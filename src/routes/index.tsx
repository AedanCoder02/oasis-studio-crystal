import { createFileRoute } from "@tanstack/react-router";
import { createContext, useContext, useEffect, useRef, useState } from "react";
const base = import.meta.env.BASE_URL;
const oasisLogo = `${base}assets/oasis-logo.png`;

/* Defers render to client — fixes SSR hydration / event-handler issues */
function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <>{children}</>;
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Oasis Studio — Designed for brands with something to say" },
      {
        name: "description",
        content:
          "Oasis Studio builds measurable reach for brands. Websites, social media, editorial direction, and digital infrastructure — operating as one system.",
      },
      { property: "og:title", content: "Oasis Studio" },
      {
        property: "og:description",
        content:
          "Websites, social media, editorial direction, and digital infrastructure — operating as a single system.",
      },
    ],
  }),
  component: Index,
});

/* ---------------- i18n ---------------- */
type Lang = "en" | "es";
const LangCtx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: "en",
  setLang: () => {},
});
const useLang = () => useContext(LangCtx);
function t<T>(lang: Lang, en: T, es: T): T {
  return lang === "en" ? en : es;
}

/* ---------------- Reveal-on-view hook ---------------- */
function useReveal<T extends HTMLElement>() {
  return useRef<T | null>(null);
}

function Reveal({
  children,
  delay,
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  delay?: 1 | 2 | 3 | 4;
  className?: string;
  as?: any;
}) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <Tag
      ref={ref as any}
      className={`reveal ${delay ? `reveal-d${delay}` : ""} ${className}`}
    >
      {children}
    </Tag>
  );
}

/* ---------------- Scroll-visible hook ---------------- */
function useScrollVisible(threshold = 0.06) {
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

/* ---------------- Nav ---------------- */
function Nav({ go, scrolled }: { go: (id: string) => void; scrolled: boolean }) {
  const { lang, setLang } = useLang();
  const links = [
    { id: "work", label: t(lang, "Work", "Proyectos") },
    { id: "services", label: t(lang, "Services", "Servicios") },
    { id: "deck", label: t(lang, "Deck", "Sistema") },
    { id: "faq", label: "FAQ" },
  ];
  return (
    <header className="fixed top-0 inset-x-0 z-50 py-4 transition-all duration-500">
      <div className="mx-auto max-w-6xl px-4 md:px-5">
        <nav className={`flex items-center justify-between rounded-full px-4 md:px-5 py-2.5 glass-strong transition-all duration-500 ${scrolled ? "nav-scrolled" : ""}`}>
          <button onClick={() => go("home")} className="flex items-center">
            <img
              src={oasisLogo}
              alt="Oasis Studio"
              className={`h-7 md:h-8 w-auto transition-all duration-500 ${scrolled ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1 pointer-events-none"}`}
              style={{ filter: "invert(1) brightness(1.4)" }}
            />
          </button>
          <ul className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <li key={l.id}>
                <button
                  onClick={() => go(l.id)}
                  className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-full"
                >
                  {l.label}
                </button>
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
              onClick={() => go("contact")}
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

/* ---------------- Hero ---------------- */
function Hero({ go, scrolled }: { go: (id: string) => void; scrolled: boolean }) {
  const { lang } = useLang();
  return (
    <section id="home" className="snap-section relative">
      <div className="mx-auto max-w-6xl px-6 flex flex-col items-center text-center">
        <Reveal className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.25em] text-muted-foreground mb-8">
          <span className="size-1.5 rounded-full bg-accent shadow-[0_0_10px_var(--accent)]" />
          {t(lang, "Now booking · Q3 2026", "Reservando · Q3 2026")}
        </Reveal>
        <Reveal delay={1}>
          <img
            src={oasisLogo}
            alt="Oasis Studio"
            className={`w-full max-w-[520px] md:max-w-[720px] h-auto transition-opacity duration-700 ${scrolled ? "opacity-0" : "opacity-100"}`}
            style={{ filter: "invert(1) brightness(1.5)" }}
          />
        </Reveal>
        <Reveal delay={2} className="mt-8 max-w-xl text-base md:text-xl text-foreground/80 text-pretty">
          {t(
            lang,
            "Find the definitive solutions for your business. Websites, social media, editorial direction, and digital infrastructure — operating as one system.",
            "Encuentra las soluciones definitivas para tu marca. Web, social media, dirección editorial e infraestructura digital — operando como un solo sistema."
          )}
        </Reveal>
        <Reveal delay={3} className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => go("contact")}
            className="rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            {t(lang, "Transform my business →", "Transformar mi marca →")}
          </button>
          <button
            onClick={() => go("services")}
            className="rounded-full glass px-6 py-3 text-sm font-medium hover-lift"
          >
            {t(lang, "Explore services", "Ver servicios")}
          </button>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- Interactive System Overview ---------------- */
type ClientKey = "aurelia" | "miamidiario" | "kimona";
type SectionKey = "overview" | "results";

const CLIENT_META: Record<ClientKey, { label: string; handle: string; tag: string }> = {
  aurelia: { label: "Aurélia", handle: "@aurelia.estudio", tag: "Branding · Web · Editorial" },
  miamidiario: { label: "Miami Diario", handle: "@miamidiario", tag: "Social · Editorial · Paid Media" },
  kimona: { label: "Kimona Atelier", handle: "@kimonatelier", tag: "E-commerce · Editorial · Brand" },
};

const SECTION_META: Record<SectionKey, { caption: Record<ClientKey, string> }> = {
  overview: {
    caption: {
      aurelia: "Brand identity and bespoke booking site for a Madrid esthetics studio.",
      miamidiario: "Reference digital publisher · 253K followers · 19,155 posts.",
      kimona: "Contemporary fashion label · editorial direction and commerce engine.",
    },
  },
  results: {
    caption: {
      aurelia: "One brand, one voice — every touchpoint engineered as a single system.",
      miamidiario: "Scaled distribution averaging 7M+ monthly reach across the network.",
      kimona: "March marked the inflection — 6× historical averages reached by May.",
    },
  },
};

/* ---------- Panel renderer ---------- */
function ClientPanel({ client, section }: { client: ClientKey; section: SectionKey }) {
  if (client === "aurelia" && section === "overview") return <AureliaOverview />;
  if (client === "aurelia" && section === "results") return <AureliaResults />;
  if (client === "miamidiario" && section === "overview") return <MiamiOverview />;
  if (client === "miamidiario" && section === "results") return <MiamiResults />;
  if (client === "kimona" && section === "overview") return <KimonaOverview />;
  return <KimonaResults />;
}

/* ---------- AURÉLIA ---------- */
function AureliaOverview() {
  const deliverables = [
    { k: "Brand", v: "Naming, identity, tone of voice" },
    { k: "Website", v: "Bespoke design + build · aureliaesthetics.lovable.app" },
    { k: "Booking", v: "Integrated appointment system" },
    { k: "Editorial", v: "Service catalogue · Facial, Massage, Ritual" },
  ];
  return (
    <div className="glass-subtle rounded-lg p-5 md:p-7">
      <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-accent">The brief</div>
      <h3 className="font-display text-2xl md:text-3xl mt-2 leading-tight text-balance max-w-2xl">
        A Madrid esthetics studio that needed to stop looking like another clinic.
      </h3>
      <p className="text-sm md:text-base text-muted-foreground mt-4 leading-relaxed max-w-2xl">
        Aurélia is a botanical skincare studio on Calle Almagro, founded in 2018. We built the brand
        from zero — name, visual identity, voice and website — to translate a premium, slow service
        into a digital presence that feels serene, coherent and unmistakably Aurélia.
      </p>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 max-w-3xl">
        {deliverables.map((d) => (
          <div key={d.k} className="flex gap-2 text-xs md:text-sm">
            <span className="text-accent shrink-0">→</span>
            <div className="min-w-0">
              <div className="font-mono uppercase tracking-wider text-[9px] text-muted-foreground">{d.k}</div>
              <div className="text-foreground/85">{d.v}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Counter animation ---------- */
function useCountUp(target: number, duration = 1100, delay = 0) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const tid = setTimeout(() => {
      let start: number | null = null;
      const tick = (ts: number) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / duration, 1);
        setValue((1 - (1 - p) ** 3) * target); // ease-out cubic
        if (p < 1) raf = requestAnimationFrame(tick);
        else setValue(target);
      };
      raf = requestAnimationFrame(tick);
    }, delay * 1000);
    return () => { clearTimeout(tid); cancelAnimationFrame(raf); };
  }, [target, duration, delay]);
  return value;
}

function useCountWhen(target: number, duration: number, enabled: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    let start: number | null = null;
    const tick = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setValue((1 - (1 - p) ** 3) * target);
      if (p < 1) raf = requestAnimationFrame(tick);
      else setValue(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enabled]);
  return value;
}

function CountStat({
  raw, fmt, label, delay = 0, large = false,
}: {
  raw: number; fmt: (n: number) => string; label: string; delay?: number; large?: boolean;
}) {
  const n = useCountUp(raw, 1100, delay);
  return (
    <div
      className="glass-subtle rounded-lg p-3"
      style={{ animation: `panel-in 0.35s cubic-bezier(0.2,0.8,0.2,1) ${delay}s both` }}
    >
      <div className={`font-display tabular-nums ${large ? "text-xl md:text-2xl" : "text-lg md:text-2xl"}`}>
        {fmt(n)}
      </div>
      <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function AureliaResults() {
  return (
    <div className="space-y-3 md:space-y-4">
      <div className="grid grid-cols-12 gap-3 md:gap-4">
        {[
          { t: "Brand Identity", b: ["Naming + wordmark serif", "Warm palette · sand, cream, bone", "Editorial type system", "Tone & voice guide"] },
          { t: "Website", b: ["Bespoke design & build", "Structured service catalogue", "Integrated appointment booking", "Local SEO · Madrid"] },
          { t: "Services", b: ["3 active service lines", "Facial · Massage · Ritual", "Unified across channels", "Physical + digital presence"] },
        ].map((c) => (
          <div key={c.t} className="col-span-12 md:col-span-4 glass-subtle rounded-lg p-4">
            <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground mb-2">{c.t}</div>
            <ul className="space-y-1.5 text-xs text-foreground/85">
              {c.b.map((x) => (
                <li key={x} className="flex gap-2">
                  <span className="text-accent">→</span> {x}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-2 md:gap-3">
        <CountStat raw={1}   fmt={n => `0 → ${Math.min(Math.round(n), 1)}`} label="Brand built from zero"  delay={0.10} large />
        <CountStat raw={1}   fmt={n => `${Math.round(n)}`}                  label="Bespoke website"        delay={0.17} large />
        <CountStat raw={3}   fmt={n => `${Math.round(n)}`}                  label="Service lines live"     delay={0.24} large />
        <CountStat raw={100} fmt={n => `${Math.round(n)}%`}                 label="Channel coherence"      delay={0.31} large />
      </div>
    </div>
  );
}

/* ---------- MIAMI DIARIO ---------- */
function MiamiOverview() {
  const desks = [
    { k: "News", v: "Florida · breaking" },
    { k: "Politics", v: "Local + LATAM" },
    { k: "Sports", v: "NFL · MLB · F1" },
    { k: "Lifestyle", v: "Culture · entertainment" },
  ];
  return (
    <div className="glass-subtle rounded-lg p-5 md:p-7">
      <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-accent">The brief</div>
      <h3 className="font-display text-2xl md:text-3xl mt-2 leading-tight text-balance max-w-2xl">
        A reference digital publisher for the Hispanic audience in Miami.
      </h3>
      <p className="text-sm md:text-base text-muted-foreground mt-4 leading-relaxed max-w-2xl">
        Miami Diario covers Florida news, politics, sports and lifestyle for U.S. Latinos and the
        wider LATAM diaspora. We took over their organic social channels and Meta paid campaigns
        and run them as a single growth system — editorial direction, production, distribution and
        measurement under one roof.
      </p>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 max-w-3xl">
        {desks.map((d) => (
          <div key={d.k} className="flex gap-2 text-xs md:text-sm">
            <span className="text-accent shrink-0">→</span>
            <div className="min-w-0">
              <div className="font-mono uppercase tracking-wider text-[9px] text-muted-foreground">{d.k}</div>
              <div className="text-foreground/85">{d.v}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiamiResults() {
  const dist = [
    { l: "Reels", v: 78 },
    { l: "Posts", v: 14 },
    { l: "Stories", v: 8 },
  ];
  const geo = [
    { l: "U.S.", v: 62 },
    { l: "Venezuela", v: 14 },
    { l: "Colombia", v: 9 },
    { l: "Mexico", v: 7 },
    { l: "Spain", v: 4 },
  ];
  return (
    <div className="space-y-3 md:space-y-4">
      <div className="grid grid-cols-4 gap-2 md:gap-3">
        <CountStat raw={7.9}  fmt={n => `${n.toFixed(1)}M`}                              label="Views · May"          delay={0.10} />
        <CountStat raw={38.2} fmt={n => `${n.toFixed(1)}M`}                              label="Cumulative · 4 mo"    delay={0.17} />
        <CountStat raw={4921} fmt={n => `+${Math.round(n).toLocaleString("en-US")}`}     label="New followers · 30d"  delay={0.24} />
        <CountStat raw={253}  fmt={n => `${Math.round(n)}K+`}                            label="Total community"      delay={0.31} />
      </div>
      <div className="grid grid-cols-12 gap-3 md:gap-4">
        <div className="col-span-12 md:col-span-5 glass-subtle rounded-lg p-4">
          <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground mb-3">Distribution by type</div>
          {dist.map((d, i) => (
            <div key={d.l} className="mb-2.5 last:mb-0">
              <div className="flex justify-between text-[10px] mb-1"><span className="text-foreground/80">{d.l}</span><span className="text-muted-foreground">{d.v}%</span></div>
              <div className="h-[2px] bg-white/10 overflow-hidden">
                <div className="h-full bg-accent/80 origin-left" style={{ width: `${d.v}%`, animation: `bar-grow-x 0.55s ease-out ${i * 0.1 + 0.3}s both` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="col-span-12 md:col-span-4 glass-subtle rounded-lg p-4">
          <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground mb-3">Audience geography</div>
          {geo.map((g) => (
            <div key={g.l} className="mb-1.5 last:mb-0 flex justify-between text-[10px]">
              <span className="text-foreground/80">{g.l}</span><span className="text-muted-foreground">{g.v}%</span>
            </div>
          ))}
        </div>
        <div className="col-span-12 md:col-span-3 glass-subtle rounded-lg p-4">
          <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground">Baseline · 2026</div>
          <div className="font-display text-3xl md:text-4xl mt-2">7.9M</div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-1">May</div>
          <div className="text-[9px] text-muted-foreground mt-3">9.55M · monthly avg</div>
        </div>
      </div>
    </div>
  );
}

/* ---------- KIMONA ---------- */
function KimonaOverview() {
  const deliverables = [
    { k: "Editorial", v: "Art direction · campaign + grid" },
    { k: "Content", v: "Posts, reels and stories at cadence" },
    { k: "Commerce", v: "Shopify · catalogue, PDP, checkout" },
    { k: "Distribution", v: "Organic IG + paid acquisition" },
  ];
  return (
    <div className="glass-subtle rounded-lg p-5 md:p-7">
      <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-accent">The brief</div>
      <h3 className="font-display text-2xl md:text-3xl mt-2 leading-tight text-balance max-w-2xl">
        A contemporary womenswear label, made entirely in Spain.
      </h3>
      <p className="text-sm md:text-base text-muted-foreground mt-4 leading-relaxed max-w-2xl">
        Kimona by Jana Pérez designs and manufactures every piece in its own workshops in Spain —
        circular production, considered silhouettes, prices from $267–$297. We took over the digital
        channel to set a unified editorial direction, a coherent content architecture, and a commerce
        engine operating as one unit.
      </p>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 max-w-3xl">
        {deliverables.map((d) => (
          <div key={d.k} className="flex gap-2 text-xs md:text-sm">
            <span className="text-accent shrink-0">→</span>
            <div className="min-w-0">
              <div className="font-mono uppercase tracking-wider text-[9px] text-muted-foreground">{d.k}</div>
              <div className="text-foreground/85">{d.v}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function KimonaResults() {
  const bars = [
    { l: "Mar", v: 30, n: "27.6K" },
    { l: "Apr", v: 38, n: "35.1K" },
    { l: "May", v: 100, n: "159.9K" },
  ];
  const channel = [
    { l: "Before · Jan–Feb", v: 25, n: "3,900" },
    { l: "After · Mar–May", v: 100, n: "7,618" },
  ];
  const alloc = [
    { l: "Posts", v: 77.9 },
    { l: "Reels", v: 13.9 },
    { l: "Stories", v: 8.2 },
  ];
  return (
    <div className="space-y-3 md:space-y-4">
      <div className="grid grid-cols-4 gap-2 md:gap-3">
        <CountStat raw={222653} fmt={n => Math.round(n).toLocaleString("en-US")}  label="Views · Mar–May"        delay={0.10} />
        <CountStat raw={95}     fmt={n => `+${Math.round(n)}%`}                   label="Monthly reach vs prior" delay={0.17} />
        <CountStat raw={82.9}   fmt={n => `+${n.toFixed(1)}%`}                   label="March · inflection"     delay={0.24} />
        <CountStat raw={18.2}   fmt={n => `${n.toFixed(1)}%`}                    label="Follower conversion"    delay={0.31} />
      </div>
      <div className="grid grid-cols-12 gap-3 md:gap-4">
        <div className="col-span-12 md:col-span-4 glass-subtle rounded-lg p-4">
          <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground mb-4">Volume baseline · 2026</div>
          <div className="flex items-end justify-around gap-2 h-28">
            {bars.map((b, i) => (
              <div key={b.l} className="flex flex-col items-center gap-1.5 flex-1">
                <span className="text-[9px] text-foreground/80 font-mono">{b.n}</span>
                <div
                  className="w-full rounded-t-sm origin-bottom"
                  style={{
                    height: `${Math.round(b.v * 0.72)}px`,
                    background: "linear-gradient(to top, oklch(0.78 0.09 65 / 0.25), oklch(0.78 0.09 65 / 0.85))",
                    animation: `bar-scale 0.65s cubic-bezier(0.2,0.8,0.2,1) ${i * 0.12 + 0.3}s both`,
                  }}
                />
                <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">{b.l}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="col-span-12 md:col-span-4 glass-subtle rounded-lg p-4">
          <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground mb-3">Channel transition · accounts reached</div>
          {channel.map((c, i) => (
            <div key={c.l} className="mb-3 last:mb-0">
              <div className="flex justify-between text-[10px] mb-1"><span className="text-foreground/80">{c.l}</span><span className="text-muted-foreground">{c.n}</span></div>
              <div className="h-[2px] bg-white/10 overflow-hidden">
                <div className="h-full bg-accent/80 origin-left" style={{ width: `${c.v}%`, animation: `bar-grow-x 0.6s ease-out ${i * 0.15 + 0.35}s both` }} />
              </div>
            </div>
          ))}
          <div className="text-[10px] font-mono uppercase tracking-wider text-accent mt-3">+95% monthly reach</div>
        </div>
        <div className="col-span-12 md:col-span-4 glass-subtle rounded-lg p-4">
          <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground mb-3">Content allocation · March</div>
          {alloc.map((a, i) => (
            <div key={a.l} className="mb-2.5 last:mb-0">
              <div className="flex justify-between text-[10px] mb-1"><span className="text-foreground/80">{a.l}</span><span className="text-muted-foreground">{a.v}%</span></div>
              <div className="h-[2px] bg-white/10 overflow-hidden">
                <div className="h-full bg-accent/80 origin-left" style={{ width: `${a.v}%`, animation: `bar-grow-x 0.55s ease-out ${i * 0.1 + 0.3}s both` }} />
              </div>
            </div>
          ))}
          <div className="text-[10px] text-muted-foreground mt-3">Editorial focus · video as infrastructure</div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Dashboard shell ---------- */
function SystemOverview() {
  const [clientKey, setClientKey] = useState<ClientKey>("aurelia");
  const [section, setSection] = useState<SectionKey>("overview");
  const meta = CLIENT_META[clientKey];
  const caption = SECTION_META[section].caption[clientKey];

  const clients: ClientKey[] = ["aurelia", "miamidiario", "kimona"];
  const sections: { k: SectionKey; label: string }[] = [
    { k: "overview", label: "Overview" },
    { k: "results", label: "Results" },
  ];

  return (
    <div className="glass-strong rounded-2xl overflow-hidden">
      {/* chrome */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-white/15" />
          <span className="size-2.5 rounded-full bg-white/15" />
          <span className="size-2.5 rounded-full bg-white/15" />
        </div>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          oasis · system overview
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="size-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--accent)]" />
          live
        </span>
      </div>

      <div className="grid grid-cols-12 min-h-[460px]">
        {/* sidebar */}
        <aside className="col-span-12 md:col-span-3 border-b md:border-b-0 md:border-r border-white/10 p-4 md:p-5">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Clients</div>
          <div className="grid grid-cols-3 md:grid-cols-1 gap-1 mb-5">
            {clients.map((k) => {
              const a = k === clientKey;
              return (
                <button
                  type="button"
                  key={k}
                  onClick={() => setClientKey(k)}
                  className={`flex items-center gap-2 text-xs py-1.5 px-2 rounded-md text-left transition-all ${
                    a
                      ? "bg-white/[0.08] text-foreground border border-white/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03] border border-transparent"
                  }`}
                >
                  <span
                    className={`size-1.5 rounded-full transition-all shrink-0 ${
                      a ? "bg-accent shadow-[0_0_8px_var(--accent)]" : "bg-accent/40"
                    }`}
                  />
                  <span className="truncate">{CLIENT_META[k].label}</span>
                </button>
              );
            })}
          </div>
          <div className="divider mb-4" />
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Section</div>
          <div className="grid grid-cols-2 md:grid-cols-1 gap-1">
            {sections.map((s) => {
              const a = s.k === section;
              return (
                <button
                  type="button"
                  key={s.k}
                  onClick={() => setSection(s.k)}
                  className={`text-xs py-1.5 px-2 rounded-md text-left transition-colors ${
                    a ? "text-foreground bg-white/[0.05]" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
          <div className="hidden md:block mt-6 text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60">
            {meta.tag}
          </div>
        </aside>

        {/* main panel */}
        <div className="col-span-12 md:col-span-9 p-4 md:p-6 animate-fade-up">
          <div key={`${clientKey}-${section}`} className="animate-panel-in">
            <div className="flex items-start justify-between mb-4 gap-3">
              <div className="min-w-0">
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  {meta.handle} · {section}
                </div>
                <div className="font-display text-xl md:text-2xl mt-1 text-balance truncate">
                  {meta.label}
                </div>
                <div className="text-xs text-muted-foreground mt-1.5">{caption}</div>
              </div>
            </div>

            <ClientPanel client={clientKey} section={section} />
          </div>
        </div>
      </div>
    </div>
  );
}

function DeckSection() {
  const { lang } = useLang();
  return (
    <section id="deck" className="snap-section relative">
      <div className="mx-auto max-w-6xl px-4 md:px-6 w-full">
        <Reveal>
          <SectionLabel>{t(lang, "Partnership deck · Q3 2026", "Sistema · Q3 2026")}</SectionLabel>
          <h2 className="font-display text-3xl md:text-5xl tracking-tight max-w-3xl text-balance">
            {t(lang, "The studio, ", "El estudio, ")}
            <em className="text-accent">{t(lang, "in motion.", "en movimiento.")}</em>
          </h2>
          <p className="mt-3 text-muted-foreground max-w-xl text-sm md:text-base">
            {t(lang, "Click any client or section to switch the live view.", "Haz clic en cualquier cliente o sección para cambiar la vista.")}
          </p>
        </Reveal>
        <Reveal delay={2} className="mt-8">
          <ClientOnly>
            <SystemOverview />
          </ClientOnly>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- Services ---------------- */
function Services() {
  const { lang } = useLang();
  const items = [
    { n: "01", title: t(lang, "Web Pages", "Sitios Web"), body: t(lang, "Sites conceived as a product, not a brochure. Performance, clarity, and narrative in a single piece.", "Sitios concebidos como producto, no folleto. Rendimiento, claridad y narrativa en una sola pieza."), tags: ["Next.js", "Shopify", "Framer"] },
    { n: "02", title: t(lang, "Social Media", "Social Media"), body: t(lang, "Organic growth and Meta Ads operating as a single engine. Accounts that grow with discernment, not dashboards.", "Crecimiento orgánico y Meta Ads operando como un solo motor. Cuentas que crecen con criterio, no con dashboards."), tags: ["Organic", "Meta Ads", "Analytics"] },
    { n: "03", title: t(lang, "Editorial Direction", "Dirección Editorial"), body: t(lang, "Sustained content systems. Voice, rhythm, and narrative. No one-off campaigns.", "Sistemas de contenido sostenidos. Voz, ritmo y narrativa. Sin campañas aisladas."), tags: ["Voice", "Systems", "Cadence"] },
    { n: "04", title: t(lang, "Digital Infrastructure", "Infraestructura Digital"), body: t(lang, "The technical base that supports all of the above. Stable, measurable, proprietary.", "La base técnica que sostiene todo lo anterior. Estable, medible, propia."), tags: ["Cloud", "Pipelines", "Observability"] },
  ];
  const [svcRef, svcVisible] = useScrollVisible(0.06);
  return (
    <section id="services" className="snap-section relative">
      <div ref={svcRef} className="mx-auto max-w-6xl px-6 w-full">
        {/* Heading fades up */}
        <div style={{ opacity: svcVisible ? 1 : 0, transform: svcVisible ? "translateY(0)" : "translateY(14px)", transition: "opacity 0.5s ease 0.05s, transform 0.5s ease 0.05s" }}>
          <SectionLabel>{t(lang, "What we do", "Qué hacemos")}</SectionLabel>
        </div>
        <h2
          style={{ opacity: svcVisible ? 1 : 0, transform: svcVisible ? "translateY(0)" : "translateY(20px)", transition: "opacity 0.75s cubic-bezier(0.2,0.8,0.2,1) 0.1s, transform 0.75s cubic-bezier(0.2,0.8,0.2,1) 0.1s" }}
          className="font-display text-3xl md:text-5xl leading-[1.05] tracking-tight max-w-3xl text-balance"
        >
          {t(lang, "Four fronts. One ", "Cuatro frentes. Un ")}
          <em className="text-accent">{t(lang, "measurable", "sistema")}</em>
          {t(lang, " system.", " medible.")}
        </h2>
        <p style={{ opacity: svcVisible ? 1 : 0, transform: svcVisible ? "translateY(0)" : "translateY(16px)", transition: "opacity 0.65s ease 0.2s, transform 0.65s ease 0.2s" }}
          className="mt-4 max-w-xl text-muted-foreground text-base md:text-lg">
          {t(lang, "We don't offer standalone services — we offer the discernment that makes them function as a single piece.", "No ofrecemos servicios sueltos — ofrecemos el criterio que los hace funcionar como una sola pieza.")}
        </p>

        {/* Cards: even slides from left, odd slides from right */}
        <div className="mt-8 md:mt-10 grid md:grid-cols-2 gap-3 md:gap-4">
          {items.map((it, i) => {
            const fromLeft = i % 2 === 0;
            const delay = 0.28 + i * 0.1;
            return (
              <article
                key={it.n}
                style={{
                  opacity: svcVisible ? 1 : 0,
                  transform: svcVisible ? "translateX(0) translateY(0)" : `translateX(${fromLeft ? "-32px" : "32px"}) translateY(16px)`,
                  transition: `opacity 0.75s cubic-bezier(0.2,0.8,0.2,1) ${delay}s, transform 0.75s cubic-bezier(0.2,0.8,0.2,1) ${delay}s`,
                }}
                className="glass hover-lift rounded-2xl p-5 md:p-6 group h-full"
              >
                <div className="flex items-start justify-between mb-6">
                  <span
                    className="font-mono text-xs text-muted-foreground"
                    style={{
                      transform: svcVisible ? "scale(1)" : "scale(0.6)",
                      transition: `transform 0.5s cubic-bezier(0.34,1.56,0.64,1) ${delay + 0.12}s`,
                    }}
                  >{it.n}</span>
                  <span className="size-8 rounded-full glass-subtle flex items-center justify-center text-muted-foreground group-hover:text-accent transition-colors">→</span>
                </div>
                <h3 className="font-display text-2xl md:text-3xl mb-2">{it.title}</h3>
                <p className="text-muted-foreground text-sm md:text-base text-pretty mb-4">{it.body}</p>
                <div className="flex flex-wrap gap-1.5">
                  {it.tags.map((tag) => (
                    <span key={tag} className="text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-full glass-subtle text-muted-foreground">{tag}</span>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Work (portfolio) ---------------- */
function WorkCard({ p, i, visible }: { p: { name: string; tag: string; url: string; href: string; img: string }; i: number; visible: boolean }) {
  const delay = 0.22 + i * 0.09;
  return (
    <a
      key={p.name}
      href={p.href} target="_blank" rel="noopener noreferrer"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "scale(1) translateY(0)" : "scale(0.93) translateY(20px)",
        transition: `opacity 0.7s cubic-bezier(0.2,0.8,0.2,1) ${delay}s, transform 0.7s cubic-bezier(0.2,0.8,0.2,1) ${delay}s`,
      }}
      className="glass hover-lift rounded-2xl overflow-hidden group block"
    >
      <div className="relative border-b border-white/10">
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/10 bg-white/[0.03]">
          {[0,1,2].map((j) => (
            <span
              key={j}
              className="size-2 rounded-full bg-white/20"
              style={{
                transform: visible ? "scale(1)" : "scale(0)",
                transition: `transform 0.35s cubic-bezier(0.34,1.56,0.64,1) ${delay + 0.12 + j * 0.06}s`,
              }}
            />
          ))}
          <span className="ml-2 text-[10px] font-mono text-muted-foreground truncate">{p.url}</span>
        </div>
        <div className="aspect-[16/10] relative overflow-hidden bg-black/30">
          <img
            src={p.img} alt={`${p.name} preview`} loading="lazy"
            className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-[1.04]"
            style={{
              filter: visible ? "blur(0px) brightness(1)" : "blur(6px) brightness(0.7)",
              transition: `filter 0.9s ease ${delay + 0.1}s, transform 0.7s cubic-bezier(0.2,0.8,0.2,1)`,
            }}
          />
        </div>
      </div>
      <div className="p-4 flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg md:text-xl">{p.name}</h3>
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-1">{p.tag}</p>
        </div>
        <span className="size-8 rounded-full glass-subtle flex items-center justify-center text-muted-foreground group-hover:text-accent transition-colors">↗</span>
      </div>
    </a>
  );
}

function Work() {
  const { lang } = useLang();
  const [showAll, setShowAll] = useState(false);
  const projects = [
    { name: "Kimona Atelier", tag: "E-Commerce · Shopify", url: "kimonatelier.com", href: "https://kimonatelier.com/", img: `${base}assets/1.png` },
    { name: "The Legacy Holding", tag: "Corporate · Real Estate", url: "thelegacyholding.com", href: "https://www.thelegacyholding.com", img: `${base}assets/2.png` },
    { name: "Oasis Yacht Club", tag: "Luxury · Marine", url: "by0gch-qd.myshopify.com", href: "https://by0gch-qd.myshopify.com/", img: `${base}assets/3.png` },
    { name: "Universe Media", tag: "News · Digital Media", url: "universe-media-two.vercel.app", href: "https://universe-media-two.vercel.app/", img: `${base}assets/4.png` },
    { name: "Kanu Decor", tag: "E-Commerce · Interior", url: "kanudecor.com", href: "https://kanudecor.com/", img: `${base}assets/7.png` },
    { name: "Aurélia", tag: "Beauty · Branding · Web", url: "aureliaesthetics.lovable.app", href: "https://aureliaesthetics.lovable.app/", img: `${base}assets/6.png` },
    { name: "Ishin Academy", tag: "Education · Framer", url: "ishinacademy.framer.website", href: "https://ishinacademy.framer.website/", img: `${base}assets/5.png` },
  ];
  const visible = projects.slice(0, 6);
  const extra = projects.slice(6);
  const [workRef, workVisible] = useScrollVisible(0.06);
  return (
    <section id="work" className="snap-section relative">
      <div ref={workRef} className="mx-auto max-w-6xl px-6 w-full">
        <div style={{ opacity: workVisible ? 1 : 0, transform: workVisible ? "translateY(0)" : "translateY(14px)", transition: "opacity 0.5s ease 0.05s, transform 0.5s ease 0.05s" }}>
          <SectionLabel>{t(lang, "Selected work", "Trabajo seleccionado")}</SectionLabel>
        </div>
        <h2
          style={{ opacity: workVisible ? 1 : 0, transform: workVisible ? "translateY(0)" : "translateY(20px)", transition: "opacity 0.75s cubic-bezier(0.2,0.8,0.2,1) 0.1s, transform 0.75s cubic-bezier(0.2,0.8,0.2,1) 0.1s" }}
          className="font-display text-3xl md:text-5xl tracking-tight max-w-3xl"
        >
          {t(lang, "Built for the ", "Hecho para los ")}
          <em className="text-accent">{t(lang, "bold.", "audaces.")}</em>
        </h2>

        {/* Always-visible first 6 */}
        <div className="mt-8 md:mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {visible.map((p, i) => (
            <WorkCard key={p.name} p={p} i={i} visible={workVisible} />
          ))}
        </div>

        {/* Expandable extra rows */}
        {extra.length > 0 && (
          <>
            <div
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 overflow-hidden"
              style={{
                maxHeight: showAll ? `${Math.ceil(extra.length / 3) * 420}px` : "0px",
                opacity: showAll ? 1 : 0,
                marginTop: showAll ? "12px" : "0px",
                transition: "max-height 0.6s cubic-bezier(0.2,0.8,0.2,1), opacity 0.4s ease, margin-top 0.3s ease",
              }}
            >
              {extra.map((p, i) => (
                <WorkCard key={p.name} p={p} i={i} visible={showAll} />
              ))}
            </div>

            <div className="mt-8 flex justify-center">
              <button
                onClick={() => setShowAll((v) => !v)}
                className="group inline-flex items-center gap-2.5 glass-subtle border border-white/[0.10] hover:border-accent/40 rounded-full px-6 py-3 text-sm font-mono uppercase tracking-[0.18em] text-muted-foreground hover:text-accent transition-all duration-300"
              >
                <span>{showAll ? t(lang, "Show less", "Ver menos") : t(lang, "Show more", "Ver más")}</span>
                <svg
                  viewBox="0 0 16 16" className="size-3.5 transition-transform duration-300"
                  style={{ transform: showAll ? "rotate(180deg)" : "rotate(0deg)" }}
                  fill="none" stroke="currentColor" strokeWidth="1.5"
                >
                  <path d="M3 6l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

/* ---------------- FAQ ---------------- */
function FAQ() {
  const { lang } = useLang();
  const faqs = lang === "en"
    ? [
        { q: "Do you replace our internal team?", a: "No. We work as an extension of your team. We take on what you can't cover internally and adapt to how you already work." },
        { q: "Do you work by project or by monthly retainer?", a: "We work with a continuous monthly partnership. The results we show are built with consistency, not one-off efforts." },
        { q: "Do I need to have my brand ready to start?", a: "No. If your brand doesn't exist yet or needs a refresh, we start from there. If it's already defined, we integrate with your guidelines and carry them across every channel." },
        { q: "How do we measure that it's working?", a: "We define clear metrics from the start based on your goals: sales, booked appointments, reach, followers or web traffic. You receive periodic reports in plain language, no jargon." },
      ]
    : [
        { q: "¿Reemplazan a nuestro equipo interno?", a: "No. Trabajamos como una extensión de tu equipo. Asumimos lo que no alcanzan a cubrir internamente y nos sumamos a la forma de trabajar que ya tienen." },
        { q: "¿Trabajan por proyecto o por mensualidad?", a: "Trabajamos con un acompañamiento mensual continuo. Los resultados que mostramos se construyen con consistencia, no con esfuerzos aislados de una sola vez." },
        { q: "¿Necesito tener mi marca lista para empezar?", a: "No. Si tu marca aún no existe o necesita refrescarse, partimos desde ahí. Si ya está definida, nos integramos a tus lineamientos y los llevamos a todos los canales." },
        { q: "¿Cómo medimos que está funcionando?", a: "Definimos métricas claras desde el inicio según tus objetivos: ventas, citas agendadas, alcance, seguidores o tráfico web. Recibes reportes periódicos en lenguaje simple, sin tecnicismos." },
      ];
  const [open, setOpen] = useState<number | null>(0);
  const [listRef, listVisible] = useScrollVisible(0.05);
  return (
    <section id="faq" className="snap-section relative">
      <div className="mx-auto max-w-6xl px-6 w-full">
        {/* Heading — slides up on scroll */}
        <div
          ref={listRef}
          style={{
            opacity: listVisible ? 1 : 0,
            transform: listVisible ? "translateY(0)" : "translateY(18px)",
            transition: "opacity 0.55s ease 0.04s, transform 0.55s cubic-bezier(0.2,0.8,0.2,1) 0.04s",
          }}
          className="flex items-baseline justify-between"
        >
          <SectionLabel>{t(lang, "Frequent conversations", "Conversaciones frecuentes")}</SectionLabel>
          <span className="hidden md:block text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
            {t(lang, "What people usually ask us", "Lo que suelen preguntarnos")}
          </span>
        </div>
        <h2
          style={{
            opacity: listVisible ? 1 : 0,
            transform: listVisible ? "translateY(0)" : "translateY(22px)",
            transition: "opacity 0.75s cubic-bezier(0.2,0.8,0.2,1) 0.1s, transform 0.75s cubic-bezier(0.2,0.8,0.2,1) 0.1s",
          }}
          className="font-display text-3xl md:text-5xl tracking-tight max-w-2xl text-balance"
        >
          {t(lang, "Direct answers, no ", "Respuestas directas, sin ")}
          <em className="text-accent">{t(lang, "detours.", "rodeos.")}</em>
        </h2>

        {/* FAQ rows — each slides in from left, staggered */}
        <div className="mt-10 border-t border-white/10">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            const rowDelay = 0.18 + i * 0.1;
            return (
              <div
                key={f.q}
                style={{
                  opacity: listVisible ? 1 : 0,
                  transform: listVisible ? "translateX(0)" : "translateX(-28px)",
                  transition: `opacity 0.7s cubic-bezier(0.2,0.8,0.2,1) ${rowDelay}s, transform 0.7s cubic-bezier(0.2,0.8,0.2,1) ${rowDelay}s`,
                }}
                className={`border-b border-white/10 transition-colors duration-300 ${isOpen ? "bg-white/[0.015]" : ""}`}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-start gap-5 md:gap-8 py-6 md:py-8 text-left group"
                >
                  {/* Large accent number — scales up slightly behind the row */}
                  <span
                    className={`font-display text-5xl md:text-6xl leading-none shrink-0 w-14 md:w-20 select-none transition-all duration-500 ${
                      isOpen ? "text-gradient-accent" : "text-foreground/[0.08] group-hover:text-foreground/[0.16]"
                    }`}
                    style={{
                      transform: listVisible ? "scale(1)" : "scale(0.75)",
                      transition: `transform 0.6s cubic-bezier(0.2,0.8,0.2,1) ${rowDelay + 0.05}s, color 0.5s, -webkit-text-fill-color 0.5s`,
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  <div className="flex-1 min-w-0 pt-1.5">
                    <div className="font-display text-xl md:text-2xl text-foreground leading-snug">{f.q}</div>
                    <div className={`overflow-hidden transition-all duration-500 ${isOpen ? "max-h-40 mt-4 opacity-100" : "max-h-0 opacity-0"}`}>
                      <p
                        key={isOpen ? `open-${i}` : `closed-${i}`}
                        className={`text-sm md:text-base text-muted-foreground leading-relaxed ${isOpen ? "animate-panel-in" : ""}`}
                      >
                        {f.a}
                      </p>
                    </div>
                  </div>

                  {/* Rotating toggle */}
                  <span
                    className={`shrink-0 mt-2 size-7 rounded-full border flex items-center justify-center text-base font-light transition-colors duration-300 ${
                      isOpen
                        ? "text-accent bg-accent/10 border-accent/30"
                        : "glass-subtle text-muted-foreground border-white/[0.07] group-hover:text-foreground"
                    }`}
                    style={{ transform: isOpen ? "rotate(45deg)" : "rotate(0deg)", transition: "transform 0.35s cubic-bezier(0.2,0.8,0.2,1), color 0.3s, background 0.3s, border-color 0.3s" }}
                  >
                    +
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Discovery CTA ---------------- */
function DiscoveryCTA() {
  const { lang } = useLang();
  const steps = lang === "en"
    ? [
        { n: "Step 01", t: "Discovery call", b: "30 minutes. Context, ambition and fit." },
        { n: "Step 02", t: "Tailored proposal", b: "Scope, team and retainer. Within 5 business days." },
        { n: "Step 03", t: "Kickoff", b: "Onboarding in 7 days. Month 01 begins." },
      ]
    : [
        { n: "Paso 01", t: "Discovery call", b: "30 minutos. Contexto, ambición y encaje." },
        { n: "Paso 02", t: "Propuesta a medida", b: "Alcance, equipo y retainer. En 5 días hábiles." },
        { n: "Paso 03", t: "Kickoff", b: "Onboarding en 7 días. Mes 01 comienza." },
      ];
  const [sectionRef, sectionVisible] = useScrollVisible(0.05);
  return (
    <section id="contact" className="snap-section relative">
      <div ref={sectionRef} className="mx-auto max-w-6xl px-6 w-full">

        {/* Label + spots — slides up first */}
        <div
          style={{
            opacity: sectionVisible ? 1 : 0,
            transform: sectionVisible ? "translateY(0)" : "translateY(14px)",
            transition: "opacity 0.5s ease 0.04s, transform 0.5s cubic-bezier(0.2,0.8,0.2,1) 0.04s",
          }}
          className="flex items-baseline justify-between"
        >
          <SectionLabel>{t(lang, "Next steps", "Próximos pasos")}</SectionLabel>
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-accent">
            {t(lang, "2 spots · Q3 2026 cohort", "2 cupos · Cohorte Q3 2026")}
          </span>
        </div>

        {/* Heading — dramatic fade+rise */}
        <h2
          style={{
            opacity: sectionVisible ? 1 : 0,
            transform: sectionVisible ? "translateY(0)" : "translateY(28px)",
            transition: "opacity 0.85s cubic-bezier(0.2,0.8,0.2,1) 0.1s, transform 0.85s cubic-bezier(0.2,0.8,0.2,1) 0.1s",
          }}
          className="font-display text-4xl md:text-7xl leading-[1] tracking-tight max-w-4xl text-balance"
        >
          {t(lang, "Every partnership begins with a ", "Toda relación comienza con una ")}
          <em className="text-accent">{t(lang, "decision.", "decisión.")}</em>
        </h2>

        {/* Chrome container — scales in from slightly below */}
        <div
          style={{
            opacity: sectionVisible ? 1 : 0,
            transform: sectionVisible ? "translateY(0) scale(1)" : "translateY(24px) scale(0.97)",
            transition: "opacity 0.75s cubic-bezier(0.2,0.8,0.2,1) 0.22s, transform 0.75s cubic-bezier(0.2,0.8,0.2,1) 0.22s",
          }}
          className="mt-10 glass-strong rounded-2xl overflow-hidden"
        >
          {/* Chrome header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-white/15" />
              <span className="size-2.5 rounded-full bg-white/15" />
              <span className="size-2.5 rounded-full bg-white/15" />
            </div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              oasis · onboarding · process
            </span>
            <span className="flex items-center gap-1.5 text-[10px] text-accent">
              <span className="size-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--accent)] animate-pulse" />
              {t(lang, "2 spots open", "2 cupos disponibles")}
            </span>
          </div>

          <div className="p-4 md:p-6">
            {/* Animated timeline row (desktop only) */}
            <div className="hidden md:block relative mb-5 h-4">
              {/* Line draws left → right */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: 0,
                  right: 0,
                  height: "1px",
                  marginTop: "-0.5px",
                  transformOrigin: "left center",
                  transform: sectionVisible ? "scaleX(1)" : "scaleX(0)",
                  transition: "transform 0.95s cubic-bezier(0.4,0,0.2,1) 0.5s",
                  background: "linear-gradient(90deg, transparent 4%, oklch(0.78 0.09 65 / 0.45) 14%, oklch(0.78 0.09 65 / 0.6) 50%, oklch(0.78 0.09 65 / 0.45) 86%, transparent 96%)",
                }}
              />
              {/* Dots pop in with spring, sequentially */}
              <div className="grid grid-cols-3 gap-4 h-full">
                {[0, 1, 2].map((j) => (
                  <div key={j} className="flex items-center justify-center">
                    <span
                      style={{
                        display: "block",
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        background: "var(--color-accent)",
                        boxShadow: "0 0 10px var(--color-accent)",
                        position: "relative",
                        zIndex: 10,
                        transform: sectionVisible ? "scale(1)" : "scale(0)",
                        transition: `transform 0.5s cubic-bezier(0.34,1.56,0.64,1) ${0.6 + j * 0.13}s`,
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Step cards — slot up sequentially */}
            <div className="grid md:grid-cols-3 gap-3 md:gap-4">
              {steps.map((s, i) => (
                <div
                  key={s.n}
                  style={{
                    opacity: sectionVisible ? 1 : 0,
                    transform: sectionVisible ? "translateY(0)" : "translateY(28px)",
                    transition: `opacity 0.65s cubic-bezier(0.2,0.8,0.2,1) ${0.55 + i * 0.13}s, transform 0.65s cubic-bezier(0.2,0.8,0.2,1) ${0.55 + i * 0.13}s`,
                  }}
                  className="glass rounded-xl p-5 md:p-6 h-full hover-lift group"
                >
                  <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-accent">{s.n}</div>
                  <div className="font-display text-2xl mt-3 group-hover:text-gradient-accent transition-all duration-300">{s.t}</div>
                  <p className="text-muted-foreground text-sm mt-2 leading-relaxed">{s.b}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA — fades in last */}
        <div
          style={{
            opacity: sectionVisible ? 1 : 0,
            transform: sectionVisible ? "translateY(0)" : "translateY(14px)",
            transition: "opacity 0.65s ease 0.9s, transform 0.65s cubic-bezier(0.2,0.8,0.2,1) 0.9s",
          }}
          className="mt-8 flex flex-wrap items-center gap-4"
        >
          <a
            href="mailto:hello@oasisstudio.co"
            className="relative overflow-hidden rounded-md border border-accent/60 text-accent px-6 py-3.5 text-xs font-mono uppercase tracking-[0.22em] hover:bg-accent/10 transition-all group"
            style={{ boxShadow: "0 0 30px -8px oklch(0.78 0.09 65 / 0.35)" }}
          >
            <span className="relative z-10">{t(lang, "Book a Discovery Call", "Reservar Discovery Call")}</span>
            <span
              className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"
              style={{ background: "linear-gradient(90deg, transparent, oklch(0.78 0.09 65 / 0.12), transparent)" }}
            />
          </a>
          <a href="mailto:hello@oasisstudio.co" className="text-xs font-mono uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground transition-colors">
            hello@oasisstudio.co
          </a>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Footer ---------------- */
function Footer() {
  const { lang } = useLang();
  const cols = [
    {
      h: t(lang, "Navigation", "Navegación"),
      links: [
        { l: t(lang, "Home", "Inicio"), id: "home" },
        { l: t(lang, "Services", "Servicios"), id: "services" },
        { l: t(lang, "Work", "Proyectos"), id: "work" },
        { l: t(lang, "Contact", "Contacto"), id: "contact" },
      ],
    },
    {
      h: t(lang, "Services", "Servicios"),
      links: [
        { l: t(lang, "Branding", "Branding"), id: "services" },
        { l: t(lang, "Web Design", "Diseño Web"), id: "services" },
        { l: t(lang, "Content Management", "Gestión de Contenido"), id: "services" },
      ],
    },
    {
      h: t(lang, "Connect", "Contacto"),
      links: [
        { l: "hello@oasisstudio.co", href: "mailto:hello@oasisstudio.co" },
        { l: "Instagram", href: "https://instagram.com" },
        { l: "LinkedIn", href: "https://linkedin.com" },
        { l: "Behance", href: "https://behance.net" },
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
                {c.links.map((l: any) => (
                  <li key={l.l}>
                    {l.href ? (
                      <a
                        href={l.href}
                        target={l.href.startsWith("http") ? "_blank" : undefined}
                        rel={l.href.startsWith("http") ? "noopener noreferrer" : undefined}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {l.l}
                      </a>
                    ) : (
                      <a
                        href={`#${l.id}`}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {l.l}
                      </a>
                    )}
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

/* ---------------- Shared ---------------- */
function SectionLabel({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return (
    <div className={`flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground mb-5 ${center ? "justify-center" : ""}`}>
      <span className="size-1 rounded-full bg-accent" />
      {children}
    </div>
  );
}

/* ---------------- Metrics ---------------- */
function Metrics() {
  const { lang } = useLang();
  const [sectionRef, sectionVisible] = useScrollVisible(0.04);

  const mainCount    = useCountWhen(38.2, 2600, sectionVisible);
  const communityCount = useCountWhen(253, 2100, sectionVisible);
  const growthCount  = useCountWhen(95,  1900, sectionVisible);
  const peakCount    = useCountWhen(7.9, 2300, sectionVisible);
  const multiCount   = useCountWhen(6,   1500, sectionVisible);

  const marqueeItems = [
    "38.2M views", "253K+ community", "6× reach growth", "0→1 brand built",
    "3 active partnerships", "+95% MoM Kimona", "7.9M views/month", "38.2M views",
    "253K+ community", "6× reach growth", "0→1 brand built", "3 active partnerships",
  ];

  return (
    <section id="metrics" className="snap-section relative overflow-hidden">
      {/* Deep ambient orbs — activate on scroll */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute rounded-full blur-[130px]"
          style={{
            width: "55%", height: "80%", left: "22%", top: "10%",
            background: "radial-gradient(ellipse, oklch(0.78 0.09 65 / 0.18) 0%, transparent 70%)",
            opacity: sectionVisible ? 1 : 0,
            transition: "opacity 1.8s ease 0.3s",
          }}
        />
        <div
          className="absolute rounded-full blur-[80px]"
          style={{
            width: "25%", height: "40%", right: "8%", bottom: "15%",
            background: "radial-gradient(ellipse, oklch(0.78 0.09 65 / 0.09) 0%, transparent 70%)",
            opacity: sectionVisible ? 1 : 0,
            transition: "opacity 1.5s ease 0.8s",
          }}
        />
      </div>

      {/* Marquee ticker */}
      <div className="overflow-hidden border-b border-white/[0.06]">
        <div className="flex animate-marquee whitespace-nowrap py-2.5 gap-10">
          {marqueeItems.map((m, i) => (
            <span key={i} className="inline-flex items-center gap-2.5 text-[10px] font-mono uppercase tracking-[0.28em] text-accent/50 shrink-0">
              <span className="size-1 rounded-full bg-accent/40" />{m}
            </span>
          ))}
        </div>
      </div>

      <div ref={sectionRef} className="mx-auto max-w-6xl px-6 w-full relative flex flex-col gap-5 justify-center py-4">

        {/* Section label */}
        <div style={{ opacity: sectionVisible ? 1 : 0, transform: sectionVisible ? "translateY(0)" : "translateY(12px)", transition: "opacity 0.5s ease 0.08s, transform 0.5s ease 0.08s" }}>
          <SectionLabel center>{t(lang, "Measured impact", "Impacto medido")}</SectionLabel>
        </div>

        {/* ── HERO NUMBER ── */}
        <div className="text-center relative select-none">
          {/* Glow halo behind number */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none rounded-full"
            style={{
              width: "420px", height: "180px",
              background: "radial-gradient(ellipse, oklch(0.78 0.09 65 / 0.28) 0%, transparent 70%)",
              filter: "blur(32px)",
              opacity: sectionVisible ? 1 : 0,
              transition: "opacity 1.2s ease 0.6s",
            }}
          />

          {/* Number + scanner line */}
          <div className="relative inline-block overflow-hidden">
            <h2
              className="font-display text-gradient-accent leading-none"
              style={{
                fontSize: "clamp(5.5rem, 17vw, 14rem)",
                opacity: sectionVisible ? 1 : 0,
                transform: sectionVisible ? "translateY(0) scale(1)" : "translateY(32px) scale(0.94)",
                transition: "opacity 0.85s cubic-bezier(0.2,0.8,0.2,1) 0.2s, transform 0.85s cubic-bezier(0.2,0.8,0.2,1) 0.2s",
              }}
            >
              {sectionVisible ? mainCount.toFixed(1) : "0.0"}M
            </h2>
            {/* Scanner line sweeps down in sync with counter */}
            <div
              className="absolute inset-x-0 pointer-events-none"
              style={{
                height: "2px",
                background: "linear-gradient(90deg, transparent 8%, oklch(0.78 0.09 65) 50%, transparent 92%)",
                boxShadow: "0 0 20px 4px oklch(0.78 0.09 65 / 0.6)",
                top: sectionVisible ? "104%" : "-2%",
                transition: sectionVisible ? "top 2.65s cubic-bezier(0.15,0.05,0.25,1) 0.35s" : "none",
              }}
            />
          </div>

          <p
            className="text-[10px] md:text-xs text-muted-foreground mt-3 font-mono uppercase tracking-[0.22em]"
            style={{ opacity: sectionVisible ? 1 : 0, transition: "opacity 0.6s ease 1.7s" }}
          >
            {t(lang, "Cumulative views · all active channels · Jan–May 2026", "Vistas acumuladas · todos los canales · Ene–May 2026")}
          </p>
        </div>

        {/* ── 4 STAT CARDS ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { display: `${Math.round(communityCount)}K+`, label: t(lang, "Community", "Comunidad"),         sub: "Miami Diario",          delay: 0.95 },
            { display: `+${Math.round(growthCount)}%`,    label: t(lang, "Monthly reach", "Alcance mens."), sub: "Kimona · Mar–May 2026", delay: 1.08 },
            { display: `${peakCount.toFixed(1)}M`,        label: t(lang, "May peak views", "Pico de mayo"), sub: "Miami Diario · 2026",   delay: 1.21 },
            { display: `${Math.round(multiCount)}×`,      label: t(lang, "Reach multiplier", "Multiplicador"), sub: "Kimona · 6 semanas",  delay: 1.34 },
          ].map((s, i) => (
            <div
              key={i}
              className="glass rounded-2xl p-4 md:p-5 hover-lift"
              style={{
                opacity: sectionVisible ? 1 : 0,
                transform: sectionVisible ? "translateY(0)" : "translateY(24px)",
                transition: `opacity 0.65s ease ${s.delay}s, transform 0.65s cubic-bezier(0.2,0.8,0.2,1) ${s.delay}s`,
              }}
            >
              <div className="font-display text-2xl md:text-[2rem] text-gradient-accent leading-none">{s.display}</div>
              <div className="text-xs font-medium text-foreground/80 mt-2">{s.label}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ── ANIMATED SVG AREA CHART ── */}
        <div
          className="glass rounded-2xl p-4 md:p-5"
          style={{
            opacity: sectionVisible ? 1 : 0,
            transform: sectionVisible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.7s ease 1.55s, transform 0.7s ease 1.55s",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
              {t(lang, "Monthly reach · Kimona Atelier · 2026", "Alcance mensual · Kimona Atelier · 2026")}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-accent">
              <span className="size-1.5 rounded-full bg-accent animate-pulse" />
              +95% MoM
            </div>
          </div>

          <svg viewBox="0 0 500 72" className="w-full h-16 md:h-[5.5rem]" preserveAspectRatio="none">
            <defs>
              <linearGradient id="areaGM" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.78 0.09 65)" stopOpacity="0.38" />
                <stop offset="100%" stopColor="oklch(0.78 0.09 65)" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            {/* Gradient area fill — appears after line draws */}
            <path
              d="M0,65 C70,62 120,55 180,44 C230,34 265,20 315,11 C355,4 430,1 500,0 L500,72 L0,72 Z"
              fill="url(#areaGM)"
              style={{ opacity: sectionVisible ? 1 : 0, transition: "opacity 0.9s ease 2.4s" }}
            />
            {/* Line draws left → right */}
            <path
              d="M0,65 C70,62 120,55 180,44 C230,34 265,20 315,11 C355,4 430,1 500,0"
              stroke="oklch(0.78 0.09 65)"
              strokeWidth="1.5"
              fill="none"
              style={{
                strokeDasharray: 660,
                strokeDashoffset: sectionVisible ? 0 : 660,
                transition: "stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1) 1.9s",
                filter: "drop-shadow(0 0 5px oklch(0.78 0.09 65 / 0.65))",
              }}
            />
            {/* End-point dot pulses in */}
            <circle
              cx="500" cy="0" r="3.5" fill="oklch(0.78 0.09 65)"
              style={{ opacity: sectionVisible ? 1 : 0, transition: "opacity 0.4s ease 3.5s", filter: "drop-shadow(0 0 6px oklch(0.78 0.09 65))" }}
            />
          </svg>

          <div className="flex justify-between text-[9px] font-mono uppercase text-muted-foreground mt-1">
            {["Jan", "Feb", "Mar", "Apr", "May"].map((m) => <span key={m}>{m}</span>)}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Approach ---------------- */
function Approach() {
  const { lang } = useLang();

  const pillarTilt = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    e.currentTarget.style.transform = `perspective(1000px) rotateY(${x * 5}deg) rotateX(${-y * 3}deg)`;
  };
  const resetPillar = (e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.transform = ""; };

  const pillars = [
    { n: "01", title: t(lang, "Research", "Investigación"), body: t(lang, "We map the market, the audience, and the gap. Every decision starts from evidence, not instinct.", "Mapeamos el mercado, la audiencia y el espacio disponible. Cada decisión parte de evidencia, no de intuición.") },
    { n: "02", title: t(lang, "Strategy", "Estrategia"), body: t(lang, "Channels, cadence, and KPIs defined before anything is built. No guesswork.", "Canales, cadencia y KPIs definidos antes de construir nada. Sin suposiciones.") },
    { n: "03", title: t(lang, "Execution", "Ejecución"), body: t(lang, "Our team owns delivery. No handoffs, no briefing loops. Same people, start to finish.", "Nuestro equipo es dueño de la entrega. Sin traspasos ni loops. Las mismas personas, de inicio a fin.") },
    { n: "04", title: t(lang, "Measurement", "Medición"), body: t(lang, "Monthly reviews with real numbers. If something isn't working, we call it. No vanity metrics.", "Revisiones mensuales con números reales. Si algo no funciona, lo decimos. Sin métricas de vanidad.") },
  ];

  const [approachRef, approachVisible] = useScrollVisible(0.05);
  return (
    <section id="approach" className="snap-section relative overflow-hidden">
      {/* radial spotlight */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-[48rem] h-[48rem] rounded-full"
          style={{ background: "radial-gradient(circle, oklch(0.78 0.09 65 / 0.07) 0%, transparent 65%)" }} />
      </div>

      <div ref={approachRef} className="mx-auto max-w-6xl px-6 w-full relative">
        {/* Manifesto — each line rises behind its own clip mask */}
        <div className="mb-10 md:mb-14">
          <div className="font-display tracking-tight leading-[0.88]">
            {/* Line 1 — ghost text */}
            <div className="overflow-hidden">
              <div
                className="text-4xl md:text-7xl lg:text-8xl select-none"
                style={{
                  color: "oklch(0.95 0.015 75 / 0.18)",
                  transform: approachVisible ? "translateY(0)" : "translateY(110%)",
                  transition: "transform 1s cubic-bezier(0.2,0.8,0.2,1) 0.05s",
                }}
              >
                {t(lang, "We don't start", "No empezamos")}
              </div>
            </div>
            {/* Line 2 — accent gradient */}
            <div className="overflow-hidden">
              <div
                className="text-4xl md:text-7xl lg:text-8xl text-gradient-accent"
                style={{
                  transform: approachVisible ? "translateY(0)" : "translateY(110%)",
                  transition: "transform 1s cubic-bezier(0.2,0.8,0.2,1) 0.18s",
                }}
              >
                {t(lang, "projects.", "proyectos.")}
              </div>
            </div>
            {/* Line 3 — italic */}
            <div className="overflow-hidden mt-2">
              <div
                className="text-2xl md:text-4xl lg:text-5xl italic text-foreground/70"
                style={{
                  transform: approachVisible ? "translateY(0)" : "translateY(110%)",
                  transition: "transform 0.9s cubic-bezier(0.2,0.8,0.2,1) 0.32s",
                }}
              >
                {t(lang, "We start partnerships.", "Empezamos relaciones.")}
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-10 md:gap-16">
          {/* Left — slides from left */}
          <div
            style={{
              opacity: approachVisible ? 1 : 0,
              transform: approachVisible ? "translateX(0)" : "translateX(-28px)",
              transition: "opacity 0.75s ease 0.5s, transform 0.75s cubic-bezier(0.2,0.8,0.2,1) 0.5s",
            }}
          >
            <SectionLabel>{t(lang, "How we work", "Cómo trabajamos")}</SectionLabel>
            <p className="text-muted-foreground max-w-sm text-sm md:text-base leading-relaxed">
              {t(lang,
                "Every engagement runs on the same four-phase methodology, regardless of scale. No exceptions, no shortcuts.",
                "Cada trabajo corre sobre la misma metodología de cuatro fases, sin importar el tamaño. Sin excepciones ni atajos."
              )}
            </p>
            <div
              className="mt-6 inline-flex items-start gap-3 glass-subtle rounded-xl px-5 py-4 border border-white/[0.07]"
              style={{
                opacity: approachVisible ? 1 : 0,
                transform: approachVisible ? "translateY(0)" : "translateY(16px)",
                transition: "opacity 0.65s ease 0.75s, transform 0.65s ease 0.75s",
              }}
            >
              <span className="size-2 rounded-full bg-accent shadow-[0_0_10px_var(--accent)] animate-pulse mt-1 shrink-0" />
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">{t(lang, "Current availability", "Disponibilidad actual")}</div>
                <div className="text-sm font-medium mt-0.5">{t(lang, "2 spots open · Q3 2026", "2 cupos disponibles · Q3 2026")}</div>
              </div>
            </div>
          </div>

          {/* Right — pillars slide from right, staggered */}
          <div
            className="space-y-2.5"
            style={{ transition: "transform 0.2s ease-out" }}
            onMouseMove={pillarTilt} onMouseLeave={resetPillar}
          >
            {pillars.map((p, i) => (
              <div
                key={p.n}
                style={{
                  opacity: approachVisible ? 1 : 0,
                  transform: approachVisible ? "translateX(0)" : "translateX(32px)",
                  transition: `opacity 0.7s ease ${0.55 + i * 0.1}s, transform 0.7s cubic-bezier(0.2,0.8,0.2,1) ${0.55 + i * 0.1}s`,
                }}
                className="group relative glass-subtle rounded-xl border border-white/[0.07] px-5 py-4 flex gap-4 items-start overflow-hidden hover-lift"
              >
                <div className="absolute left-0 top-0 bottom-0 w-[2px] rounded-r bg-accent/0 group-hover:bg-accent/70 transition-all duration-500" />
                <span className="font-mono text-[10px] shrink-0 mt-1 text-accent/50 group-hover:text-accent transition-colors duration-300">{p.n}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-lg md:text-xl group-hover:text-gradient-accent transition-colors duration-300">{p.title}</div>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1 leading-relaxed">{p.body}</p>
                </div>
                <span className="ml-auto shrink-0 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 text-accent transition-all duration-300 text-sm">→</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Index ---------------- */
function Index() {
  const [lang, setLang] = useState<Lang>("en");
  const [scrolled, setScrolled] = useState(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 60);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const go = (id: string) => {
    const el = document.getElementById(id);
    if (el && scrollerRef.current) {
      scrollerRef.current.scrollTo({ top: el.offsetTop, behavior: "smooth" });
    }
  };
  return (
    <LangCtx.Provider value={{ lang, setLang }}>
      <div className="relative z-10">
        <Nav go={go} scrolled={scrolled} />
        <main ref={scrollerRef} className="snap-page">
          <Hero go={go} scrolled={scrolled} />
          <Services />
          <DeckSection />
          <Work />
          <Metrics />
          <Approach />
          <FAQ />
          <DiscoveryCTA />
          <Footer />
        </main>
      </div>
    </LangCtx.Provider>
  );
}
