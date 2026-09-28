-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('DOCENTE', 'ADMIN');

-- CreateEnum
CREATE TYPE "TipoRecurso" AS ENUM ('VIDEO', 'DOCUMENTO', 'IMAGEN');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" "RolUsuario" NOT NULL DEFAULT 'DOCENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asignatura" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nivel" TEXT NOT NULL,

    CONSTRAINT "Asignatura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Objetivo" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "asignaturaId" TEXT NOT NULL,

    CONSTRAINT "Objetivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recurso" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "tipo" "TipoRecurso" NOT NULL,
    "url" TEXT,
    "unidad" TEXT NOT NULL,
    "asignaturaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recurso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Actividad" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "duracionMinutos" INTEGER NOT NULL,
    "asignaturaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Actividad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "notas" TEXT,
    "docenteId" TEXT NOT NULL,
    "objetivoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Objetivo_asignaturaId_codigo_key" ON "Objetivo"("asignaturaId", "codigo");

-- AddForeignKey
ALTER TABLE "Objetivo" ADD CONSTRAINT "Objetivo_asignaturaId_fkey" FOREIGN KEY ("asignaturaId") REFERENCES "Asignatura"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recurso" ADD CONSTRAINT "Recurso_asignaturaId_fkey" FOREIGN KEY ("asignaturaId") REFERENCES "Asignatura"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Actividad" ADD CONSTRAINT "Actividad_asignaturaId_fkey" FOREIGN KEY ("asignaturaId") REFERENCES "Asignatura"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_objetivoId_fkey" FOREIGN KEY ("objetivoId") REFERENCES "Objetivo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
