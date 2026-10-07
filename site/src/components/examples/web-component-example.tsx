import { useEffect, useRef, type ReactElement } from 'react';

import { registerBasketballUpload } from '@sehv-oss/basketball-upload';

import { designFile } from '../../demo/sample-files.ts';
import { createSimulatedUploader } from '../../demo/simulated-uploader.ts';
import { CodeBlock } from '../code-block.tsx';
import { Section } from '../section.tsx';

const HTML = `
<basketball-upload multiple accept="image/*,.pdf" max-size="20000000"></basketball-upload>

<script type="module">
  import {
    registerBasketballUpload,
    createXhrUploader,
  } from '@sehv-oss/basketball-upload';

  registerBasketballUpload();

  const hoop = document.querySelector('basketball-upload');
  hoop.uploader = createXhrUploader({ url: '/api/uploads' });

  hoop.addEventListener('shot', (event) => {
    console.log(event.detail.file.name, event.detail.result); // 'score' | 'miss'
  });
  hoop.addEventListener('upload-success', (event) => {
    console.log('stored', event.detail.item.response);
  });
</script>
`;

function VanillaHoop(): ReactElement {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerBasketballUpload();
    const hoop = document.createElement('basketball-upload');
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
          <code>&lt;basketball-upload&gt;</code> is a standard custom element in
          a Shadow DOM. Registration is explicit and safe on the server.
          Attributes, properties, methods and bubbling <code>CustomEvent</code>s
          are its whole API.
        </>
      }
    >
      <div className="example">
        <CodeBlock code={HTML} language="html" filename="index.html" />
        <VanillaHoop />
      </div>
    </Section>
  );
}
