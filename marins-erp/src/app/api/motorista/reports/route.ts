import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

function readJSON(file: string) {
  const p = path.join(DATA_DIR, file);
  if (!fs.existsSync(p)) return [];
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || 'month';
  const driver = searchParams.get('driver') || 'all';

  const checklists = readJSON('checklists.json');
  const expenses = readJSON('expenses.json');
  const acessos = readJSON('../api/acesso/route.ts').length > 0 ? [] : [];
  const deliveries = readJSON('deliveries.json').length > 0 ? readJSON('deliveries.json') : [];

  // Filtrar por período
  const now = new Date();
  const filterDate = (d: string) => {
    const date = new Date(d);
    if (period === 'week') return date > new Date(now.getTime() - 7 * 86400000);
    if (period === 'month') return date > new Date(now.getTime() - 30 * 86400000);
    return true;
  };

  const filteredChecklists = checklists.filter((c: any) => filterDate(c.date) && (driver === 'all' || c.driverName === driver));
  const filteredExpenses = expenses.filter((e: any) => filterDate(e.date) && (driver === 'all' || e.driverName === driver));

  // Totais
  const totalExpenses = filteredExpenses.reduce((sum: number, e: any) => sum + (e.value || 0), 0);
  const byType: Record<string, number> = {};
  filteredExpenses.forEach((e: any) => { byType[e.type] = (byType[e.type] || 0) + (e.value || 0); });

  const checklistsCompleted = filteredChecklists.filter((c: any) => c.items?.length > 0).length;
  const checklistsTotal = filteredChecklists.length;

  return NextResponse.json({
    period,
    driver,
    summary: {
      totalChecklists: checklistsTotal,
      completedChecklists: checklistsCompleted,
      completionRate: checklistsTotal > 0 ? Math.round(checklistsCompleted / checklistsTotal * 100) : 0,
      totalExpenses,
      byExpenseType: byType,
      totalDeliveries: deliveries.length,
    },
    checklists: filteredChecklists.slice(-20).reverse(),
    expenses: filteredExpenses.slice(-50).reverse(),
  });
}
