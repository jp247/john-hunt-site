import { useEffect, useMemo, useRef, useState } from "react";
// @ts-nocheck
/*
  Full site code (mobile-optimized, Cloudflare Pages friendly).
  - No testimonials (per your request).
  - Sticky Call/Text/Email bar.
  - LocalBusiness + FAQ JSON-LD.
  - Strong mobile layout, CSS reset, safe-area padding, aspect-ratio carousel.
  - TypeScript-friendly (no implicit any, typed refs).
  - Portfolio images use /public paths (drop files into public/portfolio/...).
*/

// ====== CONFIG ======
const BUSINESS = {
  name: "JOHN HUNT CONSTRUCTION",
  owner: "John Hunt",
  phone: "206.226.7122",
  phoneHref: "tel:+12062267122",
  smsHref: "sms:+12062267122",
  email: "info@johnhuntconstruction.com",
  emailHref: "mailto:info@johnhuntconstruction.com",
  ctaTagline: "Licensed • Insured • Free Estimates",
  city: "Seattle",
  serviceAreas: [
    "Greater Seattle Area",
    "King County",
    "North Seattle",
    "Eastside",
    "South Seattle",
  ],
  license: "WA Lic # JOHNHHC920Q4",
  hours: "Mon–Sat 8am–6pm",
  url: "https://johnhuntbuilds.com", // update to your live domain later
};

// Logo (optional). If empty, renders initial lockup.
const LOGO_URL = ""; // e.g. "/logo.svg"

// Hero images (replace when you have real photos)
const HERO_IMAGE_URL = "/portfolio/hero.jpg"; // place file at public/portfolio/hero.jpg
const HERO_BG_URL = "/portfolio/hero-bg.jpg"; // optional background; safe to leave missing// Hero images
const HERO_IMAGE_URL = "/images/hero.jpg";
const HERO_BG_URL = "/images/hero-bg.jpg";

// Automatically load portfolio images from public/images/portfolio
// Just drop files into that folder — no code edit needed.
const GALLERY = Array.from({ length: 6 }).map((_, i) => ({
  src: `/images/portfolio/${String(i + 1).padStart(2, "0")}.jpg`,
  alt: `Portfolio photo ${i + 1}`,
}));


// ====== CONTENT ======
const SERVICES = [
  { title: "General Carpentry", desc: "Trim, doors, framing, repairs, custom built-ins." },
  { title: "Kitchen & Bath Updates", desc: "Cabinet installs, tile, fixtures, caulk & grout refresh." },
  { title: "Fencing & Gates", desc: "Wood, hog-wire, repairs, staining, privacy solutions." },
  { title: "Decks & Siding", desc: "New builds, resurfacing, railing, safety upgrades." },
  { title: "Drywall & Paint", desc: "Patches, texture match, interior repaint, accent walls. Insurance repair closeouts." },
  { title: "Small Electrical/Plumbing", desc: "Fixture swaps, disposals, toilets, faucets.*" },
];

const FAQS = [
  { q: "Do you charge for estimates?", a: "No. Estimates are free within our service area. Remote quotes available with photos and measurements." },
  { q: "How do you price jobs?", a: "Small tasks are often time-and-materials with a one-hour minimum. Larger projects receive a fixed-price proposal after a walkthrough." },
  { q: "Are you licensed and insured?", a: `${BUSINESS.license}. COI available on request.` },
  { q: "Do you warranty your work?", a: "Yes—1-year workmanship warranty on qualifying jobs. Materials per manufacturer." },
  { q: "What don’t you do?", a: "We avoid gas work, main electrical panel changes, roofing beyond minor repairs, and any work requiring specialty permits we don’t hold. We’ll refer trusted partners when needed." },
];

// Gallery — replace with your real photos in public/portfolio/
const GALLERY = [
  { src: "/portfolio/deck.jpg", alt: "Deck resurfacing and rails" },
  { src: "/portfolio/kitchen.jpg", alt: "Kitchen cabinet install and backsplash" },
  { src: "/portfolio/fence.jpg", alt: "Privacy fence with hog-wire detail" },
  { src: "/portfolio/siding.jpg", alt: "Exterior siding and trim upgrade" },
  { src: "/portfolio/drywall.jpg", alt: "Drywall patch and paint finish" },
  { src: "/portfolio/builtins.jpg", alt: "Custom built-in shelving" },
];

const STATS = [
  { label: "Years In Business", value: 14 },
  { label: "Projects Completed", value: 815 },
  { label: "5‑Star Reviews", value: 120 },
];

// ===== Utilities (and lightweight tests) =====
export function computeClipInset(value: unknown): string {
  const n = Number(value);
  const v = Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 50; // default to 50 on invalid input
  return `inset(0 ${100 - v}% 0 0)`;
}

// Minimal runtime tests (console only) — DO NOT remove existing tests
(function runTests() {
  try {
    console.assert(computeClipInset(0) === 'inset(0 100% 0 0)', 'clip at 0% failed');
    console.assert(computeClipInset(50) === 'inset(0 50% 0 0)', 'clip at 50% failed');
    console.assert(computeClipInset(100) === 'inset(0 0% 0 0)', 'clip at 100% failed');
    // Added tests (non-breaking)
    console.assert(computeClipInset(-10) === 'inset(0 100% 0 0)', 'clamp below 0 failed');
    console.assert(computeClipInset(200) === 'inset(0 0% 0 0)', 'clamp above 100 failed');
    console.assert(computeClipInset('75') === 'inset(0 25% 0 0)', 'string number failed');
    console.assert(computeClipInset('not-a-number') === 'inset(0 50% 0 0)', 'NaN default failed');
    // Extra coverage without changing behavior
    console.assert(computeClipInset(null) === 'inset(0 50% 0 0)', 'null default failed');
    console.assert(computeClipInset(undefined) === 'inset(0 50% 0 0)', 'undefined default failed');
    console.assert(computeClipInset(true) === 'inset(0 99% 0 0)', 'boolean true cast failed');
    console.assert(computeClipInset(Infinity) === 'inset(0 50% 0 0)', 'Infinity default failed');
    console.assert(computeClipInset(33.3).startsWith('inset(0 66.7'), 'decimal rounding sanity');
    // NEW tests (do not modify existing ones above)
    console.assert(computeClipInset(1) === 'inset(0 99% 0 0)', 'integer cast 1 failed');
    console.assert(computeClipInset(' 40 ') === 'inset(0 60% 0 0)', 'trimmed string number failed');
    console.assert(computeClipInset({}) === 'inset(0 50% 0 0)', 'object default failed');
    console.assert(computeClipInset('100abc') === 'inset(0 50% 0 0)', 'garbage numeric string default failed');
  } catch (e) { /* no-op in preview */ }
})();

// ===== Carousel (no deps) =====
function useCarousel(length: number, intervalMs: number = 5000) {
  const [index, setIndex] = useState(0);
  const timer = useRef<number | null>(null);
  useEffect(() => {
    if (length <= 1) return;
    timer.current = window.setInterval(() => setIndex((i) => (i + 1) % length), intervalMs);
    return () => { if (timer.current !== null) window.clearInterval(timer.current); };
  }, [length, intervalMs]);
  const prev = () => setIndex((i) => (i - 1 + length) % length);
  const next = () => setIndex((i) => (i + 1) % length);
  return { index, prev, next, setIndex };
}

export default function App() {
  const jsonLd = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: BUSINESS.name,
    email: BUSINESS.email,
    telephone: BUSINESS.phone,
    address: { "@type": "PostalAddress", addressLocality: BUSINESS.city, addressRegion: "WA" },
    areaServed: BUSINESS.serviceAreas,
    openingHours: BUSINESS.hours,
    url: BUSINESS.url,
    image: GALLERY.slice(0, 3).map((g) => g.src),
    priceRange: "$$",
    description: "Handyman and light remodeling services in Seattle: carpentry, fencing, decks, drywall, paint, fixture swaps.",
  }), []);

  const faqLd = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map(f => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } }))
  }), []);

  const carousel = useCarousel(GALLERY.length, 5000);

  return (
    <div style={{ minHeight: '100vh', color: '#111', background: '#fff', overflowX: 'hidden' }}>
      <style>{`
        :root{--gold:#d4af37;--ink:#111;--paper:#fff;--gray:#f7f7f7}
        /* --- Mobile-first base fixes --- */
        *,*::before,*::after{ box-sizing:border-box }
        html,body,#root{ height:100%; width:100% }
        html,body{ margin:0; padding:0; overflow-x:hidden }
        img,video{ max-width:100%; height:auto; display:block }

        body{background:var(--paper);} 
        .container{ max-width:1200px; margin:0 auto; padding:0 14px }
        .btn{ display:inline-flex; align-items:center; gap:8px; border-radius:9999px; padding:12px 16px; border:1px solid #ccc; background:var(--gold); color:#111; text-decoration:none; font-weight:800; letter-spacing:.02em }
        .btn.secondary{ background:transparent; color:#111; border-color:#ccc }
        .btn.inverse{ background:#111; color:#fff; border-color:#111 }
        .card{ border:1px solid #e0e0e0; border-radius:16px; background:#fff; box-shadow:0 1px 3px rgba(0,0,0,.08) }
        .grid{ display:grid; gap:16px }
        @media(min-width:640px){ .grid-sm-2{ grid-template-columns:repeat(2,minmax(0,1fr)) } }
        @media(min-width:1024px){ .grid-lg-3{ grid-template-columns:repeat(3,minmax(0,1fr)) } }
        .uppercase{ text-transform:uppercase }
        .brand{ display:flex; align-items:center; gap:10px; color:#111 }
        .brand .name{ font-size:18px; font-weight:900; letter-spacing:.06em }
        .section{ background:#fff; color:#111 }
        .section.light{ background:var(--gray) }
        .hero{ position:relative; background:${HERO_BG_URL ? `url('${HERO_BG_URL}') center/cover no-repeat` : 'var(--gray)'}; }
        .hero::before{ content:''; position:absolute; inset:0; background:rgba(255,255,255,0.7); } /* readability overlay */
        .heroContent{ position:relative; z-index:1 }
        .heroTitle{ font-size:36px; line-height:1.12; font-weight:900; letter-spacing:.06em; color:#111 }
        @media(min-width:768px){ .heroTitle{ font-size:56px } }
        .sub{ font-size:16px; color:#444 }
        .statBand{ background:var(--gray); border-block:1px solid #e5e5e5 }
        .stat{ display:flex; flex-direction:column; align-items:center; justify-content:center; padding:16px }
        .stat .value{ font-size:24px; font-weight:900; color:#111 }
        @media(min-width:640px){ .stat .value{ font-size:28px } }
        .stat .label{ font-size:12px; color:#555; margin-top:4px; text-transform:uppercase; letter-spacing:.08em }
        .carousel{ position:relative; border-radius:16px; overflow:hidden; box-shadow:0 10px 20px rgba(0,0,0,.15) }
        .carousel img{ width:100%; aspect-ratio:16/9; height:auto; object-fit:cover }
        @media(min-width:768px){ .carousel img{ height:540px; aspect-ratio:auto } }
        .dots{ position:absolute; left:0; right:0; bottom:10px; display:flex; justify-content:center; gap:10px }
        .dot{ width:12px; height:12px; border-radius:9999px; background:rgba(0,0,0,.2); border:1px solid rgba(0,0,0,.4) }
        .dot.active{ background:#111 }
        header.sticky{ position:sticky; top:0; z-index:40; backdrop-filter:blur(6px); background:rgba(255,255,255,.9); border-bottom:1px solid #e5e5e5 }
        footer{ border-top:1px solid #e5e5e5; background:#fafafa }
        .assurance{ background:var(--gray); border-block:1px solid #e5e5e5 }
        .heroGrid{ display:grid; gap:24px; align-items:center }
        @media(min-width:900px){ .heroGrid{ grid-template-columns:1.1fr .9fr } }
        .splash{ position:relative; border-radius:16px; overflow:hidden; min-height:220px; box-shadow:0 10px 20px rgba(0,0,0,.15) }
        @media(min-width:768px){ .splash{ min-height:360px } }
        .splash img{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover }
        .splash .badge{ position:absolute; left:12px; bottom:12px; background:rgba(255,255,255,.9); color:#111; border-radius:9999px; padding:6px 10px; font-weight:700; letter-spacing:.04em }
        /* Sticky CTA with safe-area for iOS */
        .stickyCta{ position:sticky; bottom:0; z-index:50; background:#111; color:#fff; display:flex; gap:12px; justify-content:center; align-items:center; padding:10px; padding-bottom:calc(10px + env(safe-area-inset-bottom)) }
        /* Show sticky bar mainly on mobile */
        @media(min-width:768px){ .stickyCta{ display:none } }
      `}</style>

      {/* JSON-LD */}
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      <script type="application/ld+json">{JSON.stringify(faqLd)}</script>

      {/* Header */}
      <header className="sticky">
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
          <div className="brand">
            {LOGO_URL ? (
              <img src={LOGO_URL} alt="JH logo" style={{ width: 32, height: 32, objectFit: 'contain' }} />
            ) : (
              <div style={{ width: 32, height: 32, background: 'var(--gold)', color: '#111', fontWeight: 900, display: 'grid', placeItems: 'center', borderRadius: 6 }}>JH</div>
            )}
            <span className="name">{BUSINESS.name}</span>
          </div>
          <nav style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <a className="btn secondary" href="#portfolio">Work</a>
            <a className="btn secondary" href="#services">Services</a>
            <a className="btn secondary" href="#faq">FAQ</a>
            <a className="btn inverse" href={BUSINESS.phoneHref}>Call {BUSINESS.phone}</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="section hero">
        <div className="container heroContent" style={{ padding: '56px 0' }}>
          <div className="heroGrid">
            <div>
              <h1 className="heroTitle">{BUSINESS.name}</h1>
              <p className="sub" style={{ marginTop: 8 }}>Seattle‑area handyman & small renovations. {BUSINESS.ctaTagline}</p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
                <a className="btn" href={BUSINESS.phoneHref}>📞 {BUSINESS.phone}</a>
                <a className="btn secondary" href={BUSINESS.emailHref}>✉️ {BUSINESS.email}</a>
                <a className="btn secondary" href={BUSINESS.smsHref}>💬 Text us</a>
              </div>
              <div style={{ marginTop: 8, color: '#555', fontSize: 13 }}>{BUSINESS.license}</div>
            </div>
            <div className="splash" aria-label="Hero splash image">
              <img src={HERO_IMAGE_URL} alt="Handyman at work" loading="eager" decoding="async" />
              <div className="badge">On‑site • Clean • Precise</div>
            </div>
          </div>
        </div>
      </section>

      {/* Assurance band */}
      <section className="assurance">
        <div className="container" style={{ padding: '16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#111', fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase' }}>
              <span>Licensed</span>
              <span>•</span>
              <span>Insured</span>
              <span>•</span>
              <span>Free Estimates</span>
              <span>— Serving {BUSINESS.city}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {LOGO_URL ? (
                <img src={LOGO_URL} alt="JH logo" style={{ width: 28, height: 28, objectFit: 'contain' }} />
              ) : (
                <div style={{ width: 28, height: 28, background: 'var(--gold)', color: '#111', fontWeight: 900, display: 'grid', placeItems: 'center', borderRadius: 6 }}>JH</div>
              )}
              <span style={{ color: '#555', fontSize: 13 }}>{BUSINESS.license}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio */}
      <section id="portfolio" className="section">
        <div className="container" style={{ padding: '40px 0' }}>
          <h2 className="uppercase" style={{ fontSize: 32, fontWeight: 900, color: '#111' }}>Portfolio</h2>
          <p className="sub" style={{ marginTop: 6 }}>Selected work across {BUSINESS.city}.</p>

          <div className="carousel" style={{ marginTop: 20 }}>
            <img
              src={GALLERY[carousel.index].src}
              alt={GALLERY[carousel.index].alt}
              loading="lazy"
              decoding="async"
            />
            <div className="dots">
              {GALLERY.map((_, i) => (
                <button
                  key={i}
                  className={`dot ${i === carousel.index ? 'active' : ''}`}
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => carousel.setIndex(i)}
                />
              ))}
            </div>
            <button aria-label="Previous slide" onClick={carousel.prev} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,.8)', color: '#111', border: '1px solid #111', borderRadius: 9999, padding: '8px 10px' }}>{'‹'}</button>
            <button aria-label="Next slide" onClick={carousel.next} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,.8)', color: '#111', border: '1px solid #111', borderRadius: 9999, padding: '8px 10px' }}>{'›'}</button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
            <a className="btn secondary" href={BUSINESS.emailHref}>Get a Quote →</a>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="section light">
        <div className="container" style={{ padding: '48px 0' }}>
          <h2 className="uppercase" style={{ fontSize: 32, fontWeight: 900, color: '#111' }}>Services</h2>
          <div className="grid grid-sm-2 grid-lg-3" style={{ marginTop: 16 }}>
            {SERVICES.map(({ title, desc }) => (
              <div key={title} className="card" style={{ padding: 16 }}>
                <div style={{ fontWeight: 800, color: '#111' }}>{title}</div>
                <div style={{ marginTop: 8, color: '#555', fontSize: 14 }}>{desc}</div>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 12, fontSize: 12, color: '#777' }}>*Electrical/plumbing limited to like‑for‑like fixture swaps and minor repairs per code. Complex work referred to licensed specialists.</p>
        </div>
      </section>

      {/* Why Us (concise stats band) */}
      <section className="statBand">
        <div className="container" style={{ padding: '20px 0' }}>
          <div className="grid grid-sm-2 grid-lg-3" style={{ alignItems: 'stretch' }}>
            {STATS.map((s) => (
              <div key={s.label} className="stat">
                <div className="value">{s.value}</div>
                <div className="label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="section light">
        <div className="container" style={{ maxWidth: 800, padding: '48px 0' }}>
          <h2 className="uppercase" style={{ fontSize: 32, fontWeight: 900, color: '#111' }}>FAQ</h2>
          <div style={{ marginTop: 12 }}>
            {FAQS.map((f, i) => (
              <details key={i} className="card" style={{ padding: 16, marginBottom: 8 }}>
                <summary style={{ cursor: 'pointer', fontWeight: 700, color: '#111' }}>{f.q}</summary>
                <div style={{ marginTop: 8, color: '#555' }}>{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="container" style={{ padding: '32px 0', display: 'grid', gap: 24, gridTemplateColumns: '1fr', alignItems: 'start', color: '#333' }}>
          <div>
            <div className="brand"><div style={{ width: 28, height: 28, background: 'var(--gold)', color: '#111', fontWeight: 900, display: 'grid', placeItems: 'center', borderRadius: 6 }}>JH</div><span className="name">{BUSINESS.name}</span></div>
            <p style={{ marginTop: 8, color: '#555' }}>Quality fixes and small builds without the runaround.</p>
          </div>
          <div>
            <div style={{ fontWeight: 800, color: '#111' }}>Contact</div>
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <a href={BUSINESS.phoneHref} className="btn inverse" style={{ width: 'fit-content' }}>{BUSINESS.phone}</a>
              <a href={BUSINESS.emailHref} className="btn secondary" style={{ width: 'fit-content' }}>{BUSINESS.email}</a>
              <div style={{ color: '#555', marginTop: 4 }}>{BUSINESS.hours}</div>
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 800, color: '#111' }}>Details</div>
            <div style={{ marginTop: 8 }}>{BUSINESS.license}</div>
            <div style={{ color: '#555' }}>© {new Date().getFullYear()} {BUSINESS.name}</div>
          </div>
        </div>
      </footer>

      {/* Sticky CTA (mobile) */}
      <div className="stickyCta">
        <a href={BUSINESS.phoneHref} className="btn" style={{ background: '#fff' }}>Call</a>
        <a href={BUSINESS.smsHref} className="btn secondary">Text</a>
        <a href={BUSINESS.emailHref} className="btn secondary">Email</a>
      </div>
    </div>
  );
}
