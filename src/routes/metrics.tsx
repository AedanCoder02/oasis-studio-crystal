import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SubPageLayout, SectionLabel, useLang, t, useScrollVisible } from "../lib/oasis-shared";

export const Route = createFileRoute("/metrics")({
  head: () => ({
    meta: [
      { title: "Metrics — Oasis Studio" },
      { name: "description", content: "Measured impact across our active partnerships — views, community growth, and reach multipliers." },
    ],
  }),
  component: MetricsPage,
});

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

function Metrics() {
  const { lang } = useLang();
  const [sectionRef, sectionVisible] = useScrollVisible(0.04);

  const mainCount      = useCountWhen(38.2, 2600, sectionVisible);
  const communityCount = useCountWhen(253,  2100, sectionVisible);
  const growthCount    = useCountWhen(95,   1900, sectionVisible);
  const peakCount      = useCountWhen(7.9,  2300, sectionVisible);
  const multiCount     = useCountWhen(6,    1500, sectionVisible);

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
            { display: `${Math.round(communityCount)}K+`, label: t(lang, "Community",     "Comunidad"),          sub: "Miami Diario",          delay: 0.95 },
            { display: `+${Math.round(growthCount)}%`,    label: t(lang, "Monthly reach", "Alcance mens."),      sub: "Kimona · Mar–May 2026", delay: 1.08 },
            { display: `${peakCount.toFixed(1)}M`,        label: t(lang, "May peak views", "Pico de mayo"),      sub: "Miami Diario · 2026",   delay: 1.21 },
            { display: `${Math.round(multiCount)}×`,      label: t(lang, "Reach multiplier","Multiplicador"),    sub: "Kimona · 6 semanas",    delay: 1.34 },
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
            <path
              d="M0,65 C70,62 120,55 180,44 C230,34 265,20 315,11 C355,4 430,1 500,0 L500,72 L0,72 Z"
              fill="url(#areaGM)"
              style={{ opacity: sectionVisible ? 1 : 0, transition: "opacity 0.9s ease 2.4s" }}
            />
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

function MetricsPage() {
  return (
    <SubPageLayout>
      <Metrics />
    </SubPageLayout>
  );
}
