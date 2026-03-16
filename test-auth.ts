import "dotenv/config";
import { prisma } from "./src/lib/prisma";
import bcrypt from "bcryptjs";

async function test() {
  try {
    const user = await prisma.user.findUnique({ where: { username: "admin" } });
    console.log("User found:", !!user);
    if (user) {
      const valid = await bcrypt.compare("admin123", user.password);
      console.log("Password valid:", valid);
    }
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}
test();
