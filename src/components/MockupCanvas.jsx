import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, RotateCw, Move, ZoomIn } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { printAreas } from '@/data/products';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const MockupCanvas = ({ areaKey, baseImage, onFileUpload, uploadedDesign }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const [artworkTransform, setArtworkTransform] = useState({
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0
  });

  const area = printAreas[areaKey];
  
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload PNG, JPG, SVG, or PDF files only',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (100MB max)
    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload files smaller than 100MB',
        variant: 'destructive'
      });
      return;
    }

    onFileUpload(file);
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

  const resetTransform = () => {
    setArtworkTransform({
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0
    });
  };

  const rotateArtwork = () => {
    setArtworkTransform(prev => ({
      ...prev,
      rotation: (prev.rotation + 15) % 360
    }));
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {!uploadedDesign && (
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
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
          <input
            ref={fileInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.svg,.pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* Mockup Canvas */}
      {uploadedDesign && (
        <div className="space-y-4">
          <div className="mockup-canvas relative bg-gray-50 rounded-lg overflow-hidden" style={{ height: '400px' }}>
            {/* Base garment image */}
            <img
              src={baseImage}
              alt="Base garment"
              className="w-full h-full object-contain"
            />
            
            {/* Print area overlay */}
            <div
              className="absolute border-2 border-blue-500 border-dashed bg-blue-50 bg-opacity-30"
              style={{
                left: `${(area.overlayX / 800) * 100}%`,
                top: `${(area.overlayY / 800) * 100}%`,
                width: `${(area.overlayW / 800) * 100}%`,
                height: `${(area.overlayH / 800) * 100}%`,
                transform: `rotate(${area.overlayRot}deg)`
              }}
            >
              {/* Uploaded artwork */}
              <motion.img
                src={uploadedDesign.url}
                alt="Uploaded design"
                className="w-full h-full object-contain cursor-move"
                style={{
                  transform: `translate(${artworkTransform.x}px, ${artworkTransform.y}px) scale(${artworkTransform.scale}) rotate(${artworkTransform.rotation}deg)`
                }}
                drag
                dragConstraints={{
                  left: -50,
                  right: 50,
                  top: -50,
                  bottom: 50
                }}
                onDrag={(event, info) => {
                  setArtworkTransform(prev => ({
                    ...prev,
                    x: prev.x + info.delta.x,
                    y: prev.y + info.delta.y
                  }));
                }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={rotateArtwork}
            >
              <RotateCw className="h-4 w-4 mr-1" />
              Rotate
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setArtworkTransform(prev => ({ ...prev, scale: Math.min(prev.scale + 0.1, 2) }))}
            >
              <ZoomIn className="h-4 w-4 mr-1" />
              Zoom In
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setArtworkTransform(prev => ({ ...prev, scale: Math.max(prev.scale - 0.1, 0.5) }))}
            >
              Zoom Out
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={resetTransform}
            >
              Reset
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Change File
            </Button>
          </div>

          {/* File info */}
          <div className="text-sm text-gray-600">
            <p>File: {uploadedDesign.name}</p>
            <p>Print area: {area.maxWCm}×{area.maxHCm}cm</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.svg,.pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
};

export default MockupCanvas;