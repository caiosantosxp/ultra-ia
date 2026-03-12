import Link from 'next/link';

interface QuickPromptProps {
  prompt: string;
  href?: string;
  ariaLabel?: string;
}

const baseClassName =
  'block rounded-md border bg-surface px-3 py-2 text-sm text-muted-foreground transition-colors duration-150 hover:border-primary hover:text-primary';

export function QuickPrompt({ prompt, href, ariaLabel }: QuickPromptProps) {
  if (href) {
    return (
      <Link
        href={href}
        aria-label={ariaLabel}
        className={`${baseClassName} cursor-pointer`}
      >
        {prompt}
      </Link>
    );
  }

  return (
    <div role="listitem" className={baseClassName}>
      {prompt}
    </div>
  );
}
