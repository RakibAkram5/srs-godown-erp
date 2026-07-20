import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const username = process.env.SEED_ADMIN_USERNAME ?? 'admin';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'admin123';
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@srsgodown.com';
  const name = process.env.SEED_ADMIN_NAME ?? 'Administrator';

  // ── Default admin — created only if there are no users yet ──
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: { name, username, email, password: hashed, role: Role.ADMIN },
    });
    console.log(`✔ Created default admin — username: ${username}  password: ${password}`);
  } else {
    console.log('• Users already exist — skipping default admin');
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
