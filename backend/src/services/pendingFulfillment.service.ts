import type { Prisma, SaleItem } from '@prisma/client';

type Tx = Prisma.TransactionClient;

function pad(n: number, len = 5): string {
  return String(n).padStart(len, '0');
}

export interface FulfillmentSummary {
  id: string;
  saleNo: string | null;
  totalAmount: number;
  recipientName: string;
}

interface Allocation {
  item: SaleItem;
  qty: number;
}

interface FulfillmentRecipient {
  dealerId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  recipientName: string;
}

// Bills a batch of previously-pending sale items into a brand-new, already-completed
// invoice for one recipient — deducts stock, records movements, and (for dealers)
// applies the amount to their outstanding balance. Used by both the manual "Fulfill"
// button and automatic fulfillment triggered when a purchase restocks a product.
export async function createFulfillmentSale(
  tx: Tx,
  recipient: FulfillmentRecipient,
  allocations: Allocation[],
  note: string,
): Promise<FulfillmentSummary> {
  const lines = allocations.map(({ item, qty }) => {
    const discount = item.pendingQuantity > 0 ? (item.pendingDiscount * qty) / item.pendingQuantity : 0;
    const lineTotal = Math.max(0, qty * item.salePrice - discount);
    return {
      productId: item.productId,
      productName: item.productName,
      quantity: qty,
      salePrice: item.salePrice,
      discount,
      lineTotal,
    };
  });
  const totalAmount = lines.reduce((s, l) => s + l.lineTotal, 0);

  let previousBalance = 0;
  if (recipient.dealerId) {
    const dealer = await tx.dealer.findUnique({ where: { id: recipient.dealerId } });
    previousBalance = dealer?.balance ?? 0;
  }

  const created = await tx.sale.create({
    data: {
      dealerId: recipient.dealerId,
      customerName: recipient.customerName,
      customerPhone: recipient.customerPhone,
      subTotal: totalAmount,
      discount: 0,
      totalAmount,
      paidAmount: 0,
      previousBalance,
      notes: note,
      status: 'COMPLETED',
      items: { create: lines },
    },
  });
  const sale = await tx.sale.update({
    where: { id: created.id },
    data: { saleNo: `SAL-${pad(created.codeNo)}` },
  });

  for (const line of lines) {
    const product = await tx.product.findUnique({ where: { id: line.productId } });
    if (!product) continue;
    const newStock = product.currentStock - line.quantity;
    await tx.product.update({ where: { id: product.id }, data: { currentStock: newStock } });
    await tx.stockMovement.create({
      data: {
        productId: product.id,
        productName: product.name,
        type: 'SALE_OUT',
        quantity: -line.quantity,
        balanceAfter: newStock,
        referenceType: 'SALE',
        referenceId: sale.id,
        referenceNo: sale.saleNo,
        note,
      },
    });
  }

  if (recipient.dealerId) {
    await tx.dealer.update({ where: { id: recipient.dealerId }, data: { balance: { increment: totalAmount } } });
  }

  for (const { item, qty } of allocations) {
    const discount = lines.find((l) => l.productId === item.productId)?.discount ?? 0;
    await tx.saleItem.update({
      where: { id: item.id },
      data: {
        pendingQuantity: { decrement: qty },
        pendingDiscount: { decrement: discount },
      },
    });
  }

  return {
    id: sale.id,
    saleNo: sale.saleNo,
    totalAmount,
    recipientName: recipient.recipientName,
  };
}

// Called right after a purchase increases a product's stock. Finds dealers/customers
// with backordered (pending) quantity for that product, oldest order first, and bills
// them as much of the newly-arrived stock as is available — one combined invoice per
// recipient.
export async function autoFulfillPendingForProduct(tx: Tx, productId: string): Promise<FulfillmentSummary[]> {
  const product = await tx.product.findUnique({ where: { id: productId } });
  if (!product || product.currentStock <= 0) return [];

  const pendingItems = await tx.saleItem.findMany({
    where: { productId, pendingQuantity: { gt: 0 }, sale: { status: 'COMPLETED' } },
    include: { sale: { include: { dealer: true } } },
    orderBy: { sale: { saleDate: 'asc' } },
  });
  if (pendingItems.length === 0) return [];

  let remainingStock = product.currentStock;
  const groups = new Map<string, { recipient: FulfillmentRecipient; allocations: Allocation[] }>();

  for (const item of pendingItems) {
    if (remainingStock <= 0) break;
    const qty = Math.min(item.pendingQuantity, remainingStock);
    if (qty <= 0) continue;
    remainingStock -= qty;

    const key = item.sale.dealerId ?? `sale:${item.sale.id}`;
    if (!groups.has(key)) {
      groups.set(key, {
        recipient: {
          dealerId: item.sale.dealerId,
          customerName: item.sale.customerName,
          customerPhone: item.sale.customerPhone,
          recipientName: item.sale.dealer?.name ?? item.sale.customerName ?? 'Walk-in',
        },
        allocations: [],
      });
    }
    groups.get(key)!.allocations.push({ item, qty });
  }

  const results: FulfillmentSummary[] = [];
  for (const { recipient, allocations } of groups.values()) {
    if (allocations.length === 0) continue;
    results.push(
      await createFulfillmentSale(tx, recipient, allocations, `Auto-fulfilled — stock arrived (${product.name})`),
    );
  }
  return results;
}
