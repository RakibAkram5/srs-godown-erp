import ExcelJS from 'exceljs';

export interface ProColumn {
  header: string;
  key: string;
  width?: number;
  money?: boolean;
}

export interface ProExcelOptions {
  fileName: string;
  sheetName?: string;
  title: string;
  companyName?: string;
  logoUrl?: string | null;
  currency?: string;
  filters?: { label: string; value: string }[];
  columns: ProColumn[];
  rows: Record<string, unknown>[];
  /** Keys to sum into a bold totals row. */
  totalKeys?: string[];
}

const BRAND = 'FF1E3A5F';
const HEADER_FILL = 'FF243B53';
const LIGHT = 'FFF1F5F9';

function thin(): Partial<ExcelJS.Borders> {
  const b: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: 'FFCBD5E1' } };
  return { top: b, bottom: b, left: b, right: b };
}

async function fetchImage(url: string): Promise<{ buffer: ArrayBuffer; ext: 'png' | 'jpeg' } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const type = res.headers.get('content-type') ?? '';
    const ext: 'png' | 'jpeg' = type.includes('png') ? 'png' : 'jpeg';
    return { buffer: await res.arrayBuffer(), ext };
  } catch {
    return null;
  }
}

/**
 * Builds and downloads a print-ready, professionally formatted spreadsheet:
 * logo + company name, report title, generated timestamp, applied filters,
 * bold bordered header row, currency formatting, auto column width and a
 * bold totals row.
 */
export async function exportProfessionalExcel(opts: ProExcelOptions) {
  const currency = opts.currency ?? 'PKR';
  const wb = new ExcelJS.Workbook();
  wb.creator = opts.companyName ?? 'SRS Godown ERP';
  wb.created = new Date();
  const ws = wb.addWorksheet(opts.sheetName ?? 'Report', {
    pageSetup: { fitToPage: true, fitToWidth: 1, orientation: 'landscape', margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 } },
    views: [{ state: 'frozen', ySplit: 6 }],
  });

  const colCount = opts.columns.length;
  const lastCol = String.fromCharCode(64 + Math.min(colCount, 26));

  // Row 1-2: company name (with logo space)
  ws.mergeCells(`A1:${lastCol}1`);
  const c1 = ws.getCell('A1');
  c1.value = opts.companyName ?? 'SRS Traders';
  c1.font = { bold: true, size: 16, color: { argb: BRAND } };
  c1.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 26;

  // Row 2: report title
  ws.mergeCells(`A2:${lastCol}2`);
  const c2 = ws.getCell('A2');
  c2.value = opts.title;
  c2.font = { bold: true, size: 12, color: { argb: 'FF334155' } };
  c2.alignment = { horizontal: 'center' };

  // Row 3: generated timestamp
  ws.mergeCells(`A3:${lastCol}3`);
  const c3 = ws.getCell('A3');
  c3.value = `Generated: ${new Date().toLocaleString()}`;
  c3.font = { size: 9, italic: true, color: { argb: 'FF64748B' } };
  c3.alignment = { horizontal: 'center' };

  // Row 4: applied filters
  ws.mergeCells(`A4:${lastCol}4`);
  const c4 = ws.getCell('A4');
  const filterText = (opts.filters ?? []).filter((f) => f.value).map((f) => `${f.label}: ${f.value}`).join('   |   ');
  c4.value = filterText ? `Filters — ${filterText}` : 'Filters — none';
  c4.font = { size: 9, color: { argb: 'FF64748B' } };
  c4.alignment = { horizontal: 'center' };

  ws.addRow([]); // row 5 spacer

  // Row 6: header
  const headerRow = ws.addRow(opts.columns.map((c) => c.header));
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = thin();
  });
  headerRow.height = 20;

  // Data rows
  opts.rows.forEach((r, idx) => {
    const row = ws.addRow(opts.columns.map((c) => r[c.key] ?? ''));
    row.eachCell((cell, colNumber) => {
      cell.border = thin();
      if (idx % 2 === 1) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT } };
      const col = opts.columns[colNumber - 1];
      if (col?.money) {
        cell.numFmt = `"${currency} "#,##0.00`;
        cell.alignment = { horizontal: 'right' };
      }
    });
  });

  // Totals row
  if (opts.totalKeys && opts.totalKeys.length) {
    const totals: Record<string, number> = {};
    for (const k of opts.totalKeys) totals[k] = opts.rows.reduce((s, r) => s + (Number(r[k]) || 0), 0);
    const totalRow = ws.addRow(
      opts.columns.map((c, i) => {
        if (i === 0) return 'TOTAL';
        if (opts.totalKeys!.includes(c.key)) return totals[c.key];
        return '';
      }),
    );
    totalRow.eachCell((cell, colNumber) => {
      cell.font = { bold: true };
      cell.border = thin();
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
      const col = opts.columns[colNumber - 1];
      if (col?.money) {
        cell.numFmt = `"${currency} "#,##0.00`;
        cell.alignment = { horizontal: 'right' };
      }
    });
  }

  // Column widths (auto-ish)
  ws.columns.forEach((col, i) => {
    const def = opts.columns[i];
    let max = def?.header?.length ?? 10;
    opts.rows.forEach((r) => {
      const v = r[def?.key ?? ''];
      const len = v == null ? 0 : String(v).length;
      if (len > max) max = len;
    });
    col.width = Math.min(40, Math.max(def?.width ?? 0, max + 4));
  });

  // Logo (top-left) if provided
  if (opts.logoUrl) {
    const img = await fetchImage(opts.logoUrl);
    if (img) {
      const imageId = wb.addImage({ buffer: img.buffer as ArrayBuffer, extension: img.ext });
      ws.addImage(imageId, { tl: { col: 0, row: 0 }, ext: { width: 46, height: 46 } });
    }
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = opts.fileName;
  a.click();
  URL.revokeObjectURL(url);
}
