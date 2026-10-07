import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import {
  BasketballUpload,
  type BasketballUploadElement,
  type FileType,
  type Theme,
} from '../src/basketball-upload-react.ts';

const pdf = (name = 'final_final_v7.pdf'): File =>
  new File([new Uint8Array(100)], name, { type: 'application/pdf' });

function element(ref: {
  current: BasketballUploadElement | null;
}): BasketballUploadElement {
  if (!ref.current) throw new Error('Not mounted');
  return ref.current;
}

describe('<BasketballUpload>', () => {
  it('renders the custom element, with its props as attributes', async () => {
    const ref = createRef<BasketballUploadElement>();
    await render(
      <BasketballUpload
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
    expect(hoop.tagName).toBe('BASKETBALL-UPLOAD');
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
    const ref = createRef<BasketballUploadElement>();
    const screen = await render(
      <BasketballUpload ref={ref} multiple theme="dark" maxSize={10} />
    );
    await screen.rerender(<BasketballUpload ref={ref} />);

    const hoop = element(ref);
    expect(hoop.multiple).toBe(false);
    expect(hoop.hasAttribute('theme')).toBe(false);
    expect(hoop.maxSize).toBeNull();
  });

  it('calls the latest callbacks with the event details', async () => {
    const ref = createRef<BasketballUploadElement>();
    const first = vi.fn();
    const second = vi.fn();
    const screen = await render(
      <BasketballUpload ref={ref} accept=".pdf" onFileReject={first} />
    );
    await screen.rerender(
      <BasketballUpload ref={ref} accept=".pdf" onFileReject={second} />
    );

    const photo = new File(['x'], 'photo.png', { type: 'image/png' });
    element(ref).stage([photo]);

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith({ file: photo, reason: 'type' });
  });

  it('applies the uploader, messages and file types to the element', async () => {
    const ref = createRef<BasketballUploadElement>();
    const uploader = vi.fn(async () => 'ok');
    const fileTypes: FileType[] = [{ kind: 'figma', match: '.fig' }];
    const onUploadSuccess = vi.fn();
    await render(
      <BasketballUpload
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

  it('resets the uploader, messages and file types when they go away', async () => {
    const ref = createRef<BasketballUploadElement>();
    const screen = await render(
      <BasketballUpload
        ref={ref}
        uploader={async () => 'ok'}
        messages={{ counter: 'Enviados' }}
        fileTypes={[{ kind: 'figma', match: '.fig' }]}
      />
    );
    await screen.rerender(<BasketballUpload ref={ref} uploader={null} />);

    const hoop = element(ref);
    expect(hoop.uploader).toBeNull();
    expect(hoop.messages.counter).toBe('Uploaded');
    expect(hoop.fileTypes).toEqual([]);
  });

  it('stops calling a callback once removed, and after unmounting', async () => {
    const ref = createRef<BasketballUploadElement>();
    const onFileReject = vi.fn();
    const screen = await render(
      <BasketballUpload ref={ref} accept=".pdf" onFileReject={onFileReject} />
    );
    const hoop = element(ref);
    const photo = new File(['x'], 'photo.png', { type: 'image/png' });

    await screen.rerender(<BasketballUpload ref={ref} accept=".pdf" />);
    hoop.stage([photo]);
    await screen.rerender(
      <BasketballUpload ref={ref} accept=".pdf" onFileReject={onFileReject} />
    );
    await screen.unmount();
    hoop.dispatchEvent(new CustomEvent('file-reject', { detail: {} }));

    expect(onFileReject).not.toHaveBeenCalled();
  });

  it('renders the tag name it is given, registering it', async () => {
    const ref = createRef<BasketballUploadElement>();
    await render(<BasketballUpload ref={ref} tagName="react-hoop" multiple />);

    const hoop = element(ref);
    expect(hoop.tagName).toBe('REACT-HOOP');
    expect(hoop).toBeInstanceOf(customElements.get('basketball-upload')!);
    expect(hoop.multiple).toBe(true);
  });

  it('leaves out an unknown theme and empty strings', async () => {
    const ref = createRef<BasketballUploadElement>();
    await render(
      <BasketballUpload
        ref={ref}
        theme={'neon' as Theme}
        accept=""
        name=""
        multiple={false}
      />
    );

    expect(element(ref).getAttributeNames()).toEqual([]);
  });

  it('passes children through as slotted content', async () => {
    const ref = createRef<BasketballUploadElement>();
    await render(
      <BasketballUpload ref={ref}>
        <span slot="title">Enviar arquivos</span>
      </BasketballUpload>
    );

    const slot =
      element(ref).shadowRoot?.querySelector<HTMLSlotElement>(
        'slot[name="title"]'
      );
    expect(slot?.assignedElements()[0]?.textContent).toBe('Enviar arquivos');
  });
});
