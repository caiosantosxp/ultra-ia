import { redirect } from 'next/navigation';

type Props = { params: Promise<{ id: string }> };

export default async function IdentidadePage({ params }: Props) {
  const { id } = await params;
  redirect(`/admin/agents/${id}/identidade/treinamento`);
}
