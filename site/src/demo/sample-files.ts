/** The file of the reference design. Its 2.4 MB are zeros, made on the spot. */
export function designFile(): File {
  return new File([new Uint8Array(2_400_000)], 'final_final_v7.pdf', {
    type: 'application/pdf',
  });
}

function blank(name: string, type: string, size: number): File {
  return new File([new Uint8Array(size)], name, { type });
}

/** A small picture drawn on a canvas, so the image card has a real thumbnail. */
async function courtPicture(): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 240;
  canvas.height = 240;
  const context = canvas.getContext('2d');
  if (context) {
    const sky = context.createLinearGradient(0, 0, 0, 240);
    sky.addColorStop(0, '#ffb36b');
    sky.addColorStop(1, '#f0612e');
    context.fillStyle = sky;
    context.fillRect(0, 0, 240, 240);
    context.fillStyle = '#2b1a12';
    context.beginPath();
    context.arc(120, 132, 62, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = '#f0612e';
    context.lineWidth = 6;
    context.beginPath();
    context.moveTo(58, 132);
    context.lineTo(182, 132);
    context.moveTo(120, 70);
    context.lineTo(120, 194);
    context.stroke();
  }
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/png')
  );
  return new File([blob ?? new Blob()], 'buzzer-beater.png', {
    type: 'image/png',
  });
}

/** One file of each built-in type, for the file types demo. */
export async function sampleFiles(): Promise<File[]> {
  return [
    designFile(),
    await courtPicture(),
    blank('highlights.mp4', 'video/mp4', 18_700_000),
    blank('box-score.csv', 'text/csv', 48_000),
    blank('playbook.zip', 'application/zip', 6_100_000),
  ];
}

/** A Figma file: no built-in type knows it, the demo registers one. */
export function figmaFile(): File {
  return blank('court-redesign.fig', '', 3_300_000);
}
