import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import AuthLayout, { Campo } from '../components/AuthLayout';
import { destinoSeguro } from '../lib/rutas';
import { useAuth } from '../context/AuthContext';
import { mensajeDeError } from '../lib/api';

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Errores = { nombre?: string; email?: string; password?: string; confirmar?: string };

export default function Registro() {
  const { usuario, registrarse } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const destino = destinoSeguro((location.state as { desde?: unknown } | null)?.desde, '/planificador');

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [errores, setErrores] = useState<Errores>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to={destino} replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const nuevos: Errores = {};
    if (nombre.trim().length < 2) nuevos.nombre = 'Ingresa tu nombre.';
    if (!EMAIL_VALIDO.test(email.trim())) nuevos.email = 'Ingresa un correo válido.';
    if (password.length < 6) nuevos.password = 'La contraseña debe tener al menos 6 caracteres.';
    if (confirmar !== password) nuevos.confirmar = 'Las contraseñas no coinciden.';
    setErrores(nuevos);
    setErrorGeneral(null);
    if (Object.keys(nuevos).length > 0) return;

    setEnviando(true);
    try {
      await registrarse(nombre.trim(), email.trim().toLowerCase(), password);
      navigate(destino, { replace: true });
    } catch (err) {
      setErrorGeneral(mensajeDeError(err, 'No se pudo crear la cuenta. Revisa los datos ingresados.'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AuthLayout titulo="Crea tu cuenta" subtitulo="Regístrate para guardar tus planificaciones.">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {errorGeneral && (
          <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorGeneral}
          </p>
        )}
        <Campo
          id="nombre"
          etiqueta="Nombre completo"
          autoComplete="name"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          error={errores.nombre}
        />
        <Campo
          id="email"
          etiqueta="Correo electrónico"
          type="email"
          autoComplete="email"
          placeholder="nombre@colegio.cl"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errores.email}
        />
        <Campo
          id="password"
          etiqueta="Contraseña"
          type="password"
          autoComplete="new-password"
          placeholder="Mínimo 6 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errores.password}
        />
        <Campo
          id="confirmar"
          etiqueta="Repite la contraseña"
          type="password"
          autoComplete="new-password"
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
          error={errores.confirmar}
        />
        <button
          type="submit"
          disabled={enviando}
          className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-70"
        >
          {enviando && <Loader2 size={16} className="animate-spin" />}
          {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-500">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" state={location.state} className="font-medium text-brand-700 hover:underline">
          Inicia sesión
        </Link>
      </p>
    </AuthLayout>
  );
}
