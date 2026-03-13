import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button-variants';
import { Card, CardContent } from '@/components/ui/card';
import { QuickPrompt } from '@/components/specialist/quick-prompt';
import { SubscribeButton } from '@/components/specialist/subscribe-button';
import { cn } from '@/lib/utils';

interface SpecialistCardProps {
  specialist: {
    id: string;
    name: string;
    slug: string;
    domain: string;
    description: string;
    accentColor: string;
    avatarUrl: string;
    tags: string[];
    quickPrompts: string[];
  };
  isAuthenticated?: boolean;
  hasActiveSubscription?: boolean;
}

export function SpecialistCard({
  specialist,
  isAuthenticated = false,
  hasActiveSubscription = false,
}: SpecialistCardProps) {
  const initials = specialist.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2);

  return (
    <Card
      role="article"
      className="transition-all duration-150 hover:scale-[1.02] hover:shadow-lg"
    >
      <CardContent className="flex flex-col items-center gap-4 p-4">
        {/* Avatar */}
        <Avatar
          className="h-20 w-20 ring-2"
          style={{ '--tw-ring-color': specialist.accentColor } as React.CSSProperties}
        >
          <AvatarImage src={specialist.avatarUrl} alt={`Avatar de ${specialist.name}`} />
          <AvatarFallback
            className="text-lg font-semibold text-white"
            style={{ backgroundColor: specialist.accentColor }}
          >
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* Info */}
        <div className="text-center">
          <h4 className="font-heading text-lg font-semibold">{specialist.name}</h4>
          <p className="text-sm text-muted-foreground">{specialist.domain}</p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap justify-center gap-1.5">
          {specialist.tags.slice(0, 4).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Quick Prompts */}
        <div role="list" className="flex w-full flex-col gap-2">
          {specialist.quickPrompts.slice(0, 3).map((prompt) => (
            <QuickPrompt key={prompt} prompt={prompt} />
          ))}
        </div>

        {/* CTA */}
        <div className="mt-2 w-full">
          {!isAuthenticated ? (
            <Link
              href={`/register?callbackUrl=/specialist/${specialist.slug}?checkout=true`}
              aria-label={`Démarrer une conversation avec ${specialist.name}`}
              className={cn(buttonVariants(), 'w-full min-h-11')}
            >
              Démarrer une conversation
            </Link>
          ) : (
            <SubscribeButton
              specialistId={specialist.id}
              hasActiveSubscription={hasActiveSubscription}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
