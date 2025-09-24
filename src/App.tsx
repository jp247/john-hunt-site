import { useEffect, useMemo, useRef, useState } from "react";
import heroUrl from './assets/hero.jpg';

// ===== Business config =====
const BUSINESS = {
  name: "JOHN HUNT CONSTRUCTION",
  owner: "John Hunt",
  phone: "206.226.7122",
  phoneHref: "tel:+12062267122",
  smsHref: "sms:+12062267122",
  email: "john+test@example.com",
  emailHref: "mailto:john+test@example.com",
  ctaTagline: "Licensed • Insured • Free Estimates",
  city: "Seattle",
  serviceAreas: ["Greater Seattle Area","King County","North Seattle","Eastside","South Seattle"],
  license: "WA Lic # JOHNHHC920Q4",
  hours: "Mon–Sat 8am–6pm",
  url: "https://johnhuntbuilds.com"
};

// Simple cache-busting for public images
const ASSET_VERSION = '';
const HERO_IMAGE_URL = heroUrl;
const HERO_BG_URL = "";

// ===== Utilities + tests (keep) =====
export function computeClipInset(value: unknown): string {
  const n = Number(value);
  const v = Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 50;
  return `inset(0 ${100 - v}% 0 0)`;
}
(function runTests() {
  try {
    console.assert(computeClipInset(0) === 'inset(0 100% 0 0)', 'clip at 0% failed');
    console.assert(computeClipInset(50) === 'inset(0 50% 0 0)', 'clip at 50% failed');
    console.assert(computeClipInset(100) === 'inset(0 0% 0 0)', 'clip at 100% failed');
    console.assert(computeClipInset(-10) === 'inset(0 100% 0 0)', 'clamp below 0 failed');
    console.assert(computeClipInset(200) === 'inset(0 0% 0 0)', 'clamp above 100 failed');
    console.assert(computeClipInset('75') === 'inset(0 25% 0 0)', 'string number failed');
    console.assert(computeClipInset('not-a-number') === 'inset(0 50% 0 0)', 'NaN default failed');
    console.assert(computeClipInset(null) === 'inset(0 50% 0 0)', 'null default failed');
    console.assert(computeClipInset(undefined) === 'inset(0 50% 0 0)', 'undefined default failed');
    console.assert(computeClipInset(true) === 'inset(0 99% 0 0)', 'boolean true cast failed');
    console.assert(computeClipInset(Infinity) === 'inset(0 50% 0 0)', 'Infinity default failed');
    console.assert(computeClipInset(33.3).startsWith('inset(0 66.7'), 'decimal rounding sanity');
  } catch {}
})();

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ===== Carousel =====
function useCarousel(length: number, intervalMs: number = 5000) {
  const [index, setIndex] = useState(0);
  const timer = useRef<number | null>(null);
  useEffect(() => {
    if (length <= 1 || prefersReducedMotion()) return;
    timer.current = window.setInterval(() => setIndex((i) => (i + 1) % length), intervalMs);
    return () => { if (timer.current !== null) window.clearInterval(timer.current); };
  }, [length, intervalMs]);
  const prev = () => setIndex((i) => (i - 1 + length) % length);
  const next = () => setIndex((i) => (i + 1) % length);
  return { index, prev, next, setIndex };
}

// ===== Auto-detect portfolio images from /public/images/portfolio =====
type GalleryItem = { base: string; src: string; alt: string; srcset?: string; sizes?: string };

async function probeImage(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url + `?v=${Date.now()}`;
  });
}

async function buildGallery(): Promise<GalleryItem[]> {
  const max = 60;
  const found: GalleryItem[] = [];
  for (let i = 1; i <= max; i++) {
    const base = `/images/portfolio/${String(i).padStart(2, "0")}`;
    const original = `${base}.jpg`;
    const exists = await probeImage(original);
    if (!exists) {
      if (i === 1) continue;
      break;
    }
    const s800 = await probeImage(`${base}_800.jpg`);
    const s1200 = await probeImage(`${base}_1200.jpg`);
    const s1600 = await probeImage(`${base}_1600.jpg`);
    let srcset: string | undefined;
    let sizes = "(max-width: 768px) 100vw, 1200px";
    if (s800 || s1200 || s1600) {
      const parts = [];
      if (s800) parts.push(`${base}_800.jpg 800w`);
      if (s1200) parts.push(`${base}_1200.jpg 1200w`);
      if (s1600) parts.push(`${base}_1600.jpg 1600w`);
      srcset = parts.join(", ");
    }
    found.push({
      base,
      src: srcset ? `${base}_1200.jpg` : original,
      alt: `Portfolio photo ${i}`,
      srcset,
      sizes
    });
  }
  if (found.length === 0) {
    for (let i = 1; i <= 6; i++) {
      found.push({ base: `/images/portfolio/${String(i).padStart(2, "0")}`, src: `/images/portfolio/${String(i).padStart(2, "0")}.jpg`, alt: `Portfolio photo ${i}` });
    }
  }
  return found;
}

// ===== Reveal-on-scroll =====
function useReveal(selector = ".reveal", rootMargin = "0px 0px -10% 0px"){
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const els = Array.from(document.querySelectorAll<HTMLElement>(selector));
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting){ e.target.classList.add("reveal-in"); io.unobserve(e.target); } });
    }, { rootMargin, threshold: 0.1 });
    els.forEach(el => { el.classList.add("reveal-wait"); io.observe(el); });
    return () => io.disconnect();
  }, [selector, rootMargin]);
}

export default function App() {
  useReveal();

  const [gallery, setGallery] = useState<GalleryItem[] | null>(null);
  useEffect(() => { buildGallery().then(setGallery); }, []);

  const jsonLd = useMemo(() => ({
    "@context": "https://schema.org","@type": "LocalBusiness",
    name: BUSINESS.name, email: BUSINESS.email, telephone: BUSINESS.phone,
    address: { "@type": "PostalAddress", addressLocality: BUSINESS.city, addressRegion: "WA" },
    areaServed: BUSINESS.serviceAreas, openingHours: BUSINESS.hours, url: BUSINESS.url,
    image: [HERO_IMAGE_URL], priceRange: "$$",
    description: "Handyman and light remodeling services in Seattle: carpentry, fencing, decks, drywall, paint, fixture swaps."
  }), []);

  const faqLd = useMemo(() => ({
    "@context": "https://schema.org","@type":"FAQPage",
    mainEntity: [
      { "@type":"Question", name:"Do you charge for estimates?", acceptedAnswer:{ "@type":"Answer", text:"No. Estimates are free within our service area. Remote quotes available with photos and measurements." }},
      { "@type":"Question", name:"How do you price jobs?", acceptedAnswer:{ "@type":"Answer", text:"Small tasks are often time-and-materials with a one-hour minimum. Larger projects receive a fixed-price proposal after a walkthrough." }},
      { "@type":"Question", name:"Are you licensed and insured?", acceptedAnswer:{ "@type":"Answer", text:`${BUSINESS.license}. COI available on request.` }},
      { "@type":"Question", name:"Do you warranty your work?", acceptedAnswer:{ "@type":"Answer", text:"Yes—1-year workmanship warranty on qualifying jobs. Materials per manufacturer." }},
      { "@type":"Question", name:"What don’t you do?", acceptedAnswer:{ "@type":"Answer", text:"We avoid gas work, main electrical panel changes, roofing beyond minor repairs, and any work requiring specialty permits we don’t hold. We’ll refer trusted partners when needed." }}
    ]
  }), []);

  const carousel = useCarousel(gallery?.length ?? 0, 5000);

  useEffect(() => {
    const el = document.querySelector('header.sticky');
    const onScroll = () => el && el.classList.toggle('scrolled', window.scrollY > 40);
    onScroll(); window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!gallery?.length) return;
      if (e.key === "ArrowLeft") carousel.prev();
      if (e.key === "ArrowRight") carousel.next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [gallery, carousel]);

  return (
    <div style={{ minHeight: '100vh', color: '#111', background: '#fff', overflowX: 'hidden' }}>
      {/* anchor for Back-to-Top */}
      <div id="top" aria-hidden="true"></div>

      <style>{`
        :root{--gold:#C7A847;--ink:#0F1115;--paper:#ffffff;--gray:#F6F7F9}
        *,*::before,*::after{ box-sizing:border-box }
        html,body,#root{ height:100%; width:100% }
        html,body{ margin:0; padding:0; overflow-x:hidden }
        body{ background:var(--paper); font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial }
        img,video{ max-width:100%; height:auto; display:block }

        .container{ max-width:1200px; margin:0 auto; padding:0 18px }
        .btn{ display:inline-flex; align-items:center; gap:8px; border-radius:9999px; padding:12px 16px; border:1px solid #cfcfcf; background:var(--gold); color:#111; text-decoration:none; font-weight:800; letter-spacing:.02em; transition: transform .15s ease, box-shadow .2s ease, background .2s ease }
        .btn:hover{ transform: translateY(-1px); box-shadow: 0 8px 20px rgba(0,0,0,.08), inset 0 1px 0 rgba(255,255,255,.3) }
        .btn.secondary{ background:transparent; color:#111; border-color:#cfcfcf }
        .btn.inverse{ background: linear-gradient(180deg, #141821, #0F1115); color:#fff; border-color:#0F1115 }
        .btn:focus-visible{ outline:3px solid #2563eb; outline-offset:2px }

        .card{ border:1px solid rgba(15,17,21,.08); border-radius:16px; background:#fff; box-shadow:0 6px 22px rgba(15,17,21,.06) }
        .grid{ display:grid; gap:16px }
        @media(min-width:640px){ .grid-sm-2{ grid-template-columns:repeat(2,minmax(0,1fr)) } }
        @media(min-width:1024px){ .grid-lg-3{ grid-template-columns:repeat(3,minmax(0,1fr)) } }
        .uppercase{ text-transform:uppercase; letter-spacing:.08em }
        .brand{ display:flex; align-items:center; gap:10px }
        .brand .name{ font-size:18px; font-weight:900; letter-spacing:.06em }

        .section{ background:#fff; color:#111 }
        .section.light{ background:var(--gray) }

        .hero{ position:relative; }
        .hero::before{ content:''; position:absolute; inset:0; background: linear-gradient(90deg, rgba(255,255,255,.86) 0%, rgba(255,255,255,.65) 42%, rgba(255,255,255,.25) 100%), rgba(255,255,255,.5); }
        .heroContent{ position:relative; z-index:1 }
        .heroTitle{ font-size:36px; line-height:1.12; font-weight:800; letter-spacing:.02em }
        @media(min-width:768px){ .heroTitle{ font-size:56px } }
        .sub{ font-size:16px; color:#566070 }

        .statBand{ background: linear-gradient(180deg, #FAFBFC, #F6F7F9); border-block:1px solid rgba(15,17,21,.06) }
        .stat{ display:flex; flex-direction:column; align-items:center; justify-content:center; padding:16px }
        .stat .value{ font-size:24px; font-weight:900 }
        @media(min-width:640px){ .stat .value{ font-size:28px } }
        .stat .label{ font-size:12px; color:#555; margin-top:4px; text-transform:uppercase; letter-spacing:.08em }

        .carousel{ position:relative; border-radius:20px; overflow:hidden; box-shadow:0 18px 50px rgba(15,17,21,.16) }
        .carousel img{ width:100%; aspect-ratio:16/9; height:auto; object-fit:cover }
        @media(min-width:768px){ .carousel img{ height:540px; aspect-ratio:auto } }
        .dots{ position:absolute; left:0; right:0; bottom:10px; display:flex; justify-content:center; gap:10px }
        .dot{ width:12px; height:12px; border-radius:9999px; background:rgba(0,0,0,.2); border:1px solid rgba(0,0,0,.4) }
        .dot.active{ background:#111 }

        header.sticky{ position:sticky; top:0; z-index:40; backdrop-filter: blur(10px); background: rgba(255,255,255,.75); border-bottom:1px solid rgba(15,17,21,.08); box-shadow:0 6px 20px rgba(15,17,21,.06) }
        header.sticky.scrolled{ background: rgba(255,255,255,.92); box-shadow: 0 10px 28px rgba(15,17,21,.08) }

        footer{ border-top:1px solid #e5e5e5; background:#fafafa }

        .assurance{ background: linear-gradient(180deg, #FAFBFC, #F6F7F9); border-block:1px solid rgba(15,17,21,.06) }
        .heroGrid{ display:grid; gap:24px; align-items:center }
        @media(min-width:900px){ .heroGrid{ grid-template-columns:1.1fr .9fr } }
        .splash{ position:relative; border-radius:16px; overflow:hidden; min-height:220px; box-shadow:0 10px 20px rgba(0,0,0,.15) }
        @media(min-width:768px){ .splash{ min-height:360px } }
        .splash img{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; object-position:center center }
        .splash .badge{ position:absolute; left:12px; bottom:12px; background:rgba(255,255,255,.9); border-radius:9999px; padding:6px 10px; font-weight:700; letter-spacing:.04em }

        .stickyCta{ position:sticky; bottom:0; z-index:50; background:#111; color:#fff; display:flex; gap:12px; justify-content:center; align-items:center; padding:10px; padding-bottom:calc(10px + env(safe-area-inset-bottom)) }
        .stickyCta .btn{ flex:1; justify-content:center }
        @media(min-width:768px){ .stickyCta{ display:none } }

        .reveal-wait{ opacity:0; transform: translateY(12px) }
        .reveal-in{ opacity:1; transform:none; transition: all .5s cubic-bezier(.22,.61,.36,1) }

        .toTop{ position: fixed; right: 16px; bottom: 16px; z-index: 60; }

        /* ---- Mobile polish (only small screens) ---- */
        @media (max-width: 767px) {
          .container { padding: 0 14px; }
          .heroContent { padding: 40px 0 !important; }
          .heroTitle { font-size: 30px; line-height: 1.15; }
          .sub { font-size: 15px; }
          .grid { gap: 12px; }
          main { padding-bottom: 72px; } /* keeps sticky bar from covering content */
          .btn { padding: 12px 14px; }
          .stat .value { font-size: 22px; }
          .toTop { right: 12px; bottom: 88px; } /* clear of sticky CTA bar */

          /* Nav pills: horizontal scroll instead of awkward wrapping */
          header.sticky nav ul {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            gap: 8px;
            padding: 4px 2px;
            margin: 0;
          }
          header.sticky nav li { flex: 0 0 auto; }
          header.sticky .btn.secondary,
          header.sticky .btn.inverse {
            padding: 10px 12px;
            font-weight: 700;
          }

          /* Slightly heavier hero overlay for readability on small screens */
          .hero::before {
            background: linear-gradient(90deg, rgba(255,255,255,.92) 0%, rgba(255,255,255,.7) 48%, rgba(255,255,255,.3) 100%), rgba(255,255,255,.5);
          }

          /* Tighter header spacing so brand + pills fit */
          header.sticky .container { gap: 8px; }
          .brand .name { font-size: 16px; }
        }
      `}</style>

      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      <script type="application/ld+json">{JSON.stringify(faqLd)}</script>

      {/* Header */}
      <header className="sticky" role="banner" aria-label="Site header">
        <div className="brand reveal" aria-label="Brand">
			<img
					src="/images/logo.png"
					alt="John Hunt Construction logo"
					style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 6 }}
					/>
				<span className="name">{BUSINESS.name}</span>
</div>
      </header>

      <main id="main" role="main">
        {/* Hero with inline background to avoid template-string nesting */}
        <section className="section hero" style={{ background: `url('${HERO_BG_URL}') center/cover no-repeat` }} aria-label="Introduction">
          <div className="container heroContent" style={{ padding:'56px 0' }}>
            <div className="heroGrid">
              <div className="reveal">
                <h1 className="heroTitle">{BUSINESS.name}</h1>
                <p className="sub" style={{ marginTop: 8 }}>
                  Seattle-area handyman & small renovations. {BUSINESS.ctaTagline}
                </p>
                <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginTop:12 }}>
                  <a className="btn" href={BUSINESS.phoneHref} aria-label={`Call ${BUSINESS.phone}`}>📞 {BUSINESS.phone}</a>
                  <a className="btn secondary" href={BUSINESS.emailHref} aria-label={`Email ${BUSINESS.email}`}>✉️ {BUSINESS.email}</a>
                  <a className="btn secondary" href={BUSINESS.smsHref} aria-label="Text us">💬 Text us</a>
                </div>
                <div style={{ marginTop: 8, color: '#555', fontSize: 13 }}>{BUSINESS.license}</div>
              </div>
              <div className="splash reveal">
                <img src={HERO_IMAGE_URL} alt="John Hunt on site performing precise workmanship" loading="eager" decoding="async" />
                <div className="badge" aria-hidden>On-site • Clean • Precise</div>
              </div>
            </div>
          </div>
        </section>

        {/* Assurance */}
        <section className="assurance" aria-label="Assurances">
          <div className="container" style={{ padding:'16px 0' }}>
            <div className="reveal" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, color:'#111', fontWeight:800, letterSpacing:'.06em', textTransform:'uppercase' }}>
                <span>Licensed</span><span aria-hidden>•</span><span>Insured</span><span aria-hidden>•</span><span>Free Estimates</span><span aria-hidden>—</span><span>Serving {BUSINESS.city}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width: 28, height: 28, background: 'var(--gold)', color: '#111', fontWeight: 900, display: 'grid', placeItems: 'center', borderRadius: 6 }} aria-hidden>JH</div>
                <span style={{ color:'#555', fontSize:13 }}>{BUSINESS.license}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Portfolio */}
        <section id="portfolio" className="section" aria-label="Portfolio">
          <div className="container" style={{ padding:'40px 0' }}>
            <h2 className="uppercase reveal" style={{ fontSize:32, fontWeight:900 }}>Portfolio</h2>
            <p className="sub reveal" style={{ marginTop:6 }}>Selected work across {BUSINESS.city}.</p>

            <div className="carousel reveal" role="region" aria-roledescription="carousel" aria-label="Project photos" aria-live="polite" style={{ marginTop:20 }}>
              {gallery && gallery.length > 0 ? (
                <>
                  <img
                    src={gallery[carousel.index].src}
                    alt={gallery[carousel.index].alt}
                    loading="lazy"
                    decoding="async"
                    srcSet={gallery[carousel.index].srcset}
                    sizes={gallery[carousel.index].sizes}
                  />
                  <div className="dots" role="tablist" aria-label="Slides">
                    {gallery.map((_, i) => (
                      <button
                        key={i}
                        role="tab"
                        aria-selected={i === carousel.index}
                        aria-label={`Go to slide ${i + 1}`}
                        className={`dot ${i === carousel.index ? 'active' : ''}`}
                        onClick={() => carousel.setIndex(i)}
                      />
                    ))}
                  </div>
                  <button aria-label="Previous slide" onClick={carousel.prev} style={{ position:'absolute', left:8, top:'50%', transform:'translateY(-50%)', background:'rgba(255,255,255,.85)', color:'#111', border:'1px solid #111', borderRadius:9999, padding:'8px 10px' }}>{'‹'}</button>
                  <button aria-label="Next slide" onClick={carousel.next} style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', background:'rgba(255,255,255,.85)', color:'#111', border:'1px solid #111', borderRadius:9999, padding:'8px 10px' }}>{'›'}</button>
                </>
              ) : (
                <div className="card" style={{ padding:16 }}>Loading photos…</div>
              )}
            </div>

            <div className="reveal" style={{ display:'flex', justifyContent:'center', marginTop:16 }}>
              <a className="btn secondary" href={BUSINESS.emailHref}>Get a Quote →</a>
            </div>
          </div>
        </section>

        {/* Services */}
        <section id="services" className="section light" aria-label="Services">
          <div className="container" style={{ padding:'48px 0' }}>
            <h2 className="uppercase reveal" style={{ fontSize:32, fontWeight:900 }}>Services</h2>
            <div className="grid grid-sm-2 grid-lg-3" style={{ marginTop:16 }}>
              {[
                { title: "General Carpentry", desc: "Trim, doors, framing, repairs, custom built-ins." },
                { title: "Kitchen & Bath Updates", desc: "Cabinet installs, tile, fixtures, caulk & grout refresh." },
                { title: "Fencing & Gates", desc: "Wood, hog-wire, repairs, staining, privacy solutions." },
                { title: "Decks & Siding", desc: "New builds, resurfacing, railing, safety upgrades." },
                { title: "Drywall & Paint", desc: "Patches, texture match, interior repaint, accent walls. Insurance repair closeouts." },
                { title: "Small Electrical/Plumbing", desc: "Fixture swaps, disposals, toilets, faucets.*" }
              ].map(({ title, desc }) => (
                <article key={title} className="card reveal" style={{ padding: 16 }} aria-label={title}>
                  <h3 style={{ fontWeight:800, margin:0 }}>{title}</h3>
                  <p style={{ marginTop:8, color:'#555', fontSize:14 }}>{desc}</p>
                </article>
              ))}
            </div>
            <p className="reveal" style={{ marginTop:12, fontSize:12, color:'#777' }}>
              * Electrical/plumbing limited to like-for-like fixture swaps and minor repairs per code.
              Complex work referred to licensed specialists.
            </p>
          </div>
        </section>

        {/* Stats */}
        <section className="statBand" aria-label="Why us">
          <div className="container" style={{ padding:'20px 0' }}>
            <div className="grid grid-sm-2 grid-lg-3" style={{ alignItems:'stretch' }}>
              {[
                { label: "Years In Business", value: 14 },
                { label: "Projects Completed", value: 815 },
                { label: "5-Star Reviews", value: 120 }
              ].map((s) => (
                <div key={s.label} className="stat reveal" role="group" aria-label={s.label}>
                  <div className="value" aria-live="off">{s.value}</div>
                  <div className="label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="section light" aria-label="Frequently Asked Questions">
          <div className="container" style={{ maxWidth:800, padding:'48px 0' }}>
            <h2 className="uppercase reveal" style={{ fontSize:32, fontWeight:900 }}>FAQ</h2>
            <div style={{ marginTop:12 }}>
              {[
                { q: "Do you charge for estimates?", a: "No. Estimates are free within our service area. Remote quotes available with photos and measurements." },
                { q: "How do you price jobs?", a: "Small tasks are often time-and-materials with a one-hour minimum. Larger projects receive a fixed-price proposal after a walkthrough." },
                { q: "Are you licensed and insured?", a: `${BUSINESS.license}. COI available on request.` },
                { q: "Do you warranty your work?", a: "Yes—1-year workmanship warranty on qualifying jobs. Materials per manufacturer." },
                { q: "What don’t you do?", a: "We avoid gas work, main electrical panel changes, roofing beyond minor repairs, and any work requiring specialty permits we don’t hold. We’ll refer trusted partners when needed." }
              ].map((f, i) => (
                <details key={i} className="card reveal" style={{ padding:16, marginBottom:8 }}>
                  <summary style={{ cursor:'pointer', fontWeight:700 }}>{f.q}</summary>
                  <div style={{ marginTop:8, color:'#555' }}>{f.a}</div>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer role="contentinfo">
        <div className="container" style={{ padding:'32px 0', display:'grid', gap:24 }}>
          <div className="reveal">
            <div className="brand">
              <div style={{ width:28, height:28, background:'var(--gold)', color:'#111', fontWeight:900, display:'grid', placeItems:'center', borderRadius:6 }} aria-hidden>JH</div>
              <span className="name">{BUSINESS.name}</span>
            </div>
            <p style={{ marginTop:8, color:'#555' }}>Quality fixes and small builds without the runaround.</p>
          </div>
          <div className="reveal">
            <h3 style={{ fontWeight:800, margin:0 }}>Contact</h3>
            <div style={{ marginTop:8, display:'flex', flexDirection:'column', gap:6 }}>
              <a href={BUSINESS.phoneHref} className="btn inverse" style={{ width:'fit-content' }}>{BUSINESS.phone}</a>
              <a href={BUSINESS.emailHref} className="btn secondary" style={{ width:'fit-content' }}>{BUSINESS.email}</a>
              <div style={{ color:'#555', marginTop:4 }}>{BUSINESS.hours}</div>
            </div>
          </div>
          <div className="reveal">
            <h3 style={{ fontWeight:800, margin:0 }}>Details</h3>
            <div style={{ marginTop:8 }}>{BUSINESS.license}</div>
            <div style={{ color:'#555' }}>Build: <span data-build-tag="true">2025-09-23 21:37:10</span> · </div>
          </div>
        </div>
      </footer>

      {/* Sticky CTA (mobile) */}
      <div className="stickyCta" role="region" aria-label="Quick contact">
        <a href={BUSINESS.phoneHref} className="btn" style={{ background:'#fff' }}>Call</a>
        <a href={BUSINESS.smsHref} className="btn secondary">Text</a>
        <a href={BUSINESS.emailHref} className="btn secondary">Email</a>
      </div>

      {/* Back-to-top */}
      <div className="toTop">
        <a
          href="#top"
          onClick={(e)=>{ e.preventDefault(); window.scrollTo({top:0, behavior: prefersReducedMotion() ? "auto" : "smooth"}); }}
          className="btn secondary"
          aria-label="Back to top"
        >↑ Top</a>
      </div>
    </div>
  );
}







