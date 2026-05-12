import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import * as readline from "readline/promises";

const prisma = new PrismaClient();
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  console.log("--- Create Admin User ---");
  const email = await rl.question("Email: ");
  const password = await rl.question("Password: ");

  if (!email || !password) {
    console.error("Email and password are required.");
    process.exit(1);
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  const passwordHash = await bcrypt.hash(password, 10);

  if (existingUser) {
    const answer = await rl.question(
      "User already exists. Make them an admin and update password? (y/N): "
    );
    if (answer.toLowerCase() === "y") {
      await prisma.user.update({
        where: { email },
        data: {
          passwordHash,
          isAdmin: true,
        },
      });
      console.log(`User ${email} updated to admin successfully.`);
    } else {
      console.log("Operation cancelled.");
    }
  } else {
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        isAdmin: true,
      },
    });
    console.log(`Admin user ${email} created successfully.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    rl.close();
  });
