import * as React from 'react';

import {
  BasketballUpload,
  type BasketballUploadElement,
} from '@sehv-oss/basketball-upload-react';

import { designFile } from './demo/sample-files.ts';
import { createSimulatedUploader } from './demo/simulated-uploader.ts';

export function Reference(): React.ReactElement {
  const element = React.useRef<BasketballUploadElement>(null);
  const uploader = React.useMemo(() => createSimulatedUploader(), []);

  React.useEffect(() => {
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
