'use client';

import { useState, useTransition } from 'react';
import { Shield, Trash2, UserPlus } from 'lucide-react';

import { addTeamMember, removeTeamMember } from '@/actions/expert-panel-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface TeamMember {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: Date;
}

interface TeamMembersManagerProps {
  specialistId: string;
  specialistName: string;
  initialMembers: TeamMember[];
}

function AvatarInitials({ name, email }: { name: string | null; email: string }) {
  const display = name ?? email;
  const initials = display
    .split(/[\s.@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('');
  const colors = [
    'bg-blue-400',
    'bg-purple-500',
    'bg-teal-400',
    'bg-orange-400',
    'bg-pink-400',
    'bg-indigo-400',
  ];
  const idx = display.charCodeAt(0) % colors.length;
  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${colors[idx]}`}
    >
      {initials || '?'}
    </div>
  );
}

function formatMemberDate(date: Date) {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function TeamMembersManager({
  specialistId,
  specialistName,
  initialMembers,
}: TeamMembersManagerProps) {
  const [members, setMembers] = useState<TeamMember[]>(initialMembers);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleInvite() {
    const email = inviteEmail.trim();
    if (!email) return;
    const name = inviteName.trim() || null;

    const optimistic: TeamMember = {
      id: `temp-${Date.now()}`,
      email,
      name,
      role: 'Admin',
      createdAt: new Date(),
    };
    setMembers((prev) => [...prev, optimistic]);
    setInviteEmail('');
    setInviteName('');
    setShowInvite(false);

    startTransition(async () => {
      await addTeamMember(specialistId, { email, name: name ?? undefined });
    });
  }

  function handleRemove(id: string) {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    if (!id.startsWith('temp-')) {
      startTransition(async () => {
        await removeTeamMember(id, specialistId);
      });
    }
  }

  return (
    <div className="max-w-2xl space-y-5">
      {/* Header */}
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="relative">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <UserPlus className="h-8 w-8 text-muted-foreground" />
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
            +
          </span>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Membros da equipe</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie os administradores de {specialistName}
          </p>
        </div>
      </div>

      {/* Invite button */}
      <div className="flex justify-end">
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => setShowInvite((v) => !v)}
        >
          <UserPlus className="h-4 w-4" />
          Convidar um membro
        </Button>
      </div>

      {/* Invite form */}
      {showInvite && (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <h3 className="text-sm font-semibold">Convidar novo membro</h3>
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Nome (opcional)"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
            />
            <Input
              type="email"
              placeholder="E-mail"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleInvite}
              disabled={!inviteEmail.trim() || isPending}
            >
              Convidar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowInvite(false)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Members list */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Membros ({members.length})
        </p>
        <div className="rounded-xl border bg-card divide-y overflow-hidden">
          {members.length === 0 ? (
            <div className="flex h-32 items-center justify-center">
              <p className="text-sm text-muted-foreground">Nenhum membro ainda</p>
            </div>
          ) : (
            members.map((member) => (
              <div key={member.id} className="flex items-center gap-3 px-4 py-3">
                <AvatarInitials name={member.name} email={member.email} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {member.name ?? member.email.split('@')[0]}
                  </p>
                  <p className="text-xs text-muted-foreground">{member.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Membro desde {formatMemberDate(member.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                    <Shield className="h-3 w-3" />
                    {member.role}
                  </span>
                  <button
                    onClick={() => handleRemove(member.id)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
