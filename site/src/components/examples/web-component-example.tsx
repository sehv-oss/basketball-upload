import { useEffect, useRef, type ReactElement } from 'react';

import { registerDndBasketball } from '@sehv-oss/dnd-basketball';

import { designFile } from '../../demo/sample-files.ts';
import { createSimulatedUploader } from '../../demo/simulated-uploader.ts';
import { CodeBlock } from '../code-block.tsx';
import { Section } from '../section.tsx';

const HTML = `
<dnd-basketball multiple accept="image/*,.pdf" max-size="20000000"></dnd-basketball>

<script type="module">
  import {
    registerDndBasketball,
    createXhrUploader,
  } from '@sehv-oss/dnd-basketball';

  registerDndBasketball();

  const hoop = document.querySelector('dnd-basketball');
  hoop.uploader = createXhrUploader({ url: '/api/uploads' });

  hoop.addEventListener('shot', (event) => {
    console.log(event.detail.file.name, event.detail.result); // 'score' | 'miss'
  });
  hoop.addEventListener('upload-success', (event) => {
    console.log('stored', event.detail.item.response);
  });
</script>
`;

/** `<dnd-basketball>` created with plain DOM calls: no framework involved. */
function VanillaHoop(): ReactElement {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerDndBasketball();
    const hoop = document.createElement('dnd-basketball');
    hoop.multiple = true;
    hoop.uploader = createSimulatedUploader();
    host.current?.append(hoop);
    hoop.stage([designFile()]);
    return () => hoop.remove();
  }, []);

  return <div ref={host} className="example-stage" />;
}

export function WebComponentExample(): ReactElement {
  return (
    <Section
      id="web-component"
      badge="Web Component"
      title="One element, any framework"
      description={
        <>
          <code>&lt;dnd-basketball&gt;</code> is a standard custom element in a
          Shadow DOM. Registration is explicit and safe on the server.
          Attributes, properties, methods and bubbling <code>CustomEvent</code>s
          are its whole API.
        </>
      }
    >
      <div className="example">
        <CodeBlock code={HTML} lang="html" filename="index.html" />
        <VanillaHoop />
      </div>
    </Section>
  );
}
