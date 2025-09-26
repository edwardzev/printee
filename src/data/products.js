export const products = [
  {
    sku: 'tshirt',
    name: 'Classic T-Shirt',
    nameHe: 'חולצת טי קלאסית',
    description: 
'Our Classic T-Shirt is made from 100% organic cotton, offering a comfortable fit and vibrant colors. Perfect for everyday wear and custom designs.',
    descriptionHe: 
'חולצת הטי הקלאסית שלנו עשויה מ-100% כותנה אורגנית, ומציעה התאמה נוחה וצבעים חיים. מושלמת לשימוש יומיומי ולעיצובים מותאמים אישית.',
    tech: 'DTF',
    colors: ['white', 'black', 'navy', 'red', 'gray'],
    sizeRange: ['xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl', 'xxxxl', 'xxxxxl'],
    images: {
      white: ['/product_images/tshirt/white_tshirt.webp','/product_images/tshirt/white_tshirt.jpg','/product_images/tshirt/white_tshirt.png'],
      black: ['/product_images/tshirt/black_tshirt.webp','/product_images/tshirt/black_tshirt.jpg','/product_images/tshirt/black_tshirt.png'],
      navy:  ['/product_images/tshirt/navy_tshirt.webp','/product_images/tshirt/navy_tshirt.jpg','/product_images/tshirt/navy_tshirt.png'],
      red:   ['/product_images/tshirt/red_tshirt.webp','/product_images/tshirt/red_tshirt.jpg','/product_images/tshirt/red_tshirt.png'],
      gray:  ['/product_images/tshirt/gray_tshirt.webp','/product_images/tshirt/gray_tshirt.jpg','/product_images/tshirt/gray_tshirt.png'],
      base1: ['/product_images/tshirt/base_1.webp','/product_images/tshirt/base_1.jpg','/product_images/tshirt/base_1.png'],
      base2: ['/product_images/tshirt/base_2.webp','/product_images/tshirt/base_2.jpg','/product_images/tshirt/base_2.png']
    },
    activePrintAreas: ['leftChest', 'rightChest', 'frontA4', 'frontA3', 'backA4', 'backA3', 'leftSleeve', 'rightSleeve'],
    basePrice: 50
  },
  {
    sku: 'hoodie',
    name: 'Premium Hoodie',
    nameHe: 'הודי פרימיום',
    description: 'Our Premium Hoodie is crafted from a heavyweight cotton blend for warmth and durability. Ideal for prints and comfortable layering.',
    descriptionHe: 'הודי הפרימיום שלנו עשוי מתערובת כותנה עבה לנוחות וחמימות. מושלם להדפסות ולשכבות חמות.',
    tech: 'DTF',
    colors: ['white', 'black', 'navy', 'gray'],
    sizeRange: ['xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl', 'xxxxl', 'xxxxxl'],
    images: {
      white: ['/product_images/hoodie/white_hoodie.webp','/product_images/hoodie/white_hoodie.jpg','/product_images/hoodie/white_hoodie.png'],
      black: ['/product_images/hoodie/black_hoodie.webp','/product_images/hoodie/black_hoodie.jpg','/product_images/hoodie/black_hoodie.png'],
      navy:  ['/product_images/hoodie/navy_hoodie.webp','/product_images/hoodie/navy_hoodie.jpg','/product_images/hoodie/navy_hoodie.png'],
      gray:  ['/product_images/hoodie/gray_hoodie.webp','/product_images/hoodie/gray_hoodie.jpg','/product_images/hoodie/gray_hoodie.png'],
      base1: ['/product_images/hoodie/base_1.webp','/product_images/hoodie/base_1.jpg','/product_images/hoodie/base_1.png'],
      base2: ['/product_images/hoodie/base_2.webp','/product_images/hoodie/base_2.jpg','/product_images/hoodie/base_2.png']
    },
    activePrintAreas: ['leftChest', 'rightChest', 'frontA4', 'frontA3', 'backA4', 'backA3'],
    basePrice: 100
  },
  {
    sku: 'sweatshirt',
    name: 'Comfort Sweatshirt',
    nameHe: 'סווטשירט נוח',
    description: 'A soft, comfortable sweatshirt designed for everyday wear — breathable, warm and print-friendly.',
    descriptionHe: 'סווטשירט רך ונוח המתאים ללבישה יומיומית — נושם, חם וידידותי להדפסה.',
    tech: 'DTF',
    colors: ['white', 'black', 'navy', 'red', 'gray'],
    sizeRange: ['xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl', 'xxxxl', 'xxxxxl'],
    images: {
      white: ['/product_images/sweatshirt/white_sweatshirt.webp','/product_images/sweatshirt/white_sweatshirt.jpg','/product_images/sweatshirt/white_sweatshirt.png'],
      black: ['/product_images/sweatshirt/black_sweatshirt.webp','/product_images/sweatshirt/black_sweatshirt.jpg','/product_images/sweatshirt/black_sweatshirt.png'],
      navy:  ['/product_images/sweatshirt/navy_sweatshirt.webp','/product_images/sweatshirt/navy_sweatshirt.jpg','/product_images/sweatshirt/navy_sweatshirt.png'],
      red:   ['/product_images/sweatshirt/red_sweatshirt.webp','/product_images/sweatshirt/red_sweatshirt.jpg','/product_images/sweatshirt/red_sweatshirt.png'],
      gray:  ['/product_images/sweatshirt/gray_sweatshirt.webp','/product_images/sweatshirt/gray_sweatshirt.jpg','/product_images/sweatshirt/gray_sweatshirt.png'],
      base1: ['/product_images/sweatshirt/base_1.webp','/product_images/sweatshirt/base_1.jpg','/product_images/sweatshirt/base_1.png'],
      base2: ['/product_images/sweatshirt/base_2.webp','/product_images/sweatshirt/base_2.jpg','/product_images/sweatshirt/base_2.png']
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
    maxWCm: 20,
    maxHCm: 30,
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
    maxWCm: 30,
    maxHCm: 40,
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
    maxWCm: 20,
    maxHCm: 30,
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
    maxWCm: 30,
    maxHCm: 40,
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
    maxHCm: 8,
    overlayX: 50,
    overlayY: 300,
    overlayW: 80,
    overlayH: 200,
    overlayRot: 0,
    priority: 7,
    fee: 5
  },
  rightSleeve: {
    key: 'rightSleeve',
    label: 'Right Sleeve',
    labelHe: 'שרוול ימין',
    maxWCm: 8,
    maxHCm: 8,
    overlayX: 670,
    overlayY: 300,
    overlayW: 80,
    overlayH: 200,
    overlayRot: 0,
    priority: 8,
    fee: 5
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

export const templatePresets = {
  tshirt: {
    frontA4:  { x: 35, y: 27, w: 30, h: 40, rot: 0 },
    frontA3:  { x: 30.5, y: 25, w: 40, h: 55, rot: 0 },
    backA4:   { x: 35, y: 23, w: 30, h: 40, rot: 0 },
    backA3:   { x: 30, y: 22, w: 40, h: 55, rot: 0 },
    leftChest:{ x: 58, y: 25, w: 16, h: 16, rot: 0 },
    rightChest:{x: 28, y: 27, w: 16, h: 16, rot: 0 },
    leftSleeve:{x: 84, y: 27, w: 12, h: 10, rot: -10 },
    rightSleeve:{x: 3, y: 27, w: 12, h: 10, rot: 10 },
    neckLabel: { x: 38, y: 4,  w: 24, h: 12, rot: 0 }
  }
  // hoodie, sweatshirt can be added later reusing or tweaking these
};

// end of file