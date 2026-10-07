import { useEffect, useMemo, useRef, type ReactElement } from 'react';

import {
  BasketballUpload,
  type BasketballUploadElement,
} from '@sehv-oss/basketball-upload-react';

import { designFile } from './demo/sample-files.ts';
import { createSimulatedUploader } from './demo/simulated-uploader.ts';

export function Reference(): ReactElement {
  const element = useRef<BasketballUploadElement>(null);
  const uploader = useMemo(() => createSimulatedUploader(), []);

  useEffect(() => {
    element.current?.clear();
    element.current?.stage([designFile()]);
  }, []);

  return (
    <BasketballUpload
      ref={element}
      className="reference"
      theme="light"
      multiple
      uploader={uploader}
    />
  );
}
