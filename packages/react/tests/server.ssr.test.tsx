import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { DndBasketball } from '../src/dnd-basketball-react.ts';

describe('<DndBasketball> on the server', () => {
  it('renders the custom element with its attributes, without a DOM', () => {
    expect(typeof document).toBe('undefined');

    const html = renderToString(
      <DndBasketball multiple maxSize={10} theme="dark" name="files">
        <span slot="title">Enviar arquivos</span>
      </DndBasketball>
    );

    expect(html).toMatch(/^<dnd-basketball /);
    expect(html).toContain('multiple=""');
    expect(html).toContain('max-size="10"');
    expect(html).toContain('theme="dark"');
    expect(html).toContain('name="files"');
    expect(html).toContain('<span slot="title">Enviar arquivos</span>');
  });

  it('leaves out the attributes that are not set', () => {
    const html = renderToString(<DndBasketball theme="system" />);

    expect(html).toBe('<dnd-basketball></dnd-basketball>');
  });
});
