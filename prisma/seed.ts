import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Country distribution for French-market specialists
const COUNTRIES_POOL = [
  'FR', 'FR', 'FR', 'FR', 'FR', 'FR', 'FR', // ~58% France
  'BE', 'BE', 'BE',                           // ~25% Belgium
  'CA', 'CA',                                 // ~17% Canada
  'CH',                                       // ~8% Switzerland
  'LU',                                       // ~4% Luxembourg
  'MA',                                       // ~4% Morocco
  'US',                                       // ~4% USA
];
const randomCountry = () => COUNTRIES_POOL[Math.floor(Math.random() * COUNTRIES_POOL.length)];

async function main() {
  // ─── Admin users ────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash(process.env.ADMIN_SEED_PASSWORD ?? 'admin', 12);
  await prisma.user.upsert({
    where: { email: 'admin@admin' },
    update: { password: adminPassword },
    create: { email: 'admin@admin', name: 'Admin', role: 'ADMIN', password: adminPassword },
  });

  const superAdminPassword = await bcrypt.hash(process.env.SUPER_ADMIN_SEED_PASSWORD ?? 'admin123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: { password: superAdminPassword },
    create: { email: 'admin@gmail.com', name: 'Super Admin', role: 'ADMIN', password: superAdminPassword },
  });
  console.log('✓ Admin users');

  // ─── Specialists ────────────────────────────────────────────────────────────
  const specialist1 = await prisma.specialist.upsert({
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

  const specialist2 = await prisma.specialist.upsert({
    where: { slug: 'marketing-digital' },
    update: {},
    create: {
      name: 'Expert Marketing',
      slug: 'marketing-digital',
      domain: 'Marketing Digital',
      description:
        'Expert IA spécialisé en marketing digital. Conseils en SEO, réseaux sociaux, publicité en ligne et growth hacking.',
      price: 7900,
      accentColor: '#16A34A',
      avatarUrl: '/images/specialists/marketing-digital.webp',
      tags: ['SEO', 'Social Media', 'Ads', 'Growth', 'Content'],
      quickPrompts: [
        '📈 Comment améliorer mon référencement naturel ?',
        '📱 Quelle stratégie réseaux sociaux pour ma marque ?',
        '💰 Comment optimiser mon budget publicitaire ?',
      ],
      isActive: true,
    },
  });
  console.log('✓ Specialists');

  // ─── Expert users ────────────────────────────────────────────────────────────
  const expertPassword = await bcrypt.hash(process.env.EXPERT_SEED_PASSWORD ?? 'expert123', 12);

  const expert1 = await prisma.user.upsert({
    where: { email: 'expert@expert.com' },
    update: { password: expertPassword },
    create: { email: 'expert@expert.com', name: 'Expert User', role: 'EXPERT', password: expertPassword },
  });
  await prisma.specialist.update({
    where: { slug: 'gestion-entreprise' },
    data: { ownerId: expert1.id },
  });

  const expert2 = await prisma.user.upsert({
    where: { email: 'expert@gmail.com' },
    update: { password: expertPassword },
    create: { email: 'expert@gmail.com', name: 'Expert Gmail', role: 'EXPERT', password: expertPassword },
  });
  await prisma.specialist.update({
    where: { slug: 'marketing-digital' },
    data: { ownerId: expert2.id },
  });
  console.log('✓ Expert users (expert@expert.com / expert123, expert@gmail.com / expert123)');

  // ─── Regular users with subscriptions ───────────────────────────────────────
  const userPassword = await bcrypt.hash(process.env.USER_SEED_PASSWORD ?? 'user123', 12);

  const testUsers = [
    { email: 'alice@test.com',   name: 'Alice Martin',   specialist: specialist1, status: 'ACTIVE',   subId: 'sub_test_alice',   stripeStart: -60, stripeEnd: 305 },
    { email: 'bob@test.com',     name: 'Bob Dupont',     specialist: specialist1, status: 'ACTIVE',   subId: 'sub_test_bob',     stripeStart: -30, stripeEnd: 335 },
    { email: 'claire@test.com',  name: 'Claire Leroux',  specialist: specialist1, status: 'ACTIVE',   subId: 'sub_test_claire',  stripeStart: -15, stripeEnd: 350 },
    { email: 'david@test.com',   name: 'David Morel',    specialist: specialist1, status: 'CANCELED', subId: 'sub_test_david',   stripeStart: -90, stripeEnd: -1  },
    { email: 'emma@test.com',    name: 'Emma Blanc',     specialist: specialist2, status: 'ACTIVE',   subId: 'sub_test_emma',    stripeStart: -45, stripeEnd: 320 },
    { email: 'felix@test.com',   name: 'Félix Bernard',  specialist: specialist2, status: 'ACTIVE',   subId: 'sub_test_felix',   stripeStart: -20, stripeEnd: 345 },
    { email: 'grace@test.com',   name: 'Grace Petit',    specialist: specialist2, status: 'PAST_DUE', subId: 'sub_test_grace',   stripeStart: -35, stripeEnd: -5  },
    { email: 'hugo@test.com',    name: 'Hugo Lambert',   specialist: specialist1, status: 'ACTIVE',   subId: 'sub_test_hugo',    stripeStart: -5,  stripeEnd: 360 },
  ] as const;

  const createdUsers: Record<string, string> = {};

  for (const u of testUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { password: userPassword },
      create: { email: u.email, name: u.name, role: 'USER', password: userPassword },
    });
    createdUsers[u.email] = user.id;

    const now = Date.now();
    const periodStart = new Date(now + u.stripeStart * 24 * 60 * 60 * 1000);
    const periodEnd = new Date(now + u.stripeEnd * 24 * 60 * 60 * 1000);

    await prisma.subscription.deleteMany({ where: { stripeSubscriptionId: u.subId } });
    await prisma.subscription.upsert({
      where: { userId_specialistId: { userId: user.id, specialistId: u.specialist.id } },
      update: { status: u.status },
      create: {
        userId: user.id,
        specialistId: u.specialist.id,
        status: u.status,
        stripeSubscriptionId: u.subId,
        stripeCustomerId: `cus_test_${user.id.slice(-6)}`,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: u.status === 'CANCELED',
      },
    });
  }
  console.log('✓ Regular users with subscriptions (password: user123)');

  // ─── Admin test subscription ─────────────────────────────────────────────────
  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@admin' } });
  if (adminUser) {
    await prisma.subscription.deleteMany({ where: { stripeSubscriptionId: 'sub_admin_test' } });
    await prisma.subscription.upsert({
      where: { userId_specialistId: { userId: adminUser.id, specialistId: specialist1.id } },
      update: {},
      create: {
        userId: adminUser.id,
        specialistId: specialist1.id,
        status: 'ACTIVE',
        stripeSubscriptionId: 'sub_admin_test',
        stripeCustomerId: 'cus_admin_test',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false,
      },
    });
  }
  console.log('✓ Admin test subscription');

  // ─── Conversations + Messages (rich 90-day history) ──────────────────────────
  const activeUsers = testUsers.filter((u) => u.status === 'ACTIVE');

  // Remove existing seed conversations for idempotency
  await prisma.conversation.deleteMany({
    where: { userId: { in: Object.values(createdUsers) } },
  });

  const gestionPrompts = [
    { user: 'Comment structurer un business plan pour lever des fonds ?', assistant: 'Un business plan solide comprend : résumé exécutif, analyse de marché, modèle économique, projections financières sur 3 ans et stratégie de sortie.' },
    { user: 'Quels KPI suivre pour une PME de 10 employés ?', assistant: 'Priorité aux KPI opérationnels : marge brute, délai moyen de règlement clients, taux de rétention employés, chiffre d\'affaires par employé et cash-flow opérationnel.' },
    { user: 'Comment optimiser ma trésorerie en période de croissance ?', assistant: 'Trois leviers essentiels : raccourcir votre cycle de vente, négocier des délais fournisseurs plus longs, et mettre en place une ligne de crédit revolving avant d\'en avoir besoin.' },
    { user: 'Quelle structure juridique choisir pour mon activité ?', assistant: 'Cela dépend de votre situation : SAS pour la flexibilité et les levées de fonds, SARL pour la protection patrimoniale classique, ou SASU si vous êtes seul associé.' },
    { user: 'Comment recruter sans RH dédié ?', assistant: 'Externalisez le sourcing via LinkedIn Recruiter et des freelances RH. Définissez une fiche de poste précise, un processus d\'entretien structuré en 3 étapes et une grille d\'évaluation objective.' },
  ];

  const marketingPrompts = [
    { user: 'Comment améliorer mon référencement naturel rapidement ?', assistant: 'Focalisez-vous sur le contenu E-E-A-T, les Core Web Vitals, et les backlinks de qualité. Commencez par auditer vos pages existantes avec Search Console avant de créer du nouveau contenu.' },
    { user: 'Quelle stratégie réseaux sociaux pour ma marque B2B ?', assistant: 'LinkedIn est incontournable en B2B. Publiez 3-4 fois par semaine : thought leadership, cas clients, insights sectoriels. Engagez dans les commentaires des comptes influents de votre secteur.' },
    { user: 'Comment calculer mon ROI publicitaire sur Meta Ads ?', assistant: 'ROI = (Revenus générés - Coût des pubs) / Coût des pubs × 100. Trackez le ROAS (Return on Ad Spend) par campagne et visez un ROAS minimum de 3x pour être rentable.' },
    { user: 'Comment construire un tunnel de vente efficace ?', assistant: 'Structurez en 4 phases : Awareness (contenu organique), Interest (lead magnet), Desire (email nurturing), Action (offre limitée). Mesurez le taux de conversion à chaque étape.' },
    { user: 'Comment fidéliser mes clients après le premier achat ?', assistant: 'Mettez en place un programme d\'onboarding en 7 jours, une séquence email de valeur à J+7, J+21, J+45, et un programme de référencement avec incentive pour vos meilleurs clients.' },
  ];

  for (const u of activeUsers) {
    const userId = createdUsers[u.email];
    const prompts = u.specialist.id === specialist1.id ? gestionPrompts : marketingPrompts;
    const now = Date.now();

    // 15 conversations spread across 90 days (more recent = denser)
    for (let c = 0; c < 15; c++) {
      const weight = c / 14; // 0 → 1
      const daysAgo = Math.floor((1 - weight) * 88); // 88 → 0 days ago
      const convDate = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
      const prompt = prompts[c % prompts.length];

      const conv = await prisma.conversation.create({
        data: {
          userId,
          specialistId: u.specialist.id,
          title: prompt.user,
          country: randomCountry(),
          createdAt: convDate,
          updatedAt: convDate,
        },
      });

      // 20-35 message pairs per conversation (bulk insert)
      const msgCount = 20 + Math.floor(Math.random() * 16);
      const batch: {
        conversationId: string;
        userId?: string;
        role: 'USER' | 'ASSISTANT';
        content: string;
        createdAt: Date;
        updatedAt: Date;
      }[] = [];

      for (let m = 0; m < msgCount; m++) {
        const msgDate = new Date(convDate.getTime() + m * 4 * 60 * 1000);
        batch.push(
          {
            conversationId: conv.id,
            userId,
            role: 'USER',
            content: m === 0 ? prompt.user : `Question de suivi ${m} : pouvez-vous approfondir ce point ?`,
            createdAt: msgDate,
            updatedAt: msgDate,
          },
          {
            conversationId: conv.id,
            role: 'ASSISTANT',
            content: m === 0 ? prompt.assistant : `Bien sûr — voici un approfondissement sur le point ${m} : ${prompt.assistant.slice(0, 120)}…`,
            createdAt: new Date(msgDate.getTime() + 40 * 1000),
            updatedAt: new Date(msgDate.getTime() + 40 * 1000),
          }
        );
      }

      await prisma.message.createMany({ data: batch });
    }
  }
  console.log('✓ Conversations and messages (90-day history)');

  // ─── Dense recent activity (last 30 days) — ensures data for 7/15/30-day windows ──
  // Create extra conversations+messages clustered in the last 30 days for both specialists
  const recentUsersS1 = activeUsers.filter((u) => u.specialist.id === specialist1.id);
  const recentUsersS2 = activeUsers.filter((u) => u.specialist.id === specialist2.id);

  const recentActivity = [
    { users: recentUsersS1, prompts: gestionPrompts,   specialist: specialist1 },
    { users: recentUsersS2, prompts: marketingPrompts, specialist: specialist2 },
  ];

  for (const { users, prompts, specialist } of recentActivity) {
    for (const u of users) {
      const userId = createdUsers[u.email];
      // 3 additional conversations per user per "week bucket" within last 30 days
      for (let week = 0; week < 4; week++) {
        for (let i = 0; i < 3; i++) {
          const daysAgo = week * 7 + Math.floor(Math.random() * 6) + 1; // 1-30 days ago
          const hoursAgo = Math.floor(Math.random() * 18) + 6;          // 6-23h offset
          const convDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000 + hoursAgo * 60 * 60 * 1000);
          const prompt = prompts[(week * 3 + i) % prompts.length];

          const conv = await prisma.conversation.create({
            data: {
              userId,
              specialistId: specialist.id,
              title: `[Récent] ${prompt.user}`,
              country: randomCountry(),
              createdAt: convDate,
              updatedAt: convDate,
            },
          });

          const msgCount = 8 + Math.floor(Math.random() * 12);
          const batch: Parameters<typeof prisma.message.createMany>[0]['data'] = [];
          for (let m = 0; m < msgCount; m++) {
            // Realistic hours: 8am-10pm, more messages later in convo
            const msgHourOffset = Math.floor(Math.random() * 14) + 8; // 8-21h
            const msgDate = new Date(convDate);
            msgDate.setHours(msgHourOffset, Math.floor(Math.random() * 60));
            msgDate.setMinutes(msgDate.getMinutes() + m * 3);
            batch.push(
              {
                conversationId: conv.id,
                userId,
                role: 'USER' as const,
                content: m === 0 ? prompt.user : `Question de suivi ${m}`,
                createdAt: msgDate,
                updatedAt: msgDate,
              },
              {
                conversationId: conv.id,
                role: 'ASSISTANT' as const,
                content: m === 0 ? prompt.assistant : `Approfondissement ${m}: ${prompt.assistant.slice(0, 100)}…`,
                createdAt: new Date(msgDate.getTime() + 25 * 1000),
                updatedAt: new Date(msgDate.getTime() + 25 * 1000),
              }
            );
          }
          await prisma.message.createMany({ data: batch });
        }
      }
    }
  }
  console.log('✓ Dense recent activity (last 30 days)');

  // ─── Daily usage (90 days) ───────────────────────────────────────────────────
  for (const u of activeUsers) {
    const userId = createdUsers[u.email];
    for (let d = 0; d < 90; d++) {
      const date = new Date(Date.now() - d * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const dow = date.getDay(); // 0=Sun, 6=Sat
      const isWeekend = dow === 0 || dow === 6;
      const isPeak = dow >= 2 && dow <= 4; // Tue-Thu
      const base = isWeekend ? 2 : isPeak ? 9 : 5;
      const count = Math.max(0, base + Math.floor(Math.random() * 5) - 2);
      if (count > 0) {
        await prisma.dailyUsage.upsert({
          where: { userId_date: { userId, date: dateStr } },
          update: { count },
          create: { userId, date: dateStr, count },
        });
      }
    }
  }
  console.log('✓ Daily usage records (90 days)');

  // ─── Historical subscribers for 90-day revenue chart ─────────────────────────
  const historicalSubs = [
    // specialist1 (gestion-entreprise)
    { email: 'hist01@test.com', name: 'Paul Mercier',     daysAgo: 87, status: 'CANCELED' as const, specialist: specialist1 },
    { email: 'hist02@test.com', name: 'Nathalie Vidal',   daysAgo: 80, status: 'ACTIVE'   as const, specialist: specialist1 },
    { email: 'hist03@test.com', name: 'Pierre Moreau',    daysAgo: 72, status: 'ACTIVE'   as const, specialist: specialist1 },
    { email: 'hist04@test.com', name: 'Julie Roux',       daysAgo: 65, status: 'CANCELED' as const, specialist: specialist1 },
    { email: 'hist05@test.com', name: 'Laurent Faure',    daysAgo: 58, status: 'ACTIVE'   as const, specialist: specialist1 },
    { email: 'hist06@test.com', name: 'Marie Lecomte',    daysAgo: 50, status: 'PAST_DUE' as const, specialist: specialist1 },
    { email: 'hist07@test.com', name: 'François Duval',   daysAgo: 43, status: 'ACTIVE'   as const, specialist: specialist1 },
    { email: 'hist08@test.com', name: 'Isabelle Garnier', daysAgo: 35, status: 'ACTIVE'   as const, specialist: specialist1 },
    { email: 'hist09@test.com', name: 'Michel Caron',     daysAgo: 28, status: 'ACTIVE'   as const, specialist: specialist1 },
    { email: 'hist10@test.com', name: 'Sophie Lambert',   daysAgo: 20, status: 'ACTIVE'   as const, specialist: specialist1 },
    { email: 'hist11@test.com', name: 'Arnaud Perrin',    daysAgo: 14, status: 'ACTIVE'   as const, specialist: specialist1 },
    { email: 'hist12@test.com', name: 'Céline Rousseau',  daysAgo: 8,  status: 'ACTIVE'   as const, specialist: specialist1 },
    { email: 'hist13@test.com', name: 'Bruno Girard',     daysAgo: 5,  status: 'ACTIVE'   as const, specialist: specialist1 },
    { email: 'hist14@test.com', name: 'Aurélie Martin',   daysAgo: 2,  status: 'ACTIVE'   as const, specialist: specialist1 },
    // specialist2 (marketing-digital) — analytics screen for expert@gmail.com
    { email: 'mkt01@test.com',  name: 'Camille Dubois',   daysAgo: 85, status: 'CANCELED' as const, specialist: specialist2 },
    { email: 'mkt02@test.com',  name: 'Julien Morin',     daysAgo: 76, status: 'ACTIVE'   as const, specialist: specialist2 },
    { email: 'mkt03@test.com',  name: 'Anaïs Richard',    daysAgo: 68, status: 'ACTIVE'   as const, specialist: specialist2 },
    { email: 'mkt04@test.com',  name: 'Romain Lefevre',   daysAgo: 60, status: 'CANCELED' as const, specialist: specialist2 },
    { email: 'mkt05@test.com',  name: 'Manon Chevalier',  daysAgo: 52, status: 'ACTIVE'   as const, specialist: specialist2 },
    { email: 'mkt06@test.com',  name: 'Théo Bonnet',      daysAgo: 44, status: 'ACTIVE'   as const, specialist: specialist2 },
    { email: 'mkt07@test.com',  name: 'Léa Fontaine',     daysAgo: 37, status: 'PAST_DUE' as const, specialist: specialist2 },
    { email: 'mkt08@test.com',  name: 'Nicolas Perrot',   daysAgo: 29, status: 'ACTIVE'   as const, specialist: specialist2 },
    { email: 'mkt09@test.com',  name: 'Inès Marchand',    daysAgo: 21, status: 'ACTIVE'   as const, specialist: specialist2 },
    { email: 'mkt10@test.com',  name: 'Maxime Renard',    daysAgo: 12, status: 'ACTIVE'   as const, specialist: specialist2 },
    { email: 'mkt11@test.com',  name: 'Sarah Dupuis',     daysAgo: 6,  status: 'ACTIVE'   as const, specialist: specialist2 },
    { email: 'mkt12@test.com',  name: 'Kevin Aubert',     daysAgo: 3,  status: 'ACTIVE'   as const, specialist: specialist2 },
  ];

  for (const h of historicalSubs) {
    const hUser = await prisma.user.upsert({
      where: { email: h.email },
      update: {},
      create: { email: h.email, name: h.name, role: 'USER', password: userPassword },
    });

    const subDate = new Date(Date.now() - h.daysAgo * 24 * 60 * 60 * 1000);
    const periodEnd = new Date(subDate.getTime() + 365 * 24 * 60 * 60 * 1000);
    const subId = `sub_hist_${h.email.split('@')[0]}`;

    const existing = await prisma.subscription.findFirst({
      where: { userId: hUser.id, specialistId: h.specialist.id },
    });
    if (!existing) {
      await prisma.subscription.create({
        data: {
          userId: hUser.id,
          specialistId: h.specialist.id,
          status: h.status,
          stripeSubscriptionId: subId,
          stripeCustomerId: `cus_hist_${hUser.id.slice(-6)}`,
          currentPeriodStart: subDate,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: h.status === 'CANCELED',
          createdAt: subDate,
          updatedAt: subDate,
        },
      });
    }

    // Seed conversations + messages for active/past_due historical users (marketing specialist only,
    // to provide chart data for the expert analytics screen)
    if (h.specialist.id === specialist2.id && h.status !== 'CANCELED') {
      const convDate = new Date(Date.now() - h.daysAgo * 24 * 60 * 60 * 1000);
      const convCount = 3 + Math.floor(Math.random() * 4); // 3-6 conversations
      for (let c = 0; c < convCount; c++) {
        const cDate = new Date(convDate.getTime() + c * 2 * 24 * 60 * 60 * 1000);
        const p = marketingPrompts[c % marketingPrompts.length];
        const conv = await prisma.conversation.create({
          data: { userId: hUser.id, specialistId: h.specialist.id, title: p.user, country: randomCountry(), createdAt: cDate, updatedAt: cDate },
        });
        const msgCount = 6 + Math.floor(Math.random() * 10);
        const batch = [];
        for (let m = 0; m < msgCount; m++) {
          const mDate = new Date(cDate.getTime() + m * 5 * 60 * 1000);
          batch.push(
            { conversationId: conv.id, userId: hUser.id, role: 'USER' as const, content: m === 0 ? p.user : `Question de suivi ${m}`, createdAt: mDate, updatedAt: mDate },
            { conversationId: conv.id, role: 'ASSISTANT' as const, content: m === 0 ? p.assistant : `Approfondissement ${m}: ${p.assistant.slice(0, 80)}…`, createdAt: new Date(mDate.getTime() + 30000), updatedAt: new Date(mDate.getTime() + 30000) }
          );
        }
        await prisma.message.createMany({ data: batch });
      }

      // Daily usage for this historical user (from their sub start date to today)
      for (let d = 0; d < h.daysAgo; d++) {
        const date = new Date(Date.now() - d * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        const dow = date.getDay();
        const isWeekend = dow === 0 || dow === 6;
        const isPeak = dow >= 2 && dow <= 4;
        const base = isWeekend ? 1 : isPeak ? 7 : 4;
        const count = Math.max(0, base + Math.floor(Math.random() * 4) - 2);
        if (count > 0) {
          await prisma.dailyUsage.upsert({
            where: { userId_date: { userId: hUser.id, date: dateStr } },
            update: { count },
            create: { userId: hUser.id, date: dateStr, count },
          });
        }
      }
    }
  }
  console.log('✓ Historical subscribers (90-day chart) — specialist1 + specialist2');

  // ─── Leads ────────────────────────────────────────────────────────────────────
  const leads = [
    { specialistId: specialist1.id, email: 'lead1@prospect.com', name: 'Marc Dubois',    status: 'NEW',       leadType: 'LEAD',    score: 45 },
    { specialistId: specialist1.id, email: 'lead2@prospect.com', name: 'Sophie Garnier', status: 'CONTACTED', leadType: 'LEAD',    score: 72 },
    { specialistId: specialist1.id, email: 'lead3@prospect.com', name: 'Thomas Renard',  status: 'CONVERTED', leadType: 'PREMIUM', score: 90 },
    { specialistId: specialist2.id, email: 'lead4@prospect.com', name: 'Lucie Fontaine', status: 'NEW',       leadType: 'LEAD',    score: 30 },
    { specialistId: specialist2.id, email: 'lead5@prospect.com', name: 'Antoine Simon',  status: 'CONTACTED', leadType: 'PREMIUM', score: 65 },
  ] as const;

  for (const lead of leads) {
    await prisma.lead.upsert({
      where: { id: `seed-lead-${lead.email}` },
      update: {},
      create: { id: `seed-lead-${lead.email}`, ...lead },
    }).catch(() =>
      // id may not exist; use findFirst + create pattern as fallback
      prisma.lead.findFirst({ where: { email: lead.email, specialistId: lead.specialistId } }).then((existing) => {
        if (!existing) return prisma.lead.create({ data: lead });
      })
    );
  }
  console.log('✓ Leads');

  // ─── Lead conversations ───────────────────────────────────────────────────────
  // Create user accounts for each lead email and seed realistic prospect conversations

  const leadConvData = [
    {
      email: 'lead1@prospect.com',
      name: 'Marc Dubois',
      specialistId: specialist1.id,
      conversations: [
        {
          daysAgo: 5,
          title: 'Je veux en savoir plus sur vos services',
          messages: [
            { role: 'USER' as const,      content: "Bonjour, je cherche un expert pour m'aider avec la gestion de mon entreprise. Quels sont vos tarifs ?" },
            { role: 'ASSISTANT' as const, content: "Bonjour Marc ! Notre abonnement mensuel est à 99€/mois et vous donne accès à des conseils personnalisés en stratégie, finance et RH. Qu'est-ce qui vous a amené vers nous ?" },
            { role: 'USER' as const,      content: "J'ai une PME de 8 personnes et j'ai des difficultés avec ma trésorerie en période de croissance." },
            { role: 'ASSISTANT' as const, content: "C'est un défi très courant pour les PME en croissance. Trois leviers essentiels : raccourcir votre cycle de vente, négocier des délais fournisseurs plus longs, et mettre en place une ligne de crédit revolving avant d'en avoir besoin. Souhaitez-vous qu'on détaille chaque point ?" },
            { role: 'USER' as const,      content: "Oui, surtout la partie délais fournisseurs." },
            { role: 'ASSISTANT' as const, content: "Pour les délais fournisseurs, l'objectif est d'allonger vos DMP (Délais Moyens de Paiement) sans dégrader la relation. Commencez par identifier vos 5 fournisseurs clés, puis négociez un passage de 30 à 60 jours en échange d'un engagement de volume ou d'une promesse de fidélité sur 12 mois." },
          ],
        },
        {
          daysAgo: 2,
          title: 'Comment structurer un business plan ?',
          messages: [
            { role: 'USER' as const,      content: "J'ai une réunion avec des investisseurs la semaine prochaine. Comment structurer mon pitch ?" },
            { role: 'ASSISTANT' as const, content: "Pour un pitch investisseur efficace : 1) Problème (1 slide), 2) Solution (1-2 slides), 3) Traction (métriques clés), 4) Marché adressable, 5) Modèle économique, 6) Équipe, 7) Use of funds. Limitez-vous à 10 slides max." },
            { role: 'USER' as const,      content: "Et pour les projections financières, sur quelle période ?" },
            { role: 'ASSISTANT' as const, content: "3 ans minimum, 5 ans si votre secteur le justifie. Présentez un scenario conservateur et un optimiste avec des hypothèses claires. Les investisseurs évaluent votre capacité à raisonner, pas seulement les chiffres." },
          ],
        },
      ],
    },
    {
      email: 'lead2@prospect.com',
      name: 'Sophie Garnier',
      specialistId: specialist1.id,
      conversations: [
        {
          daysAgo: 12,
          title: 'Quelle structure juridique pour mon activité ?',
          messages: [
            { role: 'USER' as const,      content: "Je lance une activité de conseil et j'hésite entre SAS et SARL. Pouvez-vous m'éclairer ?" },
            { role: 'ASSISTANT' as const, content: "La SAS offre plus de flexibilité statutaire et est plus adaptée si vous envisagez des levées de fonds. La SARL est plus encadrée mais offre une protection patrimoniale classique. Pour une activité de conseil solo, la SASU (version unipersonnelle de la SAS) est souvent recommandée." },
            { role: 'USER' as const,      content: "Et côté fiscalité, quelle est la différence ?" },
            { role: 'ASSISTANT' as const, content: "En SAS, vous êtes assimilé salarié (cotisations plus élevées mais meilleure protection sociale). En SARL, si vous êtes gérant majoritaire, vous êtes TNS (travailleur non salarié) avec des cotisations réduites mais moins de couverture. À revenus équivalents, la SARL est souvent plus avantageuse fiscalement en phase de démarrage." },
            { role: 'USER' as const,      content: "Merci, c'est très clair ! Je vais réfléchir à l'abonnement premium." },
            { role: 'ASSISTANT' as const, content: "Avec plaisir Sophie ! N'hésitez pas à revenir avec d'autres questions. Si vous souhaitez un accompagnement régulier, notre abonnement vous donnera accès à des conseils personnalisés à tout moment." },
          ],
        },
      ],
    },
    {
      email: 'lead3@prospect.com',
      name: 'Thomas Renard',
      specialistId: specialist1.id,
      conversations: [
        {
          daysAgo: 20,
          title: 'Optimisation des processus RH',
          messages: [
            { role: 'USER' as const,      content: "J'ai du mal à retenir mes talents. Mon taux de turnover est de 35% par an." },
            { role: 'ASSISTANT' as const, content: "Un taux de 35% est effectivement préoccupant. Les causes principales sont généralement : manque de reconnaissance, absence de perspectives d'évolution, problèmes de management, ou rémunération non compétitive. Avez-vous mené des entretiens de sortie ?" },
            { role: 'USER' as const,      content: "Non pas vraiment, je pensais que c'était normal dans notre secteur." },
            { role: 'ASSISTANT' as const, content: "Les entretiens de sortie sont une mine d'informations. Commencez par les mettre en place. En parallèle, je recommande : un programme d'onboarding structuré sur 90 jours, des entretiens d'évolution semestriels, et une grille salariale transparente." },
          ],
        },
        {
          daysAgo: 8,
          title: 'Comment recruter efficacement sans RH ?',
          messages: [
            { role: 'USER' as const,      content: "Je dois recruter un directeur commercial mais je n'ai pas de DRH. Par où commencer ?" },
            { role: 'ASSISTANT' as const, content: "Pour un poste clé sans DRH : définissez d'abord un profil de poste précis avec 3-5 critères non négociables. Externalisez le sourcing via LinkedIn Recruiter ou un cabinet spécialisé. Créez un process d'entretien structuré en 3 étapes avec une grille d'évaluation objective." },
            { role: 'USER' as const,      content: "Super, je vais tester cette approche. Votre service m'a vraiment aidé !" },
            { role: 'ASSISTANT' as const, content: "Avec plaisir Thomas ! Pour un accompagnement continu sur votre croissance RH et commerciale, notre formule premium vous permettrait de consulter à tout moment. Bonne chance pour votre recrutement !" },
          ],
        },
      ],
    },
    {
      email: 'lead4@prospect.com',
      name: 'Lucie Fontaine',
      specialistId: specialist2.id,
      conversations: [
        {
          daysAgo: 7,
          title: 'Comment démarrer avec le SEO ?',
          messages: [
            { role: 'USER' as const,      content: "Mon site e-commerce a peu de trafic organique. Par où commencer pour améliorer le SEO ?" },
            { role: 'ASSISTANT' as const, content: "Bienvenue Lucie ! Pour un e-commerce, commencez par : 1) Audit technique (vitesse, mobile, HTTPS), 2) Recherche de mots-clés longue traîne avec faible concurrence, 3) Optimisation des fiches produits (balises title, meta description, images). Quel est votre secteur ?" },
            { role: 'USER' as const,      content: "Je vends des accessoires de yoga. Mon concurrent principal est très bien positionné." },
            { role: 'ASSISTANT' as const, content: "Pour les accessoires de yoga, misez sur les requêtes transactionnelles de niche : 'tapis yoga antidérapant éco-responsable', 'bloc yoga liège naturel', etc. Créez aussi du contenu éditorial (guides, tutoriels) pour capturer du trafic informationnel et renforcer votre autorité." },
          ],
        },
      ],
    },
    {
      email: 'lead5@prospect.com',
      name: 'Antoine Simon',
      specialistId: specialist2.id,
      conversations: [
        {
          daysAgo: 15,
          title: 'Stratégie réseaux sociaux pour B2B',
          messages: [
            { role: 'USER' as const,      content: "Je gère une agence B2B et je ne sais pas sur quels réseaux sociaux me concentrer." },
            { role: 'ASSISTANT' as const, content: "Pour le B2B, LinkedIn est incontournable. Publiez 3-4 fois par semaine : thought leadership, études de cas clients, insights sectoriels. Engagez dans les commentaires des comptes influents de votre secteur. YouTube peut aussi être puissant pour du contenu éducatif long." },
            { role: 'USER' as const,      content: "Et Twitter/X, ça vaut encore le coup en B2B ?" },
            { role: 'ASSISTANT' as const, content: "X reste pertinent pour certains secteurs tech/startups et pour suivre les tendances en temps réel. Mais si vous devez prioriser, concentrez 80% de votre effort sur LinkedIn. Quel est le secteur de vos clients cibles ?" },
            { role: 'USER' as const,      content: "On cible les PME du secteur industriel." },
            { role: 'ASSISTANT' as const, content: "Pour les PME industrielles, LinkedIn + une newsletter thématique mensuelle est une combinaison très efficace. Les décideurs industriels sont actifs sur LinkedIn et consomment du contenu email. Pensez aussi aux groupes LinkedIn de votre secteur pour développer votre notoriété." },
          ],
        },
        {
          daysAgo: 3,
          title: 'Calcul ROI de mes campagnes Meta Ads',
          messages: [
            { role: 'USER' as const,      content: "J'investis 2000€/mois en Meta Ads mais je ne sais pas si c'est rentable." },
            { role: 'ASSISTANT' as const, content: "Pour calculer votre ROI : (Revenus générés - 2000€) / 2000€ × 100. Mais d'abord, avez-vous configuré le pixel Meta et le suivi des conversions ? Sans tracking précis, impossible d'optimiser." },
            { role: 'USER' as const,      content: "Le pixel est installé mais je ne suis pas sûr que les conversions soient bien trackées." },
            { role: 'ASSISTANT' as const, content: "C'est le point critique. Je vous recommande de : 1) Vérifier avec Meta Pixel Helper, 2) Configurer les événements de conversion standard (Lead, Purchase), 3) Utiliser l'API Conversions côté serveur pour pallier les blocages iOS. Votre ROAS cible devrait être minimum 3x pour être rentable." },
          ],
        },
      ],
    },
  ];

  // Delete existing lead conversations for idempotency
  const leadEmails = leadConvData.map((l) => l.email);
  const existingLeadUsers = await prisma.user.findMany({ where: { email: { in: leadEmails } }, select: { id: true } });
  if (existingLeadUsers.length > 0) {
    await prisma.conversation.deleteMany({ where: { userId: { in: existingLeadUsers.map((u) => u.id) } } });
  }

  for (const lead of leadConvData) {
    const leadUser = await prisma.user.upsert({
      where: { email: lead.email },
      update: {},
      create: { email: lead.email, name: lead.name, role: 'USER', password: userPassword },
    });

    for (const conv of lead.conversations) {
      const convDate = new Date(Date.now() - conv.daysAgo * 24 * 60 * 60 * 1000);
      const createdConv = await prisma.conversation.create({
        data: {
          userId: leadUser.id,
          specialistId: lead.specialistId,
          title: conv.title,
          country: randomCountry(),
          createdAt: convDate,
          updatedAt: convDate,
        },
      });

      const msgBatch = conv.messages.map((msg, i) => ({
        conversationId: createdConv.id,
        userId: msg.role === 'USER' ? leadUser.id : undefined,
        role: msg.role,
        content: msg.content,
        createdAt: new Date(convDate.getTime() + i * 90 * 1000),
        updatedAt: new Date(convDate.getTime() + i * 90 * 1000),
      }));

      await prisma.message.createMany({ data: msgBatch });
    }
  }
  console.log('✓ Lead conversations (prospect chat history)');

  // ─── Keywords ─────────────────────────────────────────────────────────────────
  const keywords1 = ['gestion', 'stratégie', 'finance', 'RH', 'PME', 'business plan'];
  const keywords2 = ['SEO', 'social media', 'ads', 'content', 'growth'];

  for (const name of keywords1) {
    await prisma.keyword.upsert({
      where: { specialistId_name: { specialistId: specialist1.id, name } },
      update: {},
      create: { specialistId: specialist1.id, name, weight: 1 + Math.random() },
    });
  }
  for (const name of keywords2) {
    await prisma.keyword.upsert({
      where: { specialistId_name: { specialistId: specialist2.id, name } },
      update: {},
      create: { specialistId: specialist2.id, name, weight: 1 + Math.random() },
    });
  }
  console.log('✓ Keywords');

  // ─── Team members ─────────────────────────────────────────────────────────────
  await prisma.expertTeamMember.upsert({
    where: { specialistId_email: { specialistId: specialist1.id, email: 'collaborateur@expert.com' } },
    update: {},
    create: { specialistId: specialist1.id, email: 'collaborateur@expert.com', name: 'Jean Collaborateur', role: 'Admin' },
  });
  await prisma.expertTeamMember.upsert({
    where: { specialistId_email: { specialistId: specialist2.id, email: 'assistant@marketing.com' } },
    update: {},
    create: { specialistId: specialist2.id, email: 'assistant@marketing.com', name: 'Camille Assistante', role: 'Admin' },
  });
  console.log('✓ Team members');

  console.log('\n🌱 Seed completed!\n');
  console.log('  admin@admin          / admin');
  console.log('  admin@gmail.com      / admin123');
  console.log('  expert@expert.com    / expert123  →  gestion-entreprise');
  console.log('  expert@gmail.com     / expert123  →  marketing-digital');
  console.log('  alice@test.com       / user123    →  ACTIVE sub (gestion)');
  console.log('  bob@test.com         / user123    →  ACTIVE sub (gestion)');
  console.log('  claire@test.com      / user123    →  ACTIVE sub (gestion)');
  console.log('  david@test.com       / user123    →  CANCELED sub (gestion)');
  console.log('  emma@test.com        / user123    →  ACTIVE sub (marketing)');
  console.log('  felix@test.com       / user123    →  ACTIVE sub (marketing)');
  console.log('  grace@test.com       / user123    →  PAST_DUE sub (marketing)');
  console.log('  hugo@test.com        / user123    →  ACTIVE sub (gestion)');
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
