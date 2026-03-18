import { prisma } from '@/lib/prisma';

function countOccurrences(text: string, keyword: string): number {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escaped, 'gi');
  return (text.match(regex) ?? []).length;
}

/**
 * Recalculates the lead score for a user based on all their conversations with a specialist.
 * Score = min(100, sum of (occurrences_in_user_messages * keyword_weight * 10)).
 * No-op if the user has no Lead record for this specialist.
 */
export async function recalculateLeadScore(
  specialistId: string,
  userId: string
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (!user?.email) return;

    const lead = await prisma.lead.findFirst({
      where: { email: user.email, specialistId },
      select: { id: true },
    });
    if (!lead) return;

    const [messages, keywords] = await Promise.all([
      prisma.message.findMany({
        where: {
          role: 'USER',
          conversation: { specialistId, userId, isDeleted: false },
        },
        select: { content: true },
      }),
      prisma.keyword.findMany({
        where: { specialistId },
        select: { name: true, weight: true },
      }),
    ]);

    if (keywords.length === 0) return;

    const fullText = messages.map((m) => m.content).join(' ');

    let rawScore = 0;
    for (const kw of keywords) {
      const count = countOccurrences(fullText, kw.name);
      rawScore += count * kw.weight * 10;
    }

    const score = Math.min(100, Math.round(rawScore));

    await prisma.lead.update({
      where: { id: lead.id },
      data: { score },
    });
  } catch {
    // Non-critical — never break the chat flow
  }
}
