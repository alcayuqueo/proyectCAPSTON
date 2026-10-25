-- Material listo para usar por OA: diapositivas de contenido y videos/actividades sugeridos.
-- Todas las columnas nuevas son opcionales o tienen valor por defecto: los datos existentes no cambian.

-- AlterTable
ALTER TABLE "Objetivo" ADD COLUMN "material" JSONB;

-- AlterTable
ALTER TABLE "Recurso" ADD COLUMN "objetivoId" TEXT;

-- AlterTable
ALTER TABLE "Actividad" ADD COLUMN "objetivoId" TEXT;

-- AlterTable
ALTER TABLE "Plan" ADD COLUMN "usarMaterial" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "Recurso_objetivoId_idx" ON "Recurso"("objetivoId");

-- CreateIndex
CREATE INDEX "Actividad_objetivoId_idx" ON "Actividad"("objetivoId");

-- AddForeignKey
ALTER TABLE "Recurso" ADD CONSTRAINT "Recurso_objetivoId_fkey" FOREIGN KEY ("objetivoId") REFERENCES "Objetivo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Actividad" ADD CONSTRAINT "Actividad_objetivoId_fkey" FOREIGN KEY ("objetivoId") REFERENCES "Objetivo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
