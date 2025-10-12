import React, { useMemo, useState } from 'react';
import { composeMockupImage } from '@/lib/composeMockupImage';
import { composeWorksheetImage } from '@/lib/composeWorksheetImage';

function sampleItem() {
  // Minimal synthetic item matching Checkout builder shape
  return {
    productSku: 'tshirt',
    productName: 'Classic T-Shirt',
    color: 'white',
    sizeMatrices: {
      white: { S: 2, M: 3, L: 1 },
      black: { S: 1, M: 1, L: 2 },
    },
    selectedPrintAreas: [
      { areaKey: 'frontA4', method: 'print' },
      { areaKey: 'backA4', method: 'print' },
    ],
    uploadedDesigns: {
      frontA4: { url: '/logo_printee.png' },
      backA4: { url: '/logo_printee.png' },
    },
  };
}

export default function DevComposer() {
  const [logs, setLogs] = useState([]);
  const [images, setImages] = useState({});

  const item = useMemo(() => sampleItem(), []);

  async function composeAll() {
    const newLogs = [];
    const newImages = {};
    const addLog = (m) => newLogs.push(m);
    try {
      addLog('Composing mockups...');
      for (const { areaKey } of item.selectedPrintAreas) {
        const side = areaKey.startsWith('back') ? 'back' : 'front';
        const baseImage = `/schematics/${side}.png`;
        const designUrl = item.uploadedDesigns?.[areaKey]?.url;
        const mock = await composeMockupImage({ areaKey, baseImage, designUrl, width: 600, height: 480 });
        newImages[`mock_${areaKey}`] = mock;
      }
      addLog('Composing worksheet...');
      const ws = await composeWorksheetImage({ item, language: 'he', idempotencyKey: 'DEV-TEST' });
      newImages['worksheet'] = ws;
      setImages(newImages);
      addLog('Done composing.');
    } catch (e) {
      addLog('Compose error: ' + (e?.message || String(e)));
    }
    setLogs(newLogs);
  }

  async function saveLocally() {
    const uploads = Object.entries(images)
      .filter(([, dataUrl]) => !!dataUrl)
      .map(([key, dataUrl]) => ({
        areaKey: key.replace(/^mock_/, ''),
        method: key.startsWith('worksheet') ? 'worksheet' : 'mockup',
        product: item.productSku,
        colors: Object.keys(item.sizeMatrices || {}),
        qty: Object.values(item.sizeMatrices || {}).reduce((s, m) => s + Object.values(m || {}).reduce((a,b)=>a+(b||0),0), 0),
        fileName: `${key}.png`,
        dataUrl,
      }));
    const resp = await fetch('/api/dev/save-uploads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idempotency_key: 'DEV-TEST', uploads }),
    });
    const json = await resp.json();
    setLogs((prev) => [...prev, 'Save result: ' + JSON.stringify(json)]);
  }

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Dev Composer</h1>
      <div className="flex gap-2 mb-4">
        <button onClick={composeAll} className="px-3 py-2 rounded bg-blue-600 text-white">Compose</button>
        <button onClick={saveLocally} className="px-3 py-2 rounded bg-emerald-600 text-white" disabled={!Object.keys(images).length}>Save locally</button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(images).map(([k, url]) => (
          <div key={k} className="border rounded p-2">
            <div className="text-sm text-gray-700 mb-1">{k}</div>
            {url ? <img src={url} alt={k} className="w-full h-auto" /> : <div className="text-xs text-gray-500">(empty)</div>}
          </div>
        ))}
      </div>
      <div className="mt-4 whitespace-pre-wrap text-xs bg-gray-50 p-2 rounded border">
        {logs.join('\n')}
      </div>
    </div>
  );
}
