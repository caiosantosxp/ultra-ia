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
 * Light theme prompt buttons for chat area
 */
const baseClassName =
  'block rounded-xl border border-[#e5e7eb] bg-white px-4 py-3 text-sm text-[#787878] shadow-sm transition-all duration-200 hover:border-[#0367fb]/40 hover:bg-[#0367fb]/5 hover:text-[#161616] hover:shadow-md';

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
