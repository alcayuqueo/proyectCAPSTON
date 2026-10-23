-- AlterTable
-- Se agrega el título de la clase. Las planificaciones existentes reciben "Clase"
-- y luego se quita el valor por defecto para que coincida con schema.prisma.
ALTER TABLE "Plan" ADD COLUMN "titulo" TEXT NOT NULL DEFAULT 'Clase';
ALTER TABLE "Plan" ALTER COLUMN "titulo" DROP DEFAULT;

-- CreateTable
CREATE TABLE "PlanRecurso" (
    "planId" TEXT NOT NULL,
    "recursoId" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PlanRecurso_pkey" PRIMARY KEY ("planId","recursoId")
);

-- CreateTable
CREATE TABLE "PlanActividad" (
    "planId" TEXT NOT NULL,
    "actividadId" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PlanActividad_pkey" PRIMARY KEY ("planId","actividadId")
);

-- AddForeignKey
ALTER TABLE "PlanRecurso" ADD CONSTRAINT "PlanRecurso_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanRecurso" ADD CONSTRAINT "PlanRecurso_recursoId_fkey" FOREIGN KEY ("recursoId") REFERENCES "Recurso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanActividad" ADD CONSTRAINT "PlanActividad_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanActividad" ADD CONSTRAINT "PlanActividad_actividadId_fkey" FOREIGN KEY ("actividadId") REFERENCES "Actividad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seguridad: las tablas nuevas quedan protegidas con Row Level Security en Supabase,
-- igual que el resto (solo el backend accede a los datos).
ALTER TABLE "PlanRecurso" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PlanActividad" ENABLE ROW LEVEL SECURITY;
