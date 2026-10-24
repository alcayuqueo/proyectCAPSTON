-- Recursos y actividades propios de cada docente.
-- autorId vacío = elemento del catálogo (compartido, de solo lectura); los existentes quedan así.

-- AlterTable
ALTER TABLE "Recurso" ADD COLUMN "autorId" TEXT;

-- AlterTable
ALTER TABLE "Actividad" ADD COLUMN "autorId" TEXT;

-- CreateIndex
CREATE INDEX "Recurso_autorId_idx" ON "Recurso"("autorId");

-- CreateIndex
CREATE INDEX "Actividad_autorId_idx" ON "Actividad"("autorId");

-- AddForeignKey
ALTER TABLE "Recurso" ADD CONSTRAINT "Recurso_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Actividad" ADD CONSTRAINT "Actividad_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
