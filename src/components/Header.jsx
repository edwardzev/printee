import { useEffect, useState, useRef } from "react";
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, List, Info, HelpCircle, ShoppingCart as CartIcon, DollarSign } from 'lucide-react';

export default function Header({ dir = "rtl" }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");
  const { getTotalItems } = useCart();
  const menuContainerRef = useRef(null);
  const menuListRef = useRef(null);
  const burgerRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();

  const goTo = (id) => (e) => {
    e?.preventDefault();

    const doScroll = () => {
      const el = document.getElementById(id);
      if (!el) return;
      const y = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: "smooth" });
      setOpen(false);
      setActive(id);
    };

    // If we're not on the home page, navigate there first then scroll
    if (location.pathname !== '/') {
      navigate('/');
      // Small delay to allow Home to mount and render its sections, then scroll
      setTimeout(doScroll, 160);
      return;
    }

    doScroll();
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

  // Focus trap for mobile menu
  useEffect(() => {
    if (!open || !menuListRef.current) return;
    const menu = menuListRef.current;
    const focusable = menu.querySelectorAll('a,button,[tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const onKey = (e) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    first.focus();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // Lock body scroll when menu is open and restore focus when closed
  useEffect(() => {
    const prev = document.body.style.overflow;
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = prev || '';
      // return focus to burger
      if (burgerRef.current) burgerRef.current.focus();
    }
    return () => { document.body.style.overflow = prev || ''; };
  }, [open]);

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
        <Link
          to="/"
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
        </Link>

        {/* Burger button for mobile */}
        <button
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          style={{
            marginInlineStart: "auto",
            display: "inline-flex",
            background: "transparent",
            border: 0,
            padding: 8,
            cursor: "pointer",
          }}
          className="md:hidden"
        >
          <span style={{ display: "block", width: 24, height: 2, background: "#222", margin: "4px 0" }} />
          <span style={{ display: "block", width: 24, height: 2, background: "#222", margin: "4px 0" }} />
          <span style={{ display: "block", width: 24, height: 2, background: "#222", margin: "4px 0" }} />
        </button>

        {/* Nav (hidden on small screens, burger used instead) */}
        <nav
          style={{
            marginInlineStart: "auto",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
          className="hidden md:flex"
        >
          {[
            { id: "how", label: "איך זה עובד" },
            { id: "catalog", label: "קטלוג" },
            { id: "pricing", label: "מחירים" },
            { id: "faq", label: "שאלות נפוצות" },
            { id: "contact", label: "התחל לעצב", cta: true },
          ].map(({ id, label, cta }) => {
            const baseStyle = {
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
            };

            // Render a routed Link for the FAQ item so it navigates to /faq
            if (id === 'faq') {
              return (
                <Link key={id} to="/faq" style={baseStyle}>
                  {label}
                </Link>
              );
            }

            // Catalog, Pricing and CTA -> go to /catalog route
            if (id === 'catalog' || id === 'contact' || id === 'pricing') {
              return (
                <Link key={id} to="/catalog" style={baseStyle} onClick={() => setOpen(false)}>
                  {label}
                </Link>
              );
            }

            return (
              <a key={id} href={`#${id}`} onClick={goTo(id)} style={baseStyle}>
                {label}
              </a>
            );
          })}
          {/* Cart icon */}
          <Link
            to="/cart"
            aria-label="Cart"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              textDecoration: 'none',
              color: '#111',
              position: 'relative'
            }}
          >
            <ShoppingCart size={20} />
            <span style={{
              background: '#ff3b30',
              color: '#fff',
              borderRadius: 999,
              padding: '2px 6px',
              fontSize: 12,
              fontWeight: 600
            }}>{getTotalItems()}</span>
          </Link>
        </nav>
        {/* Mobile menu overlay */}
        {open && (
          <div
            className="md:hidden fixed inset-0 z-50 bg-white/98 flex flex-col p-6"
            role="dialog"
            aria-modal="true"
            ref={menuRef => { if (menuRef) menuContainerRef.current = menuRef }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setOpen(false);
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <Link to="/" onClick={() => setOpen(false)}>
                <img src="/logo_printee.png" alt="printee" style={{ height: 34 }} />
              </Link>
              <button onClick={() => setOpen(false)} aria-label="Close menu" style={{ border: 0, background: 'transparent', fontSize: 22 }}>✕</button>
            </div>
            <div className="flex flex-col gap-4" ref={menuListRef}>
              {/* language-aware ordering: put primary CTA first for LTR, last for RTL */}
              {dir === 'rtl' ? (
                <>
                  <Link to="/catalog" onClick={() => setOpen(false)} className="text-lg font-medium inline-flex items-center gap-3"><List className="h-5 w-5" /> קטלוג</Link>
                  <Link to="/catalog" onClick={() => setOpen(false)} className="text-lg font-medium inline-flex items-center gap-3"><DollarIcon className="h-5 w-5" /> מחירים</Link>
                </>
              ) : (
                <>
                  <Link to="/catalog" onClick={() => setOpen(false)} className="text-lg font-medium inline-flex items-center gap-3">Catalog <List className="h-5 w-5" /></Link>
                </>
              )}
              <a href="#how" onClick={goTo('how')} className="text-lg inline-flex items-center gap-3"><Info className="h-5 w-5" /> איך זה עובד</a>
              <Link to="/faq" onClick={() => setOpen(false)} className="text-lg inline-flex items-center gap-3"><HelpCircle className="h-5 w-5" /> שאלות נפוצות</Link>
              <Link to="/cart" onClick={() => setOpen(false)} className="text-lg inline-flex items-center gap-3"><CartIcon className="h-5 w-5" /> עגלה</Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}