import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import {
  DndBasketball,
  type DndBasketballElement,
  type FileType,
} from '../src/dnd-basketball-react.ts';

const pdf = (name = 'final_final_v7.pdf'): File =>
  new File([new Uint8Array(100)], name, { type: 'application/pdf' });

function element(ref: {
  current: DndBasketballElement | null;
}): DndBasketballElement {
  if (!ref.current) throw new Error('Not mounted');
  return ref.current;
}

describe('<DndBasketball>', () => {
  it('renders the custom element, with its props as attributes', async () => {
    const ref = createRef<DndBasketballElement>();
    await render(
      <DndBasketball
        ref={ref}
        multiple
        accept=".pdf"
        maxSize={1000}
        maxFiles={3}
        theme="dark"
        name="files"
        concurrency={2}
        className="hoop"
      />
    );

    const hoop = element(ref);
    expect(hoop.tagName).toBe('DND-BASKETBALL');
    expect(hoop.multiple).toBe(true);
    expect(hoop.accept).toBe('.pdf');
    expect(hoop.getAttribute('max-size')).toBe('1000');
    expect(hoop.maxFiles).toBe(3);
    expect(hoop.theme).toBe('dark');
    expect(hoop.name).toBe('files');
    expect(hoop.concurrency).toBe(2);
    expect(hoop.className).toBe('hoop');
  });

  it('removes attributes when props go away', async () => {
    const ref = createRef<DndBasketballElement>();
    const screen = await render(
      <DndBasketball ref={ref} multiple theme="dark" maxSize={10} />
    );
    await screen.rerender(<DndBasketball ref={ref} />);

    const hoop = element(ref);
    expect(hoop.multiple).toBe(false);
    expect(hoop.hasAttribute('theme')).toBe(false);
    expect(hoop.maxSize).toBeNull();
  });

  it('calls the latest callbacks with the event details', async () => {
    const ref = createRef<DndBasketballElement>();
    const first = vi.fn();
    const second = vi.fn();
    const screen = await render(
      <DndBasketball ref={ref} accept=".pdf" onFileReject={first} />
    );
    await screen.rerender(
      <DndBasketball ref={ref} accept=".pdf" onFileReject={second} />
    );

    const photo = new File(['x'], 'photo.png', { type: 'image/png' });
    element(ref).stage([photo]);

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith({ file: photo, reason: 'type' });
  });

  it('applies the uploader, messages and file types to the element', async () => {
    const ref = createRef<DndBasketballElement>();
    const uploader = vi.fn(async () => 'ok');
    const fileTypes: FileType[] = [{ kind: 'figma', match: '.fig' }];
    const onUploadSuccess = vi.fn();
    await render(
      <DndBasketball
        ref={ref}
        uploader={uploader}
        messages={{ counter: 'Enviados' }}
        fileTypes={fileTypes}
        onUploadSuccess={onUploadSuccess}
      />
    );

    const hoop = element(ref);
    expect(hoop.uploader).toBe(uploader);
    expect(hoop.messages.counter).toBe('Enviados');
    expect(hoop.fileTypes).toBe(fileTypes);

    hoop.dunk([pdf()]);
    await vi.waitFor(() => expect(onUploadSuccess).toHaveBeenCalled(), {
      timeout: 4000,
    });
    expect(uploader).toHaveBeenCalledOnce();
  });

  it('passes children through as slotted content', async () => {
    const ref = createRef<DndBasketballElement>();
    await render(
      <DndBasketball ref={ref}>
        <span slot="title">Enviar arquivos</span>
      </DndBasketball>
    );

    const slot =
      element(ref).shadowRoot?.querySelector<HTMLSlotElement>(
        'slot[name="title"]'
      );
    expect(slot?.assignedElements()[0]?.textContent).toBe('Enviar arquivos');
  });
});
