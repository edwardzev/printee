// Lightweight helper to render the first page of a PDF to a PNG data URL using pdfjs-dist.
// Lazy-loads pdfjs to avoid inflating the main bundle.
export async function pdfToDataUrl(source, { width = 1000, height = 1000 } = {}) {
  // source: File | ArrayBuffer | data:... | URL
  try {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.js');
    // set workerSrc to a CDN fallback; runtime environment should allow fetch of this script
    try {
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version || '3.9.179'}/pdf.worker.min.js`;
    } catch (e) {}

    let loadingTask;
    if (source instanceof ArrayBuffer) {
      loadingTask = pdfjs.getDocument({ data: source });
    } else if (typeof source === 'string' && source.startsWith('data:')) {
      // data URL: strip header and convert to ArrayBuffer
      const base64 = source.split(',')[1] || '';
      const binStr = atob(base64);
      const len = binStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = binStr.charCodeAt(i);
      loadingTask = pdfjs.getDocument({ data: bytes.buffer });
    } else if (typeof source === 'string') {
      // URL: allow pdfjs to fetch it (CORS must allow)
      loadingTask = pdfjs.getDocument(source);
    } else if (source instanceof File) {
      const arr = await source.arrayBuffer();
      loadingTask = pdfjs.getDocument({ data: arr });
    } else {
      return null;
    }

    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1 });

    // choose scale to fit target width/height
    const scale = Math.min(width / viewport.width, height / viewport.height, 2);
    const vp = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(vp.width);
    canvas.height = Math.round(vp.height);
    const ctx = canvas.getContext('2d');

    const renderContext = {
      canvasContext: ctx,
      viewport: vp,
    };
    await page.render(renderContext).promise;
    const dataUrl = canvas.toDataURL('image/png');
    try { pdf.destroy && pdf.destroy(); } catch (e) {}
    return dataUrl;
  } catch (err) {
    return null;
  }
}
