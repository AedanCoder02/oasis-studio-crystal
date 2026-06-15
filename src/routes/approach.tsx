import { createFileRoute } from "@tanstack/react-router";
import { SubPageLayout, SectionLabel, useLang, t, useScrollVisible } from "../lib/oasis-shared";

export const Route = createFileRoute("/approach")({
  head: () => ({
    meta: [
      { title: "Approach — Oasis Studio" },
      { name: "description", content: "Our four-phase methodology: Research, Strategy, Execution, Measurement. No exceptions, no shortcuts." },
    ],
  }),
  component: ApproachPage,
});

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
    { n: "01", title: t(lang, "Research",    "Investigación"), body: t(lang, "We map the market, the audience, and the gap. Every decision starts from evidence, not instinct.",                                                   "Mapeamos el mercado, la audiencia y el espacio disponible. Cada decisión parte de evidencia, no de intuición.") },
    { n: "02", title: t(lang, "Strategy",    "Estrategia"),    body: t(lang, "Channels, cadence, and KPIs defined before anything is built. No guesswork.",                                                                      "Canales, cadencia y KPIs definidos antes de construir nada. Sin suposiciones.") },
    { n: "03", title: t(lang, "Execution",   "Ejecución"),     body: t(lang, "Our team owns delivery. No handoffs, no briefing loops. Same people, start to finish.",                                                            "Nuestro equipo es dueño de la entrega. Sin traspasos ni loops. Las mismas personas, de inicio a fin.") },
    { n: "04", title: t(lang, "Measurement", "Medición"),      body: t(lang, "Monthly reviews with real numbers. If something isn't working, we call it. No vanity metrics.",                                                    "Revisiones mensuales con números reales. Si algo no funciona, lo decimos. Sin métricas de vanidad.") },
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

function ApproachPage() {
  return (
    <SubPageLayout>
      <Approach />
    </SubPageLayout>
  );
}
