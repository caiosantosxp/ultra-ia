import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.specialist.upsert({
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
