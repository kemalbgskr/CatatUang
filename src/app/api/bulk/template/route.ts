import { NextResponse } from "next/server";
import * as xlsx from "xlsx";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // "incomes" or "expenses"

  if (!type || (type !== "incomes" && type !== "expenses")) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const wb = xlsx.utils.book_new();
  const wsData = [
    ["Tanggal (YYYY-MM-DD)", "Kategori", "Deskripsi", "NomINAL"]
  ];
  const ws = xlsx.utils.aoa_to_sheet(wsData);

  ws["!cols"] = [{ wch: 20 }, { wch: 25 }, { wch: 40 }, { wch: 20 }];

  xlsx.utils.book_append_sheet(wb, ws, "Template " + (type === "incomes" ? "Pendapatan" : "Pengeluaran"));

  const buf = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Disposition": `attachment; filename="template_${type}.xlsx"`,
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}
