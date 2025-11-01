import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

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

  // Available options
  const availableColors = [
    'white', 'black', 'gray', 'red', 'dark_gray', 'royal_blue', 'navy',
    'benetton_green', 'bottle_green', 'bordo', 'purple', 'tourquise',
    'orange', 'yellow', 'lightblue', 'olive', 'fuchsia', 'brown',
    'banana_yellow', 'apple_green', 'natural', 'lilac', 'babypink',
    'benetongreen', 'bottlegreen', 'blue', 'offwhite', 'phospor_green', 'fuksia'
  ];

  const availableSizes = ['s', 'm', 'l', 'xl', 'xxl', 'xxxl', 'xxxxl', 'xxxxxl', '4', '6', '8', '10', '12', '14', '16', '18'];

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

  const handleImagePathChange = (color, paths) => {
    setFormData(prev => ({
      ...prev,
      images: {
        ...prev.images,
        [color]: paths.split(',').map(p => p.trim()).filter(Boolean)
      }
    }));
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
    if (!formData.name) errors.push('Name (English) is required');
    if (!formData.nameHe) errors.push('Name (Hebrew) is required');
    if (!formData.description) errors.push('Description (English) is required');
    if (!formData.descriptionHe) errors.push('Description (Hebrew) is required');
    if (formData.colors.length === 0) errors.push('At least one color is required');
    if (formData.sizeRange.length === 0) errors.push('At least one size is required');
    if (formData.basePrice <= 0) errors.push('Base price must be greater than 0');
    if (!formData.specs.material) errors.push('Material (English) is required');
    if (!formData.specs.materialHe) errors.push('Material (Hebrew) is required');

    return errors;
  };

  const generateJSON = () => {
    return JSON.stringify(formData, null, 2);
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

    try {
      const response = await fetch('/api/admin/add-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to add product');
      }

      toast({
        title: 'Success',
        description: 'Product added successfully!'
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Add New Product</h2>
        <Button
          variant="outline"
          onClick={() => setShowJsonPreview(!showJsonPreview)}
        >
          {showJsonPreview ? 'Hide' : 'Show'} JSON Preview
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Form */}
        <div className="space-y-4">
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
              <label className="block text-sm font-medium mb-1">Name (English) *</label>
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
              <label className="block text-sm font-medium mb-1">Description (English) *</label>
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
              <label className="block text-sm font-medium mb-1">Base Price (₪) *</label>
              <input
                type="number"
                value={formData.basePrice}
                onChange={(e) => handleInputChange('basePrice', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="e.g., 50"
              />
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
            <p className="text-sm text-gray-600">Enter image paths for each color (comma-separated)</p>
            
            {/* Base images */}
            <div>
              <label className="block text-sm font-medium mb-1">Base Images</label>
              <input
                type="text"
                value={(formData.images.base1 || []).join(', ')}
                onChange={(e) => handleImagePathChange('base1', e.target.value)}
                className="w-full px-3 py-2 border rounded-md mb-2"
                placeholder="/product_images/product/base1.png"
              />
              <input
                type="text"
                value={(formData.images.base2 || []).join(', ')}
                onChange={(e) => handleImagePathChange('base2', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="/product_images/product/base2.png"
              />
            </div>

            {/* Color-specific images */}
            {formData.colors.map(color => (
              <div key={color}>
                <label className="block text-sm font-medium mb-1">{color}</label>
                <input
                  type="text"
                  value={(formData.images[color] || []).join(', ')}
                  onChange={(e) => handleImagePathChange(color, e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder={`/product_images/product/${color}_product.jpg`}
                />
              </div>
            ))}
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
