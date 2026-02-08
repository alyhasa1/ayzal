import { useMemo } from "react";

const WHATSAPP_E164 = "923264980404";

function buildWhatsAppUrl() {
  const base = `https://wa.me/${WHATSAPP_E164}`;
  const text = encodeURIComponent(
    "Assalam o Alaikum! I need help with my Ayzal Collections order."
  );
  return `${base}?text=${text}`;
}

export default function WhatsAppBubble() {
  const href = useMemo(() => buildWhatsAppUrl(), []);

  return (
    <div className="fixed bottom-5 right-5 z-[170]">
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="whatsapp-bubble group"
        aria-label="Chat with us on WhatsApp"
      >
        <span className="whatsapp-bubble__ping" />
        <span className="whatsapp-bubble__button">
          <img
            src="/whatsapp.png"
            alt=""
            aria-hidden
            className="whatsapp-bubble__icon"
            loading="lazy"
          />
        </span>
        <span className="whatsapp-bubble__label">WhatsApp us</span>
      </a>
    </div>
  );
}
