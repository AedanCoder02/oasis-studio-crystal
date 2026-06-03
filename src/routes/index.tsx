import { createFileRoute } from "@tanstack/react-router";
import { createContext, useContext, useEffect, useRef, useState } from "react";
const oasisLogo = "/assets/oasis-logo.png";

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
              className="h-7 md:h-8 w-auto"
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
  kimona: { label: "Kimona Telier", handle: "@kimonatelier", tag: "E-commerce · Editorial · Brand" },
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
  return (
    <section id="services" className="snap-section relative">
      <div className="mx-auto max-w-6xl px-6 w-full">
        <Reveal><SectionLabel>{t(lang, "What we do", "Qué hacemos")}</SectionLabel></Reveal>
        <Reveal delay={1}>
          <h2 className="font-display text-3xl md:text-5xl leading-[1.05] tracking-tight max-w-3xl text-balance">
            {t(lang, "Four fronts. One ", "Cuatro frentes. Un ")}
            <em className="text-accent">{t(lang, "measurable", "sistema")}</em>
            {t(lang, " system.", " medible.")}
          </h2>
        </Reveal>
        <Reveal delay={2} className="mt-4 max-w-xl text-muted-foreground text-base md:text-lg">
          {t(lang, "We don't offer standalone services — we offer the discernment that makes them function as a single piece.", "No ofrecemos servicios sueltos — ofrecemos el criterio que los hace funcionar como una sola pieza.")}
        </Reveal>
        <div className="mt-8 md:mt-10 grid md:grid-cols-2 gap-3 md:gap-4">
          {items.map((it, i) => (
            <Reveal key={it.n} delay={((i % 4) + 1) as 1 | 2 | 3 | 4}>
              <article className="glass hover-lift rounded-2xl p-5 md:p-6 group h-full">
                <div className="flex items-start justify-between mb-6">
                  <span className="font-mono text-xs text-muted-foreground">{it.n}</span>
                  <span className="size-8 rounded-full glass-subtle flex items-center justify-center text-muted-foreground group-hover:text-accent transition-colors">→</span>
                </div>
                <h3 className="font-display text-2xl md:text-3xl mb-2">{it.title}</h3>
                <p className="text-muted-foreground text-sm md:text-base text-pretty mb-4">{it.body}</p>
                <div className="flex flex-wrap gap-1.5">
                  {it.tags.map((t) => (
                    <span key={t} className="text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-full glass-subtle text-muted-foreground">{t}</span>
                  ))}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Work (portfolio) ---------------- */
function Work() {
  const { lang } = useLang();
  const projects = [
    { name: "Kimona Telier", tag: "E-Commerce · Shopify", url: "kimonatelier.com", href: "https://kimonatelier.com/", img: "/assets/1.png" },
    { name: "The Legacy Holding", tag: "Corporate · Real Estate", url: "thelegacyholding.com", href: "https://www.thelegacyholding.com", img: "/assets/2.png" },
    { name: "Oasis Yacht Club", tag: "Luxury · Marine", url: "by0gch-qd.myshopify.com", href: "https://by0gch-qd.myshopify.com/", img: "/assets/3.png" },
    { name: "Universe Media", tag: "News · Digital Media", url: "universe-media-two.vercel.app", href: "https://universe-media-two.vercel.app/", img: "/assets/4.png" },
    { name: "Ishin Academy", tag: "Education · Framer", url: "ishinacademy.framer.website", href: "https://ishinacademy.framer.website/", img: "/assets/5.png" },
    { name: "Aurélia", tag: "Beauty · Branding · Web", url: "aureliaesthetics.lovable.app", href: "https://aureliaesthetics.lovable.app/", img: "/assets/6.png" },
  ];
  return (
    <section id="work" className="snap-section relative">
      <div className="mx-auto max-w-6xl px-6 w-full">
        <Reveal><SectionLabel>{t(lang, "Selected work", "Trabajo seleccionado")}</SectionLabel></Reveal>
        <Reveal delay={1}>
          <h2 className="font-display text-3xl md:text-5xl tracking-tight max-w-3xl">
            {t(lang, "Built for the ", "Hecho para los ")}
            <em className="text-accent">{t(lang, "bold.", "audaces.")}</em>
          </h2>
        </Reveal>
        <div className="mt-8 md:mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {projects.map((p, i) => (
            <Reveal key={p.name} delay={((i % 4) + 1) as 1 | 2 | 3 | 4}>
              <a href={p.href} target="_blank" rel="noopener noreferrer" className="glass hover-lift rounded-2xl overflow-hidden group block">
                <div className="relative border-b border-white/10">
                  <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/10 bg-white/[0.03]">
                    <span className="size-2 rounded-full bg-white/20" />
                    <span className="size-2 rounded-full bg-white/20" />
                    <span className="size-2 rounded-full bg-white/20" />
                    <span className="ml-2 text-[10px] font-mono text-muted-foreground truncate">{p.url}</span>
                  </div>
                  <div className="aspect-[16/10] relative overflow-hidden bg-black/30">
                    <img src={p.img} alt={`${p.name} preview`} loading="lazy" className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.04]" />
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
            </Reveal>
          ))}
        </div>
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
  return (
    <section id="faq" className="snap-section relative">
      <div className="mx-auto max-w-6xl px-6 w-full">
        <div className="flex items-baseline justify-between">
          <Reveal><SectionLabel>{t(lang, "Frequent conversations", "Conversaciones frecuentes")}</SectionLabel></Reveal>
          <Reveal className="hidden md:block text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
            {t(lang, "What people usually ask us", "Lo que suelen preguntarnos")}
          </Reveal>
        </div>
        <Reveal delay={1}>
          <h2 className="font-display text-3xl md:text-5xl tracking-tight max-w-2xl text-balance">
            {t(lang, "Direct answers, no ", "Respuestas directas, sin ")}
            <em className="text-accent">{t(lang, "detours.", "rodeos.")}</em>
          </h2>
        </Reveal>
        <div className="mt-10 border-t border-white/10">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={f.q} delay={((i % 4) + 1) as 1 | 2 | 3 | 4}>
                <div className="border-b border-white/10">
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="w-full grid grid-cols-12 gap-3 md:gap-6 py-5 md:py-7 text-left items-start"
                  >
                    <span className="col-span-2 md:col-span-1 font-mono text-[10px] text-muted-foreground pt-1">0{i + 1}</span>
                    <span className="col-span-10 md:col-span-5 font-display text-lg md:text-2xl text-foreground">{f.q}</span>
                    <span className={`col-span-12 md:col-span-5 text-sm md:text-base text-muted-foreground overflow-hidden transition-all duration-500 ${isOpen ? "max-h-40 opacity-100" : "max-h-0 md:max-h-40 opacity-0 md:opacity-100"}`}>
                      {f.a}
                    </span>
                    <span className="hidden md:flex col-span-1 justify-end pt-1 text-muted-foreground">{isOpen ? "−" : "+"}</span>
                  </button>
                </div>
              </Reveal>
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
  return (
    <section id="contact" className="snap-section relative">
      <div className="mx-auto max-w-6xl px-6 w-full">
        <div className="flex items-baseline justify-between">
          <Reveal><SectionLabel>{t(lang, "Next steps", "Próximos pasos")}</SectionLabel></Reveal>
          <Reveal className="text-[10px] font-mono uppercase tracking-[0.25em] text-accent">
            {t(lang, "2 spots · Q3 2026 cohort", "2 cupos · Cohorte Q3 2026")}
          </Reveal>
        </div>
        <Reveal delay={1}>
          <h2 className="font-display text-4xl md:text-7xl leading-[1] tracking-tight max-w-4xl text-balance">
            {t(lang, "Every partnership begins with a ", "Toda relación comienza con una ")}
            <em className="text-accent">{t(lang, "decision.", "decisión.")}</em>
          </h2>
        </Reveal>
        <div className="mt-10 grid md:grid-cols-3 gap-3 md:gap-4 border-t border-white/10 pt-6">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={((i % 4) + 1) as 1 | 2 | 3 | 4}>
              <div className="glass rounded-xl p-5 md:p-6 h-full hover-lift">
                <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-accent">{s.n}</div>
                <div className="font-display text-2xl mt-3">{s.t}</div>
                <p className="text-muted-foreground text-sm mt-2">{s.b}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={2} className="mt-8 flex flex-wrap items-center gap-4">
          <a
            href="mailto:hello@oasisstudio.co"
            className="rounded-md border border-accent/60 text-accent px-6 py-3.5 text-xs font-mono uppercase tracking-[0.22em] hover:bg-accent/10 transition-colors"
          >
            {t(lang, "Book a Discovery Call", "Reservar Discovery Call")}
          </a>
          <a href="mailto:hello@oasisstudio.co" className="text-xs font-mono uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground transition-colors">
            hello@oasisstudio.co
          </a>
        </Reveal>
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

  const tilt = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    e.currentTarget.style.transform = `perspective(600px) rotateY(${x * 14}deg) rotateX(${-y * 10}deg) translateZ(6px)`;
  };
  const resetTilt = (e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.transform = ""; };

  const stats = [
    { v: "38.2M", l: t(lang, "Cumulative views", "Vistas acumuladas"), sub: t(lang, "All active channels", "Todos los canales") },
    { v: "253K+", l: t(lang, "Community built", "Comunidad construida"), sub: "Miami Diario" },
    { v: "6×", l: t(lang, "Reach multiplier", "Multiplicador de alcance"), sub: "Kimona · Mar–May 2026" },
    { v: "0→1", l: t(lang, "Brand from zero", "Marca desde cero"), sub: t(lang, "Aurélia · naming to live", "Aurélia · de naming a live") },
  ];

  const marqueeItems = [
    "38.2M views", "253K+ community", "6× reach growth", "0→1 brand built",
    "3 active partnerships", "+95% MoM Kimona", "7.9M views/month", "38.2M views",
    "253K+ community", "6× reach growth", "0→1 brand built", "3 active partnerships",
  ];

  const chartBars = [
    { l: "Jan", v: 18 }, { l: "Feb", v: 22 },
    { l: "Mar", v: 38 }, { l: "Apr", v: 55 }, { l: "May", v: 100 },
  ];

  return (
    <section id="metrics" className="snap-section relative overflow-hidden">
      {/* ambient glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/3 h-96 w-96 rounded-full bg-accent/10 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full blur-[80px]" style={{ background: "oklch(0.78 0.09 65 / 0.07)" }} />
      </div>

      {/* marquee ticker */}
      <div className="overflow-hidden border-b border-white/[0.06] mb-8">
        <div className="flex animate-marquee whitespace-nowrap py-2.5 gap-10">
          {marqueeItems.map((m, i) => (
            <span key={i} className="inline-flex items-center gap-2.5 text-[10px] font-mono uppercase tracking-[0.28em] text-accent/50 shrink-0">
              <span className="size-1 rounded-full bg-accent/40" />
              {m}
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 w-full relative">
        <Reveal>
          <SectionLabel>{t(lang, "Measured impact", "Impacto medido")}</SectionLabel>
          <h2 className="font-display text-4xl md:text-6xl tracking-tight leading-[1]">
            {t(lang, "Numbers that ", "Números que ")}
            <em className="text-gradient-accent">{t(lang, "speak.", "hablan.")}</em>
          </h2>
        </Reveal>

        {/* 4 stat cards with 3D tilt */}
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {stats.map((s, i) => (
            <Reveal key={s.v} delay={((i % 4) + 1) as 1 | 2 | 3 | 4}>
              <div
                className="tilt-card glass rounded-2xl p-5 md:p-7 flex flex-col gap-1 h-full cursor-default select-none"
                onMouseMove={tilt} onMouseLeave={resetTilt}
              >
                <div className="font-display text-[2.6rem] md:text-[3.4rem] leading-none text-gradient-accent">{s.v}</div>
                <div className="text-sm font-medium text-foreground/90 mt-2">{s.l}</div>
                <div className="text-[11px] text-muted-foreground">{s.sub}</div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* animated bar chart */}
        <Reveal delay={4} className="mt-4">
          <div className="glass rounded-2xl p-5 md:p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
                {t(lang, "Monthly reach · Kimona Telier · 2026", "Alcance mensual · Kimona Telier · 2026")}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-accent">
                <span className="size-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--accent)] animate-pulse" />
                +95% MoM
              </div>
            </div>
            <div className="flex items-end gap-3 h-20">
              {chartBars.map((b, i) => (
                <div key={b.l} className="flex flex-col items-center gap-1.5 flex-1">
                  <div
                    className="w-full rounded-t origin-bottom"
                    style={{
                      height: `${Math.round(b.v * 0.65)}px`,
                      background: `linear-gradient(to top, oklch(0.78 0.09 65 / 0.15), oklch(0.78 0.09 65 / ${0.35 + b.v * 0.006}))`,
                      animation: `bar-scale 0.7s cubic-bezier(0.2,0.8,0.2,1) ${i * 0.1 + 0.4}s both`,
                    }}
                  />
                  <span className="text-[9px] font-mono uppercase text-muted-foreground">{b.l}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
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

  return (
    <section id="approach" className="snap-section relative overflow-hidden">
      {/* radial spotlight */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-[48rem] h-[48rem] rounded-full"
          style={{ background: "radial-gradient(circle, oklch(0.78 0.09 65 / 0.07) 0%, transparent 65%)" }} />
      </div>

      <div className="mx-auto max-w-6xl px-6 w-full relative">
        {/* manifesto headline — full width, dramatic */}
        <Reveal className="mb-10 md:mb-14">
          <div className="font-display tracking-tight leading-[0.88] overflow-hidden">
            <div className="text-4xl md:text-7xl lg:text-8xl select-none" style={{ color: "oklch(0.95 0.015 75 / 0.18)" }}>
              {t(lang, "We don't start", "No empezamos")}
            </div>
            <div className="text-4xl md:text-7xl lg:text-8xl text-gradient-accent">
              {t(lang, "projects.", "proyectos.")}
            </div>
            <div className="text-2xl md:text-4xl lg:text-5xl italic text-foreground/70 mt-2">
              {t(lang, "We start partnerships.", "Empezamos relaciones.")}
            </div>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-10 md:gap-16">
          {/* left: context */}
          <div>
            <Reveal>
              <SectionLabel>{t(lang, "How we work", "Cómo trabajamos")}</SectionLabel>
              <p className="text-muted-foreground max-w-sm text-sm md:text-base leading-relaxed">
                {t(lang,
                  "Every engagement runs on the same four-phase methodology, regardless of scale. No exceptions, no shortcuts.",
                  "Cada trabajo corre sobre la misma metodología de cuatro fases, sin importar el tamaño. Sin excepciones ni atajos."
                )}
              </p>
            </Reveal>
            <Reveal delay={2} className="mt-6">
              <div className="inline-flex items-start gap-3 glass-subtle rounded-xl px-5 py-4 border border-white/[0.07]">
                <span className="size-2 rounded-full bg-accent shadow-[0_0_10px_var(--accent)] animate-pulse mt-1 shrink-0" />
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">{t(lang, "Current availability", "Disponibilidad actual")}</div>
                  <div className="text-sm font-medium mt-0.5">{t(lang, "2 spots open · Q3 2026", "2 cupos disponibles · Q3 2026")}</div>
                </div>
              </div>
            </Reveal>
          </div>

          {/* right: pillars with 3D tilt on container */}
          <div
            className="space-y-2.5"
            style={{ transition: "transform 0.2s ease-out" }}
            onMouseMove={pillarTilt} onMouseLeave={resetPillar}
          >
            {pillars.map((p, i) => (
              <Reveal key={p.n} delay={((i % 4) + 1) as 1 | 2 | 3 | 4}>
                <div className="group relative glass-subtle rounded-xl border border-white/[0.07] px-5 py-4 flex gap-4 items-start overflow-hidden hover-lift">
                  {/* animated left accent bar */}
                  <div className="absolute left-0 top-0 bottom-0 w-[2px] rounded-r bg-accent/0 group-hover:bg-accent/70 transition-all duration-500" />
                  <span className="font-mono text-[10px] shrink-0 mt-1 text-accent/50 group-hover:text-accent transition-colors duration-300">{p.n}</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-lg md:text-xl group-hover:text-gradient-accent transition-colors duration-300">{p.title}</div>
                    <p className="text-xs md:text-sm text-muted-foreground mt-1 leading-relaxed">{p.body}</p>
                  </div>
                  <span className="ml-auto shrink-0 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 text-accent transition-all duration-300 text-sm">→</span>
                </div>
              </Reveal>
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
