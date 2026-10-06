import type { PropsWithChildren, ReactElement, ReactNode } from 'react';

type SectionProps = PropsWithChildren<{
  id: string;
  badge: string;
  title: string;
  description: ReactNode;
}>;

export function Section({
  id,
  badge,
  title,
  description,
  children,
}: SectionProps): ReactElement {
  return (
    <section id={id} className="section" aria-labelledby={`${id}-title`}>
      <header className="section-header">
        <span className="badge">{badge}</span>
        <h2 id={`${id}-title`}>{title}</h2>
        <p>{description}</p>
      </header>
      {children}
    </section>
  );
}
