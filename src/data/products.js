export const products = [
  {
    sku: 'tshirt',
    name: 'Classic T-Shirt',
    nameHe: 'חולצת טי קלאסית',
    tech: 'DTF',
    colors: ['white', 'black', 'navy', 'red', 'gray'],
    sizeRange: ['xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl', 'xxxxl', 'xxxxxl'],
    images: {
      white: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop',
      black: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800&h=800&fit=crop',
      navy: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&h=800&fit=crop',
      red: 'https://images.unsplash.com/photo-1583743814966-8936f37f4678?w=800&h=800&fit=crop',
      gray: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800&h=800&fit=crop'
    },
    activePrintAreas: ['leftChest', 'rightChest', 'frontA4', 'frontA3', 'backA4', 'backA3', 'leftSleeve', 'rightSleeve'],
    basePrice: 50
  },
  {
    sku: 'hoodie',
    name: 'Premium Hoodie',
    nameHe: 'הודי פרימיום',
    tech: 'DTF',
    colors: ['white', 'black', 'navy', 'gray'],
    sizeRange: ['xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl', 'xxxxl', 'xxxxxl'],
    images: {
      white: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&h=800&fit=crop',
      black: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&h=800&fit=crop',
      navy: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=800&fit=crop',
      gray: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&h=800&fit=crop'
    },
    activePrintAreas: ['leftChest', 'rightChest', 'frontA4', 'frontA3', 'backA4', 'backA3'],
    basePrice: 100
  },
  {
    sku: 'sweatshirt',
    name: 'Comfort Sweatshirt',
    nameHe: 'סווטשירט נוח',
    tech: 'DTF',
    colors: ['white', 'black', 'navy', 'red', 'gray'],
    sizeRange: ['xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl', 'xxxxl', 'xxxxxl'],
    images: {
      white: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&h=800&fit=crop',
      black: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&h=800&fit=crop',
      navy: 'https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=800&h=800&fit=crop',
      red: 'https://images.unsplash.com/photo-1571513722275-4b41940f54b8?w=800&h=800&fit=crop',
      gray: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&h=800&fit=crop'
    },
    activePrintAreas: ['leftChest', 'rightChest', 'frontA4', 'frontA3', 'backA4', 'backA3', 'leftSleeve', 'rightSleeve'],
    basePrice: 80
  }
];

export const printAreas = {
  leftChest: {
    key: 'leftChest',
    label: 'Left Chest',
    labelHe: 'חזה שמאל',
    maxWCm: 10,
    maxHCm: 10,
    overlayX: 150,
    overlayY: 200,
    overlayW: 120,
    overlayH: 120,
    overlayRot: 0,
    priority: 1,
    fee: 5
  },
  rightChest: {
    key: 'rightChest',
    label: 'Right Chest',
    labelHe: 'חזה ימין',
    maxWCm: 10,
    maxHCm: 10,
    overlayX: 530,
    overlayY: 200,
    overlayW: 120,
    overlayH: 120,
    overlayRot: 0,
    priority: 2,
    fee: 5
  },
  frontA4: {
    key: 'frontA4',
    label: 'Front A4',
    labelHe: 'חזית A4',
    maxWCm: 21,
    maxHCm: 29.7,
    overlayX: 250,
    overlayY: 250,
    overlayW: 300,
    overlayH: 400,
    overlayRot: 0,
    priority: 3,
    fee: 10
  },
  frontA3: {
    key: 'frontA3',
    label: 'Front A3',
    labelHe: 'חזית A3',
    maxWCm: 29.7,
    maxHCm: 42,
    overlayX: 200,
    overlayY: 200,
    overlayW: 400,
    overlayH: 500,
    overlayRot: 0,
    priority: 4,
    fee: 15
  },
  backA4: {
    key: 'backA4',
    label: 'Back A4',
    labelHe: 'גב A4',
    maxWCm: 21,
    maxHCm: 29.7,
    overlayX: 250,
    overlayY: 250,
    overlayW: 300,
    overlayH: 400,
    overlayRot: 0,
    priority: 5,
    fee: 10
  },
  backA3: {
    key: 'backA3',
    label: 'Back A3',
    labelHe: 'גב A3',
    maxWCm: 29.7,
    maxHCm: 42,
    overlayX: 200,
    overlayY: 200,
    overlayW: 400,
    overlayH: 500,
    overlayRot: 0,
    priority: 6,
    fee: 15
  },
  leftSleeve: {
    key: 'leftSleeve',
    label: 'Left Sleeve',
    labelHe: 'שרוול שמאל',
    maxWCm: 8,
    maxHCm: 30,
    overlayX: 50,
    overlayY: 300,
    overlayW: 80,
    overlayH: 200,
    overlayRot: 0,
    priority: 7,
    fee: 8
  },
  rightSleeve: {
    key: 'rightSleeve',
    label: 'Right Sleeve',
    labelHe: 'שרוול ימין',
    maxWCm: 8,
    maxHCm: 30,
    overlayX: 670,
    overlayY: 300,
    overlayW: 80,
    overlayH: 200,
    overlayRot: 0,
    priority: 8,
    fee: 8
  },
  neckLabel: {
    key: 'neckLabel',
    label: 'Neck Label',
    labelHe: 'תווית צוואר',
    maxWCm: 5,
    maxHCm: 2,
    overlayX: 350,
    overlayY: 100,
    overlayW: 100,
    overlayH: 40,
    overlayRot: 0,
    priority: 9,
    fee: 3
  }
};

export const pricingRules = {
  tshirt: {
    tiers: [
      { min: 1, max: 10, price: 50 },
      { min: 11, max: 50, price: 30 },
      { min: 51, max: Infinity, price: 20 }
    ]
  },
  hoodie: {
    tiers: [
      { min: 1, max: 10, price: 100 },
      { min: 11, max: 50, price: 70 },
      { min: 51, max: Infinity, price: 50 }
    ]
  },
  sweatshirt: {
    tiers: [
      { min: 1, max: 10, price: 80 },
      { min: 11, max: 50, price: 60 },
      { min: 51, max: Infinity, price: 40 }
    ]
  }
};