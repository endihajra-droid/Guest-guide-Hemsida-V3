// ╔══════════════════════════════════════════════════════════════╗
// ║  ENDIHOMES — ALLA DINA INSTÄLLNINGAR PÅ ETT STÄLLE            ║
// ║  Det här är den ENDA filen du normalt behöver ändra i.        ║
// ╚══════════════════════════════════════════════════════════════╝

// ─── KONTAKT ────────────────────────────────────────────────────
export const HOST_EMAIL = "info@endihomes.com"; // ← ÄNDRA till din riktiga e-post (tips: Namecheap har gratis vidarebefordran för @endihomes.com)
export const HOST_PHONE = "+46762811051";
export const HOST_PHONE_DISPLAY = "+46 76 281 1051";
export const WHATSAPP = "46762811051"; // wa.me-format: landskod utan + (lämna "" för att dölja WhatsApp-knappar)

// ─── BILDER ─────────────────────────────────────────────────────
// Ladda upp foton till "public"-mappen i GitHub-repot och lista dem här.
// Exempel: export const PHOTOS = ["/vardagsrum.jpg", "/kok.jpg", "/sovrum.jpg"];
// Första bilden används som stor hero-bild på bokningssidan.
export const PHOTOS = []; // ← ÄNDRA: lägg till dina foton! Bokningssidan blir 10x bättre med bilder.

// Hero-bild för GÄSTGUIDEN (kan vara samma som PHOTOS[0]). Lämna "" för gradient.
export const HERO_IMAGE_URL = "";

// ─── BOKNINGSSIDAN ──────────────────────────────────────────────
export const BOOKING = {
  fromPrice: 1295,      // ← ÄNDRA: ditt från-pris per natt i kr
  maxGuests: 5,
  rating: "",           // ← ÄNDRA: ditt Airbnb-betyg, t.ex. "4,9" (lämna "" för att dölja)
  reviewCount: "",      // ← ÄNDRA: antal recensioner, t.ex. "120" (lämna "" för att dölja)
};

// Gästcitat på bokningssidan.
// ⚠️ VIKTIGT: Ersätt exemplen nedan med RIKTIGA citat från dina
// Airbnb-recensioner innan du publicerar. Hitta aldrig på recensioner.
export const REVIEWS = [
  // { text: "Klistra in ett riktigt citat från en Airbnb-recension här.", author: "Anna, Tyskland" },
  // { text: "Ett till riktigt citat.", author: "Lars, Danmark" },
];

// ─── DIREKTBOKNING / RABATT (visas i gästguiden) ────────────────
export const DIRECT_BOOKING = {
  discountCode: "DIREKT10",   // ← ÄNDRA om du vill ha annan kod
  email: HOST_EMAIL,
  whatsapp: WHATSAPP,
};

// ─── FELANMÄLAN & FEEDBACK ──────────────────────────────────────
// Skapa gärna Google Forms och klistra in länkarna här.
// Lämnas de tomma öppnas istället ett färdigskrivet mejl till dig.
export const REPORT_ISSUE_URL = ""; // t.ex. "https://forms.gle/..."
export const FEEDBACK_URL = "";     // t.ex. "https://forms.gle/..."

// ─── MINIBAR (Google Sheets) ────────────────────────────────────
// Publicera ett Google Sheet som CSV och klistra in länken.
// Kolumner: name,price,emoji,category
// Eller flerspråkigt: name_sv,name_en,name_de,name_da,name_no,price,emoji,category
// category = drink, snack eller extra
export const GOOGLE_SHEET_CSV_URL = "";

// ─── BETALNING ──────────────────────────────────────────────────
export const REVOLUT_URL = "https://revolut.me/endritttt6";
