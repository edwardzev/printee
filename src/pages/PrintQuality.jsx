import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';

export default function PrintQuality() {
  return (
    <div className="min-h-screen py-12">
      <Helmet>
        <title>איכות הדפסה – Printeam</title>
        <meta name="description" content="Everything you need to know about our print quality, processes and use cases." />
        <link rel="canonical" href="https://printeam.co.il/print-quality" />
        {/* Structured data: Organization, Article, BreadcrumbList */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Printeam",
            url: "https://printeam.co.il/",
            logo: "https://printeam.co.il/logo_printee.png",
            contactPoint: [
              { "@type": "ContactPoint", contactType: "customer support", email: "support@printeam.co.il", availableLanguage: ["he","en"] }
            ]
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: "איכות הדפסה – Printeam",
            description: "DTF וסובלימציה: שיטות הדפסה מקצועיות, יתרונות ושימושים",
            author: { "@type": "Organization", name: "Printeam" },
            publisher: { "@type": "Organization", name: "Printeam", logo: { "@type": "ImageObject", url: "https://printeam.co.il/logo_printee.png" } },
            mainEntityOfPage: { "@type": "WebPage", "@id": "https://printeam.co.il/print-quality" }
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://printeam.co.il/" },
              { "@type": "ListItem", position: 2, name: "טכנולוגיות ההדפסה", item: "https://printeam.co.il/technologies" },
              { "@type": "ListItem", position: 3, name: "איכות הדפסה", item: "https://printeam.co.il/print-quality" }
            ]
          })}
        </script>
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-6">איכות הדפסה</h1>

        <section>
          <h2 className="text-2xl font-semibold mt-4 mb-2">🖨️ טכנולוגיות ההדפסה של Printeam – איכות שנשמרת לאורך זמן</h2>
          <p className="text-gray-700">בעולם ההדפסה על טקסטיל ומוצרים, לא כל שיטה נולדה שווה. ב־Printeam אנו שמים דגש על שילוב בין איכות צבע, עמידות לאורך זמן, ונוחות ייצור שמתאימה להזמנות קטנות וגדולות כאחד. שתי טכנולוגיות הליבה שלנו – DTF ו־סובלימציה – מייצגות את קצה החדשנות בעולם ההדפסות, ומאפשרות לנו לספק תוצאה מדויקת, חדה ועמידה לכל לקוח.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-6 mb-2">🎨 DTF – Direct to Film Printing</h2>
          <p className="text-gray-700">חופש עיצוב, צבעים עזים ועמידות גבוהה במיוחד</p>
          <p className="text-gray-700">הדפסת DTF (דיירקט טו פילם) היא אחת מטכנולוגיות ההדפסה המתקדמות והמבוקשות ביותר כיום. היא מאפשרת הדפסה באיכות פוטוגרפית על מגוון רחב של בדים – כותנה, פוליאסטר, בדים סינתטיים ואפילו תערובות.</p>
          <h3 className="text-xl font-medium mt-4">איך זה עובד</h3>
          <p className="text-gray-700">העיצוב מודפס תחילה על סרט שקוף מיוחד באמצעות צבעי פיגמנט איכותיים. לאחר מכן מוסיפים שכבת דבק אבקה, מייבשים ומעבירים את ההדפסה לחולצה או למוצר בחום ולחץ.</p>
          <h3 className="text-xl font-medium mt-4">היתרונות הבולטים</h3>
          <ul className="list-disc ml-6 mt-3 text-gray-700">
            <li>🧵 עמידות גבוהה מאוד בכביסות חוזרות – ההדפס לא מתקלף ולא דוהה.</li>
            <li>🌈 דיוק צבעים מרהיב – כולל הדפסה על רקעים כהים או בהירים באותה איכות.</li>
            <li>👕 גמישות מלאה בעיצוב – מתאים להזמנות בכמות קטנה, הדפסות אישיות ומיתוג אירועים.</li>
            <li>♻️ תוצאה חלקה ורכה למגע – ללא תחושת פלסטיק או עובי עודף.</li>
          </ul>
          <p className="text-gray-700 mt-3">ב־Printeam אנו משתמשים במדפסות DTF מתקדמות, דיו איכותי ומדיה ייעודית שמבטיחה תוצאה חלקה, עמידה ומדויקת לפרטי פרטים.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-6 mb-2">🌤️ סובלימציה – אידיאלית למוצרים קשיחים ובדים בהירים</h2>
          <p className="text-gray-700">דיוק צבע מושלם ומראה טבעי</p>
          <p className="text-gray-700">טכנולוגיית הסובלימציה מבוססת על העברת צבעים בגז ישירות אל תוך החומר – תהליך תרמי הממזג את הצבע עם הסיבים עצמם. השיטה מיועדת בעיקר להדפסה על מוצרים קשיחים מצופים פוליאסטר (כוסות, זכוכיות, פאזלים, מתכות) ועל בדים סינתטיים בהירים.</p>
          <h3 className="text-xl font-medium mt-4">היתרונות העיקריים</h3>
          <ul className="list-disc ml-6 mt-3 text-gray-700">
            <li>💡 איכות תמונה יוצאת דופן – צבעים חיים, פרטים חדים ומראה טבעי.</li>
            <li>🧼 עמידות מלאה במים, חום ושחיקה – הדפסה שאינה יורדת גם לאחר שנים.</li>
            <li>🪶 ללא תחושת הדפסה – הצבע נטמע בבד והחומר נשאר גמיש ונעים.</li>
            <li>💬 ידידותית לסביבה – ללא שימוש בדיו ממס או כימיקלים מזיקים.</li>
          </ul>
          <p className="text-gray-700 mt-3">ב־Printeam אנו מבצעים הדפסות סובלימציה במכונות חום מדויקות ובצבעים בעלי תקן איכות בינלאומי, כדי להבטיח תוצאה חדה, אחידה ומקצועית בכל מוצר.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-6 mb-2">🏁 איכות לפני הכול – ההבדל של Printeam</h2>
          <p className="text-gray-700">הצוות שלנו מלווה את הלקוח משלב העיצוב ועד המוצר המוגמר, עם הקפדה על:</p>
          <ul className="list-disc ml-6 mt-3 text-gray-700">
            <li>בקרת צבע מדויקת ותיאום מול מסך.</li>
            <li>התאמת חומר ההדפסה לבד הספציפי.</li>
            <li>בדיקות עמידות בכל שלב של הייצור.</li>
          </ul>
          <p className="text-gray-700 mt-3">השילוב בין טכנולוגיית DTF המודרנית, סובלימציה מתקדמת, וניסיון של שנים בעולם ההדפסה מאפשר לנו להציע מוצר שהוא לא רק יפה – אלא נשאר יפה לאורך זמן.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-6 mb-2">🔍 סיכום – הדפסה שמחזיקה מעמד</h2>
          <p className="text-gray-700">אם אתם מחפשים פתרון להדפסה איכותית, צבעונית ועמידה – בין אם מדובר בחולצות לצוות, מתנות לעובדים או הדפסה על מוצרי קידום מכירות – ב־Printeam תיהנו מטכנולוגיה, ניסיון ואיכות שמדברים בעד עצמם.</p>
          <p className="text-gray-700 mt-3">מילות מפתח ל־SEO: הדפסת DTF, הדפסת סובלימציה, הדפסה על חולצות, הדפסה איכותית, הדפסה עמידה, Printeam, הדפסה על טקסטיל, הדפסה על מוצרים.</p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-2">Resources & FAQs</h2>
          <p className="text-gray-700">Link to <Link to="/faq">FAQ</Link> for file formats and preparation tips.</p>
        </section>
      </div>
    </div>
  );
}
