import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * POST /api/webhook/expense
 *
 * Endpoint publik untuk dicatat dari OpenClaw / bot Telegram.
 * Auth: header "x-api-key" harus cocok dengan env WEBHOOK_API_KEY.
 *
 * Body JSON:
 * {
 *   "amount": 50000,               // wajib, angka
 *   "description": "makan siang",  // wajib
 *   "category": "Konsumsi",        // opsional, nama kategori (fuzzy match)
 *   "date": "2026-03-15"           // opsional, default hari ini
 * }
 *
 * Response:
 * { "ok": true, "id": 123, "category": "Konsumsi", "amount": 50000, "date": "..." }
 */
export async function POST(req: Request) {
  // === Auth ===
  const apiKey = process.env.WEBHOOK_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Webhook belum dikonfigurasi (WEBHOOK_API_KEY tidak diset)." }, { status: 500 });
  }
  const incoming = req.headers.get("x-api-key") ?? req.headers.get("authorization")?.replace("Bearer ", "");
  if (incoming !== apiKey) {
    return NextResponse.json({ error: "API key tidak valid." }, { status: 401 });
  }

  // === Parse body ===
  let body: { amount?: unknown; description?: unknown; category?: unknown; date?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body bukan JSON yang valid." }, { status: 400 });
  }

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Field 'amount' wajib diisi dan harus > 0." }, { status: 400 });
  }
  const description = String(body.description ?? "").trim();
  if (!description) {
    return NextResponse.json({ error: "Field 'description' wajib diisi." }, { status: 400 });
  }
  const dateStr = body.date ? String(body.date) : new Date().toISOString().split("T")[0];
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return NextResponse.json({ error: "Format 'date' tidak valid. Gunakan YYYY-MM-DD." }, { status: 400 });
  }

  // === Default User Mapping ===
  // Karena webhook mungkin datang tanpa session user, kita default ke user pertama (misal ADMIN)
  const defaultUser = await prisma.user.findFirst({ where: { role: "ADMIN" } }) || await prisma.user.findFirst();
  if (!defaultUser) {
    return NextResponse.json({ error: "System requires at least one user." }, { status: 500 });
  }

  // === Category matching ===
  const categories = await prisma.expenseCategory.findMany({
    where: { userId: defaultUser.id },
    orderBy: { name: "asc" },
  });
  if (categories.length === 0) {
    return NextResponse.json({ error: "Belum ada kategori pengeluaran. Tambahkan dulu di Pengaturan." }, { status: 400 });
  }

  let matchedCategory = categories[0]; // default: kategori pertama

  if (body.category) {
    const search = String(body.category).toLowerCase().trim();
    // Exact match dulu
    const exact = categories.find(c => c.name.toLowerCase() === search);
    if (exact) {
      matchedCategory = exact;
    } else {
      // Partial (contains) match
      const partial = categories.find(c => c.name.toLowerCase().includes(search) || search.includes(c.name.toLowerCase()));
      if (partial) matchedCategory = partial;
    }
  }

  // === Simpan ===
  const expense = await prisma.expense.create({
    data: {
      userId: defaultUser.id,
      date,
      categoryId: matchedCategory.id,
      description,
      amount: Math.round(amount),
    },
    include: { category: true },
  });

  return NextResponse.json({
    ok: true,
    id: expense.id,
    category: expense.category?.name || "Lain-lain",
    amount: expense.amount,
    description: expense.description,
    date: expense.date.toISOString().split("T")[0],
  });
}

/**
 * GET /api/webhook/expense
 * Health check — cek apakah endpoint aktif
 */
export async function GET(req: Request) {
  const apiKey = process.env.WEBHOOK_API_KEY;
  const incoming = req.headers.get("x-api-key") ?? req.headers.get("authorization")?.replace("Bearer ", "");
  if (!apiKey || incoming !== apiKey) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const categories = await prisma.expenseCategory.findMany({ select: { name: true } });
  return NextResponse.json({ ok: true, categories: categories.map(c => c.name) });
}
