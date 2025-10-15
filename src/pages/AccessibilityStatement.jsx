import React from 'react';
import { Helmet } from 'react-helmet';

export default function AccessibilityStatement() {
  const updated = "אוקטובר 2025";

  return (
    <main dir="rtl" className="container mx-auto px-4 py-10 text-slate-800">
      <Helmet>
        <html lang="he" />
        <title>הצהרת נגישות | Printeam</title>
        <meta
          name="description"
          content="הצהרת נגישות אתר Printeam בהתאם לתקן הישראלי ת״י 5568 ול-WCAG 2.1 רמה AA."
        />
      </Helmet>

      <a href="#content" className="sr-only focus:not-sr-only focus:block mb-4 underline">
        דלג לתוכן העיקרי
      </a>

      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold">הצהרת נגישות</h1>
        <p className="mt-2 text-sm text-slate-500">עודכן לאחרונה: {updated}</p>
      </header>

      <section id="content" className="prose prose-slate max-w-none rtl:prose-p:leading-8">
        <p>
          אתר <strong>Printeam</strong> מחויב להנגשת השירות הדיגיטלי לכלל הציבור, ובכלל זה אנשים עם
          מוגבלויות. האתר פותח ומעודכן בהתאם לתקן הישראלי <strong>ת״י 5568</strong> המבוסס על
          <strong> WCAG 2.1 ברמה AA</strong>.
        </p>

        <h2>מה בוצע באתר</h2>
        <ul>
          <li>תמיכה מלאה בשימוש במקלדת (ניווט באמצעות Tab, Enter, Space, Esc).</li>
          <li>תיוג סמנטי של כותרות, אזורי ניווט ותוכן (header, nav, main, footer).</li>
          <li>טקסט חלופי לכל התמונות והאייקונים (attr <code>alt</code>).</li>
          <li>יחסי ניגודיות העומדים בדרישות (מינימום 4.5:1 לטקסט רגיל).</li>
          <li>התאמה לתצוגה במכשירים ניידים ויכולת הגדלה עד 200% ללא פגיעה בתוכן.</li>
          <li>תוויות ושיוך נכון לשדות טפסים, הודעות שגיאה ברורות ותיאוריות.</li>
          <li>שליטה במודלים/תפריטים: מלכודות מקלדת נמנעות, פוקוס מוחזר, סגירה ב-Esc.</li>
          <li>שימוש בשפות וכתיבים מותאמים: <code>lang="he"</code> ו-<code>dir="rtl"</code> לדפי עברית.</li>
        </ul>

        <h2>טכנולוגיות תומכות</h2>
        <p>
          האתר נבדק עם דפדפנים עכשוויים (Chrome, Safari, Firefox, Edge) ועם קוראי מסך נפוצים
          (NVDA/VoiceOver). אנו עושים שימוש ב-HTML5, ARIA, CSS, JavaScript ו-WAI-ARIA לשיפור תאימות.
        </p>

        <h2>חריגות ותוכן שאינו נגיש במלואו</h2>
        <p>
          ייתכן שתוכן מסוים (קבצים ישנים/מדיה חיצונית/מסמכים שהועלו על ידי צד שלישי) טרם הונגש במלואו.
          אנו פועלים לעדכן ולשפר באופן מתמשך. אם נתקלתם בקושי — נשמח לסייע.
        </p>

        <h2>דרכי פנייה בנושאי נגישות</h2>
        <p>בכל בקשה, שאלה או דיווח על בעיית נגישות, ניתן ליצור קשר עם רכז/ת הנגישות שלנו:</p>
        <ul>
          <li>דוא״ל: <a href="mailto:info@printeam.co.il">info@printeam.co.il</a></li>
          <li>טלפון: <a href="tel:099999999">09-9999999</a></li>
          <li>כתובת למשלוח דואר: Printeam, גוש דן</li>
        </ul>
        <p>
          אנא ציינו תיאור הבעיה, כתובת הדף, סוג הדפדפן/מערכת ההפעלה ואמצעי עזר (במידה וקיים), כדי שנוכל
          לטפל במהירות.
        </p>

        <h2>התחייבות להמשך שיפור</h2>
        <p>
          אנו ממשיכים להשקיע מאמצים בהנגשת האתר, לרבות בדיקות תקופתיות ועדכונים שוטפים של רכיבי תוכנה,
          עיצוב ותוכן.
        </p>

        <h2>מסמך מדיניות</h2>
        <p>
          הצהרה זו נערכה בהתאם ל<strong>תקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות),
          התשע"ג–2013</strong>. מטרתנו להבטיח חוויית שימוש שוויונית, מכבדת, עצמאית ונוחה לכלל
          הגולשים.
        </p>
      </section>
    </main>
  );
}
