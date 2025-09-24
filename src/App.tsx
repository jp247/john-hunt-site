import { useEffect, useMemo } from "react";
import heroUrl from "./assets/hero.jpg";
import logoUrl from "./assets/logo.png";
const _bgMatches = import.meta.glob('./assets/hero-bg.{jpg,jpeg,png}', { eager: true, as: 'url' });
const heroBgUrl = Object.values(_bgMatches)[0] ?? '';

let heroBgUrl = "";
try { heroBgUrl = (await import("./assets/hero-bg.jpg")).default; } catch {}

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
  url: "https://johnhuntbuilds.com",
};

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
    console.assert(computeClipInset("75") === 'inset(0 25% 0 0)', 'string number failed');
    console.assert(computeClipInset("not-a-number") === 'inset(0 50% 0 0)', 'NaN default failed');
    console.assert(computeClipInset(null) === 'inset(0 50% 0 0)', 'null default failed');
    console.assert(computeClipInset(undefined) === 'inset(0 50% 0 0)', 'undefined default failed');
    console.assert(computeClipInset(true) === 'inset(0 99% 0 0)', 'boolean true cast failed');
    console.assert(computeClipInset(Infinity) === 'inset(0 50% 0 0)', 'Infinity default failed');
    console.assert(computeClipInset(33.3).startsWith('inset(0 66.7'), 'decimal rounding sanity');
  } catch {}
})();
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
export default function App() {
  const jsonLd = useMemo(() => ({
    "@context": "https://schema.org", "@type": "LocalBusiness",
    name: BUSINESS.name, email: BUSINESS.email, telephone: BUSINESS.phone,
    address: { "@type": "PostalAddress", addressLocality: BUSINESS.city, addressRegion: "WA" },
    areaServed: BUSINESS.serviceAreas, openingHours: BUSINESS.hours, url: BUSINESS.url,
    image: [heroUrl], priceRange: "$$", description: "Handyman and light remodeling services in Seattle."
  }), []);
  const faqLd = useMemo(() => ({
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question", name: "Do you charge for estimates?", acceptedAnswer: { "@type": "Answer", text: "No. Estimates are free within our service area. Remote quotes available with photos and measurements." } },
      { "@type": "Question", name: "How do you price jobs?", acceptedAnswer: { "@type": "Answer", text: "Small tasks are T&M with a one-hour minimum. Larger projects receive a fixed-price proposal after a walkthrough." } },
      { "@type": "Question", name: "Are you licensed and insured?", acceptedAnswer: { "@type": "Answer", text: `${BUSINESS.license}. COI available on request.` } },
      { "@type": "Question", name: "Do you warranty your work?", acceptedAnswer: { "@type": "Answer", text: "Yes—1-year workmanship warranty on qualifying jobs. Materials per manufacturer." } }
    ]
  }), []);
useEffect(() => {
    const el = document.querySelector("header.sticky");
    const onScroll = () => el?.classList.toggle("scrolled", window.scrollY > 40);
    onScroll(); window.addEventListener("scroll", onScroll);
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
        .btn{display:inline-flex;align-items:center;gap:8px;border-radius:9999px;padding:12px 16px;border:1px solid #cfcfcf;background:var(--gold);color:#111;text-decoration:none;font-weight:800;letter-spacing:.02em}
        .btn.secondary{background:transparent;color:#111;border-color:#cfcfcf}
        .btn.inverse{background:linear-gradient(180deg,#141821,#0F1115);color:#fff;border-color:#0F1115}
        .card{border:1px solid rgba(15,17,21,.08);border-radius:16px;background:#fff;box-shadow:0 6px 22px rgba(15,17,21,.06)}
        .grid{display:grid;gap:16px}
        @media(min-width:640px){.grid-sm-2{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(min-width:1024px){.grid-lg-3{grid-template-columns:repeat(3,minmax(0,1fr))}}
        header.sticky{position:sticky;top:0;z-index:40;backdrop-filter:blur(10px);background:rgba(255,255,255,.75);border-bottom:1px solid rgba(15,17,21,.08)}
        header.sticky.scrolled{background:rgba(255,255,255,.92)}
        .hero::before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(255,255,255,.86) 0%,rgba(255,255,255,.65) 42%,rgba(255,255,255,.25) 100%),rgba(255,255,255,.5)}
        .heroTitle{font-size:36px;line-height:1.12;font-weight:800}
        @media(min-width:768px){.heroTitle{font-size:56px}}
        .carousel{position:relative;border-radius:20px;overflow:hidden;box-shadow:0 18px 50px rgba(15,17,21,.16)}
        .carousel img{width:100%;aspect-ratio:16/9;height:auto;object-fit:cover}
        @media (max-width: 767px){
          .container{padding:0 14px}
          .heroTitle{font-size:30px;line-height:1.15}
        }
      `}</style>

      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      <script type="application/ld+json">{JSON.stringify(faqLd)}</script>

      <header className="sticky" role="banner" aria-label="Site header">
        <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0" }}>
          <div className="brand" aria-label="Brand" style={{ display:"flex", alignItems:"center", gap:10 }}>
            <img src={logoUrl} alt="John Hunt Construction logo" style={{ width: 32, height: 32, objectFit: "contain", borderRadius: 6 }} />
            <span className="name" style={{ fontSize:18, fontWeight:900, letterSpacing:".06em" }}>{BUSINESS.name}</span>
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
        <section className="section hero" style={{ position:"relative", background: heroBgUrl ? `url('${heroBgUrl}') center/cover no-repeat` : "var(--gray)" }}>
          <div className="container" style={{ padding:"56px 0" }}>
            <div style={{ display:"grid", gap:24, alignItems:"center", gridTemplateColumns: "minmax(0,1fr)" }}>
              <div>
                <h1 className="heroTitle">{BUSINESS.name}</h1>
                <p style={{ marginTop:8, color:"#566070" }}>Seattle-area handyman & small renovations. {BUSINESS.ctaTagline}</p>
                <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginTop:12 }}>
                  <a className="btn" href={BUSINESS.phoneHref}>📞 {BUSINESS.phone}</a>
                  <a className="btn secondary" href={BUSINESS.emailHref}>✉️ {BUSINESS.email}</a>
                  <a className="btn secondary" href={BUSINESS.smsHref}>💬 Text us</a>
                </div>
                <div style={{ marginTop:8, color:"#555", fontSize:13 }}>{BUSINESS.license}</div>
              </div>
              <div className="splash" style={{ position:"relative", borderRadius:16, overflow:"hidden", minHeight:220, boxShadow:"0 10px 20px rgba(0,0,0,.15)" }}>
                <img src={heroUrl} alt="John Hunt on site performing precise workmanship" loading="eager" decoding="async" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover"}} />
                <div className="badge" aria-hidden style={{ position:"absolute", left:12, bottom:12, background:"rgba(255,255,255,.9)", borderRadius:9999, padding:"6px 10px", fontWeight:700, letterSpacing:".04em" }}>On-site • Clean • Precise</div>
              </div>
            </div>
          </div>
        </section>

        <section id="portfolio" className="section">
          <div className="container" style={{ padding:"40px 0" }}>
            <h2 style={{ textTransform:"uppercase", fontSize:32, fontWeight:900 }}>Portfolio</h2>
            <div className="carousel" style={{ marginTop:20 }}>
              <img src={heroUrl} alt="Portfolio slide" />
            </div>
          </div>
        </section>
      </main>

      <footer role="contentinfo">
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




