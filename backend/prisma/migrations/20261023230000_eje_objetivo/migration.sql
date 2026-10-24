-- AlterTable
-- Eje temático de cada objetivo de aprendizaje, según las Bases Curriculares
-- (por ejemplo "Números y Operaciones" en Matemática o "Lectura" en Lenguaje).
-- Es opcional para no afectar a los objetivos ya cargados.
ALTER TABLE "Objetivo" ADD COLUMN "eje" TEXT;
