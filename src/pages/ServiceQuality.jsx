import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';

export default function ServiceQuality() {
  return (
    <div className="min-h-screen py-12">
      <Helmet>
        <title>איכות השירות – Printeam</title>
        <meta name="description" content="How our service works, SLAs, communication and customer care." />
        <link rel="canonical" href="https://printeam.co.il/service-quality" />
        {/* Structured data: Organization, Article, BreadcrumbList */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Printeam",
            url: "https://printeam.co.il/",
            logo: "https://printeam.co.il/logo_printee.png",
            contactPoint: [ { "@type": "ContactPoint", contactType: "customer support", email: "support@printeam.co.il", availableLanguage: ["he","en"] } ]
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: "איכות, אמינות ומקצועיות – Printeam",
            description: "ערכי החברה: איכות בלתי מתפשרת, מקצועיות ושירות אמין לעסקים ומוסדות",
            author: { "@type": "Organization", name: "Printeam" },
            publisher: { "@type": "Organization", name: "Printeam", logo: { "@type": "ImageObject", url: "https://printeam.co.il/logo_printee.png" } },
            mainEntityOfPage: { "@type": "WebPage", "@id": "https://printeam.co.il/service-quality" }
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://printeam.co.il/" },
              { "@type": "ListItem", position: 2, name: "איכות ושירות", item: "https://printeam.co.il/service-quality" }
            ]
          })}
        </script>
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-6">איכות השירות</h1>

        <section>
          <h2 className="text-2xl font-semibold mt-4 mb-2">🏆 איכות. אמינות. מקצועיות – Printeam מובילה את עולם ההדפסה בישראל</h2>
          <p className="text-gray-700">מאז 2006, Printeam (פרינט מרקט בע״מ) מציבה סטנדרט חדש של איכות בלתי מתפשרת, שירות מדויק ומקצועיות אמיתית. עם אלפי לקוחות עסקיים, מוסדות חינוך, רשויות וחברות הפקה – אנחנו יודעים שלא מספיק שהמוצר ייראה טוב; הוא צריך להיות מושלם, בזמן, ובאחריות מלאה.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-6 mb-2">⚙️ איכות – כי כל פרט קובע</h2>
          <p className="text-gray-700">אצלנו, איכות אינה רק תוצאה – היא תהליך. כל שלב בשרשרת הייצור נבדק בקפדנות:</p>
          <ul className="list-disc ml-6 mt-3 text-gray-700">
            <li>החל מבחירת הבדים והחומרים מהמותגים המובילים בעולם,</li>
            <li>דרך הדפסות מדויקות בטכנולוגיות DTF, UV, ו־סובלימציה,</li>
            <li>ועד בקרת האיכות הסופית לפני המסירה.</li>
          </ul>
          <p className="text-gray-700 mt-3">הסטנדרטים שלנו כוללים עמידות הדפסות של מאות כביסות ללא דהייה, שמירה על נאמנות צבע לצבעי הלוגו המקוריים, בדיקות מדידה, גימור ואריזה קפדניות ושימוש בחומרים ידידותיים לסביבה ולגוף האדם.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-6 mb-2">🧠 מקצועיות – צוות מנוסה עם ידע של שנים</h2>
          <p className="text-gray-700">צוות Printeam כולל טכנאים מוסמכים, אנשי גרפיקה, מנהלי ייצור ושירות עם ניסיון של למעלה מ־15 שנה בתחום ההדפסות המקצועיות. אנחנו מבינים לעומק את הצרכים של עסקים, מוסדות ולקוחות קצה, ומתרגמים אותם לפתרון מדויק – מהרעיון ועד למוצר המודפס.</p>
          <ul className="list-disc ml-6 mt-3 text-gray-700">
            <li>היכרות עם כל סוגי ההדפסה והמדיה.</li>
            <li>ייעוץ מקצועי בבחירת הבד, השיטה והפורמט.</li>
            <li>יכולת להתמודד עם פרויקטים מורכבים – החל מהדפסות בודדות ועד הפקות ענק.</li>
            <li>שירות גרפי מלא – כולל תיקוני צבע, הפרדות שכבות, והכנת קבצים לדפוס.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-6 mb-2">🤝 אמינות ושירות – כי יחסים באים לפני הכול</h2>
          <p className="text-gray-700">אנו גאים בכך שרוב לקוחותינו מגיעים אלינו בהמלצה אישית. אנו מאמינים ששירות אמין הוא הבסיס לשיתוף פעולה ארוך טווח:</p>
          <ul className="list-disc ml-6 mt-3 text-gray-700">
            <li>הצעות מחיר שקופות וברורות – ללא הפתעות.</li>
            <li>זמני אספקה מדויקים ומעקב אחר כל הזמנה.</li>
            <li>שירות לקוחות נגיש, אנושי ומהיר – בוואטסאפ, במייל או בטלפון.</li>
            <li>אחריות מלאה על כל מוצר – כי אנחנו עומדים מאחורי העבודה שלנו.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-6 mb-2">🧩 מצוינות כערך מוביל</h2>
          <p className="text-gray-700">ההשקעה שלנו באיכות הציוד, בחומרי הגלם ובכוח האדם מאפשרת לנו להציע:</p>
          <ul className="list-disc ml-6 mt-3 text-gray-700">
            <li>מרכז הדפסה מודרני בשטח של 400 מ״ר עם מכונות פעילות.</li>
            <li>מעבדת הדגמות והדרכות מקצועיות.</li>
            <li>מחלקת שירות טכני ותמיכה טלפונית.</li>
            <li>חיבור ישיר בין המחלקה הגרפית לייצור – בלי פשרות ובלי תיווך.</li>
          </ul>
          <p className="text-gray-700 mt-3">אנחנו מאמינים שמי שמצפה ליותר – מוצא את זה כאן.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-6 mb-2">📈 Printeam – הבחירה של עסקים שמחפשים שקט נפשי</h2>
          <p className="text-gray-700">בין אם מדובר בסט חולצות לעובדים, הדפסה על זכוכית יוקרתית, או אספקת ציוד למפעל הדפסה – Printeam היא כתובת אחת שבה כל לקוח מקבל פתרון מלא, מקצועי ואמין.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-6 mb-2">מילות מפתח ל-SEO</h2>
          <p className="text-gray-700">Printeam, הדפסה מקצועית, בית דפוס לעסקים, איכות הדפסה, הדפסות על חולצות, אמינות ומקצועיות, הדפסה באיכות גבוהה, פרינט מרקט, שירות הדפסה מקצועי, הדפסה בהתאמה אישית.</p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-2">Contact & Support</h2>
          <p className="text-gray-700">Reach out via <Link to="/contact">Contact</Link> or email <a href="mailto:support@printeam.co.il">support@printeam.co.il</a>.</p>
        </section>
      </div>
    </div>
  );
}
