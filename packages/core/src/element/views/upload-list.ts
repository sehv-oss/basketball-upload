import type { ResolvedFileType } from '../../file-types/types.ts';
import { formatBytes } from '../../upload/format.ts';
import type { UploadItem } from '../../upload/types.ts';
import { el, icon } from '../dom.ts';
import type { Messages } from '../messages.ts';
import { createArtwork, fileColor } from './card.ts';

export interface UploadListOptions {
  resolveType(file: File): ResolvedFileType;
  onRetry(id: string): void;
  locale(): string | undefined;
}

export interface UploadListView {
  readonly element: HTMLUListElement;
  render(items: readonly UploadItem[], messages: Messages): void;
  dispose(): void;
}

interface Row {
  readonly element: HTMLLIElement;
  update(item: UploadItem, messages: Messages): void;
  dispose(): void;
}

function statusText(item: UploadItem, messages: Messages): string {
  switch (item.status) {
    case 'ready':
      return messages.ready;
    case 'queued':
      return messages.queued;
    case 'uploading':
      return messages.uploading;
    case 'uploaded':
      return messages.uploaded;
    case 'error':
      return messages.failed;
  }
}

function createRow(
  item: UploadItem,
  type: ResolvedFileType,
  options: UploadListOptions
): Row {
  const { file } = item;
  const artwork = createArtwork(file, type, { class: 'item-artwork' });
  const thumbnail = el(
    'span',
    {
      class: 'item-icon',
      part: `item-icon item-icon-${type.kind}`,
      'aria-hidden': 'true',
    },
    [
      el('span', { class: 'item-paper' }, [
        artwork.element,
        el('span', { class: 'item-badge' }, [type.label]),
      ]),
    ]
  );
  thumbnail.style.setProperty('--_file-color', fileColor(type));

  const status = el('span', { class: 'item-status', part: 'item-status' });
  const bar = el('span', { class: 'progress-bar' });
  const progress = el(
    'span',
    {
      class: 'progress',
      part: 'progress',
      role: 'progressbar',
      'aria-valuemin': '0',
      'aria-valuemax': '100',
    },
    [bar]
  );
  const check = el('span', { class: 'item-check', 'aria-hidden': 'true' }, [
    icon('check'),
  ]);
  const retry = el(
    'button',
    { type: 'button', class: 'item-retry', part: 'retry' },
    [icon('retry')]
  );
  retry.addEventListener('click', () => options.onRetry(item.id));

  const element = el(
    'li',
    { class: 'item', part: 'item', 'data-kind': type.kind },
    [
      thumbnail,
      el('span', { class: 'item-meta' }, [
        el('span', { class: 'item-name', part: 'item-name' }, [file.name]),
        el('span', { class: 'item-size', part: 'item-size' }, [
          formatBytes(file.size, options.locale()),
        ]),
      ]),
      el('span', { class: 'item-progress' }, [status, progress]),
      el('span', { class: 'item-end' }, [check, retry]),
    ]
  );

  return {
    element,
    update(next, messages) {
      element.dataset.status = next.status;
      status.textContent = statusText(next, messages);
      const percent = Math.round(next.progress * 100);
      progress.setAttribute('aria-valuenow', String(percent));
      progress.setAttribute('aria-label', messages.progress(file.name));
      bar.style.scale = `${next.progress} 1`;
      check.hidden = next.status !== 'uploaded';
      retry.hidden = next.status !== 'error';
      retry.setAttribute('aria-label', messages.retry(file.name));
      retry.title = messages.retry(file.name);
    },
    dispose() {
      artwork.dispose();
      element.remove();
    },
  };
}

/** The list of files in the basket, with their upload progress. */
export function createUploadList(options: UploadListOptions): UploadListView {
  const element = el('ul', { class: 'list', part: 'list', role: 'list' });
  element.hidden = true;
  const rows = new Map<string, Row>();

  return {
    element,
    render(items, messages) {
      const present = new Set<string>();
      for (const item of items) {
        present.add(item.id);
        let row = rows.get(item.id);
        if (!row) {
          row = createRow(item, options.resolveType(item.file), options);
          rows.set(item.id, row);
          element.append(row.element);
        }
        row.update(item, messages);
      }
      for (const [id, row] of rows) {
        if (present.has(id)) continue;
        row.dispose();
        rows.delete(id);
      }
      element.hidden = items.length === 0;
    },
    dispose() {
      for (const row of rows.values()) row.dispose();
      rows.clear();
    },
  };
}
