/**
 * Pruebas de seguridad de la API: levantan la aplicación NestJS completa (guards, pipes,
 * helmet, CORS y límites de solicitudes) con una base de datos en memoria.
 */
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { configurarApp } from '../configuracion';
import { PrismaFalso } from './prisma-falso';

const SECRETO = 'secreto-de-prueba-con-mas-de-32-caracteres';

describe('Seguridad de la API', () => {
  let app: INestApplication;
  let db: PrismaFalso;
  let firmar: (payload: object, opciones?: object) => string;
  let ip = 0;
  /** Cada prueba usa una IP distinta, para que el límite de solicitudes no interfiera entre pruebas. */
  const nuevaIp = () => `10.0.0.${++ip}`;

  beforeAll(async () => {
    process.env.JWT_SECRET = SECRETO;
    db = new PrismaFalso();
    db.usuarios.push({
      id: 'ana',
      nombre: 'Ana',
      email: 'ana@colegio.cl',
      passwordHash: await bcrypt.hash('secreto123', 4),
      rol: 'DOCENTE',
    });
    const modulo = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(db)
      .compile();
    app = modulo.createNestApplication({ logger: false });
    configurarApp(app);
    await app.init();
    const jwt = new JwtService({ secret: SECRETO });
    firmar = (payload, opciones) => jwt.sign(payload, opciones);
  });

  afterAll(() => app.close());

  const api = () => request(app.getHttpServer());

  describe('Autenticación y tokens', () => {
    it('rechaza una ruta protegida sin token (401)', async () => {
      await api().get('/api/planner').set('X-Forwarded-For', nuevaIp()).expect(401);
    });

    it('acepta un token válido', async () => {
      const token = firmar({ sub: 'ana', email: 'ana@colegio.cl' });
      await api().get('/api/planner').set('Authorization', `Bearer ${token}`).set('X-Forwarded-For', nuevaIp()).expect(200);
    });

    it('rechaza un token firmado con otra clave (401)', async () => {
      const falso = new JwtService({ secret: 'clave-del-atacante' }).sign({ sub: 'ana' });
      await api().get('/api/planner').set('Authorization', `Bearer ${falso}`).set('X-Forwarded-For', nuevaIp()).expect(401);
    });

    it('rechaza un token sin firma, con algoritmo "none" (401)', async () => {
      const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
      const sinFirma = `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ sub: 'ana', email: 'ana@colegio.cl' })}.`;
      await api().get('/api/planner').set('Authorization', `Bearer ${sinFirma}`).set('X-Forwarded-For', nuevaIp()).expect(401);
    });

    it('rechaza un token vencido (401)', async () => {
      const vencido = firmar({ sub: 'ana', exp: Math.floor(Date.now() / 1000) - 60 });
      await api().get('/api/planner').set('Authorization', `Bearer ${vencido}`).set('X-Forwarded-For', nuevaIp()).expect(401);
    });

    it('rechaza un token alterado (payload modificado, 401)', async () => {
      const [h, , f] = firmar({ sub: 'ana' }).split('.');
      const otroPayload = Buffer.from(JSON.stringify({ sub: 'admin' })).toString('base64url');
      await api().get('/api/planner').set('Authorization', `Bearer ${h}.${otroPayload}.${f}`).set('X-Forwarded-For', nuevaIp()).expect(401);
    });

    it('el login responde igual si el correo no existe o la contraseña es incorrecta', async () => {
      const ipLogin = nuevaIp();
      const a = await api().post('/api/auth/login').set('X-Forwarded-For', ipLogin).send({ email: 'nadie@x.cl', password: 'abcdef' });
      const b = await api().post('/api/auth/login').set('X-Forwarded-For', ipLogin).send({ email: 'ana@colegio.cl', password: 'incorrecta' });
      expect(a.status).toBe(401);
      expect(b.status).toBe(401);
      expect(a.body.message).toBe(b.body.message);
    });

    it('la respuesta del login nunca incluye el hash de la contraseña', async () => {
      const r = await api().post('/api/auth/login').set('X-Forwarded-For', nuevaIp()).send({ email: 'ana@colegio.cl', password: 'secreto123' });
      expect(r.status).toBe(201);
      expect(JSON.stringify(r.body)).not.toContain('passwordHash');
      expect(JSON.stringify(r.body)).not.toContain('$2b$');
    });
  });

  describe('Límite de intentos (fuerza bruta)', () => {
    it('bloquea el login de una cuenta después de 10 intentos por minuto (429)', async () => {
      const estados: number[] = [];
      for (let i = 0; i < 12; i++) {
        const r = await api().post('/api/auth/login').set('X-Forwarded-For', '10.1.1.1').send({ email: 'victima@colegio.cl', password: `intento${i}` });
        estados.push(r.status);
      }
      expect(estados.slice(0, 10).every((s) => s === 401)).toBe(true);
      expect(estados.slice(10)).toEqual([429, 429]);
    });

    it('cambiar de IP no permite saltarse el límite (se cuenta por correo)', async () => {
      const estados: number[] = [];
      for (let i = 0; i < 12; i++) {
        const r = await api().post('/api/auth/login').set('X-Forwarded-For', nuevaIp()).send({ email: 'Objetivo@Colegio.cl', password: `intento${i}` });
        estados.push(r.status);
      }
      expect(estados.slice(10)).toEqual([429, 429]);
    });

    it('el bloqueo de una cuenta no afecta a otros docentes de la misma red', async () => {
      await api().post('/api/auth/login').set('X-Forwarded-For', '10.1.1.1').send({ email: 'ana@colegio.cl', password: 'secreto123' }).expect(201);
    });

    it('el mensaje de bloqueo está en español', async () => {
      let ultimo: request.Response | undefined;
      for (let i = 0; i < 11; i++) {
        ultimo = await api().post('/api/auth/login').set('X-Forwarded-For', nuevaIp()).send({ email: 'otra@x.cl', password: 'abcdef' });
      }
      expect(ultimo!.status).toBe(429);
      expect(ultimo!.body.message).toContain('Demasiadas solicitudes');
    });
  });

  describe('Encabezados HTTP y CORS', () => {
    it('envía encabezados de seguridad y oculta la tecnología del servidor', async () => {
      const r = await api().get('/api/curriculum/asignaturas').set('X-Forwarded-For', nuevaIp());
      expect(r.headers['x-content-type-options']).toBe('nosniff');
      expect(r.headers['x-frame-options']).toBe('SAMEORIGIN');
      expect(r.headers['content-security-policy']).toContain("default-src 'none'");
      expect(r.headers['strict-transport-security']).toBeDefined();
      expect(r.headers['x-powered-by']).toBeUndefined();
    });

    it('permite peticiones desde el frontend publicado', async () => {
      const r = await api()
        .get('/api/curriculum/asignaturas')
        .set('Origin', 'https://software-educativo-azure.vercel.app')
        .set('X-Forwarded-For', nuevaIp());
      expect(r.headers['access-control-allow-origin']).toBe('https://software-educativo-azure.vercel.app');
    });

    it('no autoriza a un sitio ajeno a leer las respuestas desde el navegador', async () => {
      const r = await api().get('/api/curriculum/asignaturas').set('Origin', 'https://sitio-malicioso.com').set('X-Forwarded-For', nuevaIp());
      expect(r.headers['access-control-allow-origin']).toBeUndefined();
    });
  });

  describe('Validación de entradas', () => {
    const token = () => firmar({ sub: 'ana', email: 'ana@colegio.cl' });

    it('una búsqueda con inyección SQL se trata como texto (Prisma usa consultas parametrizadas)', async () => {
      const ataque = "fracciones' OR '1'='1'; DROP TABLE \"Usuario\"; --";
      await api().get('/api/curriculum/objetivos').query({ q: ataque }).set('X-Forwarded-For', nuevaIp()).expect(200);
      const filtros = JSON.stringify(db.ultimaBusqueda);
      expect(filtros).toContain(JSON.stringify(ataque).slice(1, -1));
    });

    it('rechaza un enlace javascript: en un recurso (400)', async () => {
      await api()
        .post('/api/resources')
        .set('Authorization', `Bearer ${token()}`)
        .set('X-Forwarded-For', nuevaIp())
        .send({ titulo: 'x', tipo: 'video', url: 'javascript:alert(document.cookie)', unidad: 'u', asignaturaId: 'mat3' })
        .expect(400);
    });

    it('ignora campos que el cliente no debe controlar (no se puede asignar otro autor)', async () => {
      const r = await api()
        .post('/api/resources')
        .set('Authorization', `Bearer ${token()}`)
        .set('X-Forwarded-For', nuevaIp())
        .send({ titulo: 'Guía', tipo: 'documento', unidad: 'u', asignaturaId: 'mat3', autorId: 'otro-docente', id: 'id-elegido' });
      expect(r.status).toBe(201);
      const creado = db.recurso.filas.find((f) => f.titulo === 'Guía')!;
      expect(creado.autorId).toBe('ana');
      expect(creado.id).not.toBe('id-elegido');
    });

    it('guarda el texto con etiquetas HTML tal cual, como dato (React lo muestra sin ejecutarlo)', async () => {
      const titulo = '<img src=x onerror=alert(1)>';
      const r = await api()
        .post('/api/resources')
        .set('Authorization', `Bearer ${token()}`)
        .set('X-Forwarded-For', nuevaIp())
        .send({ titulo, tipo: 'imagen', unidad: 'u', asignaturaId: 'mat3' });
      expect(r.status).toBe(201);
      expect(r.body.titulo).toBe(titulo);
      expect(r.headers['content-type']).toContain('application/json');
    });

    it('rechaza cuerpos de solicitud demasiado grandes (413)', async () => {
      await api()
        .post('/api/auth/login')
        .set('X-Forwarded-For', nuevaIp())
        .send({ email: 'a@a.cl', password: 'x'.repeat(200_000) })
        .expect(413);
    });

    it('un docente no puede modificar recursos de otro (404)', async () => {
      const ajeno = await db.recurso.create({ data: { titulo: 'De Beto', tipo: 'VIDEO', unidad: 'u', asignaturaId: 'mat3', autorId: 'beto' } });
      await api()
        .patch(`/api/resources/${ajeno.id}`)
        .set('Authorization', `Bearer ${token()}`)
        .set('X-Forwarded-For', nuevaIp())
        .send({ titulo: 'cambiado' })
        .expect(404);
    });
  });
});
