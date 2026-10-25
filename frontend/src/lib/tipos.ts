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
  /** Tema corto del OA, solo si tiene material listo (ej.: «Fracciones propias»). */
  tema: string | null;
  /** true si el OA tiene diapositivas, videos y una actividad listos para usar. */
  tieneMaterial: boolean;
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
  /** OA para el que se sugiere (material listo); null si sirve para toda la asignatura. */
  objetivoId: string | null;
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
  /** OA para el que se sugiere (material listo); null si sirve para toda la asignatura. */
  objetivoId: string | null;
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
  /** Si es true, el modo presentación incluye las diapositivas de contenido del OA. */
  usarMaterial: boolean;
  /** Diapositivas de contenido del OA; null si no tiene material o la clase no lo usa. */
  material: MaterialObjetivo | null;
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
  usarMaterial: boolean;
  recursoIds: string[];
  actividadIds: string[];
}

/** Diapositiva de contenido del material listo de un OA. */
export interface DiapositivaContenido {
  tipo: 'concepto' | 'ejemplo' | 'pregunta';
  titulo: string;
  texto?: string;
  /** Viñetas (concepto y ejemplo) u opciones de respuesta (pregunta). */
  puntos?: string[];
  /** Solo en preguntas: se muestra al tocar «Ver respuesta». */
  respuesta?: string;
  emoji?: string;
}

export interface MaterialObjetivo {
  tema: string;
  diapositivas: DiapositivaContenido[];
}

/** Material listo de un OA, tal como lo devuelve /api/curriculum/objetivos/:id/material. */
export interface MaterialOa {
  objetivo: { id: string; codigo: string; descripcion: string; eje: string | null; asignatura: string; nivel: string };
  /** null si el OA aún no tiene material listo. */
  tema: string | null;
  diapositivas: DiapositivaContenido[];
  recursos: Pick<Recurso, 'id' | 'titulo' | 'tipo' | 'url' | 'unidad'>[];
  actividades: Pick<Actividad, 'id' | 'titulo' | 'descripcion' | 'duracionMinutos'>[];
}
