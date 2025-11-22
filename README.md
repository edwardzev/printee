# Printee — Product Configurator & Mockup Engine

Printee is a full-featured product customization and ordering frontend built with **React + Vite**, designed for apparel and merchandise printing businesses.  
It powers interactive product configuration with live previews, size/quantity matrices, print-area selection, pricing logic, and artwork uploads.

The system is built to support multiple product categories, color variants, print locations, dynamic pricing tiers, and mockup generation based on layered image rendering.

---

# 🔧 Tech Stack

- **React 18**
- **Vite**
- **TailwindCSS**
- **JavaScript / JSX**
- **Node.js** (for CLI tools)
- **Custom utilities for product image ingestion (injectors + scripts)**

---

# 📁 Project Structure

```
printee/
│
├── public/
│   ├── accessebility/
│   ├── areas/
│   ├── fonts/
│   ├── hero_images/
│   ├── methods/
│   ├── old/
│   └── product_images/
│       ├── beanie/
│       ├── hoodie/
│       ├── tshirt/
│       ├── softshell/
│       ├── sweatshirt/
│       ├── fleece/
│       ├── polo/
│       ├── longsleeve/
│       └── dryfit/
│
├── src/
│   ├── components/
│   │   ├── ProductForm.jsx
│   │   ├── PrintAreaSelector.jsx
│   │   ├── SizeMatrix.jsx
│   │   ├── MockupCanvas.jsx
│   │   ├── PricePanel.jsx
│   │   ├── PricingTiers.jsx
│   │   ├── StageStepper.jsx
│   │   └── UploadZone.jsx
│   │
│   ├── data/
│   │   ├── products.js
│   │   ├── printAreas.js
│   │   ├── pricing.js
│   │   └── colors.js
│   │
│   ├── hooks/
│   │   ├── useConfigurator.js
│   │   ├── useProduct.js
│   │   └── useUpload.js
│   │
│   ├── utils/
│   │   ├── imageTools.js
│   │   ├── pricingTools.js
│   │   ├── filePathTools.js
│   │   └── validators.js
│   │
│   ├── pages/
│   │   ├── index.jsx
│   │   ├── product/[slug].jsx
│   │   └── config.jsx
│   │
│   ├── App.jsx
│   └── main.jsx
│
├── apply-product-json.mjs
├── productInjector.js
├── upload-product-images.js
│
├── vite.config.js
└── package.json
```

---

# 🧠 Core Concepts

## 1. Products (`products.js`)
Each product defines:
- SKU  
- Name  
- Colors  
- Sizes  
- Allowed print areas  
- Images  
- Pricing  

---

## 2. Configurator State (`useConfigurator.js`)
Stores:
- product  
- selectedColor  
- sizes  
- selectedPrintAreas  
- selectedPrintMethod  
- uploadedArtwork  
- step  

---

## 3. Print Areas
Defines:
- Locations  
- Coordinates  
- Icons  
- Orientation rules  

---

## 4. Image Pipeline
### Product images
Stored under:
```
/public/product_images/<sku>/
```

### productInjector.js
Auto‑builds product definitions from image folder structure.

### MockupCanvas.jsx
Composes:
- base image  
- print area overlay  
- artwork  

---

## 5. Size Matrix
Qty per size per color → impacts pricing + file set.

---

## 6. Artwork Uploads
`UploadZone.jsx` + `useUpload.js` (local stub for now)

---

## 7. Pricing System
`pricing.js` + `PricingTiers.jsx` + `PricePanel.jsx`

Formula:
```
qty → tier → base price → method multiplier → area multiplier → total
```

---

# ⚙️ CLI Tools

### productInjector.js
Scans folders → generates product JSON entries.

### apply-product-json.mjs
Rewrites `products.js` from external JSON.

### upload-product-images.js
Utility for scanning/uploading image sets.

---

# 🧩 Adding a New Product

1. Create:
```
public/product_images/<sku>/
```

2. Add:
```
<sku>_<color>_front.jpg
<sku>_<color>_back.jpg
```

3. Run:
```
node productInjector.js
```

---

# 💻 Local Development

```
npm install
npm run dev
```

Browse:
```
/product/beanie
/product/hoodie
```

---

# 🏗 Build

```
npm run build
npm run preview
```

---

# 📐 Architecture Diagram

```
Product Page
   ↓
ProductForm
   ├── SizeMatrix
   ├── PrintAreaSelector
   ├── UploadZone
   ├── MockupCanvas
   └── PricePanel
```

---

# 📦 Final Output
Returned summary:
```
{
  items: [...],
  files: [...],
  pricing: {...},
  metadata: {...}
}
```

---

# ✔️ Done
This README documents the entire architecture, flow, and tools powering the Printee configurator.
