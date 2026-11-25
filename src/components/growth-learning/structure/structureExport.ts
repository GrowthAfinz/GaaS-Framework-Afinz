export type BoardExportFormat = 'jpeg' | 'pdf';

export async function downloadStructureBoard(source: HTMLElement, format: BoardExportFormat, date: string) {
  const { toCanvas } = await import('html-to-image');
  await document.fonts.ready;
  const width = Math.ceil(source.getBoundingClientRect().width);
  const height = Math.ceil(source.getBoundingClientRect().height);
  // Keep large boards within browser canvas limits while targeting 2x for normal boards.
  const pixelRatio = Math.min(2, 16384 / Math.max(width, height), Math.sqrt(48_000_000 / (width * height)));
  const canvas = await toCanvas(source, { width, height, pixelRatio, skipAutoScale: true });
  const jpeg = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Falha ao gerar imagem')), 'image/jpeg', 0.95);
  });

  const filename = `estrutura-crm-${date}`;
  if (format === 'pdf') {
    const { jsPDF } = await import('jspdf');
    // A custom page preserves the whole layout and lets the reader zoom into each card.
    const pointsPerPixel = Math.min(0.75, 14400 / Math.max(width, height));
    const pageWidth = width * pointsPerPixel;
    const pageHeight = height * pointsPerPixel;
    const pdf = new jsPDF({
      orientation: pageWidth >= pageHeight ? 'landscape' : 'portrait',
      unit: 'pt',
      format: [pageWidth, pageHeight],
    });
    pdf.addImage(new Uint8Array(await jpeg.arrayBuffer()), 'JPEG', 0, 0, pageWidth, pageHeight);
    pdf.save(`${filename}.pdf`);
    return;
  }

  const url = URL.createObjectURL(jpeg);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.jpeg`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
