import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as xlsx from "xlsx";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;

    if (!file || !type || (type !== "incomes" && type !== "expenses")) {
      return NextResponse.json({ error: "File dan tipe (incomes/expenses) wajib disertakan" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const wb = xlsx.read(buffer, { type: "buffer" });
    const wsName = wb.SheetNames[0];
    const ws = wb.Sheets[wsName];

    const json: any[][] = xlsx.utils.sheet_to_json(ws, { header: 1 });

    if (json.length < 2) {
      await prisma.bulkUploadHistory.create({
        data: {
          type,
          fileName: file.name,
          rowsProcessed: 0,
          status: "failed",
          message: "File kosong atau tidak memiliki baris data",
        }
      });
      return NextResponse.json({ error: "File kosong atau tidak memiliki baris data" }, { status: 400 });
    }

    const dataRows = json.slice(1); // skip header
    let successCount = 0;
    let errorCount = 0;

    for (const row of dataRows) {
      if (!row || row.length === 0) continue;
      
      const rawDate = row[0];
      const categoryName = row[1];
      const desc = row[2] || "";
      let amount = row[3];

      if (!rawDate || !categoryName || amount == null) {
        errorCount++;
        continue;
      }

      let parsedDate: Date;
      if (typeof rawDate === "number") {
        parsedDate = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
      } else {
        parsedDate = new Date(rawDate);
      }

      if (isNaN(parsedDate.getTime())) {
        errorCount++;
        continue;
      }

      amount = Number(amount);
      if (isNaN(amount) || amount <= 0) {
        errorCount++;
        continue;
      }
      
      const safeCatName = String(categoryName).trim();
      if (!safeCatName) {
        errorCount++;
        continue;
      }

      try {
        if (type === "incomes") {
          let cat = await prisma.incomeCategory.findUnique({ where: { name: safeCatName } });
          if (!cat) cat = await prisma.incomeCategory.create({ data: { name: safeCatName } });
          
          await prisma.income.create({
            data: {
              date: parsedDate,
              categoryId: cat.id,
              description: String(desc),
              amount: amount,
            }
          });
        } else {
          let cat = await prisma.expenseCategory.findUnique({ where: { name: safeCatName } });
          if (!cat) cat = await prisma.expenseCategory.create({ data: { name: safeCatName } });
          
          await prisma.expense.create({
            data: {
              date: parsedDate,
              categoryId: cat.id,
              description: String(desc),
              amount: amount,
            }
          });
        }
        successCount++;
      } catch (err) {
        errorCount++;
      }
    }

    const status = (successCount > 0 && errorCount > 0) ? "partial" : (successCount > 0 ? "success" : "failed");
    const message = `Berhasil impor ${successCount} baris. Gagal: ${errorCount} baris.`;

    const history = await prisma.bulkUploadHistory.create({
      data: {
        type,
        fileName: file.name,
        rowsProcessed: successCount,
        status,
        message,
      }
    });

    return NextResponse.json({ ok: true, successCount, errorCount, status, message, history });
  } catch (error: any) {
    console.error("Bulk upload error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan sistem saat memproses file" }, { status: 500 });
  }
}
