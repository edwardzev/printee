import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';

export default function GarmentsQuality() {
  return (
    <div className="min-h-screen py-12">
      <Helmet>
        <title>איכות הביגוד – Printeam</title>
        <meta name="description" content="Details on garment quality, materials, fit and fabric care." />
        <link rel="canonical" href="https://printeam.co.il/garments-quality" />
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
            headline: "איכות הביגוד – Printeam",
            description: "בדיקה ותקנים בבחירת בדים, גזרות ושימור צבעים",
            author: { "@type": "Organization", name: "Printeam" },
            publisher: { "@type": "Organization", name: "Printeam", logo: { "@type": "ImageObject", url: "https://printeam.co.il/logo_printee.png" } },
            mainEntityOfPage: { "@type": "WebPage", "@id": "https://printeam.co.il/garments-quality" }
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://printeam.co.il/" },
              { "@type": "ListItem", position: 2, name: "איכות הביגוד", item: "https://printeam.co.il/garments-quality" }
            ]
          })}
        </script>
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-6">איכות הביגוד</h1>

        <section>
          <h2 className="text-2xl font-semibold mt-4 mb-2">👕 איכות הביגוד של Printeam – הבד שמדבר בעד עצמו</h2>
          <p className="text-gray-700">כאשר מדובר בהדפסה על חולצות וביגוד ממותג, לא פחות חשוב מהטכנולוגיה — הוא הבד שעליו מדפיסים. ב־Printeam אנחנו מאמינים שאיכות אמיתית מתחילה בחומר הגלם. הבדים, הגזרות והגימור בהם אנו משתמשים נבחרים בקפידה כדי להבטיח נוחות, עמידות וצבע שנשאר מושלם גם לאחר עשרות כביסות.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-6 mb-2">🧵 בדים איכותיים – הבסיס להדפסה מושלמת</h2>
          <p className="text-gray-700">הבד הוא הקנבס של עולם ההדפסה. אנחנו עובדים רק עם ספקים מוסמכים ובדים שעומדים בתקני איכות מחמירים:</p>
          <ul className="list-disc ml-6 mt-3 text-gray-700">
            <li>כותנה טבעית 100% – רכה, נושמת, ונעימה למגע. מתאימה במיוחד להדפסות יומיומיות ופרויקטים יוקרתיים.</li>
            <li>תערובות כותנה ופוליאסטר – שילוב מושלם של חוזק ועמידות, אידיאלי לשימוש אינטנסיבי, אירועים, צוותים ופעילויות חוץ.</li>
            <li>DryFit מתקדם – בד טכני עם נידוף זיעה מהיר, מגע רך ויכולת הדפסה מדויקת במיוחד. מושלם לספורט, תנועות נוער וימי גיבוש.</li>
            <li>בדים ממוחזרים ובעלי תקני OEKO-TEX® – לבחירה ירוקה ואחראית, ללא חומרים מזיקים לעור.</li>
          </ul>
          <p className="text-gray-700 mt-3">כל בד נבדק במעבדת הדפסה פנימית כדי לוודא: צבע הדפסה אחיד, אי־שקיפות של צבע הרקע, מתיחה והתכווצות מינימלית, והתאמה מושלמת בין סוג הבד לשיטת ההדפסה (DTF, סובלימציה, UV ועוד).</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-6 mb-2">✂️ גזרות שמתאימות לכולם</h2>
          <p className="text-gray-700">הבגדים שלנו אינם סתם “חולצות בסיס”. ב־Printeam תמצאו מגוון גזרות המתאימות לכל מטרה:</p>
          <ul className="list-disc ml-6 mt-3 text-gray-700">
            <li>גזרת יוניסקס קלאסית – התאמה מושלמת לגברים ולנשים כאחד.</li>
            <li>גזרות ילדים ונוער – במידות מדויקות ובבדים נעימים המתאימים לעור רגיש.</li>
            <li>חולצות V, קפוצ’ונים, סווטשירטים ורגלאן – כל סגנון מקבל את תשומת הלב העיצובית והפונקציונלית שמגיעה לו.</li>
          </ul>
          <p className="text-gray-700 mt-3">כל פריט עובר בקרת איכות קפדנית של תפירה, צווארון, חיזוקים ותוויות — כדי להבטיח תוצאה מקצועית גם אחרי חודשים של שימוש.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-6 mb-2">🌈 שימור צבעים ועמידות לאורך זמן</h2>
          <p className="text-gray-700">לא די בכך שהחולצה יפה ביום הראשון — היא צריכה להיראות כך גם אחרי השנה הראשונה. ההדפסות שלנו נבדקות בתנאי כביסה אינטנסיביים ובחשיפה לשמש כדי להבטיח:</p>
          <ul className="list-disc ml-6 mt-3 text-gray-700">
            <li>צבעים עמידים שאינם דוהים.</li>
            <li>הדפס שאינו נסדק, מתקלף או מתפורר.</li>
            <li>בד שנשאר רך ונעים גם לאחר כביסות חוזרות.</li>
          </ul>
          <p className="text-gray-700 mt-3">אנחנו מאמינים שכשמדובר בביגוד ממותג, האיכות איננה מותרות – היא השקעה בתדמית שלכם.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-6 mb-2">🧩 מותאם אישית – גם באיכות</h2>
          <p className="text-gray-700">כל פרויקט אצלנו מתחיל בהתאמה מלאה:</p>
          <ul className="list-disc ml-6 mt-3 text-gray-700">
            <li>התאמת סוג הבד לסוג ההדפסה ולשימוש בפועל (אירוע חד־פעמי, חולצות עובדים, מתנות לקמפיין).</li>
            <li>בדיקות צבע על גבי הבד הנבחר לפני ייצור מלא.</li>
            <li>דוגמת ניסיון (sample) לפי דרישה – כדי שתראו, תרגישו ותאשרו לפני ההפקה.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-6 mb-2">🏁 Printeam – כשלוקחים איכות אישית</h2>
          <p className="text-gray-700">איכות אינה סיסמה – היא תהליך. מהרגע שבו אנו בוחרים את הגליל הראשון של הבד ועד המסירה הסופית, הכל נמדד, נבדק ומנוטר בקפדנות. הלקוחות שלנו יודעים שחולצה של Printeam נראית מעולה, מרגישה מצוין, ונשארת כך לאורך זמן.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-6 mb-2">מילות מפתח ל־SEO</h2>
          <p className="text-gray-700">חולצות מודפסות איכותיות, חולצות דרייפיט, חולצות כותנה ממותגות, הדפסה על חולצות איכותיות, Printeam, איכות הבד, חולצות עבודה ממותגות, חולצות לילדים, הדפסה שלא יורדת בכביסה.</p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-2">Resources & Care</h2>
          <p className="text-gray-700">See <Link to="/returns">Returns</Link> and <Link to="/privacy">Privacy</Link> pages for policies.</p>
        </section>
      </div>
    </div>
  );
}
