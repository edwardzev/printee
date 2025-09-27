import React, { useState, useRef, useEffect } from 'react';
// import { motion } from 'framer-motion';
import { Upload } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { printAreas, templatePresets } from '@/data/products';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const MockupCanvas = ({ areaKey, baseImage, onFileUpload, uploadedDesign, template = 'tshirt', onClearFile, onColorChoice }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const [printColor, setPrintColor] = useState('as-is'); // 'as-is', 'color', 'black', 'white', etc.
  const [designerNotes, setDesignerNotes] = useState('');

  const area = printAreas[areaKey];
  
  // Any non-back area (front, chest, sleeves, neck) is grouped as 'front'
  const areaGroup = areaKey?.startsWith('back') ? 'back' : 'front';
  const memoryKey = areaGroup ? `printee:design:${areaGroup}` : null;
  const clearedFlagKey = areaGroup ? `printee:design-cleared:${areaGroup}` : null;
  const areaClearedKey = areaKey ? `printee:design-cleared:area:${areaKey}` : null;
  const [remembered, setRemembered] = useState(null);   // { name, url (dataURL) }
  const [uploadedObjUrl, setUploadedObjUrl] = useState(null);

  // Prefer percentage-based overlay from templatePresets; fallback to pixel-based printAreas (800px baseline)
  const preset = (templatePresets?.[template] && templatePresets[template]?.[areaKey]) || null;
  const overlayStyle = preset
    ? {
        left: `${preset.x}%`,
        top: `${preset.y}%`,
        width: `${preset.w}%`,
        height: `${preset.h}%`,
        transform: `rotate(${preset.rot || 0}deg)`
      }
    : {
        left: `${(area.overlayX / 800) * 100}%`,
        top: `${(area.overlayY / 800) * 100}%`,
        width: `${(area.overlayW / 800) * 100}%`,
        height: `${(area.overlayH / 800) * 100}%`,
        transform: `rotate(${area.overlayRot || 0}deg)`
      };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'סוג קובץ לא נתמך',
        description: 'העלו קבצי PNG, JPG, SVG או PDF בלבד',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (100MB max)
    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: 'גודל הקובץ גדול מדי',
        description: 'העלו קבצים קטנים מ-100MB',
        variant: 'destructive'
      });
      return;
    }

    // Show immediately with a blob URL, then upgrade to dataURL when ready
    const immediatePreviewUrl = URL.createObjectURL(file);
    setRemembered({ name: file.name, url: immediatePreviewUrl });

    onFileUpload(file);

    // New upload cancels any cleared flags for this side and this specific area
    try {
      if (clearedFlagKey) sessionStorage.removeItem(clearedFlagKey);
      if (areaClearedKey) sessionStorage.removeItem(areaClearedKey);
    } catch {}

    // Persist to sessionStorage as dataURL for cross-area reuse within the session
    try {
      if (memoryKey) {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const payload = { name: file.name, type: file.type, dataUrl: reader.result };
            sessionStorage.setItem(memoryKey, JSON.stringify(payload));
            // Overwrite the blob preview with the persistent dataURL once ready
            setRemembered({ name: file.name, url: reader.result });
          } catch {}
        };
        reader.readAsDataURL(file);
      }
    } catch {}

    // Reset the input value so selecting the same file again will retrigger onChange
    try { if (event.target) event.target.value = ''; } catch {}
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const event = { target: { files: [file] } };
      handleFileSelect(event);
    }
  };

  // On area change, if no uploadedDesign is provided by parent, try to restore from sessionStorage (front/back)
  useEffect(() => {
    if (!memoryKey) return;
    const sideCleared = clearedFlagKey ? sessionStorage.getItem(clearedFlagKey) === '1' : false;
    const areaCleared = areaClearedKey ? sessionStorage.getItem(areaClearedKey) === '1' : false;
    if (sideCleared || areaCleared) {
      // Respect cleared flags: ensure nothing is shown until a fresh upload happens
      setRemembered(null);
      return;
    }
    if (!uploadedDesign) {
      const raw = sessionStorage.getItem(memoryKey);
      if (raw) {
        try {
          const payload = JSON.parse(raw);
          setRemembered({ name: payload.name, url: payload.dataUrl });
        } catch {
          setRemembered(null);
        }
      } else {
        setRemembered(null);
      }
    } else {
      // Parent provided a design; keep remembered as a fallback in case parent lacks a URL
    }
  }, [areaKey, uploadedDesign, memoryKey, clearedFlagKey, areaClearedKey]);

  useEffect(() => {
    // If parent provides a File/blob without .url, build a temporary object URL
    if (uploadedDesign && !uploadedDesign.url) {
      try {
        const fileLike = uploadedDesign.file || uploadedDesign;
        if (fileLike && fileLike instanceof Blob) {
          const u = URL.createObjectURL(fileLike);
          setUploadedObjUrl(u);
          return () => {
            URL.revokeObjectURL(u);
          };
        }
      } catch {
        setUploadedObjUrl(null);
      }
    } else {
      // Parent either provided a url or nothing
      setUploadedObjUrl(null);
    }
  }, [uploadedDesign]);

  const sideCleared = clearedFlagKey ? sessionStorage.getItem(clearedFlagKey) === '1' : false;
  const areaCleared = areaClearedKey ? sessionStorage.getItem(areaClearedKey) === '1' : false;
  const isCleared = sideCleared || areaCleared;

  const parentUrl = uploadedDesign?.url || uploadedObjUrl || null;
  const parentName = uploadedDesign?.name || uploadedDesign?.file?.name || (parentUrl ? 'design' : null);
  const parentDesign = parentUrl ? { name: parentName, url: parentUrl } : null;

  const effectiveDesign = isCleared ? null : (parentDesign || remembered);

  return (
    <div className="space-y-4">
      {/* Always split: Left = schematic w/ area, Right = upload (or raw preview if uploaded) */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: schematic canvas with dotted designated area */}
          <div className="mockup-canvas relative bg-gray-50 rounded-lg overflow-hidden" style={{ height: '400px' }}>
            {/* Base schematic / garment image */}
            <img
              src={baseImage}
              alt="Base garment"
              className="w-full h-full object-contain"
            />
            {/* Print area overlay */}
            <div
              className="absolute border-2 border-blue-500 border-dashed bg-blue-50 bg-opacity-20"
              style={overlayStyle}
            >
              {/* Show artwork only after upload; otherwise keep area empty */}
              {effectiveDesign && (
                <img
                  src={effectiveDesign.url}
                  alt="Uploaded design in area"
                  className="w-full h-full object-contain"
                  style={{ objectPosition: 'center top' }}
                  loading="eager"
                  decoding="async"
                />
              )}
            </div>
          </div>

          {/* Right: upload panel BEFORE upload; raw preview AFTER upload */}
          {!effectiveDesign ? (
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors bg-white"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                {t('uploadDesign')}
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Drag and drop or click to upload
              </p>
              <p className="text-xs text-gray-400">
                PNG, JPG, SVG, PDF • Max 100MB
              </p>
              <div className="mt-4">
                <Button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); fileInputRef.current?.click(); }}
                  className="rounded-full px-5 py-3 bg-gradient-to-l from-blue-600 to-indigo-600 text-white shadow-md transition-transform hover:scale-[1.03] active:scale-[0.98] hover:shadow-lg"
                >
                  <Upload className="h-4 w-4 ml-2" />
                  העלו קובץ
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative bg-white rounded-lg border overflow-hidden">
              <div className="bg-gray-50 grid place-items-center" style={{ height: '400px' }}>
                <img
                  src={effectiveDesign.url}
                  alt="Uploaded file preview"
                  className="max-h-[380px] max-w-full object-contain"
                  loading="eager"
                  decoding="async"
                />
              </div>
            </div>
          )}
        </div>

        {/* Single action: Change file and color choice */}
        <div className="flex flex-col sm:flex-row items-stretch justify-between gap-3">
          {effectiveDesign ? (
            <div className="flex items-center gap-2">
              <label htmlFor={`print-color-${areaKey}`} className="text-sm text-gray-700 whitespace-nowrap">
                צבע הדפסה:
              </label>
              <select
                id={`print-color-${areaKey}`}
                className="rounded-full border border-gray-300 px-3 py-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={printColor}
                onChange={(e) => {
                  const v = e.target.value;
                  setPrintColor(v);
                  if (typeof onColorChoice === 'function') {
                    try { onColorChoice(areaKey, v); } catch {}
                  }
                }}
              >
                <option value="as-is">כמו שזה</option>
                <option value="color">צבעוני</option>
                <option value="black">שחור</option>
                <option value="white">לבן</option>
                <option value="red">אדום</option>
                <option value="blue">כחול</option>
                <option value="green">ירוק</option>
                <option value="yellow">צהוב</option>
                <option value="other">אחר</option>
              </select>
            <div className="ml-4">
              <label htmlFor={`designer-notes-${areaKey}`} className="text-sm text-gray-700 block mb-1">
                הערות לגרפיקאי
              </label>
              <textarea
                id={`designer-notes-${areaKey}`}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[220px]"
                rows={2}
                maxLength={200}
                placeholder="עד 200 תווים…"
                value={designerNotes}
                onChange={(e) => setDesignerNotes(e.target.value)}
              />
              <div className="text-[11px] text-gray-400 mt-1 text-right">{designerNotes.length}/200</div>
            </div>
            </div>
          ) : <div />}
          <div className="flex justify-end gap-3">
            <Button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); fileInputRef.current?.click(); }}
              className="rounded-full px-5 py-3 bg-gradient-to-l from-blue-600 to-indigo-600 text-white shadow-md transition-transform hover:scale-[1.03] active:scale-[0.98] hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Upload className="h-4 w-4 ml-2" />
              החלף קובץ
            </Button>
            {effectiveDesign && (
              <Button
                onClick={() => {
                  if (memoryKey) sessionStorage.removeItem(memoryKey);
                  if (clearedFlagKey) sessionStorage.setItem(clearedFlagKey, '1');
                  if (areaClearedKey) sessionStorage.setItem(areaClearedKey, '1');
                  setRemembered(null);
                  // notify parent if provided so it can clear its own per-area state
                  if (typeof onClearFile === 'function') {
                    try { onClearFile(areaKey); } catch {}
                  }
                }}
                className="rounded-full px-5 py-3 bg-gradient-to-l from-rose-600 to-red-600 text-white shadow-md transition-transform hover:scale-[1.03] active:scale-[0.98] hover:shadow-lg"
              >
                אפס קובץ
              </Button>
            )}
          </div>
        </div>

        {/* File info */}
        {effectiveDesign && (
          <div className="text-sm text-gray-600">
            <p>File: {effectiveDesign.name}</p>
            <p>Print area: {area.maxWCm}cm×{area.maxHCm}cm</p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.svg,.pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default MockupCanvas;