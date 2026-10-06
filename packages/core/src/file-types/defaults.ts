import type { FileType } from './types.ts';

/** Built-in file types, checked after the ones you register. */
export const defaultFileTypes: readonly FileType[] = [
  {
    kind: 'pdf',
    match: '.pdf,application/pdf',
    label: 'PDF',
    color: '#d8374e',
  },
  {
    kind: 'image',
    match: 'image/*,.png,.jpg,.jpeg,.gif,.webp,.avif,.svg',
    color: '#2f7cf6',
    artwork: 'thumbnail',
  },
  { kind: 'video', match: 'video/*', color: '#8b5cf6' },
  { kind: 'audio', match: 'audio/*', color: '#e39a0b' },
  {
    kind: 'sheet',
    match: '.csv,.tsv,.xls,.xlsx,.ods,.numbers,text/csv',
    color: '#1f9d55',
  },
  {
    kind: 'doc',
    match: '.doc,.docx,.odt,.rtf,.md,.txt,.pages,text/plain,text/markdown',
    color: '#2563eb',
  },
  { kind: 'slides', match: '.ppt,.pptx,.key,.odp', color: '#ea580c' },
  {
    kind: 'archive',
    match: '.zip,.rar,.7z,.tar,.gz,.tgz,.bz2,application/zip',
    label: (file) =>
      file.name.toLowerCase().endsWith('.tar.gz')
        ? 'TGZ'
        : extensionLabel(file.name, 'ZIP'),
    color: '#6b7280',
  },
  {
    kind: 'code',
    match:
      '.json,.js,.mjs,.cjs,.ts,.tsx,.jsx,.html,.css,.xml,.yaml,.yml,.py,.go,.rs,.java,.c,.cpp,.sh',
    color: '#475569',
  },
];

/** The extension in capitals, at most 4 characters, or `fallback`. */
export function extensionLabel(name: string, fallback: string): string {
  const dot = name.lastIndexOf('.');
  const extension = dot > 0 ? name.slice(dot + 1) : '';
  return (extension || fallback).slice(0, 4).toUpperCase();
}
