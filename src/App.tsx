import { useEffect, useMemo, useState } from "react";
import heroUrl from "./assets/hero.jpg";
import logoUrl from "./assets/logo.png";

/** Optional hero background (safe if missing) */
const _bgMatches = import.meta.glob("./assets/hero-bg.{jpg,jpeg,png}", { eager: true }) as Record<string, { default: string }>;
const heroBgUrl: string = Object.values(_bgMatches)[0]?.default ?? "";

/** Portfolio images: drop files into src/assets/portfolio/*.{jpg,jpeg,png} */
const _slides = import.meta.glob("./assets/portfolio/*.{jpg,jpeg,png}", { eager: true }) as Record<string, { default: string }>;
const slideUrls: string[] = Object.values(_slides).map(m => m.default).filter(Boolean);

/* ===================== Config ===================== */
const BUSINESS = {
  name: "JOHN HUNT CONSTRUCTION",
  owner: "John Hunt",
  phone: "206.226.7122",
  phoneHref: "tel:+12062267122",
  smsHref: "sms:+12062267122",
  email: "john+test@example.com",              // ← change later
  emailHref: "mailto:john+test@example.com",   // ← change later
  ctaTagline: "Licensed • Insured • Free Estimates",
  city: "Seattle",
  serviceAreas: ["Greater Seattle Area","King County","North Seattle","Eastside","South Seattle"],
  license: "WA Lic # JOHNHHC920Q4",
  hours: "Mon–Sat 8am–6pm",
  url: "https://johnhuntbuilds.com",
};

/* ================= Utilities + tests (preserved) ================= */
export function computeClipInset(value: unknown): string {
  const n = Number(value);
  const v = Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 50; // default 50
  return `inset(0 ${100 - v}% 0 0)`;
}
(function runTests() {
  try {
    console.assert(computeClipInset(0) === 'inset(0 100% 0 0)', 'clip at 0% failed');
    console.assert(computeClipInset(50) === 'inset(0 50% 0 0)', 'clip at 50% failed');
    console.assert(computeClipInset(100) === 'inset(0 0% 0 0)', 'clip at 100% failed');
    console.assert(computeClipInset(-10) === 'inset(0 100% 0 0)', 'clamp below 0 failed');
    console.assert(computeClipInset(200) === 'inset(0 0% 0 0)', 'clamp above 100 failed');
    console.assert(computeClipInset("75") === 'inset(0 25% 0 0)', 'string number failed');
    console.assert(computeClipInset("not-a-number") === 'inset(0 50% 0 0)', 'NaN default failed');
    console.assert(computeClipInset(null) === 'inset(0 50% 0 0)', 'null default failed');
    console.assert(computeClipInset(undefined) === 'inset(0 50% 0 0)', 'undefined default failed');
    console.assert(computeClipInset(true) === 'inset(0 99% 0 0)', 'boolean true cast failed');
    console.assert(computeClipInset(Infinity) === 'inset(0 50% 0 0)', 'Infinity default failed');
    console.assert(computeClipInset(33.3).startsWith('inset(0 66.7'), 'decimal rounding sanity');
  } catch {}
})();

/* =================== Tiny carousel hook =================== */
function useCarousel(length: number, intervalMs = 5000) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (length <= 1) return;
    const id = setInterval(() => setIndex(i => (i + 1) % length), intervalMs);
    return () => clearInterval(id);
  }, [length, intervalMs]);
  const prev = () => setIndex(i => (i - 1 + length) % length);
  const next = () => setIndex(i => (i + 1) % length);
  return { index, prev, next, setIndex };
}

export default function App() {
  const slides = useMemo(() => slideUrls.length ? slideUrls : [heroUrl], []);
  const carousel = useCarousel(slides.length, 5000);

  const jsonLd = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: BUSINESS.name,
    email: BUSINESS.email,
    telephone: BUSINESS.phone,
    address: { "@type": "PostalAddress", addressLocality: BUSINESS.city, addressRegion: "WA" },
    areaServed: BUSINESS.serviceAreas, openingHours: BUSINESS.hours,
    url: BUSINESS.url, image: [heroUrl], priceRange: "$$",
    description: "Handyman and light remodeling services in Seattle."
  }), []);

  const faqLd = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question", name: "Do you charge for estimates?", acceptedAnswer: { "@type": "Answer", text: "No. Estimates are free within our service area. Remote quotes available with photos and measurements." } },
      { "@type": "Question", name: "How do you price jobs?", acceptedAnswer: { "@type": "Answer", text: "Small tasks are T&M with a one-hour minimum. Larger projects receive a fixed-price proposal after a walkthrough." } },
      { "@type": "Question", name: "Are you licensed and insured?", acceptedAnswer: { "@type": "Answer", text: `${BUSINESS.license}. COI available on request.` } },
      { "@type": "Question", name: "Do you warranty your work?", acceptedAnswer: { "@type": "Answer", text: "Yes—1-year workmanship warranty on qualifying jobs. Materials per manufacturer." } },
    ]
  }), []);

  useEffect(() => {
    const hdr = document.querySelector("header.sticky");
    const onScroll = () => hdr?.classList.toggle("scrolled", window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={{ minHeight: "100vh", color: "#111", background: "#fff", overflowX: "hidden" }}>
      <div id="top" aria-hidden="true" />
      <style>{`
        :root{--gold:#C7A847;--ink:#0F1115;--paper:#fff;--gray:#F6F7F9}
        *,*::before,*::after{box-sizing:border-box}
        html,body,#root{height:100%;width:100%}
        html,body{margin:0;padding:0;overflow-x:hidden}
        body{background:var(--paper);font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial}

        .container{max-width:1200px;margin:0 auto;padding:0 18px}

        /* Buttons */
        .btn{display:inline-flex;align-items:center;gap:8px;border-radius:9999px;padding:12px 16px;border:1px solid #cfcfcf;background:var(--gold);color:#111;text-decoration:none;font-weight:800;letter-spacing:.02em;transition:transform .15s ease, box-shadow .2s ease, background .2s ease}
        .btn:hover{transform:translateY(-1px);box-shadow:0 8px 20px rgba(0,0,0,.08), inset 0 1px 0 rgba(255,255,255,.3)}
        .btn.secondary{background:transparent;color:#111;border-color:#cfcfcf}
        .btn.inverse{background:linear-gradient(180deg,#141821,#0F1115);color:#fff;border-color:#0F1115}
        .btn:focus-visible{outline:3px solid #2563eb;outline-offset:2px}

        /* Header */
        header.sticky{position:sticky;top:0;z-index:40;backdrop-filter:blur(10px);background:rgba(255,255,255,.75);border-bottom:1px solid rgba(15,17,21,.08)}
        header.sticky.scrolled{background:rgba(255,255,255,.92);box-shadow:0 10px 28px rgba(15,17,21,.08)}
        .brand .name{font-size:18px;font-weight:900;letter-spacing:.06em}

        /* Hero */
        .heroTitle{font-size:36px;line-height:1.12;font-weight:800}
        @media(min-width:768px){.heroTitle{font-size:56px}}
        .heroWrap{display:grid;gap:24px;align-items:center}
        @media(min-width:900px){.heroWrap{grid-template-columns:1.1fr .9fr}}
        .heroBand{position:relative;min-height:clamp(420px,54vh,680px);background:${heroBgUrl ? `url('${heroBgUrl}') center/cover no-repeat` : "var(--gray)"}}
        .heroBand::before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(255,255,255,.88) 0%,rgba(255,255,255,.72) 46%,rgba(255,255,255,.30) 100%)}

        .splash{position:relative;border-radius:16px;overflow:hidden;min-height:300px;box-shadow:0 10px 22px rgba(0,0,0,.15)}
        @media(min-width:768px){.splash{min-height:360px}}
        .splash img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
        .splash .badge{position:absolute;left:12px;bottom:12px;background:rgba(255,255,255,.92);border-radius:9999px;padding:6px 10px;font-weight:700;letter-spacing:.04em}

        /* Carousel */
        .carousel{position:relative;border-radius:20px;overflow:hidden;box-shadow:0 18px 50px rgba(15,17,21,.16)}
        .carousel img{width:100%;aspect-ratio:16/9;height:auto;object-fit:cover}
        @media(min-width:768px){.carousel img{height:540px;aspect-ratio:auto}}
        .dots{position:absolute;left:0;right:0;bottom:10px;display:flex;justify-content:center;gap:10px}
        .dot{width:12px;height:12px;border-radius:9999px;background:rgba(0,0,0,.22);border:1px solid rgba(0,0,0,.4)}
        .dot.active{background:#111}
        .navBtn{position:absolute;top:50%;transform:translateY(-50%);background:rgba(255,255,255,.88);color:#111;border:1px solid #111;border-radius:9999px;padding:8px 10px}
        .navBtn.left{left:8px}
        .navBtn.right{right:8px}

        /* Section shells */
        .section{background:#fff;color:#111}
        .section.light{background:var(--gray)}

        /* --- Premium cards & layout polish --- */
        .card{border:1px solid rgba(15,17,21,.08);border-radius:16px;background:#fff;box-shadow:0 8px 26px rgba(15,17,21,.06)}
        .card.pad{padding:16px}
        .grid{display:grid;gap:16px}
        @media(min-width:640px){.grid.sm-2{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(min-width:1024px){.grid.lg-3{grid-template-columns:repeat(3,minmax(0,1fr))}}
        .sectionBand{background:linear-gradient(180deg,#FAFBFC,#F6F7F9);border-block:1px solid rgba(15,17,21,.06)}
        .sectionTitle{font-size:32px;font-weight:900;text-transform:uppercase}
        .sectionSub{margin-top:6px;color:#566070}
        .serviceTitle{font-weight:800;color:#111}
        .serviceDesc{margin-top:8px;color:#555;font-size:14px}
        .faqCard{border:1px solid #e5e5e5;border-radius:12px;padding:12px}
        .faqCard summary{cursor:pointer;font-weight:700}
        .faqCard div{margin-top:8px;color:#555}
      `}</style>

      {/* Structured data */}
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      <script type="application/ld+json">{JSON.stringify(faqLd)}</script>

      {/* Header */}
      <header className="sticky" role="banner" aria-label="Site header">
        <div className="container" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 0", gap:12 }}>
          <div className="brand" aria-label="Brand" style={{ display:"flex", alignItems:"center", gap:10 }}>
            <img src={logoUrl} alt="John Hunt Construction logo" style={{ width:32, height:32, objectFit:"contain", borderRadius:6 }} />
            <span className="name">{BUSINESS.name}</span>
          </div>
          <nav aria-label="Primary">
            <ul style={{ display:"flex", gap:12, flexWrap:"wrap", alignItems:"center", listStyle:"none", margin:0, padding:0 }}>
              <li><a className="btn secondary" href="#portfolio">Work</a></li>
              <li><a className="btn secondary" href="#services">Services</a></li>
              <li><a className="btn secondary" href="#faq">FAQ</a></li>
              <li><a className="btn inverse" href={BUSINESS.phoneHref}>Call {BUSINESS.phone}</a></li>
            </ul>
          </nav>
        </div>
      </header>

      <main id="main" role="main">
        {/* Hero */}
        <section className="section heroBand">
          <div className="container" style={{ position:"relative", zIndex:1, padding:"64px 0" }}>
            <div className="heroWrap">
              <div>
                <h1 className="heroTitle">{BUSINESS.name}</h1>
                <p style={{ marginTop:8, color:"#566070" }}>
                  Seattle-area handyman & small renovations. {BUSINESS.ctaTagline}
                </p>
                <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginTop:12 }}>
                  <a className="btn" href={BUSINESS.phoneHref}>📞 {BUSINESS.phone}</a>
                  <a className="btn secondary" href={BUSINESS.emailHref}>✉️ {BUSINESS.email}</a>
                  <a className="btn secondary" href={BUSINESS.smsHref}>💬 Text us</a>
                </div>
                <div style={{ marginTop:8, color:"#555", fontSize:13 }}>{BUSINESS.license}</div>
              </div>
              <div className="splash" aria-label="Hero image">
                <img src={heroUrl} alt="On-site craftsmanship by John Hunt" loading="eager" decoding="async" />
                <div className="badge" aria-hidden>On-site • Clean • Precise</div>
              </div>
            </div>
          </div>
        </section>

        {/* Portfolio — carousel */}
        <section id="portfolio" className="section">
          <div className="container" style={{ padding:"44px 0" }}>
            <h2 className="sectionTitle">Portfolio</h2>
            <p className="sectionSub">Selected work across {BUSINESS.city}.</p>

            <div className="carousel" style={{ marginTop:20 }}>
              <img src={slides[carousel.index]} alt={`Portfolio slide ${carousel.index + 1}`} />
              <div className="dots" role="tablist" aria-label="Portfolio slides">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    className={`dot ${i === carousel.index ? "active" : ""}`}
                    aria-label={`Go to slide ${i + 1}`}
                    aria-selected={i === carousel.index}
                    onClick={() => carousel.setIndex(i)}
                  />
                ))}
              </div>
              {slides.length > 1 && (
                <>
                  <button aria-label="Previous slide" className="navBtn left" onClick={carousel.prev}>‹</button>
                  <button aria-label="Next slide" className="navBtn right" onClick={carousel.next}>›</button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Services — premium card grid */}
        <section id="services" className="section sectionBand">
          <div className="container" style={{ padding:"48px 0" }}>
            <h2 className="sectionTitle">Services</h2>
            <p className="sectionSub">The most common work we’re asked to do.</p>

            <div className="grid sm-2 lg-3" style={{ marginTop:16 }}>
              <div className="card pad">
                <div className="serviceTitle">General Carpentry</div>
                <div className="serviceDesc">Trim, doors, framing, repairs, custom built-ins.</div>
              </div>
              <div className="card pad">
                <div className="serviceTitle">Kitchen &amp; Bath</div>
                <div className="serviceDesc">Cabinet installs, tile, fixtures, caulk &amp; grout refresh.</div>
              </div>
              <div className="card pad">
                <div className="serviceTitle">Fencing &amp; Gates</div>
                <div className="serviceDesc">Wood, hog-wire, repairs, staining, privacy solutions.</div>
              </div>
              <div className="card pad">
                <div className="serviceTitle">Decks &amp; Siding</div>
                <div className="serviceDesc">New builds, resurfacing, railing, safety upgrades.</div>
              </div>
              <div className="card pad">
                <div className="serviceTitle">Drywall &amp; Paint</div>
                <div className="serviceDesc">Patches, texture match, interior repaint, accent walls.</div>
              </div>
              <div className="card pad">
                <div className="serviceTitle">Small Electrical/Plumbing</div>
                <div className="serviceDesc">Like-for-like fixture swaps and minor repairs.*</div>
              </div>
            </div>

            <p style={{ marginTop:12, fontSize:12, color:"#777" }}>
              * Complex work referred to licensed specialists.
            </p>
          </div>
        </section>

        {/* FAQ — tidy cards */}
        <section id="faq" className="section sectionBand">
          <div className="container" style={{ maxWidth:800, padding:"48px 0" }}>
            <h2 className="sectionTitle">FAQ</h2>
            <div style={{ marginTop:12, display:"grid", gap:10 }}>
              <details className="faqCard">
                <summary>Do you charge for estimates?</summary>
                <div>No. Estimates are free within our service area. Remote quotes available with photos and measurements.</div>
              </details>
              <details className="faqCard">
                <summary>How do you price jobs?</summary>
                <div>Small tasks are time-and-materials with a one-hour minimum. Larger projects get a fixed-price proposal after a walkthrough.</div>
              </details>
              <details className="faqCard">
                <summary>Are you licensed and insured?</summary>
                <div>{BUSINESS.license}. COI available on request.</div>
              </details>
              <details className="faqCard">
                <summary>Do you warranty your work?</summary>
                <div>Yes—1-year workmanship warranty on qualifying jobs. Materials per manufacturer.</div>
              </details>
            </div>
          </div>
        </section>
      </main>

      <footer role="contentinfo" style={{ borderTop:"1px solid #e5e5e5", background:"#fafafa" }}>
        <div className="container" style={{ padding:"32px 0", display:"grid", gap:24 }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <img src={logoUrl} alt="" style={{ width:28, height:28, objectFit:"contain", borderRadius:6 }} />
              <span style={{ fontWeight:900 }}>{BUSINESS.name}</span>
            </div>
            <p style={{ marginTop:8, color:"#555" }}>Quality fixes and small builds without the runaround.</p>
          </div>
          <div>
            <h3 style={{ fontWeight:800, margin:0 }}>Contact</h3>
            <div style={{ marginTop:8, display:"flex", flexDirection:"column", gap:6 }}>
              <a href={BUSINESS.phoneHref} className="btn inverse" style={{ width:"fit-content" }}>{BUSINESS.phone}</a>
              <a href={BUSINESS.emailHref} className="btn secondary" style={{ width:"fit-content" }}>{BUSINESS.email}</a>
              <div style={{ color:"#555", marginTop:4 }}>{BUSINESS.hours}</div>
            </div>
          </div>
          <div>
            <h3 style={{ fontWeight:800, margin:0 }}>Details</h3>
            <div style={{ marginTop:8 }}>{BUSINESS.license}</div>
            <div style={{ color:"#555" }}>© {new Date().getFullYear()} {BUSINESS.name}</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
