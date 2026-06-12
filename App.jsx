import GuestGuide from "./GuestGuide";
import BookingPage from "./BookingPage";

// ─────────────────────────────────────────────
//  ROUTER
//  endihomes.com        → Bokningssidan (för nya gäster)
//  endihomes.com/guide  → Gästguiden (QR-koden i hemmet)
// ─────────────────────────────────────────────
export default function App() {
  const path = window.location.pathname.replace(/\/+$/, "");
  if (path === "/guide" || path.startsWith("/guide/")) return <GuestGuide />;
  return <BookingPage />;
}
