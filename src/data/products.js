export const products = [
  {
    sku: 'tshirt',
    appearance: 10,
    name: 'Classic T-Shirt',
    nameHe: 'חולצת טריקו קלאסית',
    description: 
'Our Classic T-Shirt is made from 100% organic cotton, offering a comfortable fit and vibrant colors. Perfect for everyday wear and custom designs.',
    descriptionHe: 
'חולצת הטי הקלאסית שלנו עשויה מ-100% כותנה אורגנית, ומציעה התאמה נוחה וצבעים חיים. מושלמת לשימוש יומיומי ולעיצובים מותאמים אישית.',
    tech: 'DTF',
  colors: ['white', 'black', 'navy', 'red', 'gray', 'blue', 'olive', 'purple', 'lightblue', 'bottlegreen', 'tourquise', 'babypink', 'yellow'],
    sizeRange: ['xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl', 'xxxxl', 'xxxxxl'],
    images: {
      white: ['/product_images/tshirt/white_tshirt.jpg','/product_images/tshirt/white_tshirt.png'],
      black: ['/product_images/tshirt/black_tshirt.jpg','/product_images/tshirt/black_tshirt.png'],
      navy:  ['/product_images/tshirt/navy_tshirt.jpg','/product_images/tshirt/navy_tshirt.png'],
      red:   ['/product_images/tshirt/red_tshirt.jpg','/product_images/tshirt/red_tshirt.png'],
      gray:  ['/product_images/tshirt/gray_tshirt.jpeg','/product_images/tshirt/gray_tshirt.jpg','/product_images/tshirt/gray_tshirt.png'],
      blue: ['/product_images/tshirt/blue_tshirt.jpg','/product_images/tshirt/blue_tshirt.png'],
      olive: ['/product_images/tshirt/olive_tshirt.jpeg','/product_images/tshirt/olive_tshirt.png'],
      purple: ['/product_images/tshirt/purple_tshirt.jpeg','/product_images/tshirt/purple_tshirt.png'],
      lightblue: ['/product_images/tshirt/lightblue_tshirt.jpeg','/product_images/tshirt/lightblue_tshirt.png'],
      bottlegreen: ['/product_images/tshirt/bottlegreen_tshirt.jpeg','/product_images/tshirt/bottlegreen_tshirt.png'],
      tourquise: ['/product_images/tshirt/tourquise_tshirt.jpeg','/product_images/tshirt/tourquise_tshirt.png'],
      babypink: ['/product_images/tshirt/babypink_tshirt.jpeg','/product_images/tshirt/babypink_tshirt.png'],
      yellow: ['/product_images/tshirt/yellow_tshirt.jpeg','/product_images/tshirt/yellow_tshirt.png'],
      base1: ['/product_images/tshirt/base_1.png','/product_images/tshirt/base_1.jpg'],
      base2: ['/product_images/tshirt/base_2.png','/product_images/tshirt/base_2.jpg']
    },
    activePrintAreas: ['leftChest', 'rightChest', 'frontA4', 'frontA3', 'backA4', 'backA3', 'leftSleeve', 'rightSleeve'],
    basePrice: 50
  },
  {
    sku: 'hoodie',
    appearance: 30,
    name: 'Premium Hoodie',
    nameHe: 'קפוצ׳ון פרימיום',
    description: 'Our Premium Hoodie is crafted from a heavyweight cotton blend for warmth and durability. Ideal for prints and comfortable layering.',
    descriptionHe: 'הודי הפרימיום שלנו עשוי מתערובת כותנה עבה לנוחות וחמימות. מושלם להדפסות ולשכבות חמות.',
    tech: 'DTF',
    colors: ['white', 'black', 'navy', 'gray'],
    sizeRange: ['xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl', 'xxxxl', 'xxxxxl'],
    images: {
      white: ['/product_images/hoodie/base_1.png','/product_images/hoodie/base_2.png'],
      black: ['/product_images/hoodie/base_1.png','/product_images/hoodie/base_2.png'],
      navy:  ['/product_images/hoodie/base_1.png','/product_images/hoodie/base_2.png'],
      gray:  ['/product_images/hoodie/base_1.png','/product_images/hoodie/base_2.png'],
      base1: ['/product_images/hoodie/base_1.png'],
      base2: ['/product_images/hoodie/base_2.png']
    },
    activePrintAreas: ['leftChest', 'rightChest', 'frontA4', 'frontA3', 'backA4', 'backA3'],
    basePrice: 100
  },
  {
    sku: 'polo',
    appearance: 61,
    name: 'Classic Polo',
    nameHe: 'פולו קלאסי',
    description: 'A soft and breathable polo shirt suitable for corporate and casual wear, compatible with DTF printing.',
    descriptionHe: 'חולצת פולו רכה ונושמת, מתאימה לעבודה ולפנאי. מתאימה להדפסות DTF.',
    tech: 'DTF',
    colors: ['white', 'black'],
    sizeRange: ['s','m','l','xl','xxl'],
    images: {
      white: ['/product_images/polo/base1.png','/product_images/polo/base2.png'],
      black: ['/product_images/polo/base1.png','/product_images/polo/base2.png'],
      base1: ['/product_images/polo/base1.png'],
      base2: ['/product_images/polo/base2.png']
    },
    activePrintAreas: ['leftChest','rightChest','frontA4','backA4'],
    basePrice: 80
  },
  {
    sku: 'dryfit',
    appearance: 19,
    name: 'DryFit Sport Tee',
    nameHe: 'חולצת דרייפיט',
    description: 'Lightweight performance tee with moisture-wicking fabric, ideal for sports and events.',
    descriptionHe: 'חולצת ספורט קלה עם בד מנדף לחות, מושלמת לפעילות ספורטיבית ואירועים.',
    tech: 'DTF',
    colors: ['white','black'],
    sizeRange: ['s','m','l','xl','xxl'],
    images: {
      white: ['/product_images/dryfit/base1','/product_images/dryfit/base2.png'],
      black: ['/product_images/dryfit/base1','/product_images/dryfit/base2.png'],
      base1: ['/product_images/dryfit/base1'],
      base2: ['/product_images/dryfit/base2.png']
    },
    activePrintAreas: ['leftChest','rightChest','frontA4','backA4'],
    basePrice: 60
  },
  {
    sku: 'fleece',
    appearance: 80,
    name: 'Light Fleece',
    nameHe: 'פלי́ס קל',
    description: 'Soft fleece layer, suitable for cool weather and comfortable prints.',
    descriptionHe: 'שכבת פליס רכה, מתאימה למזג אוויר קר והדפסים נוחים.',
    tech: 'DTF',
    colors: ['black','gray','navy'],
    sizeRange: ['s','m','l','xl','xxl'],
    images: {
      base1: ['/product_images/fleece/base1.png'],
      base2: ['/product_images/fleece/base2.png']
    },
    activePrintAreas: ['leftChest','rightChest','frontA4','backA4'],
    basePrice: 120
  },
  {
    sku: 'longsleeve',
    appearance: 20,
    name: 'Long Sleeve Tee',
    nameHe: 'חולצת טריקן שרוול ארוך',
    description: 'A long-sleeve variant of our classic tee, great for cooler days and layered looks.',
    descriptionHe: 'גרסה בשרוול ארוך של חולצת הטי הקלאסית, נהדרת לימי קור ולמראה בשכבות.',
    tech: 'DTF',
    colors: ['white','black','navy'],
    sizeRange: ['s','m','l','xl','xxl'],
    images: {
      base1: ['/product_images/longsleeve/base1.png'],
      base2: ['/product_images/longsleeve/base2.png']
    },
    activePrintAreas: ['leftChest','rightChest','frontA4','backA4','leftSleeve','rightSleeve'],
    basePrice: 60
  },
  {
    sku: 'softshell',
    appearance: 90,
    name: 'Softshell Jacket',
    nameHe: 'ג׳קט סופטשל',
    description: 'A weather-resistant softshell layer ideal for outdoor branding and comfort.',
    descriptionHe: 'ג׳קט סופטשל עמיד למזג אוויר, מתאים למיתוג חיצוני ונוחות.',
    tech: 'DTF',
    colors: ['black'],
    sizeRange: ['s','m','l','xl','xxl'],
    images: {
      base1: ['/product_images/softshell/base1.png'],
      base2: ['/product_images/softshell/base2.png']
    },
    activePrintAreas: ['leftChest','rightChest','backA4'],
    basePrice: 150
  },
  {
    sku: 'zipped_hood',
    appearance: 50,
    name: 'Zipped Hoodie',
    nameHe: 'קפוצ׳ון עם רוכסן',
    description: 'Zipped hoodie with roomy pockets and a comfortable fit, print friendly.',
    descriptionHe: 'חולצת הודי עם רוכסן וכיסים, נוחה ומותאמת להדפסה.',
    tech: 'DTF',
    colors: ['black','gray'],
    sizeRange: ['s','m','l','xl','xxl'],
    images: {
      base1: ['/product_images/zipped_hood/base1.png'],
      base2: ['/product_images/zipped_hood/base2.png']
    },
    activePrintAreas: ['leftChest','rightChest','frontA4','backA4'],
    basePrice: 110
  },
  {
    sku: 'sweatshirt',
    appearance: 40,
    name: 'Comfort Sweatshirt',
    nameHe: 'סווטשירט נוח',
    description: 'A soft, comfortable sweatshirt designed for everyday wear — breathable, warm and print-friendly.',
    descriptionHe: 'סווטשירט רך ונוח המתאים ללבישה יומיומית — נושם, חם וידידותי להדפסה.',
    tech: 'DTF',
    colors: ['white', 'black', 'navy', 'red', 'gray'],
    sizeRange: ['xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl', 'xxxxl', 'xxxxxl'],
    images: {
      white: ['/product_images/sweatshirt/base1','/product_images/sweatshirt/base2'],
      black: ['/product_images/sweatshirt/base1','/product_images/sweatshirt/base2'],
      navy:  ['/product_images/sweatshirt/base1','/product_images/sweatshirt/base2'],
      red:   ['/product_images/sweatshirt/base1','/product_images/sweatshirt/base2'],
      gray:  ['/product_images/sweatshirt/base1','/product_images/sweatshirt/base2'],
      base1: ['/product_images/sweatshirt/base1'],
      base2: ['/product_images/sweatshirt/base2']
    },
    activePrintAreas: ['leftChest', 'rightChest', 'frontA4', 'frontA3', 'backA4', 'backA3', 'leftSleeve', 'rightSleeve'],
    basePrice: 80
  }
];

// Hebrew labels for color keys used across the UI
export const colorLabelsHe = {
  white: 'לבן',
  black: 'שחור',
  navy: 'כחול נייבי',
  red: 'אדום',
  gray: 'אפור',
  blue: 'כחול רויאל',
  olive: 'ירוק זית',
  purple: 'סגול',
  lightblue: 'תכלת',
  bottlegreen: 'ירוק בקבוק',
  tourquise: 'טורקיז',
  babypink: 'ורוד בייבי',
  yellow: 'צהוב'
};

export const printAreas = {
  leftChest: {
    key: 'leftChest',
    label: 'Left Chest',
    labelHe: 'חזה שמאל',
    emboAllowed: true,
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
    emboAllowed: true,
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
    emboAllowed: false,
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
    emboAllowed: false,
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
    emboAllowed: false,
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
    emboAllowed: false,
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
    emboAllowed: true,
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
    emboAllowed: true,
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
    emboAllowed: true,
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