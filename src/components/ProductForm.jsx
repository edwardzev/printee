import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const searchTagOptions = [
  { value: 'all', label: 'All Products' },
  { value: 'short_sleeve', label: 'Short Sleeve' },
  { value: 'winter', label: 'Winter' },
  { value: 'headwear', label: 'Headwear' },
  { value: 'accessories', label: 'Accessories' }
];

const sharedSizeRange = ['s', 'm', 'l', 'xl', 'xxl', 'xxxl', 'xxxxl', 'xxxxxl'];
const sharedPrintAreas = ['leftChest', 'rightChest', 'frontA4', 'frontA3', 'backA4', 'backA3', 'leftSleeve', 'rightSleeve'];

const productTemplates = {
  shortSleeve: {
    label: 'Short Sleeve Apparel',
    description: 'Use for tees, polos, and dry-fit garments.',
    defaults: {
      search_tag: ['all', 'short_sleeve'],
      colors: ['white', 'black', 'gray', 'red', 'blue', 'navy', 'benetongreen', 'bottlegreen', 'orange', 'yellow', 'babypink', 'lightblue', 'olive'],
      sizeRange: sharedSizeRange,
      activePrintAreas: sharedPrintAreas,
      pricingTiers: [
        { min: 1, max: 9, price: 60 },
        { min: 10, max: 19, price: 35 },
        { min: 20, max: 49, price: 20 },
        { min: 50, max: 99, price: 15 },
        { min: 100, max: Infinity, price: 10 }
      ],
      basePrice: 50
    }
  },
  winter: {
    label: 'Winter Layers',
    description: 'Ideal for hoodies, sweatshirts, fleece, and outerwear.',
    defaults: {
      search_tag: ['all', 'winter'],
      colors: ['white', 'black', 'gray', 'navy', 'benetongreen', 'bottlegreen', 'bordo', 'purple', 'orange', 'yellow', 'babypink', 'lightblue', 'olive', 'brown'],
      sizeRange: sharedSizeRange,
      activePrintAreas: ['leftChest', 'rightChest', 'backA4', 'backA3', 'leftSleeve', 'rightSleeve'],
      pricingTiers: [
        { min: 1, max: 9, price: 85 },
        { min: 10, max: 19, price: 65 },
        { min: 20, max: 49, price: 45 },
        { min: 50, max: 99, price: 40 },
        { min: 100, max: Infinity, price: 35 }
      ],
      basePrice: 90
    }
  },
  accessory: {
    label: 'Accessories (Umbrella, Bags, etc.)',
    description: 'Use for non-garment merch such as umbrellas or totes.',
    defaults: {
      search_tag: ['all', 'accessories'],
      colors: ['black', 'white', 'navy', 'red', 'yellow'],
      sizeRange: ['one-size'],
      activePrintAreas: ['frontA3', 'backA3'],
      pricingTiers: [
        { min: 1, max: 9, price: 120 },
        { min: 10, max: 19, price: 95 },
        { min: 20, max: 49, price: 80 },
        { min: 50, max: 99, price: 65 },
        { min: 100, max: Infinity, price: 55 }
      ],
      basePrice: 110
    }
  }
};

const ProductForm = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    sku: '',
    appearance: 10,
    name: '',
    nameHe: '',
    description: '',
    descriptionHe: '',
    tech: 'DTF',
    search_tag: ['all'],
    colors: [],
    sizeRange: [],
    images: {},
    activePrintAreas: [],
    basePrice: 0,
    pricingTiers: [
      { min: 1, max: 9, price: 50 },
      { min: 10, max: 19, price: 30 },
      { min: 20, max: 49, price: 20 },
      { min: 50, max: 99, price: 15 },
      { min: 100, max: Infinity, price: 10 }
    ],
    specs: {
      material: '',
      materialHe: '',
      weight: '',
      weightHe: '',
      care: '',
      careHe: ''
    }
  });

  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [imageUploads, setImageUploads] = useState({ base1: null, base2: null, colors: {} });

  // Available options
  const availableColors = [
    'white', 'black', 'gray', 'red', 'dark_gray', 'royal_blue', 'navy',
    'benetton_green', 'bottle_green', 'bordo', 'purple', 'tourquise',
    'orange', 'yellow', 'lightblue', 'olive', 'fuchsia', 'brown',
    'banana_yellow', 'apple_green', 'natural', 'lilac', 'babypink',
    'benetongreen', 'bottlegreen', 'blue', 'offwhite', 'phospor_green', 'fuksia'
  ];

  const availableSizes = ['s', 'm', 'l', 'xl', 'xxl', 'xxxl', 'xxxxl', 'xxxxxl', '4', '6', '8', '10', '12', '14', '16', '18', 'one-size'];

  useEffect(() => {
    setImageUploads((prev) => {
      const nextColors = { ...prev.colors };
      Object.keys(nextColors).forEach((colorKey) => {
        if (!formData.colors.includes(colorKey)) {
          delete nextColors[colorKey];
        }
      });
      return { ...prev, colors: nextColors };
    });
  }, [formData.colors]);

  const availablePrintAreas = [
    'leftChest', 'rightChest', 'frontA4', 'frontA3', 'backA4', 'backA3',
    'leftSleeve', 'rightSleeve', 'neckLabel'
  ];

  const technologies = ['DTF', 'DTG', 'Embroidery', 'Screen Print'];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSpecChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      specs: { ...prev.specs, [field]: value }
    }));
  };

  const handleArrayToggle = (field, value) => {
    setFormData(prev => {
      const currentArray = prev[field] || [];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      return { ...prev, [field]: newArray };
    });
  };

  const handleSearchTagToggle = (value) => {
    if (value === 'all') return; // always keep "all" for discoverability
    setFormData(prev => {
      const current = new Set(prev.search_tag || ['all']);
      if (current.has(value)) {
        current.delete(value);
      } else {
        current.add(value);
      }
      current.add('all');
      return { ...prev, search_tag: Array.from(current) };
    });
  };

  const applyTemplateDefaults = (templateKey) => {
    const template = productTemplates[templateKey];
    if (!template) return;
    setFormData(prev => ({
      ...prev,
      search_tag: template.defaults.search_tag ? [...template.defaults.search_tag] : prev.search_tag,
      colors: template.defaults.colors ? [...template.defaults.colors] : prev.colors,
      sizeRange: template.defaults.sizeRange ? [...template.defaults.sizeRange] : prev.sizeRange,
      activePrintAreas: template.defaults.activePrintAreas ? [...template.defaults.activePrintAreas] : prev.activePrintAreas,
      pricingTiers: template.defaults.pricingTiers
        ? template.defaults.pricingTiers.map(tier => ({ ...tier }))
        : prev.pricingTiers,
      basePrice: template.defaults.basePrice ?? prev.basePrice
    }));
    toast({
      title: 'Template applied',
      description: template.description || template.label
    });
  };

  const copyJsonToClipboard = async () => {
    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard) {
        throw new Error('Clipboard API unavailable');
      }
      await navigator.clipboard.writeText(generateJSON());
      toast({ title: 'JSON copied', description: 'Payload copied to clipboard.' });
    } catch (error) {
      console.error('Clipboard error:', error);
      toast({
        title: 'Clipboard unavailable',
        description: 'Expand the JSON preview and copy manually.',
        variant: 'destructive'
      });
    }
  };

  const handleBaseImageUpload = (slot, file) => {
    setImageUploads((prev) => ({
      ...prev,
      [slot]: file || null
    }));
  };

  const handleColorImageUpload = (color, file) => {
    setImageUploads((prev) => {
      const nextColors = { ...prev.colors };
      if (file) {
        nextColors[color] = file;
      } else {
        delete nextColors[color];
      }
      return { ...prev, colors: nextColors };
    });
  };

  const collectPendingUploads = () => {
    const entries = [];
    if (imageUploads.base1) entries.push({ field: 'base1', file: imageUploads.base1 });
    if (imageUploads.base2) entries.push({ field: 'base2', file: imageUploads.base2 });
    Object.entries(imageUploads.colors).forEach(([colorKey, file]) => {
      if (file) entries.push({ field: colorKey, file });
    });
    return entries;
  };

  const uploadPendingImages = async () => {
    const pending = collectPendingUploads();
    if (pending.length === 0) return null;

    if (!formData.sku) {
      toast({
        title: 'SKU required',
        description: 'Enter a SKU before uploading images so we can place them in the correct folder.',
        variant: 'destructive'
      });
      throw new Error('Missing SKU for uploads');
    }

    const payload = new FormData();
    payload.append('sku', formData.sku);
    pending.forEach(({ field, file }) => {
      payload.append(field, file, file.name || `${field}.png`);
    });

    const response = await fetch('/api/admin/upload-product-images', {
      method: 'POST',
      body: payload
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 501) {
        toast({
          title: 'Upload unavailable in production',
          description: 'Run the dev server locally to upload images, or place files manually in public/product_images/<SKU>.',
          variant: 'destructive'
        });
      }
      throw new Error(data.error || data.details || 'Image upload failed');
    }

    setImageUploads({ base1: null, base2: null, colors: {} });
    return data.images || null;
  };

  const handlePricingTierChange = (index, field, value) => {
    setFormData(prev => {
      const newTiers = [...prev.pricingTiers];
      newTiers[index] = {
        ...newTiers[index],
        [field]: field === 'max' && value === '' ? Infinity : (value === '' ? '' : Number(value))
      };
      return { ...prev, pricingTiers: newTiers };
    });
  };

  const addPricingTier = () => {
    setFormData(prev => ({
      ...prev,
      pricingTiers: [...prev.pricingTiers, { min: '', max: '', price: '' }]
    }));
  };

  const removePricingTier = (index) => {
    setFormData(prev => ({
      ...prev,
      pricingTiers: prev.pricingTiers.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const errors = [];
    
    if (!formData.sku) errors.push('SKU is required');
    //if (!formData.name) errors.push('Name (English) is required');
    if (!formData.nameHe) errors.push('Name (Hebrew) is required');
    //if (!formData.description) errors.push('Description (English) is required');
    if (!formData.descriptionHe) errors.push('Description (Hebrew) is required');
    if (!formData.search_tag || formData.search_tag.length === 0) {
      errors.push('Select at least one search tag');
    } else if (!formData.search_tag.includes('all')) {
      errors.push("Search tags must include 'all'");
    }
    if (formData.colors.length === 0) errors.push('At least one color is required');
    if (formData.sizeRange.length === 0) errors.push('At least one size is required');
    //if (formData.basePrice <= 0) errors.push('Base price must be greater than 0');
    //if (!formData.specs.material) errors.push('Material (English) is required');
    //if (!formData.specs.materialHe) errors.push('Material (Hebrew) is required');

    return errors;
  };

  const generateJSON = () => {
    return JSON.stringify(formData, (key, value) => (value === Infinity ? 'Infinity' : value), 2);
  };

  const handleSubmit = async () => {
    const errors = validateForm();
    
    if (errors.length > 0) {
      toast({
        title: 'Validation Error',
        description: errors.join(', '),
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    let payload = { ...formData };

    try {
      const uploadedImages = await uploadPendingImages();
      if (uploadedImages) {
        const mergedImages = { ...payload.images };
        Object.entries(uploadedImages).forEach(([key, paths]) => {
          mergedImages[key] = paths;
        });
        payload = {
          ...payload,
          images: mergedImages
        };
        setFormData((prev) => ({
          ...prev,
          images: {
            ...prev.images,
            ...mergedImages
          }
        }));
      }
    } catch (error) {
      console.error('Upload error:', error);
      setIsSubmitting(false);
      toast({
        title: 'Image upload failed',
        description: error.message || 'Could not upload images automatically',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await fetch('/api/admin/add-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        // If we get a 501 (Not Implemented in production), show a helpful message
        if (response.status === 501) {
          toast({
            title: 'Production Environment Detected',
            description: 'Copy the JSON preview and run "npm run admin:inject-product -- path/to/file.json" locally to update products.js.',
            variant: 'default',
            duration: 12000
          });
          // Show the JSON preview so they can copy it
          setShowJsonPreview(true);
          return;
        }
        throw new Error(data.error || data.details || 'Failed to add product');
      }

      toast({
        title: 'Success',
        description: data?.warnings?.length
          ? `Product added with warnings: ${data.warnings.join(' · ')}`
          : 'Product added successfully! Rebuild and redeploy for changes to take effect.'
      });

      // Reset form
      setFormData({
        sku: '',
        appearance: 10,
        name: '',
        nameHe: '',
        description: '',
        descriptionHe: '',
        tech: 'DTF',
        search_tag: ['all'],
        colors: [],
        sizeRange: [],
        images: {},
        activePrintAreas: [],
        basePrice: 0,
        pricingTiers: [
          { min: 1, max: 9, price: 50 },
          { min: 10, max: 19, price: 30 },
          { min: 20, max: 49, price: 20 },
          { min: 50, max: 99, price: 15 },
          { min: 100, max: Infinity, price: 10 }
        ],
        specs: {
          material: '',
          materialHe: '',
          weight: '',
          weightHe: '',
          care: '',
          careHe: ''
        }
      });
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add product',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h2 className="text-2xl font-bold">Add New Product</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowJsonPreview(!showJsonPreview)}
          >
            {showJsonPreview ? 'Hide' : 'Show'} JSON Preview
          </Button>
          <Button variant="outline" onClick={copyJsonToClipboard}>
            Copy JSON
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Form */}
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Use a Template</h3>
                <p className="text-sm text-blue-900">Pre-fill common colors, sizes, pricing tiers, and search tags.</p>
              </div>
              <select
                value={selectedTemplate}
                onChange={(e) => {
                  const key = e.target.value;
                  setSelectedTemplate(key);
                  if (key) applyTemplateDefaults(key);
                }}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="">Select template</option>
                {Object.entries(productTemplates).map(([key, template]) => (
                  <option key={key} value={key}>{template.label}</option>
                ))}
              </select>
            </div>
            {selectedTemplate && (
              <p className="text-sm text-blue-800">{productTemplates[selectedTemplate]?.description}</p>
            )}
          </div>

          {/* Basic Information */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <h3 className="font-semibold text-lg">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-medium mb-1">SKU *</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => handleInputChange('sku', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="e.g., tshirt"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Appearance (Sort Order)</label>
              <input
                type="number"
                value={formData.appearance}
                onChange={(e) => handleInputChange('appearance', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="e.g., 10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Name (English)</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="e.g., Classic T-Shirt"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Name (Hebrew) *</label>
              <input
                type="text"
                value={formData.nameHe}
                onChange={(e) => handleInputChange('nameHe', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="e.g., חולצת טריקו קלאסית"
                dir="rtl"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description (English)</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                rows="3"
                placeholder="Product description in English"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description (Hebrew) *</label>
              <textarea
                value={formData.descriptionHe}
                onChange={(e) => handleInputChange('descriptionHe', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                rows="3"
                placeholder="תיאור המוצר בעברית"
                dir="rtl"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Technology</label>
              <select
                value={formData.tech}
                onChange={(e) => handleInputChange('tech', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                {technologies.map(tech => (
                  <option key={tech} value={tech}>{tech}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Base Price (₪)</label>
              <input
                type="number"
                value={formData.basePrice}
                onChange={(e) => handleInputChange('basePrice', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="e.g., 50"
              />
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Search Tabs *</h3>
              <span className="text-xs uppercase tracking-wide text-gray-500">Shown on catalog quick filters</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {searchTagOptions.map((option) => {
                const isActive = formData.search_tag.includes(option.value);
                const isAll = option.value === 'all';
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => (!isAll ? handleSearchTagToggle(option.value) : null)}
                    className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${
                      isActive ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 text-gray-700 hover:border-blue-400'
                    } ${isAll ? 'cursor-not-allowed opacity-80' : ''}`}
                    aria-pressed={isActive}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Colors */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <h3 className="font-semibold text-lg">Colors *</h3>
            <div className="grid grid-cols-3 gap-2">
              {availableColors.map(color => (
                <label key={color} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.colors.includes(color)}
                    onChange={() => handleArrayToggle('colors', color)}
                    className="rounded"
                  />
                  <span className="text-sm">{color}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Sizes */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <h3 className="font-semibold text-lg">Size Range *</h3>
            <div className="grid grid-cols-4 gap-2">
              {availableSizes.map(size => (
                <label key={size} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.sizeRange.includes(size)}
                    onChange={() => handleArrayToggle('sizeRange', size)}
                    className="rounded"
                  />
                  <span className="text-sm uppercase">{size}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Print Areas */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <h3 className="font-semibold text-lg">Active Print Areas</h3>
            <div className="grid grid-cols-2 gap-2">
              {availablePrintAreas.map(area => (
                <label key={area} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.activePrintAreas.includes(area)}
                    onChange={() => handleArrayToggle('activePrintAreas', area)}
                    className="rounded"
                  />
                  <span className="text-sm">{area}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Images */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <h3 className="font-semibold text-lg">Images</h3>
            <p className="text-sm text-gray-600">
              Upload JPG/PNG/PDF files for each base view and selected color. Files are stored under
              {' '}
              <span className="font-mono text-xs bg-white/70 px-1 py-0.5 rounded">
                /public/product_images/&lt;SKU&gt;
              </span>
              {' '}and automatically converted to AVIF/WebP for performance.
            </p>
            {!formData.sku && (
              <p className="text-sm text-red-600">Enter a SKU to enable uploads.</p>
            )}

            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Base 1 Image</label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  disabled={!formData.sku}
                  onChange={(e) => handleBaseImageUpload('base1', e.target.files?.[0] || null)}
                  className="w-full"
                />
                {imageUploads.base1 && (
                  <p className="text-xs text-gray-600">Selected: {imageUploads.base1.name}</p>
                )}
                {formData.images.base1 && (
                  <p className="text-xs text-gray-500">Existing: {formData.images.base1[formData.images.base1.length - 1]}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Base 2 Image</label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  disabled={!formData.sku}
                  onChange={(e) => handleBaseImageUpload('base2', e.target.files?.[0] || null)}
                  className="w-full"
                />
                {imageUploads.base2 && (
                  <p className="text-xs text-gray-600">Selected: {imageUploads.base2.name}</p>
                )}
                {formData.images.base2 && (
                  <p className="text-xs text-gray-500">Existing: {formData.images.base2[formData.images.base2.length - 1]}</p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {formData.colors.map(color => (
                <div key={color}>
                  <label className="block text-sm font-medium mb-1 capitalize">{color}</label>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    disabled={!formData.sku}
                    onChange={(e) => handleColorImageUpload(color, e.target.files?.[0] || null)}
                    className="w-full"
                  />
                  {imageUploads.colors[color] && (
                    <p className="text-xs text-gray-600">Selected: {imageUploads.colors[color].name}</p>
                  )}
                  {formData.images[color] && (
                    <p className="text-xs text-gray-500">Existing: {formData.images[color][formData.images[color].length - 1]}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Tiers */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg">Pricing Tiers</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPricingTier}
              >
                Add Tier
              </Button>
            </div>
            <p className="text-sm text-gray-600">Define price tiers based on quantity ranges</p>
            
            <div className="space-y-2">
              {formData.pricingTiers.map((tier, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <div className="flex-1">
                    <input
                      type="number"
                      value={tier.min}
                      onChange={(e) => handlePricingTierChange(index, 'min', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      placeholder="Min qty"
                      min="1"
                    />
                  </div>
                  <span className="text-gray-500">to</span>
                  <div className="flex-1">
                    <input
                      type="number"
                      value={tier.max === Infinity ? '' : tier.max}
                      onChange={(e) => handlePricingTierChange(index, 'max', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      placeholder="Max (empty = ∞)"
                      min="1"
                    />
                  </div>
                  <span className="text-gray-500">=</span>
                  <div className="flex-1">
                    <input
                      type="number"
                      value={tier.price}
                      onChange={(e) => handlePricingTierChange(index, 'price', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      placeholder="Price (₪)"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  {formData.pricingTiers.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removePricingTier(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Specifications */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <h3 className="font-semibold text-lg">Specifications</h3>
            
            <div>
              <label className="block text-sm font-medium mb-1">Material (English) *</label>
              <input
                type="text"
                value={formData.specs.material}
                onChange={(e) => handleSpecChange('material', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="e.g., 100% cotton"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Material (Hebrew) *</label>
              <input
                type="text"
                value={formData.specs.materialHe}
                onChange={(e) => handleSpecChange('materialHe', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="e.g., 100% כותנה"
                dir="rtl"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Weight</label>
              <input
                type="text"
                value={formData.specs.weight}
                onChange={(e) => handleSpecChange('weight', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="e.g., 160 g"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Weight (Hebrew)</label>
              <input
                type="text"
                value={formData.specs.weightHe}
                onChange={(e) => handleSpecChange('weightHe', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="e.g., 160 גרם"
                dir="rtl"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Care Instructions (English)</label>
              <textarea
                value={formData.specs.care}
                onChange={(e) => handleSpecChange('care', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                rows="2"
                placeholder="e.g., Machine wash cold, tumble dry low"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Care Instructions (Hebrew)</label>
              <textarea
                value={formData.specs.careHe}
                onChange={(e) => handleSpecChange('careHe', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                rows="2"
                placeholder="e.g., כביסה במכונה במים קרים"
                dir="rtl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* JSON Preview */}
      {showJsonPreview && (
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg">
          <h3 className="font-semibold text-lg mb-2">JSON Preview</h3>
          <pre className="text-xs overflow-auto max-h-96">
            {generateJSON()}
          </pre>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <Button
          variant="outline"
          onClick={() => {
            const errors = validateForm();
            if (errors.length > 0) {
              toast({
                title: 'Validation Errors',
                description: errors.join('\n'),
                variant: 'destructive'
              });
            } else {
              toast({
                title: 'Validation Passed',
                description: 'All required fields are filled correctly'
              });
            }
          }}
        >
          Validate
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Product'}
        </Button>
      </div>
    </div>
  );
};

export default ProductForm;
