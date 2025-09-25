import { useEffect, useState } from "react";

export default function Header({ dir = "rtl" }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");

  const goTo = (id) => (e) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top: y, behavior: "smooth" });
    setOpen(false);
    setActive(id);
  };

  useEffect(() => {
    const sections = ["how", "catalog", "pricing", "faq", "contact"];
    const onScroll = () => {
      let current = "";
      for (const id of sections) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.offsetTop - 120;
        if (window.scrollY >= top) current = id;
      }
      setActive(current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      dir={dir}
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "#fff",
        borderBottom: "1px solid #eee",
        backdropFilter: "saturate(180%) blur(8px)",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <a
          href="/"
          aria-label="Printee – Print your apparel"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
          }}
        >
          <img
            src="/logo_printee.png"
            alt="PRINTEE"
            style={{ height: 36, width: "auto", display: "block" }}
          />
          <span style={{ fontSize: 20, fontWeight: 700, color: "#111" }}>
            printee
          </span>
        </a>

        {/* Burger button for mobile */}
        <button
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          style={{
            marginInlineStart: "auto",
            display: "none",
            background: "transparent",
            border: 0,
            padding: 8,
            cursor: "pointer",
          }}
          className="burger"
        >
          <span style={{ display: "block", width: 24, height: 2, background: "#222", margin: "5px 0" }} />
          <span style={{ display: "block", width: 24, height: 2, background: "#222", margin: "5px 0" }} />
          <span style={{ display: "block", width: 24, height: 2, background: "#222", margin: "5px 0" }} />
        </button>

        {/* Nav */}
        <nav
          style={{
            marginInlineStart: "auto",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          {[
            { id: "how", label: "איך זה עובד" },
            { id: "catalog", label: "קטלוג" },
            { id: "pricing", label: "מחירים" },
            { id: "faq", label: "שאלות נפוצות" },
            { id: "contact", label: "התחל לעצב", cta: true },
          ].map(({ id, label, cta }) => (
            <a
              key={id}
              href={`#${id}`}
              onClick={goTo(id)}
              style={{
                textDecoration: "none",
                color: active === id ? "#000" : "#333",
                padding: cta ? "10px 14px" : "8px 10px",
                borderRadius: cta ? 999 : 10,
                background: cta
                  ? "#111"
                  : active === id
                  ? "#f0f0f0"
                  : "transparent",
                color: cta ? "#fff" : undefined,
                fontWeight: 500,
              }}
            >
              {label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}