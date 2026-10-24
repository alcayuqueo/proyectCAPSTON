/**
 * Base de datos en memoria para las pruebas unitarias. Imita solo las operaciones de
 * Prisma que usan los servicios de recursos y actividades, incluido el filtro
 * { OR: [{ autorId: null }, { autorId }] } del catálogo.
 */
type Fila = Record<string, any>;

function cumple(fila: Fila, where: Fila = {}): boolean {
  return Object.entries(where).every(([campo, condicion]) => {
    if (campo === 'OR') return (condicion as Fila[]).some((w) => cumple(fila, w));
    if (condicion && typeof condicion === 'object' && 'in' in condicion) {
      return condicion.in.includes(fila[campo]);
    }
    return fila[campo] === condicion;
  });
}

function tabla(nombre: string, db: PrismaFalso) {
  const filas: Fila[] = [];
  let siguiente = 1;
  const conRelaciones = (f: Fila): Fila => ({
    ...f,
    asignatura: db.datos.asignatura.find((a) => a.id === f.asignaturaId),
    _count: { planes: db.usos[f.id] ?? 0 },
  });
  return {
    filas,
    findMany: async ({ where }: Fila = {}) => filas.filter((f) => cumple(f, where)).map(conRelaciones),
    findUnique: async ({ where }: Fila) => {
      const f = filas.find((x) => x.id === where.id);
      return f ? { ...f } : null;
    },
    count: async ({ where }: Fila = {}) => filas.filter((f) => cumple(f, where)).length,
    create: async ({ data }: Fila) => {
      const fila = { id: `${nombre}-${siguiente++}`, createdAt: new Date(), autorId: null, ...data };
      filas.push(fila);
      return conRelaciones(fila);
    },
    update: async ({ where, data }: Fila) => {
      const fila = filas.find((x) => x.id === where.id)!;
      Object.assign(fila, data);
      return conRelaciones(fila);
    },
    delete: async ({ where }: Fila) => {
      const i = filas.findIndex((x) => x.id === where.id);
      return filas.splice(i, 1)[0];
    },
  };
}

export class PrismaFalso {
  datos = {
    asignatura: [
      { id: 'mat3', nombre: 'Matemática', nivel: '3° básico' },
      { id: 'len5', nombre: 'Lenguaje y Comunicación', nivel: '5° básico' },
    ],
  };
  /** Cantidad de clases que usan cada recurso o actividad (por id). */
  usos: Record<string, number> = {};
  asignatura = {
    findUnique: async ({ where }: Fila) => this.datos.asignatura.find((a) => a.id === where.id) ?? null,
  };
  recurso = tabla('recurso', this);
  actividad = tabla('actividad', this);

  // Usuarios y clases (para las pruebas de seguridad de la API)
  usuarios: Fila[] = [];
  /** Últimos filtros recibidos por objetivo.findMany (para revisar que el texto llega como dato). */
  ultimaBusqueda: Fila | null = null;
  usuario = {
    findUnique: async ({ where }: Fila) =>
      this.usuarios.find((u) => (where.id ? u.id === where.id : u.email === where.email)) ?? null,
    create: async ({ data }: Fila) => {
      const u = { id: `usuario-${this.usuarios.length + 1}`, rol: 'DOCENTE', createdAt: new Date(), ...data };
      this.usuarios.push(u);
      return u;
    },
  };
  plan = {
    findMany: async () => [],
    findFirst: async () => null,
  };
  objetivo = {
    findMany: async (args: Fila) => {
      this.ultimaBusqueda = args;
      return [];
    },
  };
  $connect = async () => {};
  $disconnect = async () => {};
}
