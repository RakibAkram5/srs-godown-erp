import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@srsgodown.com';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'Admin@123';
  const name = process.env.SEED_ADMIN_NAME ?? 'Warehouse Admin';

  // ── Default admin user ──────────────────────────────
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: { name, email, password: hashed, role: Role.ADMIN },
    });
    console.log(`✔ Created admin user: ${email} (password: ${password})`);
  } else {
    console.log(`• Admin user already exists: ${email}`);
  }

  // ── Single settings row ─────────────────────────────
  const settings = await prisma.settings.findFirst();
  if (!settings) {
    await prisma.settings.create({
      data: {
        companyName: 'SRS Godown ERP',
        currency: 'PKR',
        language: 'en',
        theme: 'system',
      },
    });
    console.log('✔ Created default settings row');
  } else {
    console.log('• Settings row already exists');
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
