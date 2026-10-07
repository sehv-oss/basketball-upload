import * as React from 'react';

interface CopyButtonProps {
  text: string;
  label: string;
}

export function CopyButton({
  text,
  label,
}: CopyButtonProps): React.ReactElement {
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleOnClick = (): void => {
    void navigator.clipboard.writeText(text).then(() => setCopied(true));
  };

  return (
    <button
      type="button"
      className="icon-button"
      aria-label={label}
      title={copied ? 'Copied' : label}
      onClick={handleOnClick}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {copied ? (
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        ) : (
          <>
            <rect x="8.5" y="8.5" width="12" height="12" rx="2" />
            <path d="M15.5 8.5V5.5a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3" />
          </>
        )}
      </svg>
    </button>
  );
}
