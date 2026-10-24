// Tipos de los datos que entrega la API.

export interface Asignatura {
  id: string;
  nombre: string;
  nivel: string;
}

export interface Objetivo {
  id: string;
  codigo: string;
  descripcion: string;
  eje: string | null; // ej: "Números y Operaciones", "Lectura"
  asignaturaId: string;
  asignatura: string;
  nivel: string;
}

export type TipoRecurso = 'video' | 'documento' | 'imagen';

export interface Recurso {
  id: string;
  titulo: string;
  tipo: TipoRecurso;
  url: string | null;
  unidad: string;
  asignaturaId: string;
  asignatura: string;
  nivel: string;
  /** true si lo creó el docente con sesión: puede editarlo y eliminarlo. */
  propio: boolean;
  /** Cantidad de clases que lo usan. */
  usos: number;
}

export interface Actividad {
  id: string;
  titulo: string;
  descripcion: string;
  duracionMinutos: number;
  asignaturaId: string;
  asignatura: string;
  nivel: string;
  /** true si la creó el docente con sesión: puede editarla y eliminarla. */
  propio: boolean;
  /** Cantidad de clases que la usan. */
  usos: number;
}

/** Planificación de una clase, tal como la devuelve /api/planner. */
export interface Clase {
  id: string;
  titulo: string;
  fecha: string; // AAAA-MM-DD
  notas: string;
  objetivo: { id: string; codigo: string; descripcion: string };
  asignatura: Asignatura;
  recursos: Pick<Recurso, 'id' | 'titulo' | 'tipo' | 'url' | 'unidad'>[];
  actividades: Pick<Actividad, 'id' | 'titulo' | 'descripcion' | 'duracionMinutos'>[];
  duracionTotalMinutos: number;
}

/** Datos que se envían al crear o editar una clase. */
export interface DatosClase {
  titulo: string;
  fecha: string;
  objetivoId: string;
  notas: string;
  recursoIds: string[];
  actividadIds: string[];
}
