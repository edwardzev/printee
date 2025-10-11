import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

const translations = {
  he: {
    // Navigation
    home: 'בית',
    catalog: 'קטלוג',
    cart: 'עגלה',
    admin: 'ניהול',
    
    // Home page
    heroTitle: 'עיצוב והדפסה מותאמת אישית',
    heroSubtitle: 'צרו בגדים מותאמים אישית עם מערכת העיצוב המתקדמת שלנו. הדפסת DTF ו-UV איכותית עם הצעת מחיר מיידית.',
    startOrder: 'התחל הזמנה',
    whyChooseUs: 'למה לבחור בנו?',
    fastDelivery: 'איכות מעולה',
    fastDeliveryDesc: 'אנחנו משתמשים בטכנולוגיות הדפסה מתקדמות ביותר לתוצאות מצוינות',
    bestPrices: 'מחירים הוגנים',
    bestPricesDesc: 'מחירים תחרותיים ללא פשרות על איכות',
    easyDesign: 'תהליך קל ומהיר',
    easyDesignDesc: 'ממשק פשוט ואינטואיטיבי להזמנה אונליין',
    
    // Catalog
    catalogTitle: 'קטלוג מוצרים',
    catalogSubtitle: 'בחרו מתוך מגוון רחב של בגדים איכותיים',
    filterByType: 'סנן לפי סוג',
    allTypes: 'כל הסוגים',
    tshirt: 'חולצת טי',
    hoodie: 'הודי',
    sweatshirt: 'סווטשירט',
    startDesigning: 'התחל עיצוב',
    
    // Product Configurator
    chooseColor: 'בחר צבע',
    sizeMatrix: 'מטריצת מידות',
  chooseSizesForColor: 'בחרו מידות עבור צבע',
    printAreas: 'אזורי הדפסה',
    uploadDesign: 'העלה עיצוב',
    deliveryOptions: 'אפשרויות משלוח',
    totalQuantity: 'כמות כוללת',
    minOrder: 'הזמנה מינימלית: 10 יחידות',
    addToCart: 'הוסף לעגלה',
    priceBreakdown: 'פירוט מחיר',
    basePrice: 'מחיר בסיס',
    placementFees: 'עלויות מיתוג',
    delivery: 'משלוח',
    total: 'סה"כ',
    addDelivery: 'הוסף משלוח',
    deliveryPriceInfo: 'עלות המשלוח היא 50₪ לכל 50 פריטים.',
    calculatedDeliveryCost: 'עלות משלוח מחושבת',
  deliveryAddress: 'כתובת למשלוח',
  deliveryAddressPlaceholder: 'הזן כתובת למשלוח (רחוב, מספר, עיר)',
  pickupAddress: 'כתובת לאיסוף עצמי: האורגים 32, חולון',
    
    // Print areas
    leftChest: 'חזה שמאל',
    rightChest: 'חזה ימין',
    frontA4: 'חזית A4',
    frontA3: 'חזית A3',
    backA4: 'גב A4',
    backA3: 'גב A3',
    leftSleeve: 'שרוול שמאל',
    rightSleeve: 'שרוול ימין',
    neckLabel: 'תווית צוואר',
    
    // Sizes
    xs: 'XS',
    s: 'S',
    m: 'M',
    l: 'L',
    xl: 'XL',
    xxl: '2XL',
    xxxl: '3XL',
    xxxxl: '4XL',
    xxxxxl: '5XL',
    
    // Cart
    cartTitle: 'עגלת קניות',
    cartEmpty: 'העגלה ריקה',
    continueShopping: 'המשך קניות',
    checkout: 'המשך לתשלום',
    removeItem: 'הסר פריט',
    editItem: 'ערוך פריט',
    
    // Messages
    uploadSuccess: 'הקובץ הועלה בהצלחה!',
    uploadError: 'שגיאה בהעלאת הקובץ',
    addedToCart: 'הפריט נוסף לעגלה!',
  addToCartCount: (count) => `התווסף ${count} פריטים לעגלה`,
  updateCartCount: (count) => `עודכן ${count} פריטים בעגלה`,
    notImplemented: '🚧 התכונה הזו עדיין לא מוכנה - אבל אל תדאגו! תוכלו לבקש אותה בהודעה הבאה! 🚀',
    
    // Footer
  company: 'Printeam Ltd.',
    allRightsReserved: 'כל הזכויות שמורות',
    terms: 'תנאי שימוש',
    privacy: 'מדיניות פרטיות',
    returns: 'החזרות והחלפות',
    informationAndLinks: 'מידע וקישורים',
    
    // Validation
    selectPrintArea: 'יש לבחור לפחות אזור הדפסה אחד',
    minimumQuantity: 'כמות מינימלית: 10 יחידות',
    lowQuality: 'האיכות נמוכה - ייתכן טשטוש בהדפסה',
    outOfBounds: 'העיצוב חורג מהגבולות המותרים',

    // Page Titles
    termsTitle: 'תנאי שימוש',
    privacyTitle: 'מדיניות פרטיות',
    returnsTitle: 'החזרות והחלפות',
  },
  en: {
    // Navigation
    home: 'Home',
    catalog: 'Catalog',
    cart: 'Cart',
    admin: 'Admin',
    
    // Home page
    heroTitle: 'Custom Apparel Design & Printing',
    heroSubtitle: 'Create custom garments with our advanced design system. High-quality DTF and UV printing with instant quotes.',
    startOrder: 'Start Order',
    whyChooseUs: 'Why Choose Us?',
    fastDelivery: 'Fast Delivery',
    fastDeliveryDesc: 'Quick turnaround time with excellent quality',
    bestPrices: 'Best Prices',
    bestPricesDesc: 'Competitive pricing without compromising quality',
    easyDesign: 'Easy Design',
    easyDesignDesc: 'Simple and intuitive design interface',
    
    // Catalog
    catalogTitle: 'Product Catalog',
    catalogSubtitle: 'Choose from our wide range of quality garments',
    filterByType: 'Filter by Type',
    allTypes: 'All Types',
    tshirt: 'T-Shirt',
    hoodie: 'Hoodie',
    sweatshirt: 'Sweatshirt',
    startDesigning: 'Start Designing',
    
    // Product Configurator
    chooseColor: 'Choose Color',
    sizeMatrix: 'Size Matrix',
  chooseSizesForColor: 'Choose sizes for color',
    printAreas: 'Print Areas',
    uploadDesign: 'Upload Design',
    deliveryOptions: 'Delivery Options',
    totalQuantity: 'Total Quantity',
    minOrder: 'Minimum Order: 10 units',
    addToCart: 'Add to Cart',
    priceBreakdown: 'Price Breakdown',
    basePrice: 'Base Price',
    placementFees: 'Placement Fees',
    delivery: 'Delivery',
    total: 'Total',
    addDelivery: 'Add Delivery',
    deliveryPriceInfo: 'Delivery cost is ₪50 for every 50 items.',
    calculatedDeliveryCost: 'Calculated Delivery Cost',
    deliveryAddress: 'Delivery address',
    deliveryAddressPlaceholder: 'Enter delivery address (street, number, city)',
    pickupAddress: 'Haorgim 32, Holon',
    
    // Print areas
    leftChest: 'Left Chest',
    rightChest: 'Right Chest',
    frontA4: 'Front A4',
    frontA3: 'Front A3',
    backA4: 'Back A4',
    backA3: 'Back A3',
    leftSleeve: 'Left Sleeve',
    rightSleeve: 'Right Sleeve',
    neckLabel: 'Neck Label',
    
    // Sizes
    xs: 'XS',
    s: 'S',
    m: 'M',
    l: 'L',
    xl: 'XL',
    xxl: '2XL',
    xxxl: '3XL',
    xxxxl: '4XL',
    xxxxxl: '5XL',
    
    // Cart
    cartTitle: 'Shopping Cart',
    cartEmpty: 'Your cart is empty',
    continueShopping: 'Continue Shopping',
    checkout: 'Checkout',
    removeItem: 'Remove Item',
    editItem: 'Edit Item',
    
    // Messages
    uploadSuccess: 'File uploaded successfully!',
    uploadError: 'Error uploading file',
    addedToCart: 'Item added to cart!',
  addToCartCount: (count) => `${count} items added to cart`,
  updateCartCount: (count) => `${count} items updated in cart`,
    notImplemented: '🚧 This feature isn\'t implemented yet—but don\'t worry! You can request it in your next prompt! 🚀',
    
    // Footer
  company: 'Printeam Ltd.',
    allRightsReserved: 'All rights reserved',
    terms: 'Terms of Service',
    privacy: 'Privacy Policy',
    returns: 'Returns & Exchanges',
    informationAndLinks: 'Information & Links',
    
    // Validation
    selectPrintArea: 'Please select at least one print area',
    minimumQuantity: 'Minimum quantity: 10 units',
    lowQuality: 'Low quality - may result in blurry print',
    outOfBounds: 'Design exceeds allowed boundaries',

    // Page Titles
    termsTitle: 'Terms of Service',
    privacyTitle: 'Privacy Policy',
    returnsTitle: 'Returns & Exchanges',
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('he');
  const [isRTL, setIsRTL] = useState(true);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'he';
    setLanguage(savedLanguage);
    setIsRTL(savedLanguage === 'he');
    
    document.documentElement.dir = savedLanguage === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = savedLanguage;
  }, []);

  const toggleLanguage = () => {
    const newLanguage = language === 'he' ? 'en' : 'he';
    setLanguage(newLanguage);
    setIsRTL(newLanguage === 'he');
    localStorage.setItem('language', newLanguage);
    
    document.documentElement.dir = newLanguage === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLanguage;
  };

  const t = (key) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{
      language,
      isRTL,
      toggleLanguage,
      t
    }}>
      {children}
    </LanguageContext.Provider>
  );
};