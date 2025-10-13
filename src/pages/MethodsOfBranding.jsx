import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

const MethodBlock = ({ title, image, description, pros, cons, useCases }) => {
  const { language } = useLanguage();
  const labelPros = language === 'he' ? 'יתרונות' : 'Pros';
  const labelCons = language === 'he' ? 'חסרונות' : 'Cons';
  const labelBest = language === 'he' ? 'הכי מתאים ל-' : 'Best for';

  return (
    <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        <div className="md:col-span-1 flex items-center justify-center">
          <img src={image} alt={title} className="max-h-40 object-contain" />
        </div>
        <div className="md:col-span-3">
          <h3 className="text-xl font-semibold mb-2">{title}</h3>
          <p className="text-sm text-gray-700 mb-3">{description}</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium mb-1">{labelPros}</h4>
              <ul className="list-disc list-inside text-sm text-gray-700">
                {pros.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-1">{labelCons}</h4>
              <ul className="list-disc list-inside text-sm text-gray-700">
                {cons.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-1">{labelBest}</h4>
              <ul className="list-disc list-inside text-sm text-gray-700">
                {useCases.map((u, i) => <li key={i}>{u}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const MethodsOfBranding = () => {
  const { language } = useLanguage();

  const examples = [
    {
      id: 'dtf',
      key: 'dtf',
      title: language === 'he' ? 'DTF (Direct to Film)' : 'DTF (Direct to Film)',
      image: '/methods/dtf.jpg',
      description: language === 'he'
        ? 'הדפסת DTF היא טכנולוגיה מתקדמת וחדשנית, שבה העיצוב מודפס תחילה על סרט פוליאסטר מיוחד בעזרת דיו פיגמנטי ויועבר לבד באמצעות אבקת דבק וחום.'
        : 'DTF uses a printed film that is transferred to garments using heat and adhesive. Good for full-color prints on many substrates.',
      pros: [
        language === 'he' ? 'צבעים חיים וברמת פירוט גבוהה מאוד' : 'Good for full-color, detailed prints',
        language === 'he' ? 'מתאימה כמעט לכל סוג בד' : 'Works on many fabrics including darks',
      ],
      cons: [
        language === 'he' ? 'טיפה יותר יקרה ביחס לדפוס משי' : 'Slightly more expensive than screen for very large flat prints',
      ],
      useCases: [
        language === 'he' ? 'הדפסות בצבע מלא, כמויות קטנות ובינוניות' : 'Full-colour prints, small-to-medium runs',
      ]
    },

    {
      id: 'dtg',
      key: 'dtg',
      title: language === 'he' ? 'DTG (Direct to Garment)' : 'DTG (Direct to Garment)',
      image: '/methods/dtg.jpg',
      description: language === 'he'
        ? 'DTG מדפיס ישירות על הבגד באמצעות מדפסות דיו טקסטיל. מתאים במיוחד לכותנה בהירה ועיצובים מפורטים.'
        : 'DTG prints directly onto garments using specialized inkjet printers. Best for detailed, colorful designs on light cotton.',
      pros: [
        language === 'he' ? 'תחושה טבעית ורכה במיוחד' : 'Soft hand feel',
        language === 'he' ? 'איכות צילום גבוהה עם מעברי צבע חלקים' : 'Photographic-quality prints with fine detail',
      ],
      cons: [
        language === 'he' ? 'מתאימה בעיקר לכותנה או בדים בעלי אחוז כותנה גבוה' : 'Not ideal for dark garments unless pre-treated',
      ],
      useCases: [
        language === 'he' ? 'הדפסות אומנותיות, תמונות והזמנות אישיות' : 'Art prints, photos, and custom single items',
      ]
    },

    {
      id: 'screen-printing',
      key: 'screen',
      title: language === 'he' ? 'הדפסה במסך (Screen printing)' : 'Screen printing',
      image: '/methods/screen_printing.jpg',
      description: language === 'he'
        ? 'הדפסה במסך היא שיטה וותיקה שבה מסכים נבנים לכל צבע ומתבצעת הדפסה בשכבות דיו. מצטיינת בעמידות ובהתאמה להזמנות גדולות.'
        : 'Screen printing uses stencils (screens) for each color to lay down ink in layers. It is durable and cost-effective for large runs.',
      pros: [
        language === 'he' ? 'צבעים עזים ובולטים' : 'Very durable with strong ink coverage',
      ],
      cons: [
        language === 'he' ? 'הכנות מסכים יכולות להיות יקרות להרצות קטנות' : 'Higher setup costs make small runs less economical',
      ],
      useCases: [
        language === 'he' ? 'חולצות אחידות, הזמנות גדולות ומוצרים ממותגים' : 'Uniforms, bulk orders, merchandising',
      ]
    },

    {
      id: 'sublimation',
      key: 'sublimation',
      title: language === 'he' ? 'סובלימציה (Sublimation)' : 'Sublimation',
      image: '/methods/sublimation.jpg',
      description: language === 'he'
        ? 'בסובלימציה העיצוב מודפס על נייר מיוחד ומועבר בחום לבד או מוצר מצופה; הדיו חודר לסיבים והופך לחלק מהחומר.'
        : 'Sublimation transfers dye into polyester fibers using heat. Results are smooth, durable prints that don\'t affect fabric hand.',
      pros: [
        language === 'he' ? 'הדפס חלק לחלוטין, ללא מרקם מורגש' : 'Smooth, durable prints that become part of the fabric',
      ],
      cons: [
        language === 'he' ? 'עובד רק על בדים פוליאסטריים ובהירים' : 'Only works on polyester or polymer-coated substrates',
      ],
      useCases: [
        language === 'he' ? 'בגדי ספורט, חולצות טכניות ומוצרים מצופים' : 'Polyester shirts, sportswear, sublimated signage',
      ]
    },

    {
      id: 'embroidery',
      key: 'embroidery',
      title: language === 'he' ? 'רקמה (Embroidery)' : 'Embroidery',
      image: '/methods/embroidery.jpg',
      description: language === 'he'
        ? 'הרקמה הממוחשבת מבוססת תפרים צבעוניים ומעניקה מראה פרימיום ועמידות יוצאת דופן.'
        : 'Embroidery stitches thread into the garment creating a textured, durable decoration. Great for premium branding.',
      pros: [
        language === 'he' ? 'מראה יוקרתי ועמידות גבוהה' : 'Premium look and very durable',
      ],
      cons: [
        language === 'he' ? 'מגבלת פרטים קטנים או גוונים משתנים' : 'Not ideal for photographic detail or very fine artwork',
      ],
      useCases: [
        language === 'he' ? 'כובעים, פולו ופריטי פרימיום' : 'Hats, polos, corporate shirts, premium items',
      ]
    }
  ];

  const siteBase = 'https://printeam.co.il/methods-of-branding';

  const faqJson = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": language === 'he' ? 'מה ההבדל בין DTG ל-DTF?' : 'What is the difference between DTG and DTF?',
        "acceptedAnswer": {
          "@type": "Answer",
          "text": language === 'he'
            ? 'DTG מדפיס ישירות על הבגד ונותן תחושה רכה; DTF משתמש בסרט ועשוי להתאים למגוון בדים עם גמישות צבע.'
            : 'DTG prints directly on the garment with a soft hand; DTF uses a transfer film and can work across more substrates.'
        }
      },
      {
        "@type": "Question",
        "name": language === 'he' ? 'מתי כדאי לבחור הדפסה במסך?' : 'When should I choose screen printing?',
        "acceptedAnswer": {
          "@type": "Answer",
          "text": language === 'he'
            ? 'כאשר יש הזמנה גדולה וצבעים מוגבלים — הדפסה במסך היא חסכונית ועמידה.'
            : 'When you have large orders with limited colors — screen printing is cost-effective and durable.'
        }
      }
    ]
  };

  const howToJson = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": language === 'he' ? 'כיצד לבחור שיטת הדפסה' : 'How to choose a printing method',
    "description": language === 'he' ? 'מדריך מהיר לבחירת שיטת המיתוג הטובה ביותר לפרויקט שלכם' : 'Quick guide for choosing the best branding method for your project',
    "step": [
      {
        "@type": "HowToStep",
        "url": siteBase + "#dtf",
        "name": language === 'he' ? 'DTF' : 'DTF',
        "itemListElement": [{ "@type": "HowToDirection", "text": language === 'he' ? 'טוב להדפסות צבעוניות על מגוון בדים' : 'Good for colorful prints across substrates' }]
      },
      {
        "@type": "HowToStep",
        "url": siteBase + "#dtg",
        "name": language === 'he' ? 'DTG' : 'DTG',
        "itemListElement": [{ "@type": "HowToDirection", "text": language === 'he' ? 'מתאים לפריטים בודדים ובעיצובים מפורטים על כותנה' : 'Suitable for single items and detailed designs on cotton' }]
      },
      {
        "@type": "HowToStep",
        "url": siteBase + "#screen-printing",
        "name": language === 'he' ? 'הדפסה במסך' : 'Screen printing',
        "itemListElement": [{ "@type": "HowToDirection", "text": language === 'he' ? 'בחירה לטווחים גדולים עם כיסוי צבע חזק' : 'Choose for large runs with strong ink coverage' }]
      },
      {
        "@type": "HowToStep",
        "url": siteBase + "#sublimation",
        "name": language === 'he' ? 'סובלימציה' : 'Sublimation',
        "itemListElement": [{ "@type": "HowToDirection", "text": language === 'he' ? 'מצוין להדפסות all-over על סינטטיקה' : 'Perfect for all-over prints on synthetics' }]
      },
      {
        "@type": "HowToStep",
        "url": siteBase + "#embroidery",
        "name": language === 'he' ? 'רקמה' : 'Embroidery',
        "itemListElement": [{ "@type": "HowToDirection", "text": language === 'he' ? 'מראה פרימיום לעיצובים לוגו וטקסט' : 'Premium look for logos and text' }]
      }
    ]
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">{language === 'he' ? 'שיטות מיתוג והדפסה' : 'Methods of branding & printing'}</h1>
        <p className="text-sm text-gray-600 mt-2">{language === 'he' ? 'מדריך קצר לשיטות הנפוצות: מה מתאים לכל מוצר, יתרונות וחסרונות' : 'A short guide to common methods: when to use each, pros & cons'}</p>
      </header>

      <Helmet>
        <title>{language === 'he' ? 'שיטות מיתוג והדפסה - Printeam' : 'Methods of branding - Printeam'}</title>
        <meta name="description" content={language === 'he'
          ? 'הכירו את שיטות ההדפסה והרקמה שאנו מציעים: DTF, DTG, הדפסה במסך, סובלימציה ורקמה. מדריך לבחירת השיטה המתאימה לפי חומר, תקציב וזמני ייצור.'
          : 'Learn about the printing and branding methods we offer: DTF, DTG, screen printing, sublimation and embroidery. A guide to choosing the right technique by material, budget and turnaround.'} />
        <link rel="canonical" href="https://printeam.co.il/methods-of-branding" />

        <script type="application/ld+json">{JSON.stringify(faqJson)}</script>
        <script type="application/ld+json">{JSON.stringify(howToJson)}</script>
      </Helmet>

      <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="prose max-w-none text-gray-800">
          {language === 'he' ? (
            <>
              <div className="rounded-md border-l-4 border-green-500 bg-green-50 p-4 mb-4">
                <p className="font-semibold">מדוע חשוב לבחור את שיטת המיתוג הנכונה?</p>
                <p className="mt-2">בחירת שיטת ההדפסה או הרקמה הנכונה היא ההבדל בין מוצר שנראה <strong>יוקרתי, מדויק ועמיד</strong> — לבין מוצר שעלול <strong>לדהות, להתקלף או להיראות זול</strong>. ב־Printeam אנו מתמחים בהתאמת השיטה לכל לקוח לפי סוג הבד, תקציב וכמות.</p>
              </div>

              <h3 className="text-lg font-semibold">מה אנחנו מבצעים לשמירה על איכות?</h3>
              <ul className="list-disc list-inside mt-2 mb-4">
                <li>בחירת חומרי גלם מתאימים ודיוקים בצבע</li>
                <li>בקרת טמפרטורה ולחץ בתהליכי העברה</li>
                <li>בדיקות כביסה מדגמיות לאימות עמידות</li>
              </ul>

              <h3 className="text-lg font-semibold">איך אנחנו בוחרים את השיטה המתאימה עבורכם?</h3>
              <ol className="list-decimal list-inside mt-2 mb-4">
                <li>אוספים מידע על סוג הבד, כמות ההזמנה ואופי העיצוב.</li>
                <li>ממליצים על שיטת מיתוג המתאימה ביותר מבחינת <strong>איכות</strong>, <strong>עלות</strong> וזמן אספקה.</li>
                <li>במידת הצורך, מכינים דוגמת הדפסה או רקמה לאישור לפני הייצור הסופי.</li>
              </ol>

              <div className="prose-sm text-gray-700">בעולם ההדפסה והמיתוג קיימות שיטות רבות; הבחירה משפיעה על המראה, תחושת המגע, עלויות ועמידות ההדפס לאורך זמן. להלן סקירה של השיטות העיקריות שאנו מציעים.</div>
            </>
          ) : (
            <>
              <div className="rounded-md border-l-4 border-blue-500 bg-blue-50 p-4 mb-4">
                <p className="font-semibold">Why choosing the right branding method matters</p>
                <p className="mt-2">The right printing or embroidery method is the difference between a <strong>premium, long-lasting product</strong> and one that <strong>fades, peels or looks cheap</strong>. At Printeam we match the technique to your fabric, budget and volume.</p>
              </div>

              <h3 className="text-lg font-semibold">Quality checks we perform</h3>
              <ul className="list-disc list-inside mt-2 mb-4">
                <li>Material selection and colour matching</li>
                <li>Controlled heat/pressure in transfer processes</li>
                <li>Sample wash tests to validate durability</li>
              </ul>

              <h3 className="text-lg font-semibold">How we choose the best method for you</h3>
              <ol className="list-decimal list-inside mt-2 mb-4">
                <li>We collect fabric, quantity and artwork details.</li>
                <li>We recommend the best technique for <strong>quality</strong>, <strong>cost</strong> and lead time.</li>
                <li>We produce a sample on request before full production.</li>
              </ol>

              <div className="prose-sm text-gray-700">Different methods suit different products and designs. Below you'll find a short guide to the main techniques we use.</div>
            </>
          )}
        </div>
      </section>

      {examples.map((ex) => (
        <div id={ex.id} key={ex.key}>
          <MethodBlock {...ex} />
        </div>
      ))}

      <div className="mt-8 text-center">
        <Link to="/catalog"><Button>{language === 'he' ? 'חזור למוצרים' : 'Back to catalog'}</Button></Link>
      </div>
    </div>
  );
};

export default MethodsOfBranding;
