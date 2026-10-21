import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import AuthLayout, { Campo } from '../components/AuthLayout';
import { useAuth } from '../context/AuthContext';
import { mensajeDeError } from '../lib/api';

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const { usuario, iniciarSesion } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const destino = (location.state as { desde?: string } | null)?.desde ?? '/planificador';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errores, setErrores] = useState<{ email?: string; password?: string }>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to={destino} replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const nuevos: typeof errores = {};
    if (!EMAIL_VALIDO.test(email.trim())) nuevos.email = 'Ingresa un correo válido.';
    if (!password) nuevos.password = 'Ingresa tu contraseña.';
    setErrores(nuevos);
    setErrorGeneral(null);
    if (Object.keys(nuevos).length > 0) return;

    setEnviando(true);
    try {
      await iniciarSesion(email.trim().toLowerCase(), password);
      navigate(destino, { replace: true });
    } catch (err) {
      setErrorGeneral(mensajeDeError(err, 'No se pudo iniciar sesión. Revisa tus datos.'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AuthLayout titulo="Inicia sesión" subtitulo="Accede a tus planificaciones de clase.">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {errorGeneral && (
          <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorGeneral}
          </p>
        )}
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
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errores.password}
        />
        <button
          type="submit"
          disabled={enviando}
          className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-70"
        >
          {enviando && <Loader2 size={16} className="animate-spin" />}
          {enviando ? 'Ingresando…' : 'Iniciar sesión'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-500">
        ¿No tienes cuenta?{' '}
        <Link to="/registro" state={location.state} className="font-medium text-brand-700 hover:underline">
          Regístrate
        </Link>
      </p>
    </AuthLayout>
  );
}
