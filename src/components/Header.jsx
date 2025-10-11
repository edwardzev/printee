import { useEffect, useState, useRef } from "react";
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, List, Info, HelpCircle, ShoppingCart as CartIcon, DollarSign } from 'lucide-react';
import { useMediaQuery } from '@/hooks/use-media-query';

export default function Header({ dir = "rtl" }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");
  const { getTotalItems } = useCart();
  const menuContainerRef = useRef(null);
  const menuListRef = useRef(null);
  const burgerRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width: 768px)");

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
    <header dir={dir} className="fixed-header" style={{ background: '#000' }}>
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 12px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          width: '100%',
          height: '100%'
        }}
      >
        <Link
          to="/"
          aria-label="Printeam – Custom apparel printing"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
          }}
        >
          <img
            src="/logo_printee.png"
            alt="PRINTEAM"
            style={{
              height: isMobile ? 110 : 210,
              width: "auto",
              display: "block",
              objectFit: 'contain'
            }}
          />
        </Link>

        {/* Burger button for mobile + cart badge - render only when viewport is mobile */}
        {isMobile && (
          <div style={{ marginInlineStart: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              aria-label="Toggle menu"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                background: 'transparent',
                border: 0,
                padding: 8,
                cursor: 'pointer',
              }}
              ref={burgerRef}
            >
              <span style={{ display: 'block', width: 24, height: 2, background: '#fff' }} />
              <span style={{ display: 'block', width: 24, height: 2, background: '#fff' }} />
              <span style={{ display: 'block', width: 24, height: 2, background: '#fff' }} />
            </button>

            {/* Cart icon with mobile badge placed to the right of the burger */}
            <Link
              to="/cart"
              aria-label={`Cart - ${getTotalItems()} items`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                textDecoration: 'none',
                color: '#fff',
                position: 'relative',
                padding: '8px'
              }}
            >
              <div style={{ position: 'relative', display: 'inline-flex' }}>
                <ShoppingCart size={20} />
                {getTotalItems() > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    background: '#ff3b30',
                    color: '#fff',
                    borderRadius: 999,
                    padding: '2px 6px',
                    fontSize: 11,
                    fontWeight: 700,
                    lineHeight: 1,
                    minWidth: 18,
                    height: 18,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #000'
                  }}>{getTotalItems()}</span>
                )}
              </div>
            </Link>
          </div>
        )}

        {/* Nav (hidden on small screens, burger used instead) */}
        <nav
          style={{
            marginInlineStart: "auto",
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
            { id: "contact", label: "התחל בהזמנה", cta: true },
          ].map(({ id, label, cta }) => {
            const baseStyle = {
              textDecoration: "none",
              color: '#fff',
              padding: cta ? "10px 18px" : "8px 10px",
              borderRadius: cta ? 999 : 10,
              // Use the brand gradient for CTA to match primary buttons; keep
              // a subtle hover-friendly contrast for active/non-cta links.
              background: cta
                ? "linear-gradient(90deg,#7a00ff 0%,#fe00ff 100%)"
                : active === id
                ? "#111"
                : "transparent",
              color: cta ? "#fff" : '#fff',
              fontWeight: 600,
              boxShadow: cta ? "0 6px 18px rgba(107,33,168,0.12)" : undefined,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
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
          {/* Cart icon with badge */}
          <Link
            to="/cart"
            aria-label={`Cart - ${getTotalItems()} items`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              textDecoration: 'none',
              color: '#fff',
              position: 'relative',
              padding: '8px'
            }}
          >
            <div style={{ position: 'relative', display: 'inline-flex' }}>
              <ShoppingCart size={20} />
              {getTotalItems() > 0 && (
                <span style={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  background: '#ff3b30',
                  color: '#fff',
                  borderRadius: 999,
                  padding: '2px 6px',
                  fontSize: 11,
                  fontWeight: 700,
                  lineHeight: 1,
                  minWidth: 18,
                  height: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #000'
                }}>{getTotalItems()}</span>
              )}
            </div>
          </Link>
        </nav>
        {/* Mobile menu overlay - only render on mobile viewports */}
        {isMobile && open && (
          <div
            className="fixed inset-0 flex flex-col overflow-y-auto"
            style={{ zIndex: 9999 }}
            role="dialog"
            aria-modal="true"
            ref={menuRef => { if (menuRef) menuContainerRef.current = menuRef }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setOpen(false);
            }}
          >
            {/* Black top bar behind logo for contrast */}
            <div className="w-full bg-black text-white">
              <div className="max-w-[1200px] mx-auto flex items-center justify-between px-6 py-4">
                <Link to="/" onClick={() => setOpen(false)}>
                  <img src="/logo_printee.png" alt="Printeam" style={{ height: 60, width: 'auto' }} />
                </Link>
                <button 
                  onClick={() => setOpen(false)} 
                  aria-label="Close menu" 
                  className="text-white text-3xl font-light leading-none p-2"
                  style={{ border: 0, background: 'transparent' }}
                >
                  ×
                </button>
              </div>
            </div>
            <nav className="flex flex-col gap-5 bg-white px-6 pb-6 pt-6" ref={menuListRef}>
              {dir === 'rtl' ? (
                <>
                  <Link to="/catalog" onClick={() => setOpen(false)} className="text-xl font-semibold text-gray-900 py-3 border-b border-gray-200 inline-flex items-center gap-3">
                    <List className="h-6 w-6" /> קטלוג
                  </Link>
                  <Link to="/catalog" onClick={() => setOpen(false)} className="text-xl font-semibold text-gray-900 py-3 border-b border-gray-200 inline-flex items-center gap-3">
                    <DollarSign className="h-6 w-6" /> מחירים
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/catalog" onClick={() => setOpen(false)} className="text-xl font-semibold text-gray-900 py-3 border-b border-gray-200 inline-flex items-center gap-3">
                    Catalog <List className="h-6 w-6" />
                  </Link>
                </>
              )}
              <a href="#how" onClick={goTo('how')} className="text-xl font-semibold text-gray-900 py-3 border-b border-gray-200 inline-flex items-center gap-3">
                <Info className="h-6 w-6" /> איך זה עובד
              </a>
              <Link to="/faq" onClick={() => setOpen(false)} className="text-xl font-semibold text-gray-900 py-3 border-b border-gray-200 inline-flex items-center gap-3">
                <HelpCircle className="h-6 w-6" /> שאלות נפוצות
              </Link>
              <Link to="/cart" onClick={() => setOpen(false)} className="text-xl font-semibold text-gray-900 py-3 border-b border-gray-200 inline-flex items-center gap-3">
                <CartIcon className="h-6 w-6" /> עגלה ({getTotalItems()})
              </Link>
            </nav>
            
            {/* CTA Button at bottom of menu */}
            <div className="mt-auto pt-8 bg-white px-6 pb-8">
              <Link to="/catalog" onClick={() => setOpen(false)}>
                <button 
                  className="w-full py-4 px-6 rounded-full text-lg font-bold text-white"
                  style={{ background: 'linear-gradient(90deg,#7a00ff 0%,#fe00ff 100%)' }}
                >
                  התחל בהזמנה
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}