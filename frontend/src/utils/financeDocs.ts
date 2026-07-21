import * as XLSX from 'xlsx';
import type { Expense, Salary, FinancialReport } from '@/types';
import { formatDate } from '@/utils/formatters';

function save(rows: Record<string, unknown>[], sheet: string, file: string) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheet);
  XLSX.writeFile(wb, file);
}

export function exportExpensesExcel(items: Expense[], file = 'expenses.xlsx') {
  const rows: Record<string, unknown>[] = items.map((e) => ({
    'Expense No': e.expenseNo ?? '',
    Date: formatDate(e.expenseDate),
    Category: e.category,
    Description: e.description ?? '',
    Method: e.method,
    Amount: e.amount,
  }));
  rows.push({ 'Expense No': '', Date: '', Category: '', Description: '', Method: 'TOTAL', Amount: items.reduce((s, e) => s + e.amount, 0) });
  save(rows, 'Expenses', file);
}

export function exportSalariesExcel(items: Salary[], file = 'salaries.xlsx') {
  const rows: Record<string, unknown>[] = items.map((s) => ({
    'Salary No': s.salaryNo ?? '',
    Employee: s.employeeName,
    Month: s.month,
    Amount: s.amount,
    Paid: s.paidAmount,
    Remaining: Math.max(0, s.amount - s.paidAmount),
    'Paid On': s.paymentDate ? formatDate(s.paymentDate) : '',
    Method: s.method,
  }));
  rows.push({
    'Salary No': '', Employee: 'TOTAL', Month: '',
    Amount: items.reduce((a, s) => a + s.amount, 0),
    Paid: items.reduce((a, s) => a + s.paidAmount, 0),
    Remaining: items.reduce((a, s) => a + Math.max(0, s.amount - s.paidAmount), 0),
    'Paid On': '', Method: '',
  });
  save(rows, 'Salaries', file);
}

export function exportFinancialExcel(r: FinancialReport, file = 'financial-report.xlsx') {
  const rows: Record<string, unknown>[] = [
    { Item: 'Period', Amount: `${formatDate(r.period.from)} to ${formatDate(r.period.to)}` },
    { Item: 'Sales (income)', Amount: r.sales.total },
    { Item: 'Purchases (cost)', Amount: r.purchases.total },
    { Item: 'Expenses', Amount: r.expenses.total },
    { Item: 'Salaries', Amount: r.salaries.total },
    { Item: 'NET PROFIT', Amount: r.netProfit },
    { Item: '', Amount: '' },
    { Item: 'Outstanding receivable (dealers)', Amount: r.outstanding.receivable },
    { Item: 'Outstanding payable (vendors)', Amount: r.outstanding.payable },
    { Item: 'Pending value', Amount: r.pending.value },
    { Item: '', Amount: '' },
    { Item: 'Expenses by category', Amount: '' },
    ...r.expenses.byCategory.map((c) => ({ Item: `  ${c.category}`, Amount: c.amount })),
  ];
  save(rows, 'Financial Report', file);
}
