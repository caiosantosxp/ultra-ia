import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Admin user
  const adminPassword = await bcrypt.hash(process.env.ADMIN_SEED_PASSWORD ?? 'admin', 12);
  await prisma.user.upsert({
    where: { email: 'admin@admin' },
    update: { password: adminPassword },
    create: {
      email: 'admin@admin',
      name: 'Admin',
      role: 'ADMIN',
      password: adminPassword,
    },
  });
  console.log('Seed completed: admin user created/updated');

  // Super admin user
  const superAdminPassword = await bcrypt.hash('admin123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: { password: superAdminPassword },
    create: {
      email: 'admin@gmail.com',
      name: 'Super Admin',
      role: 'ADMIN',
      password: superAdminPassword,
    },
  });
  console.log('Seed completed: super admin user created/updated');

  const specialist = await prisma.specialist.upsert({
    where: { slug: 'gestion-entreprise' },
    update: {},
    create: {
      name: 'Expert Gestion',
      slug: 'gestion-entreprise',
      domain: "Gestion d'Entreprise",
      description:
        "Expert IA spécialisé en gestion d'entreprise. Conseils personnalisés en stratégie, finance, RH et opérations pour PME et entrepreneurs.",
      price: 9900,
      accentColor: '#2563EB',
      avatarUrl: '/images/specialists/gestion-entreprise.webp',
      tags: ['Stratégie', 'Finance', 'RH', 'Opérations', 'PME'],
      quickPrompts: [
        '💼 Comment structurer mon business plan pour lever des fonds ?',
        '📊 Quels KPI suivre pour une PME de 10 employés ?',
        '🏗️ Comment optimiser mes processus opérationnels ?',
      ],
      isActive: true,
    },
  });

  console.log('Seed completed: specialist "gestion-entreprise" created/updated');

  // Expert user — linked to the specialist above
  const expertPassword = await bcrypt.hash('expert123', 12);
  const expertUser = await prisma.user.upsert({
    where: { email: 'expert@expert.com' },
    update: { password: expertPassword },
    create: {
      email: 'expert@expert.com',
      name: 'Expert User',
      role: 'EXPERT',
      password: expertPassword,
    },
  });
  // Link the specialist to the expert user (ownerId)
  await prisma.specialist.update({
    where: { slug: 'gestion-entreprise' },
    data: { ownerId: expertUser.id },
  });
  console.log('Seed completed: expert user created/updated (expert@expert.com / expert123)');

  // Expert user (gmail) — for testing the expert panel
  const expertGmailPassword = await bcrypt.hash('expert123', 12);
  const expertGmailUser = await prisma.user.upsert({
    where: { email: 'expert@gmail.com' },
    update: { password: expertGmailPassword },
    create: {
      email: 'expert@gmail.com',
      name: 'Expert Gmail',
      role: 'EXPERT',
      password: expertGmailPassword,
    },
  });
  // Create a second specialist owned by this expert
  const specialist2 = await prisma.specialist.upsert({
    where: { slug: 'marketing-digital' },
    update: { ownerId: expertGmailUser.id },
    create: {
      name: 'Expert Marketing',
      slug: 'marketing-digital',
      domain: 'Marketing Digital',
      description:
        'Expert IA spécialisé en marketing digital. Conseils en SEO, réseaux sociaux, publicité en ligne et growth hacking.',
      price: 9900,
      accentColor: '#16A34A',
      avatarUrl: '/images/specialists/marketing-digital.webp',
      tags: ['SEO', 'Social Media', 'Ads', 'Growth', 'Content'],
      quickPrompts: [
        '📈 Comment améliorer mon référencement naturel ?',
        '📱 Quelle stratégie réseaux sociaux pour ma marque ?',
        '💰 Comment optimiser mon budget publicitaire ?',
      ],
      isActive: true,
      ownerId: expertGmailUser.id,
    },
  });
  console.log('Seed completed: expert@gmail.com created/updated, linked to specialist "marketing-digital"');

  // Admin test subscription (bypasses Stripe for local testing)
  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@admin' } });
  if (adminUser) {
    // Remove any stale test subscription with this stripeSubscriptionId before upserting
    await prisma.subscription.deleteMany({ where: { stripeSubscriptionId: 'sub_admin_test' } });
    await prisma.subscription.upsert({
      where: { userId_specialistId: { userId: adminUser.id, specialistId: specialist.id } },
      update: {},
      create: {
        userId: adminUser.id,
        specialistId: specialist.id,
        status: 'ACTIVE',
        stripeSubscriptionId: 'sub_admin_test',
        stripeCustomerId: 'cus_admin_test',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false,
      },
    });
    console.log('Seed completed: admin test subscription created/updated');
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
