import { AgentForm } from '@/components/admin/agent-form';
import { SecuritySettingsForm } from '@/components/admin/security-settings-form';
import { TeamMembersManager } from '@/components/admin/team-members-manager';
import { FirstMessageForm } from '@/components/expert/first-message-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { requireExpert } from '@/lib/expert-helpers';
import { prisma } from '@/lib/prisma';

export default async function ExpertPersonalizacaoPage() {
  const { specialist: base } = await requireExpert();

  const specialist = await prisma.specialist.findUnique({
    where: { id: base.id },
    include: {
      teamMembers: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!specialist) return null;

  const securitySettings = {
    showSources: specialist.showSources,
    showBranding: specialist.showBranding,
    personalBranding: specialist.personalBranding,
    hideSidebar: specialist.hideSidebar,
    requirePhone: specialist.requirePhone,
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="experiencia">
        <TabsList>
          <TabsTrigger value="experiencia">Experiência</TabsTrigger>
          <TabsTrigger value="gestao">Gestão</TabsTrigger>
        </TabsList>

        <TabsContent value="experiencia" className="mt-6">
          <Tabs defaultValue="perfil">
            <TabsList>
              <TabsTrigger value="perfil">Perfil</TabsTrigger>
              <TabsTrigger value="primeira-mensagem">Primeira mensagem</TabsTrigger>
              <TabsTrigger value="cenarios">Cenários</TabsTrigger>
            </TabsList>

            <TabsContent value="perfil" className="mt-6">
              <div className="max-w-3xl rounded-lg border p-6">
                <h3 className="mb-4 text-sm font-semibold">Informações do perfil</h3>
                <AgentForm
                  specialistId={specialist.id}
                  defaultValues={{
                    name: specialist.name,
                    slug: specialist.slug,
                    domain: specialist.domain,
                    description: specialist.description,
                    price: specialist.price,
                    accentColor: specialist.accentColor,
                    avatarUrl: specialist.avatarUrl,
                    tags: specialist.tags,
                    quickPrompts: specialist.quickPrompts,
                    language: specialist.language as 'fr' | 'en',
                    systemPrompt: specialist.systemPrompt ?? '',
                    scopeLimits: specialist.scopeLimits ?? '',
                  }}
                />
              </div>
            </TabsContent>

            <TabsContent value="primeira-mensagem" className="mt-6">
              <FirstMessageForm
                specialistId={specialist.id}
                initialValue={specialist.firstMessage ?? null}
              />
            </TabsContent>

            <TabsContent value="cenarios" className="mt-6">
              <div className="max-w-3xl rounded-lg border p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold">Cenários (sugestões rápidas)</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {specialist.quickPrompts.length} cenário
                    {specialist.quickPrompts.length !== 1 ? 's' : ''} configurado
                    {specialist.quickPrompts.length !== 1 ? 's' : ''}
                  </p>
                </div>
                {specialist.quickPrompts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum cenário configurado.</p>
                ) : (
                  <ul className="space-y-2">
                    {specialist.quickPrompts.map((prompt, i) => (
                      <li key={i} className="rounded-md bg-muted px-3 py-2 text-sm">
                        {prompt}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-xs text-muted-foreground">Para editar, acesse a aba Perfil.</p>
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="gestao" className="mt-6">
          <Tabs defaultValue="em-geral">
            <TabsList>
              <TabsTrigger value="em-geral">Em geral</TabsTrigger>
              <TabsTrigger value="equipe">Equipe</TabsTrigger>
              <TabsTrigger value="limites">Limites</TabsTrigger>
              <TabsTrigger value="acessos">Acessos</TabsTrigger>
            </TabsList>

            <TabsContent value="em-geral" className="mt-6">
              <SecuritySettingsForm specialistId={specialist.id} settings={securitySettings} />
            </TabsContent>

            <TabsContent value="equipe" className="mt-6">
              <TeamMembersManager
                specialistId={specialist.id}
                specialistName={specialist.name}
                initialMembers={specialist.teamMembers}
              />
            </TabsContent>

            <TabsContent value="limites" className="mt-6">
              <div className="max-w-3xl rounded-lg border p-6 space-y-4">
                <h3 className="text-sm font-semibold">Limites de portée</h3>
                {specialist.scopeLimits ? (
                  <p className="text-sm whitespace-pre-wrap">{specialist.scopeLimits}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum limite configurado.</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Para editar, acesse Experiência → Perfil.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="acessos" className="mt-6">
              <div className="max-w-3xl rounded-lg border p-6 space-y-4">
                <h3 className="text-sm font-semibold">Controle de acessos e preço</h3>
                <div className="flex justify-between py-2 border-b text-sm">
                  <span className="text-muted-foreground">Preço da assinatura</span>
                  <span className="font-medium">
                    {new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'EUR',
                    }).format(specialist.price / 100)}
                    /mês
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Para editar o preço, acesse Experiência → Perfil.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}
