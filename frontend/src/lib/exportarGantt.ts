import { zipSync, strToU8 } from 'fflate';
import { temaDe } from './temas';
import type { Clase } from './tipos';

/**
 * Exporta el planificador de un año a Excel (.xlsx) como carta Gantt.
 *
 * Se arma el archivo a mano (es un zip con XML) para no sumar una librería pesada y para que
 * funcione con la política de seguridad de la app (sin eval). fflate solo comprime el zip,
 * y este módulo se carga recién al presionar el botón.
 *
 * Hojas:
 *  1. «Carta Gantt»: una fila por OA, agrupadas por asignatura y nivel; columnas = semanas
 *     del año (lunes a domingo) con el mes arriba. Las semanas en que se trabaja el OA se
 *     pintan con el color de la asignatura y muestran cuántas clases hay; las semanas sin
 *     ninguna clase (vacaciones) quedan en gris. Si las notas de las clases empiezan con
 *     «Unidad N» (como en los Programas de Estudio del MINEDUC), los OA se ordenan por unidad
 *     y cada unidad tiene su propia barra.
 *  2. «Resumen»: clases por mes para cada asignatura y nivel.
 *  3. «Clases»: la lista completa con filtros, para ordenar o buscar.
 */

// ---------- Estilos (styles.xml) ----------

interface Estilo {
  negrita?: boolean;
  tamano?: number;
  colorTexto?: string; // RRGGBB
  fondo?: string; // RRGGBB
  borde?: 'fino' | 'suave';
  horizontal?: 'left' | 'center' | 'right';
  ajustar?: boolean;
  formatoFecha?: boolean;
  rotar?: boolean;
}

class Estilos {
  private fuentes: string[] = ['<font><sz val="10"/><name val="Calibri"/><family val="2"/></font>'];
  private rellenos: string[] = ['<fill><patternFill patternType="none"/></fill>', '<fill><patternFill patternType="gray125"/></fill>'];
  private bordes: string[] = ['<border><left/><right/><top/><bottom/><diagonal/></border>'];
  private xfs: string[] = ['<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'];
  private claves = new Map<string, number>();

  private indice(lista: string[], xml: string): number {
    const i = lista.indexOf(xml);
    if (i >= 0) return i;
    lista.push(xml);
    return lista.length - 1;
  }

  id(e: Estilo): number {
    const clave = JSON.stringify(e);
    const existente = this.claves.get(clave);
    if (existente !== undefined) return existente;

    const fuente = this.indice(
      this.fuentes,
      `<font>${e.negrita ? '<b/>' : ''}<sz val="${e.tamano ?? 10}"/>${e.colorTexto ? `<color rgb="FF${e.colorTexto}"/>` : ''}<name val="Calibri"/><family val="2"/></font>`,
    );
    const relleno = e.fondo
      ? this.indice(this.rellenos, `<fill><patternFill patternType="solid"><fgColor rgb="FF${e.fondo}"/><bgColor indexed="64"/></patternFill></fill>`)
      : 0;
    const color = e.borde === 'suave' ? 'FFE2E0EE' : 'FF9A96B0';
    const lado = (n: string) => `<${n} style="thin"><color rgb="${color}"/></${n}>`;
    const borde = e.borde ? this.indice(this.bordes, `<border>${lado('left')}${lado('right')}${lado('top')}${lado('bottom')}<diagonal/></border>`) : 0;
    const alineacion =
      `<alignment${e.horizontal ? ` horizontal="${e.horizontal}"` : ''} vertical="center"${e.ajustar ? ' wrapText="1"' : ''}${e.rotar ? ' textRotation="90"' : ''}/>`;
    const numFmt = e.formatoFecha ? 164 : 0;
    this.xfs.push(
      `<xf numFmtId="${numFmt}" fontId="${fuente}" fillId="${relleno}" borderId="${borde}" xfId="0"${numFmt ? ' applyNumberFormat="1"' : ''} applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">${alineacion}</xf>`,
    );
    const id = this.xfs.length - 1;
    this.claves.set(clave, id);
    return id;
  }

  xml(): string {
    return (
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<numFmts count="1"><numFmt numFmtId="164" formatCode="dd\\-mm\\-yyyy"/></numFmts>' +
      `<fonts count="${this.fuentes.length}">${this.fuentes.join('')}</fonts>` +
      `<fills count="${this.rellenos.length}">${this.rellenos.join('')}</fills>` +
      `<borders count="${this.bordes.length}">${this.bordes.join('')}</borders>` +
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
      `<cellXfs count="${this.xfs.length}">${this.xfs.join('')}</cellXfs>` +
      '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
      '</styleSheet>'
    );
  }
}

// ---------- Hojas ----------

type Valor = string | number | null;
interface Celda {
  v: Valor;
  s?: number;
}

function columna(n: number): string {
  // 0 → A, 25 → Z, 26 → AA
  let s = '';
  for (let i = n + 1; i > 0; i = Math.floor((i - 1) / 26)) s = String.fromCharCode(65 + ((i - 1) % 26)) + s;
  return s;
}

const escapar = (t: string) =>
  t
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

class Hoja {
  filas: (Celda | undefined)[][] = [];
  altos = new Map<number, number>();
  anchos: number[] = [];
  uniones: string[] = [];
  congelar?: { columnas: number; filas: number };
  filtro?: string;
  horizontal = false;

  constructor(public nombre: string) {}

  poner(fila: number, col: number, v: Valor, s?: number) {
    (this.filas[fila] ??= [])[col] = { v, s };
  }

  unir(f1: number, c1: number, f2: number, c2: number) {
    this.uniones.push(`${columna(c1)}${f1 + 1}:${columna(c2)}${f2 + 1}`);
  }

  xml(): string {
    const filas = this.filas
      .map((fila, f) => {
        if (!fila) return '';
        const celdas = fila
          .map((c, col) => {
            if (!c) return '';
            const ref = `${columna(col)}${f + 1}`;
            const s = c.s ? ` s="${c.s}"` : '';
            if (c.v === null || c.v === '') return `<c r="${ref}"${s}/>`;
            if (typeof c.v === 'number') return `<c r="${ref}"${s}><v>${c.v}</v></c>`;
            return `<c r="${ref}"${s} t="inlineStr"><is><t xml:space="preserve">${escapar(c.v)}</t></is></c>`;
          })
          .join('');
        const alto = this.altos.get(f);
        return `<row r="${f + 1}"${alto ? ` ht="${alto}" customHeight="1"` : ''}>${celdas}</row>`;
      })
      .join('');
    const cols = this.anchos.length
      ? `<cols>${this.anchos.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols>`
      : '';
    let vista = '<sheetView workbookViewId="0"/>';
    if (this.congelar) {
      const { columnas, filas: nf } = this.congelar;
      const panel = columnas && nf ? 'bottomRight' : columnas ? 'topRight' : 'bottomLeft';
      vista =
        `<sheetView workbookViewId="0"><pane${columnas ? ` xSplit="${columnas}"` : ''}${nf ? ` ySplit="${nf}"` : ''}` +
        ` topLeftCell="${columna(columnas)}${nf + 1}" activePane="${panel}" state="frozen"/><selection pane="${panel}"/></sheetView>`;
    }
    return (
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      '<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>' +
      `<sheetViews>${vista}</sheetViews>` +
      '<sheetFormatPr defaultRowHeight="15"/>' +
      cols +
      `<sheetData>${filas}</sheetData>` +
      (this.filtro ? `<autoFilter ref="${this.filtro}"/>` : '') +
      (this.uniones.length ? `<mergeCells count="${this.uniones.length}">${this.uniones.map((u) => `<mergeCell ref="${u}"/>`).join('')}</mergeCells>` : '') +
      '<pageMargins left="0.4" right="0.4" top="0.5" bottom="0.5" header="0.3" footer="0.3"/>' +
      `<pageSetup paperSize="9" orientation="${this.horizontal ? 'landscape' : 'portrait'}" fitToWidth="1" fitToHeight="0"/>` +
      '</worksheet>'
    );
  }
}

function libro(hojas: Hoja[], estilos: Estilos, tituloImpresion?: { hoja: number; filas: string }): Uint8Array {
  const archivos: Record<string, Uint8Array> = {
    '[Content_Types].xml': strToU8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        hojas.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('') +
        '</Types>',
    ),
    '_rels/.rels': strToU8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
        '</Relationships>',
    ),
    'xl/workbook.xml': strToU8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
        `<sheets>${hojas.map((h, i) => `<sheet name="${escapar(h.nombre)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets>` +
        (tituloImpresion
          ? `<definedNames><definedName name="_xlnm.Print_Titles" localSheetId="${tituloImpresion.hoja}">'${escapar(hojas[tituloImpresion.hoja].nombre)}'!${tituloImpresion.filas}</definedName></definedNames>`
          : '') +
        '</workbook>',
    ),
    'xl/_rels/workbook.xml.rels': strToU8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        hojas.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('') +
        `<Relationship Id="rId${hojas.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
        '</Relationships>',
    ),
    'xl/styles.xml': strToU8(estilos.xml()),
  };
  hojas.forEach((h, i) => (archivos[`xl/worksheets/sheet${i + 1}.xml`] = strToU8(h.xml())));
  return zipSync(archivos, { level: 6 });
}

// ---------- Fechas ----------

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const DIA_MS = 86_400_000;

const utc = (iso: string) => Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)));
/** Número de serie de Excel (días desde el 30-12-1899). */
const serialExcel = (iso: string) => utc(iso) / DIA_MS + 25569;
const dosDigitos = (n: number) => String(n).padStart(2, '0');
const numeroNivel = (nivel: string) => parseInt(nivel, 10) || 0;

// ---------- Exportación ----------

export interface OpcionesExportar {
  anio: number;
  clases: Clase[];
  docente?: string;
}

/** Arma el .xlsx del año. Devuelve los bytes (se usa también en las pruebas). */
export function crearExcelPlanificador({ anio, clases, docente }: OpcionesExportar): Uint8Array {
  const delAnio = clases.filter((c) => c.fecha.startsWith(`${anio}-`));
  const est = new Estilos();

  const sTitulo = est.id({ negrita: true, tamano: 16, colorTexto: '1E1B3A' });
  const sSub = est.id({ tamano: 10, colorTexto: '5B5872' });
  const sEncabezado = est.id({ negrita: true, colorTexto: 'FFFFFF', fondo: '2B2650', borde: 'fino', horizontal: 'center', ajustar: true });
  const sMes = est.id({ negrita: true, colorTexto: '1E1B3A', fondo: 'D9D2FF', borde: 'fino', horizontal: 'center' });
  const sSemana = est.id({ tamano: 8, colorTexto: '5B5872', fondo: 'F1EEFF', borde: 'fino', horizontal: 'center', rotar: true });
  const sTexto = est.id({ borde: 'fino', ajustar: true });
  const sCentro = est.id({ borde: 'fino', horizontal: 'center' });
  const sFecha = est.id({ borde: 'fino', horizontal: 'center', formatoFecha: true });
  const sVacia = est.id({ borde: 'suave' });
  const sNegrita = est.id({ negrita: true });

  // Grupos: asignatura + nivel, ordenados; dentro, las clases por fecha.
  const grupos = new Map<string, { asignatura: string; nivel: string; clases: Clase[] }>();
  for (const c of [...delAnio].sort((a, b) => a.fecha.localeCompare(b.fecha) || a.titulo.localeCompare(b.titulo, 'es'))) {
    const clave = `${c.asignatura.nombre}|${c.asignatura.nivel}`;
    if (!grupos.has(clave)) grupos.set(clave, { asignatura: c.asignatura.nombre, nivel: c.asignatura.nivel, clases: [] });
    grupos.get(clave)!.clases.push(c);
  }
  const listaGrupos = [...grupos.values()].sort(
    (a, b) => a.asignatura.localeCompare(b.asignatura, 'es') || numeroNivel(a.nivel) - numeroNivel(b.nivel),
  );

  // Semanas: de lunes a domingo, desde la semana del 1 de enero hasta la del 31 de diciembre.
  const primero = Date.UTC(anio, 0, 1);
  const lunesInicial = primero - ((new Date(primero).getUTCDay() + 6) % 7) * DIA_MS;
  const nSemanas = Math.floor((Date.UTC(anio, 11, 31) - lunesInicial) / DIA_MS / 7) + 1;
  const semanaDe = (iso: string) => Math.floor((utc(iso) - lunesInicial) / DIA_MS / 7);
  // El mes de cada semana es el de su jueves (así cada semana queda en el mes donde tiene más días).
  const mesDeSemana = (s: number) => {
    const jueves = new Date(lunesInicial + (s * 7 + 3) * DIA_MS);
    return jueves.getUTCFullYear() < anio ? 0 : jueves.getUTCFullYear() > anio ? 11 : jueves.getUTCMonth();
  };

  // ===== Hoja 1: Carta Gantt =====
  // Una fila por objetivo de aprendizaje (OA): así cada OA se ve como una barra que abarca las
  // semanas en que se trabaja. El número de cada celda es cuántas clases de ese OA hay esa semana.
  const g = new Hoja('Carta Gantt');
  g.horizontal = true;
  const FIJAS = ['OA', 'Objetivo de aprendizaje', 'Clases', 'Desde', 'Hasta'];
  const C0 = FIJAS.length; // primera columna de semanas
  g.anchos = [7, 46, 7, 11, 11, ...Array(nSemanas).fill(3.6)];
  g.poner(0, 0, `Planificador ${anio} · Carta Gantt`, sTitulo);
  g.altos.set(0, 24);
  const generado = new Date();
  g.poner(
    1,
    0,
    `EducaApp${docente ? ` · Docente: ${docente}` : ''} · ${delAnio.length} clase${delAnio.length === 1 ? '' : 's'} · Generado el ${dosDigitos(generado.getDate())}-${dosDigitos(generado.getMonth() + 1)}-${generado.getFullYear()}`,
    sSub,
  );

  // Encabezado: fila 4 meses, fila 5 fecha del lunes de cada semana.
  const F_MES = 3;
  const F_SEM = 4;
  FIJAS.forEach((t, i) => {
    g.poner(F_MES, i, t, sEncabezado);
    g.poner(F_SEM, i, null, sEncabezado);
    g.unir(F_MES, i, F_SEM, i);
  });
  let inicioMes = 0;
  for (let s = 0; s < nSemanas; s++) {
    const lunes = new Date(lunesInicial + s * 7 * DIA_MS);
    g.poner(F_SEM, C0 + s, `${dosDigitos(lunes.getUTCDate())}/${dosDigitos(lunes.getUTCMonth() + 1)}`, sSemana);
    g.poner(F_MES, C0 + s, s === inicioMes ? MESES[mesDeSemana(s)] : null, sMes);
    if (s === nSemanas - 1 || mesDeSemana(s + 1) !== mesDeSemana(s)) {
      if (s > inicioMes) g.unir(F_MES, C0 + inicioMes, F_MES, C0 + s);
      inicioMes = s + 1;
    }
  }
  g.altos.set(F_SEM, 34);
  g.congelar = { columnas: C0, filas: F_SEM + 1 };

  // Semanas sin ninguna clase (vacaciones, feriados largos): se marcan en gris en todas las filas.
  const semanasConClases = new Set(delAnio.map((c) => semanaDe(c.fecha)));
  const sSinClases = est.id({ fondo: 'EDEDF2', borde: 'suave' });

  let f = F_SEM + 1;
  const ultimaCol = C0 + nSemanas - 1;
  if (listaGrupos.length === 0) {
    g.poner(f, 0, `No hay clases planificadas en ${anio}.`, sSub);
    f++;
  }
  for (const grupo of listaGrupos) {
    const tema = temaDe(grupo.asignatura);
    const oscuro = tema.oscuro.slice(1).toUpperCase();
    const suave = tema.suave.slice(1).toUpperCase();
    const sGrupo = est.id({ negrita: true, colorTexto: oscuro, fondo: suave, borde: 'fino' });
    const sBanda = est.id({ fondo: suave, borde: 'suave' });
    const sBarra = est.id({ negrita: true, tamano: 8, colorTexto: 'FFFFFF', fondo: oscuro, borde: 'fino', horizontal: 'center' });

    // Unidades: si la mayoría de las clases tienen en sus notas «Unidad N» (como en el Programa de
    // Estudio), el grupo se divide por unidad; si no, se muestran solo los OA.
    const unidadDe = (c: Clase) => /^\s*(unidad\s+\d+)/i.exec(c.notas ?? '')?.[1].replace(/^u/, 'U').replace(/\s+/g, ' ') ?? null;
    const conUnidad = grupo.clases.filter((c) => unidadDe(c)).length;
    const usarUnidades = conUnidad >= grupo.clases.length / 2;
    const bloques = new Map<string, Clase[]>();
    for (const c of grupo.clases) {
      const clave = usarUnidades ? unidadDe(c) ?? 'Sin unidad' : '';
      bloques.set(clave, [...(bloques.get(clave) ?? []), c]);
    }
    const listaBloques = [...bloques.entries()].sort((a, b) =>
      a[0] === 'Sin unidad' ? 1 : b[0] === 'Sin unidad' ? -1 : a[1][0].fecha.localeCompare(b[1][0].fecha),
    );
    const totalOa = new Set(grupo.clases.map((c) => c.objetivo.codigo)).size;

    g.poner(
      f,
      0,
      `${grupo.asignatura} · ${grupo.nivel} · ${usarUnidades ? `${listaBloques.length} unidades · ` : ''}${totalOa} OA · ${grupo.clases.length} clase${grupo.clases.length === 1 ? '' : 's'}`,
      sGrupo,
    );
    for (let c = 1; c < C0; c++) g.poner(f, c, null, sGrupo);
    g.unir(f, 0, f, C0 - 1);
    for (let c = C0; c <= ultimaCol; c++) g.poner(f, c, null, sBanda);
    g.altos.set(f, 18);
    f++;

    const medio = tema.medio.slice(1).toUpperCase();
    const sUnidad = est.id({ negrita: true, colorTexto: oscuro, fondo: medio, borde: 'fino' });
    const sUnidadCentro = est.id({ negrita: true, colorTexto: oscuro, fondo: medio, borde: 'fino', horizontal: 'center' });
    const sUnidadFecha = est.id({ negrita: true, colorTexto: oscuro, fondo: medio, borde: 'fino', horizontal: 'center', formatoFecha: true });
    const sTextoOa = est.id({ borde: 'fino', ajustar: true, tamano: 9 });
    const sCodigo = est.id({ negrita: true, colorTexto: oscuro, borde: 'fino', horizontal: 'center' });

    for (const [unidad, clasesBloque] of listaBloques) {
      if (usarUnidades) {
        // Fila de la unidad: una barra continua desde su primera hasta su última semana.
        const primera = semanaDe(clasesBloque[0].fecha);
        const ultima = semanaDe(clasesBloque[clasesBloque.length - 1].fecha);
        g.poner(f, 0, unidad, sUnidad);
        g.poner(f, 1, null, sUnidad);
        g.unir(f, 0, f, 1);
        g.poner(f, 2, clasesBloque.length, sUnidadCentro);
        g.poner(f, 3, serialExcel(clasesBloque[0].fecha), sUnidadFecha);
        g.poner(f, 4, serialExcel(clasesBloque[clasesBloque.length - 1].fecha), sUnidadFecha);
        for (let s = 0; s < nSemanas; s++) {
          const dentro = s >= primera && s <= ultima && unidad !== 'Sin unidad';
          g.poner(f, C0 + s, null, dentro ? (semanasConClases.has(s) ? sUnidadCentro : sSinClases) : semanasConClases.has(s) ? sVacia : sSinClases);
        }
        g.altos.set(f, 18);
        f++;
      }

      // OA del bloque, en el orden en que se empiezan a trabajar.
      const porOa = new Map<string, Clase[]>();
      for (const c of clasesBloque) porOa.set(c.objetivo.codigo, [...(porOa.get(c.objetivo.codigo) ?? []), c]);
      const filasOa = [...porOa.entries()].sort((a, b) => a[1][0].fecha.localeCompare(b[1][0].fecha) || a[0].localeCompare(b[0]));

      for (const [codigo, lista] of filasOa) {
        const descripcion = lista[0].objetivo.descripcion.replace(/\s+/g, ' ').trim();
        const corta = descripcion.length > 95 ? `${descripcion.slice(0, 92).trimEnd()}…` : descripcion;
        g.poner(f, 0, codigo, sCodigo);
        g.poner(f, 1, corta || codigo, sTextoOa);
        g.poner(f, 2, lista.length, sCentro);
        g.poner(f, 3, serialExcel(lista[0].fecha), sFecha);
        g.poner(f, 4, serialExcel(lista[lista.length - 1].fecha), sFecha);
        const porSemana = new Map<number, number>();
        for (const c of lista) porSemana.set(semanaDe(c.fecha), (porSemana.get(semanaDe(c.fecha)) ?? 0) + 1);
        for (let s = 0; s < nSemanas; s++) {
          const cuantas = porSemana.get(s);
          g.poner(f, C0 + s, cuantas ?? null, cuantas ? sBarra : semanasConClases.has(s) ? sVacia : sSinClases);
        }
        g.altos.set(f, 26);
        f++;
      }
    }
  }

  // Leyenda
  f++;
  g.poner(f, 1, 'Leyenda: cada fila es un OA; la celda pintada indica cuántas clases de ese OA hay en la semana. Las filas «Unidad» muestran la duración de cada unidad.', sSub);
  f++;
  const asignaturasVistas = [...new Set(listaGrupos.map((x) => x.asignatura))];
  for (const a of asignaturasVistas) {
    const oscuro = temaDe(a).oscuro.slice(1).toUpperCase();
    g.poner(f, 0, null, est.id({ fondo: oscuro, borde: 'fino' }));
    g.poner(f, 1, a, sNegrita);
    f++;
  }
  g.poner(f, 0, null, sSinClases);
  g.poner(f, 1, 'Semana sin clases (vacaciones o receso)', sNegrita);

  // ===== Hoja 2: Resumen por mes =====
  const r = new Hoja('Resumen');
  r.horizontal = true;
  r.anchos = [30, ...Array(12).fill(6.5), 8];
  r.poner(0, 0, `Clases por mes · ${anio}`, sTitulo);
  r.altos.set(0, 24);
  const encabezadoR = ['Asignatura y nivel', ...MESES_CORTOS, 'Total'];
  encabezadoR.forEach((t, i) => r.poner(2, i, t, sEncabezado));
  const totalesMes = Array(12).fill(0) as number[];
  let fr = 3;
  for (const grupo of listaGrupos) {
    const porMes = Array(12).fill(0) as number[];
    for (const c of grupo.clases) porMes[Number(c.fecha.slice(5, 7)) - 1]++;
    const tema = temaDe(grupo.asignatura);
    const sNum = est.id({ borde: 'fino', horizontal: 'center', fondo: tema.suave.slice(1).toUpperCase() });
    r.poner(fr, 0, `${grupo.asignatura} · ${grupo.nivel}`, est.id({ negrita: true, colorTexto: tema.oscuro.slice(1).toUpperCase(), borde: 'fino' }));
    porMes.forEach((v, i) => {
      totalesMes[i] += v;
      r.poner(fr, i + 1, v || null, v ? sNum : sCentro);
    });
    r.poner(fr, 13, grupo.clases.length, est.id({ negrita: true, borde: 'fino', horizontal: 'center' }));
    fr++;
  }
  const sTotal = est.id({ negrita: true, fondo: 'FFF4D6', borde: 'fino', horizontal: 'center' });
  r.poner(fr, 0, 'Total', est.id({ negrita: true, fondo: 'FFF4D6', borde: 'fino' }));
  totalesMes.forEach((v, i) => r.poner(fr, i + 1, v, sTotal));
  r.poner(fr, 13, delAnio.length, sTotal);

  // ===== Hoja 3: Lista de clases =====
  const l = new Hoja('Clases');
  l.horizontal = true;
  const encabezadoL = ['Fecha', 'Día', 'Asignatura', 'Nivel', 'OA', 'Clase', 'Recursos', 'Actividades', 'Min. de actividades', 'Notas'];
  l.anchos = [11, 6, 16, 11, 7, 38, 9, 11, 11, 40];
  encabezadoL.forEach((t, i) => l.poner(0, i, t, sEncabezado));
  l.altos.set(0, 30);
  const ordenadas = [...delAnio].sort((a, b) => a.fecha.localeCompare(b.fecha) || a.titulo.localeCompare(b.titulo, 'es'));
  ordenadas.forEach((c, i) => {
    const fl = i + 1;
    l.poner(fl, 0, serialExcel(c.fecha), sFecha);
    l.poner(fl, 1, DIAS[new Date(utc(c.fecha)).getUTCDay()], sCentro);
    l.poner(fl, 2, c.asignatura.nombre, sTexto);
    l.poner(fl, 3, c.asignatura.nivel, sCentro);
    l.poner(fl, 4, c.objetivo.codigo, sCentro);
    l.poner(fl, 5, c.titulo, sTexto);
    l.poner(fl, 6, c.recursos.length, sCentro);
    l.poner(fl, 7, c.actividades.length, sCentro);
    l.poner(fl, 8, c.duracionTotalMinutos || null, sCentro);
    l.poner(fl, 9, c.notas || null, sTexto);
  });
  l.congelar = { columnas: 0, filas: 1 };
  l.filtro = `A1:${columna(encabezadoL.length - 1)}${Math.max(ordenadas.length + 1, 2)}`;

  return libro([g, r, l], est, { hoja: 0, filas: `$${F_MES + 1}:$${F_SEM + 1}` });
}

/** Genera el archivo y lo descarga en el navegador. */
export function exportarPlanificadorExcel(opciones: OpcionesExportar): string {
  const bytes = crearExcelPlanificador(opciones);
  const nombre = `Planificador_${opciones.anio}_EducaApp.xlsx`;
  const blob = new Blob([bytes as Uint8Array<ArrayBuffer>], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return nombre;
}
