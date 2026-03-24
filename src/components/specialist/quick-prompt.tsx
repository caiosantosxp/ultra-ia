'use client';

import Link from 'next/link';

interface QuickPromptProps {
  prompt: string;
  href?: string;
  ariaLabel?: string;
  onClick?: (prompt: string) => void;
}

/**
 * NexAgent Design System — Quick Prompt
 *
 * Glass-effect prompt buttons for specialist cards
 */
const baseClassName =
  'block rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/70 transition-all duration-200 hover:border-[#0367fb]/40 hover:bg-[#0367fb]/10 hover:text-white';

export function QuickPrompt({ prompt, href, ariaLabel, onClick }: QuickPromptProps) {
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

  if (onClick) {
    return (
      <button
        role="button"
        type="button"
        aria-label={ariaLabel ?? `Poser la question : ${prompt}`}
        onClick={() => onClick(prompt)}
        className={`${baseClassName} cursor-pointer text-left`}
      >
        {prompt}
      </button>
    );
  }

  return (
    <div role="listitem" className={baseClassName}>
      {prompt}
    </div>
  );
}
