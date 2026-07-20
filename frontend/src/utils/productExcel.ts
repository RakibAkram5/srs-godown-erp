import * as XLSX from 'xlsx';
import type { MasterRecord, Product } from '@/types';
import type { ProductPayload } from '@/services/products.service';
import { BIKES } from '@/types';

const EXPORT_COLUMNS = [
  'Name',
  'Product Code',
  'SKU',
  'Barcode',
  'Category',
  'Brand',
  'Unit',
  'Warehouse',
  'Rack',
  'Shelf',
  'Bikes',
  'Purchase Price',
  'Sale Price',
  'Opening Stock',
  'Minimum Stock',
  'Current Stock',
  'Status',
] as const;

export function exportProducts(products: Product[], fileName = 'products.xlsx') {
  const rows = products.map((p) => ({
    Name: p.name,
    'Product Code': p.productCode ?? '',
    SKU: p.sku ?? '',
    Barcode: p.barcode ?? '',
    Category: p.categoryName ?? '',
    Brand: p.brandName ?? '',
    Unit: p.unitName ?? '',
    Warehouse: p.warehouse ?? '',
    Rack: p.rack ?? '',
    Shelf: p.shelf ?? '',
    Bikes: (p.bikes ?? []).join(', '),
    'Purchase Price': p.purchasePrice,
    'Sale Price': p.salePrice,
    'Opening Stock': p.openingStock,
    'Minimum Stock': p.minimumStock,
    'Current Stock': p.currentStock,
    Status: p.isActive ? 'Active' : 'Inactive',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows, { header: [...EXPORT_COLUMNS] });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
  XLSX.writeFile(workbook, fileName);
}

export function downloadImportTemplate() {
  const example = [
    {
      Name: 'Brake Cable',
      Description: 'Front brake cable',
      Category: 'Brakes',
      Brand: 'Honda',
      Unit: 'Piece',
      Warehouse: 'Main',
      Rack: 'R1',
      Shelf: 'S2',
      Bikes: 'Honda, Deluxe',
      'Purchase Price': 120,
      'Sale Price': 160,
      'Opening Stock': 50,
      'Minimum Stock': 10,
    },
  ];
  const worksheet = XLSX.utils.json_to_sheet(example);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
  XLSX.writeFile(workbook, 'products-import-template.xlsx');
}

interface Masters {
  categories: MasterRecord[];
  brands: MasterRecord[];
  units: MasterRecord[];
}

function idByName(rows: MasterRecord[], name?: string): string | null {
  if (!name) return null;
  const match = rows.find((r) => r.name.trim().toLowerCase() === String(name).trim().toLowerCase());
  return match ? match.id : null;
}

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Parse an uploaded .xlsx/.csv file into product payloads (names → ids via masters). */
export async function parseProductsFile(file: File, masters: Masters): Promise<ProductPayload[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

  const validBikes = new Set(BIKES.map((b) => b.toLowerCase()));

  return raw
    .filter((r) => String(r['Name'] ?? '').trim().length > 0)
    .map((r) => {
      const bikes = String(r['Bikes'] ?? '')
        .split(/[,;]/)
        .map((b) => b.trim())
        .filter((b) => validBikes.has(b.toLowerCase()))
        .map((b) => BIKES.find((x) => x.toLowerCase() === b.toLowerCase()) as string);

      return {
        name: String(r['Name']).trim(),
        description: String(r['Description'] ?? '').trim() || null,
        categoryId: idByName(masters.categories, r['Category'] as string),
        brandId: idByName(masters.brands, r['Brand'] as string),
        unitId: idByName(masters.units, r['Unit'] as string),
        warehouse: String(r['Warehouse'] ?? '').trim() || null,
        rack: String(r['Rack'] ?? '').trim() || null,
        shelf: String(r['Shelf'] ?? '').trim() || null,
        bikes,
        purchasePrice: num(r['Purchase Price']),
        salePrice: num(r['Sale Price']),
        openingStock: num(r['Opening Stock']),
        minimumStock: num(r['Minimum Stock']),
        isActive: true,
      } satisfies ProductPayload;
    });
}
