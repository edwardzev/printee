import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export default function ForwardedLogs() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/forwarded?limit=200');
      const j = await r.json();
      if (j && j.entries) setEntries(j.entries.reverse());
    } catch (err) {
      console.error('load forwarded', err);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="min-h-screen py-8">
      <Helmet><title>Forwarded payloads - Dev</title></Helmet>
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Forwarded payloads (dev)</h1>
          <div className="flex items-center gap-2">
            <Button onClick={load} disabled={loading}>{loading ? 'Loading...' : 'Refresh'}</Button>
          </div>
        </div>

        <div className="space-y-3">
          {entries.length === 0 ? (
            <div className="text-sm text-gray-500">No forwarded payloads yet.</div>
          ) : entries.map((e, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 border rounded bg-white shadow-sm">
              <div className="text-xs text-gray-500">{e.ts} — {e.status}{e.statusCode ? ` (HTTP ${e.statusCode})` : ''}</div>
              <pre className="text-xs max-h-60 overflow-auto mt-2 bg-gray-50 p-2 rounded">{JSON.stringify(e.payload || e, null, 2)}</pre>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
