import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { BasketballUpload } from '../src/basketball-upload-react.ts';

describe('<BasketballUpload> on the server', () => {
  it('renders the custom element with its attributes, without a DOM', () => {
    expect(typeof document).toBe('undefined');

    const html = renderToString(
      <BasketballUpload multiple maxSize={10} theme="dark" name="files">
        <span slot="title">Enviar arquivos</span>
      </BasketballUpload>
    );

    expect(html).toMatch(/^<basketball-upload /);
    expect(html).toContain('multiple=""');
    expect(html).toContain('max-size="10"');
    expect(html).toContain('theme="dark"');
    expect(html).toContain('name="files"');
    expect(html).toContain('<span slot="title">Enviar arquivos</span>');
  });

  it('leaves out the attributes that are not set', () => {
    const html = renderToString(<BasketballUpload theme="system" />);

    expect(html).toBe('<basketball-upload></basketball-upload>');
  });
});
