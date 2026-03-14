import { prisma } from "@/lib/prisma";

export async function getDefaultAccountId() {
  const account = await prisma.account.upsert({
    where: { name: "Kas Utama" },
    update: {},
    create: { name: "Kas Utama", type: "cash" },
  });
  return account.id;
}
