import { useState, useEffect, useRef } from "react";
import { T, RULES, APPLIANCES, CHECKOUT, KEY_INFO, LOCAL, FALLBACK_ITEMS, getName } from "./i18n";
import {
  HOST_EMAIL, HOST_PHONE, HOST_PHONE_DISPLAY, HERO_IMAGE_URL,
  DIRECT_BOOKING, REPORT_ISSUE_URL, FEEDBACK_URL, GOOGLE_SHEET_CSV_URL, REVOLUT_URL,
} from "./config";

// ─── Säker lagring (fungerar live, kraschar inte i förhandsvisning) ───
const storage = {
  get(k) { try { return window.localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { window.localStorage.setItem(k, v); } catch { /* preview */ } },
};

function detectLang() {
  const saved = storage.get("eh_lang");
  if (saved && T[saved]) return saved;
  const nav = ((typeof navigator !== "undefined" && navigator.language) || "en").toLowerCase();
  if (nav.startsWith("sv")) return "sv";
  if (nav.startsWith("de")) return "de";
  if (nav.startsWith("da")) return "da";
  if (nav.startsWith("no") || nav.startsWith("nb") || nav.startsWith("nn")) return "no";
  return "en";
}

function parseCSV(csv) {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/['"]/g, ""));
  return lines.slice(1).map((line, i) => {
    const vals = line.split(",").map(v => v.trim().replace(/['"]/g, ""));
    const row = {};
    headers.forEach((h, j) => { row[h] = vals[j] || ""; });
    const multi = row.name_sv || row.name_en || row.name_de || row.name_da || row.name_no;
    const name = multi
      ? { sv: row.name_sv || row.name || "", en: row.name_en || row.name || "", de: row.name_de || row.name || "", da: row.name_da || row.name || "", no: row.name_no || row.name || "" }
      : (row.name || "");
    return { id: i + 1, name, price: parseInt(row.price) || 0, emoji: row.emoji || "📦", cat: (row.category || "extra").toLowerCase() };
  }).filter(item => {
    const n = typeof item.name === "string" ? item.name : (item.name.sv || item.name.en);
    return n && item.price > 0;
  });
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
    <div ref={ref} style={{ opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(20px)", transition: `opacity 0.7s ${delay}s cubic-bezier(.22,1,.36,1), transform 0.7s ${delay}s cubic-bezier(.22,1,.36,1)`, willChange: "opacity, transform" }}>
      {children}
    </div>
  );
}

function CopyBtn({ text, lang }) {
  const [ok, setOk] = useState(false);
  const t = T[lang];
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1800); }}
      className="copy-btn" data-copied={ok ? "true" : "false"}>
      {ok ? t.copied : t.copy}
    </button>
  );
}

function WeatherWidget({ lang, dark }) {
  const [w, setW] = useState(null);
  const t = T[lang];
  useEffect(() => {
    fetch("https://api.open-meteo.com/v1/forecast?latitude=55.6059&longitude=13.0007&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code&timezone=Europe/Stockholm")
      .then(r => r.json()).then(d => setW(d.current)).catch(() => {});
  }, []);
  const icon = (c) => {
    if (!c && c !== 0) return "🌡️";
    if (c === 0) return "☀️";
    if (c <= 3) return "⛅";
    if (c <= 48) return "🌫️";
    if (c <= 67) return "🌧️";
    if (c <= 77) return "🌨️";
    if (c <= 82) return "🌧️";
    if (c <= 86) return "🌨️";
    return "⛈️";
  };
  if (!w) return null;
  const bg = dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)";
  const border = dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const sub = dark ? "rgba(232,224,212,0.4)" : "rgba(58,48,40,0.45)";
  const main = dark ? "#e8e0d4" : "#2a2520";
  return (
    <div style={{ padding: "16px 18px", borderRadius: 14, background: bg, border: `1px solid ${border}`, marginBottom: 12 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2.5, color: sub, marginBottom: 12 }}>{t.weather.toUpperCase()}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 36 }}>{icon(w.weather_code)}</span>
          <span style={{ fontSize: 32, fontWeight: 700, color: main, fontFamily: "'Outfit',sans-serif" }}>{Math.round(w.temperature_2m)}°C</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
          <span style={{ fontSize: 11, color: sub }}>{t.feelsLike} {Math.round(w.apparent_temperature)}°</span>
          <span style={{ fontSize: 11, color: sub }}>{t.wind} {Math.round(w.wind_speed_10m)} km/h</span>
          <span style={{ fontSize: 11, color: sub }}>{t.humidity} {w.relative_humidity_2m}%</span>
        </div>
      </div>
    </div>
  );
}

// ─── Nedräkning till utcheckning ───
function nightsUntil(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr + "T10:00:00");
  if (isNaN(target)) return null;
  const diff = Math.ceil((target - new Date()) / 86400000);
  return diff < 0 ? null : diff;
}

function CountdownCard({ lang, dark, coDate, onClear }) {
  const t = T[lang];
  const n = nightsUntil(coDate);
  if (n === null) return null;
  const label = n === 0 ? t.cdToday : n === 1 ? t.cdTomorrow : null;
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 18px", borderRadius: 14, marginBottom: 12,
      background: "linear-gradient(135deg, rgba(176,141,87,0.12), rgba(176,141,87,0.05))",
      border: "1px solid rgba(176,141,87,0.25)",
    }}>
      {label ? (
        <span style={{ fontSize: 14, fontWeight: 700, color: "#b08d57", letterSpacing: 0.3 }}>{label}</span>
      ) : (
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "rgba(176,141,87,0.7)" }}>{t.cdTitle}</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: "#b08d57", fontFamily: "'Outfit',sans-serif" }}>{n}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: dark ? "rgba(232,224,212,0.6)" : "rgba(58,48,40,0.55)" }}>{n === 1 ? t.night : t.nights}</span>
        </div>
      )}
      <button onClick={onClear} aria-label="Clear" style={{ background: "none", border: "none", color: "rgba(176,141,87,0.5)", fontSize: 16, cursor: "pointer", padding: 4, lineHeight: 1 }}>✕</button>
    </div>
  );
}

// ─── Minibar ───
function Shop({ lang, dark }) {
  const t = T[lang];
  const [items, setItems] = useState(FALLBACK_ITEMS);
  const [loading, setLoading] = useState(!!GOOGLE_SHEET_CSV_URL);
  const [cart, setCart] = useState({});

  useEffect(() => {
    if (!GOOGLE_SHEET_CSV_URL) return;
    fetch(GOOGLE_SHEET_CSV_URL)
      .then(r => r.text())
      .then(csv => { const parsed = parseCSV(csv); if (parsed.length > 0) setItems(parsed); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const total = Object.entries(cart).reduce((s, [id, q]) => { const it = items.find(i => i.id === +id); return s + (it ? it.price * q : 0); }, 0);
  const count = Object.values(cart).reduce((s, q) => s + q, 0);
  const add = id => setCart(c => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const rem = id => setCart(c => { const n = { ...c }; if (n[id] > 1) n[id]--; else delete n[id]; return n; });
  const summary = Object.entries(cart).map(([id, q]) => { const it = items.find(i => i.id === +id); return `${q}x ${getName(it.name, lang)}`; }).join(", ");

  const catLabel = { drink: t.drinks, snack: t.snacks, extra: t.extras };
  const bg = dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)";
  const bgActive = dark ? "rgba(176,141,87,0.06)" : "rgba(176,141,87,0.08)";
  const borderNorm = dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
  const borderAct = dark ? "rgba(176,141,87,0.18)" : "rgba(176,141,87,0.25)";
  const txt = dark ? "#e8e0d4" : "#2a2520";
  const sub = dark ? "rgba(232,224,212,0.4)" : "rgba(58,48,40,0.45)";

  return (
    <div>
      <p style={{ margin: "0 0 18px", fontSize: 13, color: sub, lineHeight: 1.6 }}>{t.shopDesc}</p>
      {loading ? (
        <div style={{ textAlign: "center", padding: "24px 0", color: sub, fontSize: 13 }}>{t.loading}</div>
      ) : ["drink", "snack", "extra"].map(cat => {
        const catItems = items.filter(i => i.cat === cat);
        if (!catItems.length) return null;
        return (
          <div key={cat} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2.5, color: "rgba(176,141,87,0.55)", marginBottom: 10 }}>{catLabel[cat]}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {catItems.map(item => {
                const q = cart[item.id] || 0;
                return (
                  <div key={item.id} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "11px 14px", borderRadius: 10,
                    background: q > 0 ? bgActive : bg,
                    border: `1px solid ${q > 0 ? borderAct : borderNorm}`,
                    transition: "all 0.3s",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 20, flexShrink: 0 }}>{item.emoji}</span>
                      <span style={{ fontSize: 14, fontWeight: 500, color: txt, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{getName(item.name, lang)}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#b08d57", minWidth: 40, textAlign: "right" }}>{item.price}kr</span>
                      {q === 0 ? (
                        <button onClick={() => add(item.id)} className="shop-add-btn">+</button>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          <button onClick={() => rem(item.id)} className="shop-qty-btn">−</button>
                          <span style={{ width: 22, textAlign: "center", fontSize: 14, fontWeight: 700, color: txt }}>{q}</span>
                          <button onClick={() => add(item.id)} className="shop-qty-btn shop-qty-btn-fill">+</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {count > 0 && (
        <div className="cart-bar">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>{count} {count === 1 ? t.item : t.items}</span>
            <span style={{ fontSize: 24, fontWeight: 800, color: "#fff", fontFamily: "'Outfit',sans-serif" }}>{total} kr</span>
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", background: "rgba(0,0,0,0.15)", padding: "8px 12px", borderRadius: 8, wordBreak: "break-all", marginBottom: 10 }}>
            {summary}
          </div>
          <p style={{ margin: "0 0 10px", fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>{t.payNote}</p>
          <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: "14px", textAlign: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600, letterSpacing: 1 }}>{t.toPay}</span>
            <div style={{ fontSize: 36, fontWeight: 800, color: "#fff", fontFamily: "'Outfit',sans-serif", marginTop: 2 }}>{total} kr</div>
          </div>
          <a href={REVOLUT_URL} target="_blank" rel="noreferrer" className="revolut-btn">
            {t.payNow}
          </a>
        </div>
      )}
    </div>
  );
}

// ─── Boka direkt — din nya intäktskanal ───
function BookDirect({ lang }) {
  const t = T[lang];
  const [copied, setCopied] = useState(false);
  const code = DIRECT_BOOKING.discountCode;
  const mailHref = `mailto:${DIRECT_BOOKING.email}?subject=${encodeURIComponent(t.bdMailSubject + " " + code)}&body=${encodeURIComponent(t.bdMailBody + code)}`;
  const waHref = DIRECT_BOOKING.whatsapp ? `https://wa.me/${DIRECT_BOOKING.whatsapp}?text=${encodeURIComponent(t.bdMailSubject + " " + code)}` : null;

  return (
    <div style={{
      borderRadius: 16, padding: "22px 20px",
      background: "linear-gradient(145deg, #b08d57 0%, #8a6d3b 100%)",
      boxShadow: "0 8px 32px rgba(176,141,87,0.25)",
    }}>
      <h3 style={{ margin: "0 0 8px", fontFamily: "'Cormorant Garamond',serif", fontSize: 26, fontWeight: 600, color: "#fff", lineHeight: 1.2 }}>
        {t.bdHeadline}
      </h3>
      <p style={{ margin: "0 0 18px", fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.65 }}>
        {t.bdText}
      </p>
      <div style={{
        border: "2px dashed rgba(255,255,255,0.4)", borderRadius: 12,
        padding: "14px 16px", marginBottom: 14, textAlign: "center",
        background: "rgba(0,0,0,0.12)",
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "rgba(255,255,255,0.6)", marginBottom: 6 }}>{t.bdCodeLabel}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <span style={{ fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: 3, fontFamily: "'Outfit',sans-serif" }}>{code}</span>
          <button onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
            style={{
              padding: "6px 14px", fontSize: 11, fontWeight: 700, fontFamily: "'Outfit',sans-serif",
              color: copied ? "#8a6d3b" : "#fff", background: copied ? "#fff" : "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.35)", borderRadius: 8, cursor: "pointer",
              transition: "all 0.3s", letterSpacing: 0.8,
            }}>
            {copied ? t.copied : t.copy}
          </button>
        </div>
      </div>
      <a href={mailHref} style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        padding: 14, borderRadius: 12, background: "#fff",
        color: "#1a1a1a", fontSize: 15, fontWeight: 800, textDecoration: "none",
        fontFamily: "'Outfit',sans-serif", marginBottom: 8,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      }}>
        ✉ {t.bdContact}
      </a>
      {waHref && (
        <a href={waHref} target="_blank" rel="noreferrer" style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          padding: 13, borderRadius: 10, background: "rgba(0,0,0,0.18)",
          color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none",
          fontFamily: "'Outfit',sans-serif", border: "1px solid rgba(255,255,255,0.15)",
          marginBottom: 8,
        }}>
          WhatsApp
        </a>
      )}
      <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, textAlign: "center" }}>
        {t.bdHint}
      </p>
    </div>
  );
}

// ─── Huvudkomponent ───
const SECTIONS = [
  { id: "wifi", icon: "◐" },
  { id: "checkin", icon: "⬡" },
  { id: "shop", icon: "◈", badge: "star" },
  { id: "home", icon: "△" },
  { id: "rules", icon: "▣" },
  { id: "local", icon: "◎" },
  { id: "bookdirect", icon: "✧", badge: "gold" },
  { id: "checkout", icon: "◇" },
  { id: "emergency", icon: "✦" },
];

export default function GuestGuide() {
  const [lang, setLangState] = useState(detectLang);
  const [dark, setDarkState] = useState(() => storage.get("eh_dark") !== "0");
  const [open, setOpen] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [coDate, setCoDate] = useState(() => storage.get("eh_checkout") || "");
  useEffect(() => { setTimeout(() => setLoaded(true), 100); }, []);

  const t = T[lang];
  const setLang = (l) => { setLangState(l); storage.set("eh_lang", l); };
  const toggleDark = () => setDarkState(d => { storage.set("eh_dark", d ? "0" : "1"); return !d; });
  const saveCoDate = (v) => { setCoDate(v); storage.set("eh_checkout", v); };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? t.greetM : hour < 18 ? t.greetD : t.greetE;

  const sectionTitle = (id) => ({
    wifi: t.wifi, checkin: t.checkin, shop: t.shop, home: t.home, rules: t.rules,
    local: t.explore, bookdirect: t.bookDirect, checkout: t.checkoutTitle, emergency: t.emergency,
  }[id]);

  const accent = "#b08d57";
  const pageBg = dark ? "#1a1714" : "#faf6f1";
  const cardBg = dark ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.025)";
  const cardBgOpen = dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
  const cardBorder = dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)";
  const cardBorderOpen = dark ? "rgba(176,141,87,0.15)" : "rgba(176,141,87,0.25)";
  const txt = dark ? "#e8e0d4" : "#2a2520";
  const txtSub = dark ? "rgba(232,224,212,0.55)" : "rgba(58,48,40,0.5)";
  const txtFaint = dark ? "rgba(232,224,212,0.35)" : "rgba(58,48,40,0.3)";
  const iconDim = dark ? "rgba(232,224,212,0.3)" : "rgba(58,48,40,0.25)";
  const heroGradient = dark
    ? "linear-gradient(165deg,#2a2520 0%,#1a1714 60%,#151210 100%)"
    : "linear-gradient(165deg,#5c7a5e 0%,#3d5a40 50%,#2c4230 100%)";
  const heroStyle = HERO_IMAGE_URL
    ? { backgroundImage: `linear-gradient(165deg, rgba(26,23,20,0.5) 0%, rgba(21,18,16,0.85) 100%), url(${HERO_IMAGE_URL})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: heroGradient };
  const wifiBorder = dark ? "rgba(176,141,87,0.1)" : "rgba(176,141,87,0.15)";
  const wifiBg = dark ? "rgba(176,141,87,0.03)" : "rgba(176,141,87,0.05)";
  const alertBg = dark ? "rgba(176,141,87,0.05)" : "rgba(176,141,87,0.07)";
  const alertBorder = dark ? "rgba(176,141,87,0.1)" : "rgba(176,141,87,0.15)";
  const emBg = dark ? "rgba(201,123,90,0.04)" : "rgba(201,123,90,0.06)";
  const emBorder = dark ? "rgba(201,123,90,0.08)" : "rgba(201,123,90,0.12)";

  const typeLabel = (type) => ({
    sightseeing: t.sightseeing, shopping: t.shopping, food: t.food, grocery: t.grocery, pharmacy: t.pharmacy,
  }[type] || type).toUpperCase();

  const reportHref = REPORT_ISSUE_URL || `mailto:${HOST_EMAIL}?subject=${encodeURIComponent(t.reportSubject)}`;
  const feedbackHref = FEEDBACK_URL || `mailto:${HOST_EMAIL}?subject=${encodeURIComponent(t.feedbackSubject)}`;

  return (
    <div style={{ minHeight: "100vh", background: pageBg, fontFamily: "'Outfit',sans-serif", color: txt, overflowX: "hidden", WebkitFontSmoothing: "antialiased", transition: "background 0.5s, color 0.5s" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
        html{scroll-behavior:smooth;-webkit-overflow-scrolling:touch}
        body{scroll-behavior:smooth;overscroll-behavior:none}
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
        a:active,button:active{transform:scale(0.97)!important}
        input[type="checkbox"]{accent-color:#b08d57;width:18px;height:18px;cursor:pointer}
        input[type="date"]{font-family:'Outfit',sans-serif;padding:10px 14px;border-radius:10px;border:1.5px solid rgba(176,141,87,0.3);background:transparent;color:inherit;font-size:14px;width:100%;outline:none}
        input[type="date"]:focus{border-color:#b08d57}
        .copy-btn{padding:6px 14px;font-size:11px;font-weight:700;font-family:'Outfit',sans-serif;color:#b08d57;background:transparent;border:1.5px solid rgba(176,141,87,0.35);border-radius:8px;cursor:pointer;transition:all 0.3s cubic-bezier(.22,1,.36,1);letter-spacing:0.8px}
        .copy-btn[data-copied="true"]{color:#fff;background:#b08d57;border-color:#b08d57}
        .copy-btn:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(176,141,87,0.2)}
        .shop-add-btn{width:32px;height:32px;border-radius:9px;border:1.5px solid rgba(176,141,87,0.25);background:transparent;color:#b08d57;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:'Outfit',sans-serif;line-height:1;transition:all 0.25s cubic-bezier(.22,1,.36,1)}
        .shop-add-btn:hover{background:rgba(176,141,87,0.08);transform:scale(1.05)}
        .shop-qty-btn{width:28px;height:28px;border-radius:7px;border:1px solid rgba(176,141,87,0.2);background:transparent;color:#b08d57;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:'Outfit',sans-serif;transition:all 0.2s}
        .shop-qty-btn-fill{background:rgba(176,141,87,0.12)}
        .cart-bar{margin-top:6px;padding:18px;border-radius:16px;background:linear-gradient(145deg,#b08d57 0%,#8a6d3b 100%);box-shadow:0 8px 32px rgba(176,141,87,0.25);animation:fadeUp 0.5s cubic-bezier(.22,1,.36,1)}
        .revolut-btn{display:flex;align-items:center;justify-content:center;padding:15px;border-radius:12px;background:#fff;color:#1a1a1a;font-size:15px;font-weight:800;text-decoration:none;font-family:'Outfit',sans-serif;transition:all 0.25s cubic-bezier(.22,1,.36,1);box-shadow:0 4px 12px rgba(0,0,0,0.15)}
        .revolut-btn:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(0,0,0,0.25)}
        .lang-btn{width:36px;height:36px;font-size:17px;border-radius:10px;cursor:pointer;font-family:'Outfit',sans-serif;transition:all 0.3s cubic-bezier(.22,1,.36,1);border:1.5px solid transparent;display:flex;align-items:center;justify-content:center;background:transparent;padding:0}
        .theme-toggle{width:36px;height:36px;border-radius:10px;border:1.5px solid rgba(255,255,255,0.15);background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;transition:all 0.4s cubic-bezier(.22,1,.36,1);color:rgba(255,255,255,0.7)}
        .theme-toggle:hover{transform:rotate(15deg)}
        .section-card{transition:background 0.4s cubic-bezier(.22,1,.36,1),border 0.4s cubic-bezier(.22,1,.36,1),transform 0.3s cubic-bezier(.22,1,.36,1)}
        .section-card:hover{transform:translateY(-1px)}
        .quick-action{transition:all 0.25s cubic-bezier(.22,1,.36,1)}
        .quick-action:hover{transform:translateY(-2px);box-shadow:0 6px 16px rgba(0,0,0,0.08)}
        .place-card{transition:all 0.25s cubic-bezier(.22,1,.36,1)}
        .place-card:hover{transform:translateY(-1px);border-color:rgba(176,141,87,0.3)!important;box-shadow:0 4px 12px rgba(0,0,0,0.06)}
        .util-btn{display:flex;align-items:center;justify-content:center;gap:8px;padding:13px;border-radius:10px;font-size:13px;font-weight:700;text-decoration:none;font-family:'Outfit',sans-serif;transition:all 0.25s cubic-bezier(.22,1,.36,1);border:1.5px solid rgba(176,141,87,0.25);color:#b08d57;background:transparent}
        .util-btn:hover{background:rgba(176,141,87,0.06);transform:translateY(-1px)}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @media (prefers-reduced-motion:reduce){
          html,body{scroll-behavior:auto}
          *{animation-duration:0.01ms!important;transition-duration:0.01ms!important}
        }
      `}</style>

      {/* HERO */}
      <header style={{
        position: "relative", padding: "24px 20px 32px", textAlign: "center",
        overflow: "hidden", ...heroStyle,
        opacity: loaded ? 1 : 0, transition: "opacity 1.2s cubic-bezier(.22,1,.36,1)",
      }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 50% at 50% 25%,rgba(176,141,87,0.07) 0%,transparent 70%)", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 2, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div style={{ display: "flex", gap: 4 }}>
            {[["sv", "🇸🇪"], ["en", "🇬🇧"], ["de", "🇩🇪"], ["da", "🇩🇰"], ["no", "🇳🇴"]].map(([l, flag]) => (
              <button key={l} className="lang-btn" aria-label={l} onClick={() => setLang(l)}
                style={{
                  background: lang === l ? "rgba(176,141,87,0.35)" : "transparent",
                  borderColor: lang === l ? "rgba(176,141,87,0.6)" : "rgba(255,255,255,0.1)",
                  filter: lang === l ? "none" : "saturate(0.5) opacity(0.7)",
                }}>
                {flag}
              </button>
            ))}
          </div>
          <button className="theme-toggle" onClick={toggleDark}>
            {dark ? "☀️" : "🌙"}
          </button>
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{
            display: "inline-block", fontSize: 10, fontWeight: 700, letterSpacing: 3.5,
            color: dark || HERO_IMAGE_URL ? "#b08d57" : "rgba(255,255,255,0.8)", marginBottom: 18,
            padding: "6px 16px", border: `1px solid ${dark || HERO_IMAGE_URL ? "rgba(176,141,87,0.2)" : "rgba(255,255,255,0.25)"}`, borderRadius: 20,
            opacity: loaded ? 1 : 0, transform: loaded ? "none" : "scale(0.85)",
            transition: "all 1s 0.3s cubic-bezier(.22,1,.36,1)",
          }}>{t.badge}</div>

          <h1 style={{
            fontFamily: "'Cormorant Garamond',serif", fontSize: 44, fontWeight: 600,
            color: "#fff", margin: "0 0 8px", letterSpacing: 1, lineHeight: 1.1,
            opacity: loaded ? 1 : 0, transform: loaded ? "none" : "translateY(20px)",
            transition: "all 1s 0.5s cubic-bezier(.22,1,.36,1)",
          }}>Spelmansgatan 18</h1>

          <p style={{
            fontSize: 15, fontWeight: 300, color: "rgba(255,255,255,0.7)", margin: 0, letterSpacing: 2,
            opacity: loaded ? 1 : 0, transition: "all 1s 0.7s cubic-bezier(.22,1,.36,1)",
          }}>{greeting}</p>

          <div style={{
            height: 1, background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)",
            margin: "22px auto", width: loaded ? 48 : 0, transition: "width 1s 0.9s cubic-bezier(.22,1,.36,1)",
          }} />

          <div style={{
            display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap",
            fontSize: 11, fontWeight: 600, letterSpacing: 2.5, color: "rgba(255,255,255,0.5)",
            opacity: loaded ? 1 : 0, transition: "all 0.8s 1.1s cubic-bezier(.22,1,.36,1)",
          }}>
            <span>{t.in} 15:00</span>
            <span style={{ color: accent }}>·</span>
            <span>{t.out} 10:00</span>
            <span style={{ color: accent }}>·</span>
            <span>{t.max} 5 {t.guests}</span>
          </div>
        </div>
      </header>

      {/* NEDRÄKNING + VÄDER + SNABBKNAPPAR */}
      <div style={{ padding: "16px 16px 0", position: "relative", zIndex: 2, maxWidth: 560, margin: "0 auto" }}>
        <Reveal delay={0.05}>
          <CountdownCard lang={lang} dark={dark} coDate={coDate} onClear={() => saveCoDate("")} />
        </Reveal>
        <Reveal delay={0.1}>
          <WeatherWidget lang={lang} dark={dark} />
        </Reveal>
        <Reveal delay={0.15}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
            {[
              { href: `tel:${HOST_PHONE}`, icon: "☏", label: t.call },
              { href: "https://maps.google.com/?q=Spelmansgatan+18+Malmö", icon: "⊹", label: t.map, tgt: "_blank" },
              { href: "tel:112", icon: "⚠", label: "112", em: true },
            ].map((a, i) => (
              <a key={i} href={a.href} target={a.tgt} rel="noreferrer" className="quick-action" style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                padding: "16px 4px", borderRadius: 14,
                background: a.em ? emBg : cardBg, border: `1px solid ${a.em ? emBorder : cardBorder}`,
                textDecoration: "none", color: txt,
              }}>
                <span style={{ fontSize: 20, lineHeight: 1 }}>{a.icon}</span>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5 }}>{a.label}</span>
              </a>
            ))}
          </div>
        </Reveal>
      </div>

      {/* SEKTIONER */}
      <main style={{ padding: "24px 16px", display: "flex", flexDirection: "column", gap: 10, maxWidth: 560, margin: "0 auto" }}>
        {SECTIONS.map((sec, i) => (
          <Reveal key={sec.id} delay={0.06 * i}>
            <div className="section-card" style={{
              borderRadius: 16, overflow: "hidden",
              background: open === sec.id ? cardBgOpen : cardBg,
              border: `1px solid ${open === sec.id ? cardBorderOpen : cardBorder}`,
            }}>
              <button onClick={() => setOpen(o => o === sec.id ? null : sec.id)} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                width: "100%", padding: "18px 20px", background: "none", border: "none",
                cursor: "pointer", color: txt, fontFamily: "'Outfit',sans-serif", textAlign: "left",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ fontSize: 17, color: open === sec.id ? accent : iconDim, transition: "color 0.4s" }}>{sec.icon}</span>
                  <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: 0.3 }}>{sectionTitle(sec.id)}</span>
                  {sec.badge === "star" && <span style={{ fontSize: 9, fontWeight: 700, color: accent, background: "rgba(176,141,87,0.1)", padding: "2px 8px", borderRadius: 5 }}>★</span>}
                  {sec.badge === "gold" && <span style={{ fontSize: 9, fontWeight: 800, color: "#fff", background: "linear-gradient(135deg,#b08d57,#8a6d3b)", padding: "3px 9px", borderRadius: 5, letterSpacing: 0.5 }}>{t.bdBadge}</span>}
                </div>
                <span style={{ fontSize: 22, fontWeight: 300, color: "rgba(176,141,87,0.35)", transition: "transform 0.4s cubic-bezier(.22,1,.36,1)", transform: open === sec.id ? "rotate(45deg)" : "none" }}>+</span>
              </button>

              <div style={{ maxHeight: open === sec.id ? 5000 : 0, overflow: "hidden", transition: "max-height 0.6s cubic-bezier(.22,1,.36,1)" }}>
                <div style={{ padding: "0 20px 22px" }}>

                  {sec.id === "wifi" && (
                    <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${wifiBorder}`, background: wifiBg }}>
                      {[{ l: t.network, v: "Family H" }, { l: t.password, v: "12345678" }].map((r, j) => (
                        <div key={j} style={{ padding: "14px 16px", borderTop: j ? `1px solid ${wifiBorder}` : "none", display: "flex", flexDirection: "column", gap: 8 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "rgba(176,141,87,0.55)" }}>{r.l}</span>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                            <code style={{ fontSize: 18, fontWeight: 700, color: txt, fontFamily: "'Outfit',sans-serif", letterSpacing: 0.5 }}>{r.v}</code>
                            <CopyBtn text={r.v} lang={lang} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {sec.id === "checkin" && (
                    <div>
                      <div style={{ display: "flex", gap: 14, padding: 18, background: alertBg, borderRadius: 12, border: `1px solid ${alertBorder}` }}>
                        <span style={{ fontSize: 26, flexShrink: 0 }}>🔐</span>
                        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: txtSub }}>{KEY_INFO[lang]}</p>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
                        {[{ l: t.checkInTime, v: "15:00", n: t.orLater }, { l: t.checkOutTime, v: "10:00", n: t.atLatest }].map((ti, j) => (
                          <div key={j} style={{
                            display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 12px",
                            background: cardBg, borderRadius: 12, border: `1px solid ${cardBorder}`,
                          }}>
                            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: "rgba(176,141,87,0.5)" }}>{ti.l}</span>
                            <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 36, fontWeight: 600, color: txt, margin: "4px 0" }}>{ti.v}</span>
                            <span style={{ fontSize: 12, color: txtFaint }}>{ti.n}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: 14, padding: "16px", borderRadius: 12, background: cardBg, border: `1px solid ${cardBorder}` }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: txt, marginBottom: 4 }}>{t.cdSet}</div>
                        <div style={{ fontSize: 12, color: txtFaint, marginBottom: 10 }}>{t.cdSetHint}</div>
                        <input type="date" value={coDate} onChange={e => saveCoDate(e.target.value)} style={{ colorScheme: dark ? "dark" : "light" }} />
                      </div>
                    </div>
                  )}

                  {sec.id === "shop" && <Shop lang={lang} dark={dark} />}

                  {sec.id === "home" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {(APPLIANCES[lang] || APPLIANCES.en).map((a, j) => (
                        <div key={j} style={{ padding: "14px 16px", borderRadius: 10, background: cardBg, border: `1px solid ${cardBorder}`, display: "flex", flexDirection: "column", gap: 4 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 20 }}>{a.icon}</span>
                            <span style={{ fontSize: 14, fontWeight: 700, color: txt }}>{a.label}</span>
                          </div>
                          <p style={{ margin: "6px 0 0 30px", fontSize: 13, color: txtSub, lineHeight: 1.6 }}>{a.desc}</p>
                        </div>
                      ))}
                      <a href={reportHref} target={REPORT_ISSUE_URL ? "_blank" : undefined} rel="noreferrer" className="util-btn" style={{ marginTop: 6 }}>
                        🔧 {t.reportIssue}
                      </a>
                    </div>
                  )}

                  {sec.id === "rules" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {(RULES[lang] || RULES.en).map((r, j) => (
                        <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                          <span style={{ color: accent, fontSize: 7, marginTop: 7, flexShrink: 0 }}>●</span>
                          <span style={{ fontSize: 14, color: txtSub, lineHeight: 1.6 }}>{r}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {sec.id === "local" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {(LOCAL[lang] || LOCAL.en).map((p, j) => {
                        const query = encodeURIComponent(`${p.name}, Malmö, Sweden`);
                        const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${query}&travelmode=driving`;
                        return (
                          <a key={j} href={mapsUrl} target="_blank" rel="noreferrer" className="place-card" style={{
                            padding: "14px 16px", borderRadius: 10, background: cardBg, border: `1px solid ${cardBorder}`,
                            display: "flex", flexDirection: "column", gap: 4,
                            textDecoration: "none", color: "inherit", cursor: "pointer",
                          }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 14, fontWeight: 600, color: txt }}>{p.name}</span>
                              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: accent, background: "rgba(176,141,87,0.08)", padding: "3px 9px", borderRadius: 5, flexShrink: 0 }}>{typeLabel(p.type)}</span>
                            </div>
                            <span style={{ fontSize: 13, color: txtSub, lineHeight: 1.5 }}>{p.note}</span>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
                              <span style={{ fontSize: 12, color: txtFaint }}>🚗 {p.dist}</span>
                              <span style={{ fontSize: 11, color: accent, fontWeight: 600, letterSpacing: 0.5 }}>{t.getDirections} →</span>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  )}

                  {sec.id === "bookdirect" && <BookDirect lang={lang} />}

                  {sec.id === "checkout" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {(CHECKOUT[lang] || CHECKOUT.en).map((c, j) => (
                        <label key={j} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                          <input type="checkbox" />
                          <span style={{ fontSize: 14, color: txtSub, lineHeight: 1.5 }}>{c}</span>
                        </label>
                      ))}
                      <div style={{ marginTop: 8, padding: "16px", borderRadius: 12, background: cardBg, border: `1px solid ${cardBorder}`, textAlign: "center" }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: txt, marginBottom: 10 }}>{t.feedbackQ}</div>
                        <a href={feedbackHref} target={FEEDBACK_URL ? "_blank" : undefined} rel="noreferrer" className="util-btn">
                          💬 {t.feedbackBtn}
                        </a>
                      </div>
                    </div>
                  )}

                  {sec.id === "emergency" && (
                    <div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                        {[
                          { l: t.emergencyNum, v: "112", h: "tel:112" },
                          { l: t.healthAdvice, v: "1177", h: "tel:1177" },
                          { l: t.host, v: HOST_PHONE_DISPLAY, h: `tel:${HOST_PHONE}` },
                        ].map((e, j) => (
                          <div key={j} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderRadius: 10, background: emBg, border: `1px solid ${emBorder}` }}>
                            <span style={{ fontSize: 13, color: txtSub }}>{e.l}</span>
                            <a href={e.h} style={{ fontSize: 16, fontWeight: 800, color: "#c97b5a", textDecoration: "none", fontFamily: "'Outfit',sans-serif" }}>{e.v}</a>
                          </div>
                        ))}
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: txtFaint, lineHeight: 1.7, padding: "14px 16px", background: cardBg, borderRadius: 10, border: `1px solid ${cardBorder}` }}>
                        {t.safetyNote}
                      </p>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </main>

      {/* FOOTER */}
      <Reveal delay={0.2}>
        <footer style={{ textAlign: "center", padding: "16px 24px 56px", maxWidth: 560, margin: "0 auto" }}>
          <div style={{ width: 28, height: 1, background: "linear-gradient(90deg,transparent,rgba(176,141,87,0.3),transparent)", margin: "0 auto 24px" }} />
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 500, color: txtSub, margin: "0 0 4px", fontStyle: "italic" }}>
            {t.footer}
          </p>
          <a href="/" style={{ fontSize: 14, color: txtFaint, textDecoration: "none" }}>— Endrit · endihomes.com</a>
        </footer>
      </Reveal>
    </div>
  );
}
