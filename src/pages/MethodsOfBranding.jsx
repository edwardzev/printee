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
      key: 'dtf',
      title: language === 'he' ? 'DTF (Direct to Film)' : 'DTF (Direct to Film)',
      image: '/hero_images/hero_1.jpg',
      description: language === 'he'
        ? 'DTF הוא תהליך שבו הדפסה עוברת על סרט מיוחד ואז מועברת לבד באמצעות דבק וחום. מתאים בעיקר להדפסות צבעוניות על מגוון בדים.'
        : 'DTF uses a printed film that is transferred to garments using heat and adhesive. Good for full-color prints on many substrates.',
      pros: [
        language === 'he' ? 'מדיום צבעוני ומפורט' : 'Good for full-color, detailed prints',
        language === 'he' ? 'עבודה מהירה ללא צורך במסכי צבע' : 'Fast turnaround without needing screens',
        language === 'he' ? 'מתאים לייצור קטן ובינוני' : 'Suitable for small to medium runs',
      ],
      cons: [
        language === 'he' ? 'תחושת מגע מעט דביקה על חלק מהבדים' : 'Can feel slightly plasticky on some fabrics',
        language === 'he' ? 'עמידות כביסה פחותה בהשוואה לרקמה/רשת' : 'Less durable than embroidery or high-quality screen printing',
      ],
      useCases: [
        language === 'he' ? 'הדפסות צבעוניות על טי-שירטים ומוצרי פרסום' : 'Colorful prints on t-shirts and promo items',
      ]
    },

    {
      key: 'dtg',
      title: language === 'he' ? 'DTG (Direct to Garment)' : 'DTG (Direct to Garment)',
      image: '/hero_images/hero_2.jpg',
      description: language === 'he'
        ? 'DTG הוא הדפסה ישירה על הבגד באמצעות מדפסות מיוחדות. מתאים לעיצובים צבעוניים ודקים על כותנה בהירה בעיקר.'
        : 'DTG prints directly onto garments using specialized inkjet printers. Best for detailed, colorful designs on light cotton.',
      pros: [
        language === 'he' ? 'איכות צילום גבוהה לפרטים קטנים' : 'Photographic-quality prints with fine detail',
        language === 'he' ? 'תחושה רכה על הבד' : 'Soft hand feel',
        language === 'he' ? 'טוב להזמנות בודדות' : 'Great for one-offs and small runs',
      ],
      cons: [
        language === 'he' ? 'פחות מתאים לבדים כהים ללא טיפול מיוחד' : 'Not ideal for dark garments unless pretreatment is used',
        language === 'he' ? 'עמידות כביסה תלויה בסוג הדיו והטיפול' : 'Wash durability depends on ink and pretreatment',
      ],
      useCases: [
        language === 'he' ? 'הדפסות אישיות ומוצרי אופנה קטנים' : 'Custom single items and fashion pieces',
      ]
    },

    {
      key: 'screen',
      title: language === 'he' ? 'הדפסה במסך (Screen printing)' : 'Screen printing',
      image: '/hero_images/hero_3.jpg',
      description: language === 'he'
        ? 'הדפסה במסך היא שיטה וותיקה שבה נהוג ליצור מסך לכל צבע ולהדפיס שכבות דיו על הבד. מצטיינת בעמידות ועלויות נמוכות להרצות גדולות.'
        : 'Screen printing uses stencils (screens) for each color to lay down ink in layers. It is durable and cost-effective for large runs.',
      pros: [
        language === 'he' ? 'עמידות גבוהה וכיסוי צבע חזק' : 'Very durable with strong ink coverage',
        language === 'he' ? 'עלות נמוכה לייצור המוני' : 'Low unit cost for large runs',
      ],
      cons: [
        language === 'he' ? 'הגבלה בכמויות צבעים מורכבים' : 'Limited for complex multi-color photographic prints',
        language === 'he' ? 'עלות גבוהה להכנה במסכים (לרוץ קטן פחות מתאים)' : 'Higher setup costs (screens) make small runs expensive',
      ],
      useCases: [
        language === 'he' ? 'חולצות אחידות, הזמנות גדולות, מותגים' : 'Uniforms, bulk orders, merchandising',
      ]
    },

    {
      key: 'sublimation',
      title: language === 'he' ? 'סובלימציה (Sublimation)' : 'Sublimation',
      image: '/hero_images/hero_4.jpg',
      description: language === 'he'
        ? 'סובלימציה מעבירה דיו מיוחדת לתוך סיבים פוליאסטריים באמצעות חום גבוה. התוצאה היא הדפסה חלקה ועמידה שלא משפיעה על מגע הבד.'
        : 'Sublimation transfers dye into polyester fibers using heat. Results are smooth, durable prints that don’t affect fabric hand.',
      pros: [
        language === 'he' ? 'תוצאת הדפסה חלקה ועמידה' : 'Smooth, durable prints that become part of the fabric',
        language === 'he' ? 'מושלם ל־all-over ופריטים סינטטיים' : 'Excellent for all-over prints and synthetic substrates',
      ],
      cons: [
        language === 'he' ? 'רק עובד על בדים עם אחוז גבוה של פוליאסטר' : 'Only works on polyester or polymer-coated substrates',
        language === 'he' ? 'לא מתאים לבדי כותנה טבעית' : 'Not suitable for natural cotton fabrics',
      ],
      useCases: [
        language === 'he' ? 'חולצות פוליאסטר, סמלים, הדפסות על מוצרי ספורט' : 'Polyester shirts, sportswear, sublimated signage',
      ]
    },

    {
      key: 'embroidery',
      title: language === 'he' ? 'רקמה (Embroidery)' : 'Embroidery',
      image: '/hero_images/hero_5.jpg',
      description: language === 'he'
        ? 'רקמה היא שיטת עיטור המכניסה חוטים לבגד ליצירת עיצוב טקסטורי ועמיד מאוד. מצוינת להעברת תחושת פרימיום.'
        : 'Embroidery stitches thread into the garment creating a textured, durable decoration. Great for premium branding.',
      pros: [
        language === 'he' ? 'מראה פרימיום ועמידות גבוהה' : 'Premium look and very durable',
        language === 'he' ? 'מתאים ללוגואים וטקסטים' : 'Great for logos and text',
      ],
      cons: [
        language === 'he' ? 'פחות טוב לפרטים קטנים מאוד ותמונות מורכבות' : 'Not ideal for photographic detail or very fine artwork',
        language === 'he' ? 'עלות לכל יחידה גבוהה יחסית' : 'Higher per-item cost for small runs',
      ],
      useCases: [
        language === 'he' ? 'כובעים, פולו, חולצות משרד, פריטי פרימיום' : 'Hats, polos, corporate shirts, premium items',
      ]
    }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">{language === 'he' ? 'שיטות מיתוג והדפסה' : 'Methods of branding & printing'}</h1>
        <p className="text-sm text-gray-600 mt-2">{language === 'he' ? 'מדריך קצר לשיטות הנפוצות: מה מתאים לכל מוצר, יתרונות וחסרונות' : 'A short guide to common methods: when to use each, pros & cons'}</p>
      </header>
      {/* SEO + Structured Data */}
      <Helmet>
        <title>{language === 'he' ? 'שיטות מיתוג והדפסה - Printeam' : 'Methods of branding - Printeam'}</title>
        <meta name="description" content={language === 'he'
          ? 'הכירו את שיטות ההדפסה והרקמה שאנו מציעים: DTF, DTG, הדפסה במסך, סובלימציה ורקמה. מדריך לבחירת השיטה המתאימה לפי חומר, תקציב וזמני ייצור.'
          : 'Learn about the printing and branding methods we offer: DTF, DTG, screen printing, sublimation and embroidery. A guide to choosing the right technique by material, budget and turnaround.'} />
        <link rel="canonical" href="https://printeam.co.il/methods-of-branding" />

        {/* FAQ + HowTo structured data for SEO */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "מה ההבדל בין DTG ל-DTF?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "DTG מדפיס ישירות על הבגד ונותן תחושה רכה, טוב לפריטים בודדים; DTF משתמש בסרט ומועבר בחום, טוב לריבוי סוגי בד ולקומפוזיציות צבעוניות עם גמישות עלויות."
                }
              },
              {
                "@type": "Question",
                "name": "מתי כדאי לבחור הדפסה במסך?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "כשהזמנה גדולה וצבעים מוגבלים — הדפסה במסך יוצרת צבע חזק ועמיד בעלות ליחידה נמוכה להרצות גדולות."
                }
              }
            ]
          })}
        </script>

        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HowTo",
            "name": language === 'he' ? 'כיצד לבחור שיטת הדפסה' : 'How to choose a printing method',
            "description": language === 'he' ? 'מדריך מהיר לבחירת שיטת המיתוג הטובה ביותר לפרויקט שלכם' : 'Quick guide for choosing the best branding method for your project',
            "step": [
              {
                "@type": "HowToStep",
                "url": "#material",
                "name": language === 'he' ? 'קבעו את סוג הבד' : 'Define the fabric',
                "itemListElement": [
                  { "@type": "HowToDirection", "text": language === 'he' ? 'העדיפו סובלימציה לסיבים סינטטיים, DTG לכותנה בהירה וכו\'' : 'Prefer sublimation for synthetic fibers, DTG for light cotton, etc.' }
                ]
              },
              {
                "@type": "HowToStep",
                "url": "#volume",
                "name": language === 'he' ? 'העריכו את הכמות' : 'Estimate volume',
                "itemListElement": [
                  { "@type": "HowToDirection", "text": language === 'he' ? 'עבור ריצות גדולות שקלו הדפסה במסך; להזמנות בודדות DTG או DTF יהיו יעילים יותר.' : 'For large runs consider screen printing; for single items DTG or DTF are more efficient.' }
                ]
              },
              {
                "@type": "HowToStep",
                "url": "#finish",
                "name": language === 'he' ? 'בחנו את המראה והתחושה' : 'Check finish & feel',
                "itemListElement": [
                  { "@type": "HowToDirection", "text": language === 'he' ? 'רקמה מעניקה תחושת פרימיום; הדפסות חלקות עדיפות לעיצובים צבעוניים רחבים.' : 'Embroidery gives a premium feel; smooth prints suit wide-color designs.' }
                ]
              }
            ]
          })}
        </script>
      </Helmet>

      {/* Long-form selling copy */}
      <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="prose max-w-none text-gray-800">
          {language === 'he' ? (
            <>
              <h2>מדוע חשוב לבחור את שיטת המיתוג הנכונה?</h2>
              <p>
                הבחירה בשיטת ההדפסה או הרקמה הנכונה היא ההבדל בין מוצר שנראה מקצועי ומחזיק למעלה לבין מוצר עם ליקויים, דהייה או תחושת "זולה".
                ב-Printeam אנו מתמחים בהתאמת שיטת העבודה לכל לקוח: מהבחינה החומרית של הבגד ועד תקציב, יחידות הזמנה וציפיות העמידות.
              </p>
              <p>
                אנו מקפידים על בקרת איכות בכל שלב — מבחירת דיו מותאם, חימום מדויק בתהליך העברה ועד בדיקות כביסה מדגמיות כדי להבטיח שהמוצר שתשלח ללקוח יעמוד בסטנדרטים המקצועיים ביותר.
                תהליך זה מבטיח צבעים חזקים, תחושת מגע טובה ועמידות לאורך זמן.
              </p>
              <h3>איך אנו בוחרים עבורכם?</h3>
              <ol>
                <li>אוספים מידע על הבד, כמות ההזמנה, ותיאור העיצוב.</li>
                <li>ממליצים על שיטה המתאימה מבחינת עלות, איכות וזמן אספקה.</li>
                <li>מכינים דוגמה במידת הצורך לאישור והמשך לייצור המוני.</li>
              </ol>
            </>
          ) : (
            <>
              <h2>Why choosing the right branding method matters</h2>
              <p>
                The right printing or embroidery method is the difference between a premium product and a disappointing one. At Printeam we match the technique to your fabric, budget and volume — so you get strong colours, a pleasant hand and prints that last.
              </p>
              <p>
                Our process includes material checks, ink selection, precision heat/transfers where needed, and sample checks to ensure washability and durability before we ship your order.
              </p>
              <h3>Our selection process</h3>
              <ol>
                <li>We gather fabric, artwork and quantity details.</li>
                <li>We recommend the optimal technique for cost, look and lead time.</li>
                <li>We produce a sample on request and move to full production after approval.</li>
              </ol>
            </>
          )}
        </div>
      </section>

      {examples.map((ex) => (
        <MethodBlock key={ex.key} {...ex} />
      ))}

      <div className="mt-8 text-center">
        <Link to="/catalog"><Button>{language === 'he' ? 'חזור למוצרים' : 'Back to catalog'}</Button></Link>
      </div>
    </div>
  );
};

export default MethodsOfBranding;
