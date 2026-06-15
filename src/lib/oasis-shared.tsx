import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";

const base = import.meta.env.BASE_URL;
export const oasisLogo = `${base}assets/oasis-logo.png`;

/* ---------------- i18n ---------------- */
export type Lang = "en" | "es";
export const LangCtx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: "en",
  setLang: () => {},
});
export const useLang = () => useContext(LangCtx);
export function t<T>(lang: Lang, en: T, es: T): T {
  return lang === "en" ? en : es;
}

/* ---------------- Scroll-visible hook ---------------- */
export function useScrollVisible(threshold = 0.06) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible] as const;
}

/* ---------------- SectionLabel ---------------- */
export function SectionLabel({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return (
    <div className={`flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground mb-5 ${center ? "justify-center" : ""}`}>
      <span className="size-1 rounded-full bg-accent" />
      {children}
    </div>
  );
}

/* ---------------- Nav ---------------- */
export function Nav({ go, scrolled }: { go?: (id: string) => void; scrolled?: boolean }) {
  const { lang, setLang } = useLang();

  const homeLinks = [
    { id: "work",     label: t(lang, "Work",     "Proyectos") },
    { id: "services", label: t(lang, "Services", "Servicios") },
    { id: "deck",     label: t(lang, "Deck",     "Sistema")   },
  ];

  const pageLinks = [
    { to: "/metrics"  as const, label: t(lang, "Metrics",  "Métricas") },
    { to: "/approach" as const, label: t(lang, "Approach", "Enfoque")  },
    { to: "/faq"      as const, label: "FAQ" },
  ];

  const handleHomeLink = (id: string) => {
    if (go) go(id);
    else window.location.href = `/#${id}`;
  };

  const handleContact = () => {
    if (go) go("contact");
    else window.location.href = "/#contact";
  };

  return (
    <header className="site-header fixed top-0 inset-x-0 z-50 py-4 transition-all duration-500">
      <div className="mx-auto max-w-6xl px-4 md:px-5">
        <nav className={`flex items-center justify-between rounded-full px-4 md:px-5 py-2.5 glass-strong transition-all duration-500 ${scrolled ? "nav-scrolled" : ""}`}>
          {go ? (
            <button onClick={() => go("home")} className="flex items-center">
              <img
                src={oasisLogo}
                alt="Oasis Studio"
                className={`h-7 md:h-8 w-auto transition-all duration-500 ${scrolled ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1 pointer-events-none"}`}
                style={{ filter: "invert(1) brightness(1.4)" }}
              />
            </button>
          ) : (
            <Link to="/" className="flex items-center">
              <img
                src={oasisLogo}
                alt="Oasis Studio"
                className="h-7 md:h-8 w-auto"
                style={{ filter: "invert(1) brightness(1.4)" }}
              />
            </Link>
          )}
          <ul className="hidden md:flex items-center gap-1">
            {homeLinks.map((l) => (
              <li key={l.id}>
                <button
                  onClick={() => handleHomeLink(l.id)}
                  className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-full"
                >
                  {l.label}
                </button>
              </li>
            ))}
            {pageLinks.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-full"
                  activeProps={{ className: "px-3 py-1.5 text-sm text-foreground rounded-full" }}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center rounded-full glass-subtle p-0.5 text-[10px] font-mono uppercase tracking-widest">
              {(["en", "es"] as Lang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-2.5 py-1 rounded-full transition-colors ${
                    lang === l ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
            <button
              onClick={handleContact}
              className="rounded-full bg-primary text-primary-foreground px-3.5 md:px-4 py-2 text-xs md:text-sm font-medium hover:opacity-90 transition-opacity"
            >
              {t(lang, "Start a project", "Empezar")}
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}

/* ---------------- Footer ---------------- */
export function Footer() {
  const { lang } = useLang();
  const cols = [
    {
      h: t(lang, "Navigation", "Navegación"),
      links: [
        { l: t(lang, "Home",    "Inicio"),    href: "/"          },
        { l: t(lang, "Services","Servicios"), href: "/#services" },
        { l: t(lang, "Work",    "Proyectos"), href: "/#work"     },
        { l: t(lang, "Contact", "Contacto"),  href: "/#contact"  },
      ],
    },
    {
      h: t(lang, "Services", "Servicios"),
      links: [
        { l: t(lang, "Branding",           "Branding"),               href: "/#services" },
        { l: t(lang, "Web Design",         "Diseño Web"),             href: "/#services" },
        { l: t(lang, "Content Management", "Gestión de Contenido"),   href: "/#services" },
      ],
    },
    {
      h: t(lang, "Connect", "Contacto"),
      links: [
        { l: "hello@oasisstudio.co", href: "mailto:hello@oasisstudio.co" },
        { l: "Instagram",            href: "https://instagram.com"        },
        { l: "LinkedIn",             href: "https://linkedin.com"         },
        { l: "Behance",              href: "https://behance.net"          },
      ],
    },
  ];
  return (
    <footer className="relative px-6 pt-16 pb-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-6">
          <div className="md:col-span-4">
            <img
              src={oasisLogo}
              alt="Oasis Studio"
              className="h-10 w-auto"
              style={{ filter: "invert(1) brightness(1.4)" }}
            />
            <p className="mt-5 max-w-xs text-sm text-muted-foreground leading-relaxed">
              {t(
                lang,
                "Boutique creative studio that transforms brands into extraordinary digital experiences.",
                "Estudio creativo boutique que transforma marcas en experiencias digitales extraordinarias."
              )}
            </p>
          </div>
          {cols.map((c) => (
            <div key={c.h} className="md:col-span-2 md:col-start-auto">
              <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-accent mb-4">
                {c.h}
              </div>
              <ul className="space-y-3">
                {c.links.map((l) => (
                  <li key={l.l}>
                    <a
                      href={l.href}
                      target={l.href.startsWith("http") ? "_blank" : undefined}
                      rel={l.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {l.l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-wrap justify-between gap-3 text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
          <span>© 2026 Oasis Studio. {t(lang, "All rights reserved.", "Todos los derechos reservados.")}</span>
          <a href="#" className="hover:text-foreground transition-colors">{t(lang, "Privacy Policy", "Política de privacidad")}</a>
        </div>
      </div>
    </footer>
  );
}

/* ---------------- Sub-page layout wrapper ---------------- */
export function SubPageLayout({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <LangCtx.Provider value={{ lang, setLang }}>
      <div className="relative z-10">
        <Nav scrolled={scrolled} />
        <main>
          {children}
          <Footer />
        </main>
      </div>
    </LangCtx.Provider>
  );
}
