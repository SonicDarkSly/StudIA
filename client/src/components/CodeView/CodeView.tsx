import type { ReactNode } from 'react';

interface Props {
  label: string;
  className?: string;
  children: ReactNode;
}

export function CodeView({ label, className, children }: Props) {
  return (
    <div
      className={className ? `code-view ${className}` : 'code-view'}
      role="region"
      aria-label={label}
      tabIndex={0}
    >
      {children}
    </div>
  );
}
