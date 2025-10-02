import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';

export default function DevDashboard() {
  const { payload } = useCart();
  const [partials, setPartials] = useState([]);
  const [running, setRunning] = useState(false);

  const loadPartials = async () => {
    try {
      const r = await fetch('/api/partials?limit=50');
      const j = await r.json();
      if (j && j.entries) setPartials(j.entries.reverse());
    } catch (err) {
      console.error('load partials', err);
    }
  };

  useEffect(() => {
    let t;
    const tick = async () => { await loadPartials(); if (running) t = setTimeout(tick, 3000); };
    if (running) tick();
    return () => { clearTimeout(t); };
  }, [running]);

  useEffect(() => { loadPartials(); }, []);

  return (
    <div className="min-h-screen py-8">
      <Helmet><title>Dev dashboard</title></Helmet>
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Dev Dashboard</h1>
          <div className="flex items-center gap-2">
            <Button onClick={loadPartials}>Refresh partials</Button>
            <Button onClick={() => setRunning(r => !r)}>{running ? 'Stop polling' : 'Start polling'}</Button>
          </div>
        </div>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Live payload (client state)</h2>
          <div className="bg-white border rounded p-3"><pre className="text-xs whitespace-pre-wrap">{JSON.stringify(payload || {}, null, 2)}</pre></div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Recent partials (server)</h2>
          <div className="space-y-3">
            {partials.length === 0 ? (
              <div className="text-sm text-gray-500">No partials yet</div>
            ) : partials.map((p, i) => (
              <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 border rounded bg-white shadow-sm">
                <div className="text-xs text-gray-500">{p.ts}</div>
                <pre className="text-xs whitespace-pre-wrap mt-2">{JSON.stringify(p.payload, null, 2)}</pre>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
