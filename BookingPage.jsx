import { useState, useEffect, useRef } from "react";
import {
  HOST_EMAIL, HOST_PHONE, HOST_PHONE_DISPLAY, WHATSAPP,
  PHOTOS, BOOKING, REVIEWS,
} from "./config";

// ╔══════════════════════════════════════════════════════════════╗
// ║  BOKNINGSSIDAN — endihomes.com                                ║
// ║  Här skickar framtida gäster bokningsförfrågningar direkt     ║
// ║  till dig — utan Airbnb- eller Booking-avgifter.              ║
// ╚══════════════════════════════════════════════════════════════╝

const BT = {
  sv: {
    guestBanner: "Bor du här just nu?", guestLink: "Öppna gästguiden →",
    heroTag: "MALMÖ · SVERIGE",
    heroSub: "Ert hem i Malmö — boka direkt hos värden och slipp plattformsavgifterna",
    from: "från", perNight: "kr / natt", upTo: "Upp till", guestsWord: "gäster",
    cta: "Skicka bokningsförfrågan",
    trustReply: "Svar inom 24 timmar", trustPrice: "Bästa pris — alltid", trustOn: "på Airbnb",
    aboutTitle: "Om boendet",
    aboutText: "Ett bekvämt och fullt utrustat hem för upp till 5 gäster i södra Malmö. Perfekt för familjer, par och längre vistelser — med nära till mataffärer, kollektivtrafik och bara en halvtimme från Köpenhamns flygplats.",
    amenitiesTitle: "Bekvämligheter",
    amenities: ["WiFi", "Fullt utrustat kök", "Tvättmaskin", "Diskmaskin", "Värmepump", "TV", "Parkering på uppfarten"],
    whyTitle: "Varför boka direkt?",
    why1t: "Bästa priset", why1d: "Inga plattformsavgifter. Ni betalar det riktiga priset — samma hem, lägre kostnad.",
    why2t: "Direktkontakt", why2d: "Prata direkt med oss som värdar. Snabba svar före, under och efter vistelsen.",
    why3t: "Flexibelt", why3d: "Enklare att lösa speciella önskemål, tider och längre vistelser när ni bokar direkt.",
    formTitle: "Skicka bokningsförfrågan",
    formHint: "Ingen betalning nu — vi bekräftar tillgänglighet och pris inom 24 timmar.",
    checkin: "Incheckning", checkout: "Utcheckning", guests: "Antal gäster",
    name: "Namn", namePh: "Ert namn", message: "Meddelande (valfritt)", messagePh: "Berätta gärna om er resa...",
    nights: "nätter", night: "natt",
    sendEmail: "✉ Skicka via e-post", sendWa: "Skicka via WhatsApp",
    fillFields: "Fyll i datum och namn för att skicka",
    reviewsTitle: "Vad gäster säger",
    locTitle: "Läget",
    locText: "Lugnt läge i södra Malmö med allt inom räckhåll.",
    locItems: [
      { label: "Malmö Centralstation", val: "~10 min med bil" },
      { label: "Köpenhamns flygplats (CPH)", val: "~25 min med bil" },
      { label: "Emporia köpcentrum", val: "~10 min med bil" },
      { label: "Mataffär & apotek", val: "~5 min" },
    ],
    mapBtn: "Öppna i Google Maps",
    footerContact: "Kontakt",
    footerGuide: "Gästguide för boende gäster",
    mailSubject: "Bokningsförfrågan — Spelmansgatan 18",
    mailIntro: "Hej! Vi vill gärna boka Spelmansgatan 18.",
  },
  en: {
    guestBanner: "Staying with us right now?", guestLink: "Open the guest guide →",
    heroTag: "MALMÖ · SWEDEN",
    heroSub: "Your home in Malmö — book directly with the host and skip the platform fees",
    from: "from", perNight: "kr / night", upTo: "Up to", guestsWord: "guests",
    cta: "Send booking request",
    trustReply: "Reply within 24 hours", trustPrice: "Best price — always", trustOn: "on Airbnb",
    aboutTitle: "About the home",
    aboutText: "A comfortable, fully equipped home for up to 5 guests in southern Malmö. Perfect for families, couples and longer stays — close to grocery stores, public transport, and just half an hour from Copenhagen Airport.",
    amenitiesTitle: "Amenities",
    amenities: ["WiFi", "Fully equipped kitchen", "Washing machine", "Dishwasher", "Heat pump", "TV", "Driveway parking"],
    whyTitle: "Why book direct?",
    why1t: "Best price", why1d: "No platform fees. You pay the real price — same home, lower cost.",
    why2t: "Direct contact", why2d: "Talk directly with us as hosts. Fast replies before, during and after your stay.",
    why3t: "Flexible", why3d: "Easier to arrange special requests, timings and longer stays when you book direct.",
    formTitle: "Send booking request",
    formHint: "No payment now — we confirm availability and price within 24 hours.",
    checkin: "Check-in", checkout: "Check-out", guests: "Number of guests",
    name: "Name", namePh: "Your name", message: "Message (optional)", messagePh: "Tell us about your trip...",
    nights: "nights", night: "night",
    sendEmail: "✉ Send via email", sendWa: "Send via WhatsApp",
    fillFields: "Fill in dates and name to send",
    reviewsTitle: "What guests say",
    locTitle: "Location",
    locText: "A calm location in southern Malmö with everything within reach.",
    locItems: [
      { label: "Malmö Central Station", val: "~10 min by car" },
      { label: "Copenhagen Airport (CPH)", val: "~25 min by car" },
      { label: "Emporia shopping mall", val: "~10 min by car" },
      { label: "Grocery store & pharmacy", val: "~5 min" },
    ],
    mapBtn: "Open in Google Maps",
    footerContact: "Contact",
    footerGuide: "Guest guide for current guests",
    mailSubject: "Booking request — Spelmansgatan 18",
    mailIntro: "Hi! We would like to book Spelmansgatan 18.",
  },
};

function detectBookingLang() {
  const nav = ((typeof navigator !== "undefined" && navigator.language) || "en").toLowerCase();
  return nav.startsWith("sv") ? "sv" : "en";
}

function Reveal({ children, delay = 0 }) {
  const ref = useRef();
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } }, { threshold: 0.05, rootMargin: "0px 0px -40px 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(24px)", transition: `opacity 0.8s ${delay}s cubic-bezier(.22,1,.36,1), transform 0.8s ${delay}s cubic-bezier(.22,1,.36,1)` }}>
      {children}
    </div>
  );
}

function nightsBetween(a, b) {
  if (!a || !b) return 0;
  const d1 = new Date(a), d2 = new Date(b);
  if (isNaN(d1) || isNaN(d2)) return 0;
  const n = Math.round((d2 - d1) / 86400000);
  return n > 0 ? n : 0;
}

export default function BookingPage() {
  const [lang, setLang] = useState(detectBookingLang);
  const [loaded, setLoaded] = useState(false);
  const [ci, setCi] = useState("");
  const [co, setCo] = useState("");
  const [guests, setGuests] = useState(2);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  useEffect(() => { setTimeout(() => setLoaded(true), 100); }, []);

  const t = BT[lang];
  const nights = nightsBetween(ci, co);
  const ready = ci && co && nights > 0 && name.trim().length > 1;

  const bodyLines = [
    t.mailIntro, "",
    `${t.checkin}: ${ci}`,
    `${t.checkout}: ${co}`,
    `${t.guests}: ${guests}`,
    `${t.name}: ${name}`,
    msg ? `${t.message}: ${msg}` : "",
    "", "— endihomes.com",
  ].filter(Boolean).join("\n");
  const mailHref = `mailto:${HOST_EMAIL}?subject=${encodeURIComponent(t.mailSubject)}&body=${encodeURIComponent(bodyLines)}`;
  const waHref = WHATSAPP ? `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(t.mailSubject + "\n" + bodyLines)}` : null;

  const heroImg = PHOTOS[0] || "";
  const accent = "#b08d57";

  const scrollToForm = () => {
    const el = document.getElementById("booking-form");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div style={{ minHeight: "100vh", background: "#1a1714", color: "#e8e0d4", fontFamily: "'Outfit',sans-serif", overflowX: "hidden", WebkitFontSmoothing: "antialiased" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
        html{scroll-behavior:smooth}
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
        a:active,button:active{transform:scale(0.98)!important}
        .bp-input{font-family:'Outfit',sans-serif;padding:12px 14px;border-radius:10px;border:1.5px solid rgba(176,141,87,0.25);background:rgba(255,255,255,0.03);color:#e8e0d4;font-size:14px;width:100%;outline:none;transition:border 0.3s}
        .bp-input:focus{border-color:#b08d57}
        .bp-input::placeholder{color:rgba(232,224,212,0.3)}
        select.bp-input{appearance:none}
        textarea.bp-input{resize:vertical;min-height:80px}
        input[type="date"].bp-input{color-scheme:dark}
        .bp-cta{display:flex;align-items:center;justify-content:center;gap:8px;padding:16px 28px;border-radius:12px;background:linear-gradient(135deg,#b08d57,#8a6d3b);color:#fff;font-size:15px;font-weight:800;text-decoration:none;font-family:'Outfit',sans-serif;border:none;cursor:pointer;transition:all 0.25s cubic-bezier(.22,1,.36,1);box-shadow:0 8px 24px rgba(176,141,87,0.3);letter-spacing:0.3px}
        .bp-cta:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(176,141,87,0.4)}
        .bp-cta[data-disabled="true"]{opacity:0.45;pointer-events:none}
        .bp-cta-sec{display:flex;align-items:center;justify-content:center;gap:8px;padding:14px 24px;border-radius:10px;background:rgba(255,255,255,0.04);color:#e8e0d4;font-size:13px;font-weight:700;text-decoration:none;font-family:'Outfit',sans-serif;border:1px solid rgba(255,255,255,0.1);cursor:pointer;transition:all 0.25s}
        .bp-cta-sec:hover{background:rgba(255,255,255,0.08)}
        .bp-card{background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.05);border-radius:16px;transition:all 0.3s cubic-bezier(.22,1,.36,1)}
        .bp-card:hover{transform:translateY(-2px);border-color:rgba(176,141,87,0.2)}
        @media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}*{animation-duration:0.01ms!important;transition-duration:0.01ms!important}}
      `}</style>

      {/* Banner för nuvarande gäster */}
      <a href="/guide" style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        padding: "10px 16px", background: "rgba(176,141,87,0.12)",
        borderBottom: "1px solid rgba(176,141,87,0.2)",
        textDecoration: "none", fontSize: 12, fontWeight: 600,
      }}>
        <span style={{ color: "rgba(232,224,212,0.6)" }}>🔑 {t.guestBanner}</span>
        <span style={{ color: accent, fontWeight: 700 }}>{t.guestLink}</span>
      </a>

      {/* Nav */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", maxWidth: 920, margin: "0 auto" }}>
        <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 700, letterSpacing: 1, color: "#fff" }}>
          ENDI<span style={{ color: accent }}>HOMES</span>
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          {["sv", "en"].map(l => (
            <button key={l} onClick={() => setLang(l)} style={{
              padding: "6px 12px", fontSize: 12, fontWeight: 700, borderRadius: 8, cursor: "pointer",
              fontFamily: "'Outfit',sans-serif", letterSpacing: 0.5,
              color: lang === l ? "#fff" : "rgba(232,224,212,0.45)",
              background: lang === l ? "rgba(176,141,87,0.3)" : "transparent",
              border: `1.5px solid ${lang === l ? "rgba(176,141,87,0.5)" : "rgba(255,255,255,0.08)"}`,
              transition: "all 0.3s",
            }}>
              {l === "sv" ? "🇸🇪 SV" : "🇬🇧 EN"}
            </button>
          ))}
        </div>
      </nav>

      {/* HERO */}
      <header style={{
        position: "relative", padding: "56px 24px 64px", textAlign: "center", overflow: "hidden",
        ...(heroImg
          ? { backgroundImage: `linear-gradient(165deg, rgba(26,23,20,0.55) 0%, rgba(21,18,16,0.9) 100%), url(${heroImg})`, backgroundSize: "cover", backgroundPosition: "center" }
          : { background: "linear-gradient(165deg,#2a2520 0%,#1a1714 60%,#151210 100%)" }),
        opacity: loaded ? 1 : 0, transition: "opacity 1.2s cubic-bezier(.22,1,.36,1)",
      }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 50% at 50% 30%,rgba(176,141,87,0.08) 0%,transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 680, margin: "0 auto" }}>
          <div style={{
            display: "inline-block", fontSize: 10, fontWeight: 700, letterSpacing: 3.5, color: accent,
            marginBottom: 20, padding: "6px 16px", border: "1px solid rgba(176,141,87,0.25)", borderRadius: 20,
            opacity: loaded ? 1 : 0, transition: "all 1s 0.3s cubic-bezier(.22,1,.36,1)",
          }}>{t.heroTag}</div>
          <h1 style={{
            fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(40px, 9vw, 64px)", fontWeight: 600,
            color: "#fff", margin: "0 0 14px", lineHeight: 1.05, letterSpacing: 1,
            opacity: loaded ? 1 : 0, transform: loaded ? "none" : "translateY(24px)",
            transition: "all 1s 0.5s cubic-bezier(.22,1,.36,1)",
          }}>Spelmansgatan 18</h1>
          <p style={{
            fontSize: 16, fontWeight: 300, color: "rgba(232,224,212,0.65)", margin: "0 0 28px", lineHeight: 1.6,
            opacity: loaded ? 1 : 0, transition: "all 1s 0.7s cubic-bezier(.22,1,.36,1)",
          }}>{t.heroSub}</p>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 16, flexWrap: "wrap", marginBottom: 30,
            opacity: loaded ? 1 : 0, transition: "all 1s 0.9s cubic-bezier(.22,1,.36,1)",
          }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 13, color: "rgba(232,224,212,0.5)" }}>{t.from}</span>
              <span style={{ fontSize: 32, fontWeight: 800, color: "#fff", fontFamily: "'Outfit',sans-serif" }}>{BOOKING.fromPrice}</span>
              <span style={{ fontSize: 13, color: "rgba(232,224,212,0.5)" }}>{t.perNight}</span>
            </div>
            <span style={{ color: "rgba(176,141,87,0.5)" }}>·</span>
            <span style={{ fontSize: 13, color: "rgba(232,224,212,0.5)" }}>{t.upTo} {BOOKING.maxGuests} {t.guestsWord}</span>
          </div>
          <button onClick={scrollToForm} className="bp-cta" style={{
            margin: "0 auto",
            opacity: loaded ? 1 : 0, transition: "opacity 1s 1.1s cubic-bezier(.22,1,.36,1), transform 0.25s, box-shadow 0.25s",
          }}>{t.cta} →</button>
        </div>
      </header>

      {/* Trust-rad */}
      <Reveal delay={0.1}>
        <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap", padding: "20px 16px 0", maxWidth: 920, margin: "0 auto" }}>
          {[
            BOOKING.rating ? `★ ${BOOKING.rating} ${t.trustOn}` : null,
            t.trustReply,
            t.trustPrice,
          ].filter(Boolean).map((s, i) => (
            <span key={i} style={{
              fontSize: 12, fontWeight: 600, color: "rgba(232,224,212,0.55)",
              padding: "8px 16px", borderRadius: 20,
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
            }}>{s}</span>
          ))}
        </div>
      </Reveal>

      {/* Bildgalleri — visas bara om PHOTOS har bilder */}
      {PHOTOS.length > 1 && (
        <Reveal delay={0.1}>
          <section style={{ padding: "32px 16px 0", maxWidth: 920, margin: "0 auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8 }}>
              {PHOTOS.slice(1, 7).map((src, i) => (
                <img key={i} src={src} alt="" loading="lazy" style={{
                  width: "100%", aspectRatio: "4/3", objectFit: "cover", borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.06)",
                }} />
              ))}
            </div>
          </section>
        </Reveal>
      )}

      {/* Om boendet + bekvämligheter */}
      <Reveal delay={0.1}>
        <section style={{ padding: "44px 20px 0", maxWidth: 680, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, fontWeight: 600, color: "#fff", margin: "0 0 14px" }}>{t.aboutTitle}</h2>
          <p style={{ fontSize: 15, color: "rgba(232,224,212,0.6)", lineHeight: 1.8, margin: "0 0 22px" }}>{t.aboutText}</p>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2.5, color: "rgba(176,141,87,0.6)", marginBottom: 12 }}>{t.amenitiesTitle.toUpperCase()}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {t.amenities.map((a, i) => (
              <span key={i} style={{
                fontSize: 13, fontWeight: 500, color: "rgba(232,224,212,0.7)",
                padding: "8px 14px", borderRadius: 10,
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
              }}>{a}</span>
            ))}
          </div>
        </section>
      </Reveal>

      {/* Varför boka direkt */}
      <Reveal delay={0.1}>
        <section style={{ padding: "48px 20px 0", maxWidth: 920, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, fontWeight: 600, color: "#fff", margin: "0 0 20px", textAlign: "center" }}>{t.whyTitle}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
            {[
              { icon: "◈", title: t.why1t, desc: t.why1d },
              { icon: "☏", title: t.why2t, desc: t.why2d },
              { icon: "✧", title: t.why3t, desc: t.why3d },
            ].map((c, i) => (
              <div key={i} className="bp-card" style={{ padding: "22px 20px" }}>
                <div style={{ fontSize: 22, color: accent, marginBottom: 10 }}>{c.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 6 }}>{c.title}</div>
                <div style={{ fontSize: 13, color: "rgba(232,224,212,0.55)", lineHeight: 1.65 }}>{c.desc}</div>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* BOKNINGSFÖRFRÅGAN */}
      <Reveal delay={0.1}>
        <section id="booking-form" style={{ padding: "52px 20px 0", maxWidth: 560, margin: "0 auto", scrollMarginTop: 20 }}>
          <div style={{
            borderRadius: 20, padding: "26px 22px",
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(176,141,87,0.2)",
            boxShadow: "0 16px 48px rgba(0,0,0,0.3)",
          }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 30, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>{t.formTitle}</h2>
            <p style={{ fontSize: 13, color: "rgba(232,224,212,0.5)", margin: "0 0 20px", lineHeight: 1.6 }}>{t.formHint}</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "rgba(176,141,87,0.7)", marginBottom: 6 }}>{t.checkin.toUpperCase()}</label>
                <input type="date" className="bp-input" value={ci} onChange={e => setCi(e.target.value)} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "rgba(176,141,87,0.7)", marginBottom: 6 }}>{t.checkout.toUpperCase()}</label>
                <input type="date" className="bp-input" value={co} min={ci || undefined} onChange={e => setCo(e.target.value)} />
              </div>
            </div>

            {nights > 0 && (
              <div style={{ textAlign: "center", fontSize: 13, fontWeight: 700, color: accent, marginBottom: 10 }}>
                {nights} {nights === 1 ? t.night : t.nights}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "rgba(176,141,87,0.7)", marginBottom: 6 }}>{t.guests.toUpperCase()}</label>
                <select className="bp-input" value={guests} onChange={e => setGuests(+e.target.value)}>
                  {Array.from({ length: BOOKING.maxGuests }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n} style={{ background: "#1a1714" }}>{n}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "rgba(176,141,87,0.7)", marginBottom: 6 }}>{t.name.toUpperCase()}</label>
                <input type="text" className="bp-input" placeholder={t.namePh} value={name} onChange={e => setName(e.target.value)} />
              </div>
            </div>

            <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "rgba(176,141,87,0.7)", marginBottom: 6 }}>{t.message.toUpperCase()}</label>
            <textarea className="bp-input" placeholder={t.messagePh} value={msg} onChange={e => setMsg(e.target.value)} style={{ marginBottom: 16 }} />

            <a href={ready ? mailHref : undefined} className="bp-cta" data-disabled={ready ? "false" : "true"} style={{ width: "100%", marginBottom: 8 }}>
              {t.sendEmail}
            </a>
            {waHref && (
              <a href={ready ? waHref : undefined} target="_blank" rel="noreferrer" className="bp-cta-sec" data-disabled={ready ? "false" : "true"} style={{ width: "100%", opacity: ready ? 1 : 0.45, pointerEvents: ready ? "auto" : "none" }}>
                {t.sendWa}
              </a>
            )}
            {!ready && (
              <p style={{ margin: "10px 0 0", fontSize: 11, color: "rgba(232,224,212,0.35)", textAlign: "center" }}>{t.fillFields}</p>
            )}
          </div>
        </section>
      </Reveal>

      {/* Recensioner — visas bara om REVIEWS har riktiga citat */}
      {REVIEWS.length > 0 && (
        <Reveal delay={0.1}>
          <section style={{ padding: "52px 20px 0", maxWidth: 920, margin: "0 auto" }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, fontWeight: 600, color: "#fff", margin: "0 0 20px", textAlign: "center" }}>{t.reviewsTitle}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
              {REVIEWS.map((r, i) => (
                <div key={i} className="bp-card" style={{ padding: "22px 20px" }}>
                  <p style={{ margin: "0 0 12px", fontFamily: "'Cormorant Garamond',serif", fontSize: 17, fontStyle: "italic", color: "rgba(232,224,212,0.75)", lineHeight: 1.6 }}>
                    “{r.text}”
                  </p>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(176,141,87,0.7)" }}>— {r.author}</span>
                </div>
              ))}
            </div>
          </section>
        </Reveal>
      )}

      {/* Läget */}
      <Reveal delay={0.1}>
        <section style={{ padding: "52px 20px 0", maxWidth: 680, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, fontWeight: 600, color: "#fff", margin: "0 0 10px" }}>{t.locTitle}</h2>
          <p style={{ fontSize: 14, color: "rgba(232,224,212,0.55)", margin: "0 0 18px", lineHeight: 1.7 }}>{t.locText}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
            {t.locItems.map((it, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "13px 16px", borderRadius: 10,
                background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)",
              }}>
                <span style={{ fontSize: 13, color: "rgba(232,224,212,0.7)" }}>{it.label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(176,141,87,0.7)" }}>{it.val}</span>
              </div>
            ))}
          </div>
          <a href="https://maps.google.com/?q=Spelmansgatan+18+Malmö" target="_blank" rel="noreferrer" className="bp-cta-sec" style={{ width: "100%" }}>
            ⊹ {t.mapBtn}
          </a>
        </section>
      </Reveal>

      {/* FOOTER */}
      <Reveal delay={0.1}>
        <footer style={{ textAlign: "center", padding: "56px 24px 48px", maxWidth: 680, margin: "0 auto" }}>
          <div style={{ width: 28, height: 1, background: "linear-gradient(90deg,transparent,rgba(176,141,87,0.3),transparent)", margin: "0 auto 24px" }} />
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 700, letterSpacing: 1, color: "#fff", marginBottom: 12 }}>
            ENDI<span style={{ color: accent }}>HOMES</span>
          </div>
          <div style={{ fontSize: 13, color: "rgba(232,224,212,0.45)", lineHeight: 2 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "rgba(176,141,87,0.5)", marginBottom: 4 }}>{t.footerContact.toUpperCase()}</div>
            <a href={`mailto:${HOST_EMAIL}`} style={{ color: "rgba(232,224,212,0.6)", textDecoration: "none" }}>{HOST_EMAIL}</a><br />
            <a href={`tel:${HOST_PHONE}`} style={{ color: "rgba(232,224,212,0.6)", textDecoration: "none" }}>{HOST_PHONE_DISPLAY}</a>
          </div>
          <div style={{ marginTop: 20 }}>
            <a href="/guide" style={{ fontSize: 12, color: "rgba(176,141,87,0.6)", textDecoration: "none", fontWeight: 600 }}>
              🔑 {t.footerGuide} →
            </a>
          </div>
          <p style={{ margin: "24px 0 0", fontSize: 11, color: "rgba(232,224,212,0.25)" }}>© {new Date().getFullYear()} EndiHomes · Malmö</p>
        </footer>
      </Reveal>
    </div>
  );
}
