import type * as React from 'react';

type SectionProps = React.PropsWithChildren<{
  id: string;
  badge: string;
  title: string;
  description: React.ReactNode;
}>;

export function Section({
  id,
  badge,
  title,
  description,
  children,
}: SectionProps): React.ReactElement {
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
