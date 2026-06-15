import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SubPageLayout, SectionLabel, useLang, t, useScrollVisible } from "../lib/oasis-shared";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Oasis Studio" },
      { name: "description", content: "Direct answers to the questions we hear most — no jargon, no detours." },
    ],
  }),
  component: FAQPage,
});

function FAQ() {
  const { lang } = useLang();
  const faqs = lang === "en"
    ? [
        { q: "Do you replace our internal team?",             a: "No. We work as an extension of your team. We take on what you can't cover internally and adapt to how you already work." },
        { q: "Do you work by project or by monthly retainer?", a: "We work with a continuous monthly partnership. The results we show are built with consistency, not one-off efforts." },
        { q: "Do I need to have my brand ready to start?",    a: "No. If your brand doesn't exist yet or needs a refresh, we start from there. If it's already defined, we integrate with your guidelines and carry them across every channel." },
        { q: "How do we measure that it's working?",          a: "We define clear metrics from the start based on your goals: sales, booked appointments, reach, followers or web traffic. You receive periodic reports in plain language, no jargon." },
      ]
    : [
        { q: "¿Reemplazan a nuestro equipo interno?",         a: "No. Trabajamos como una extensión de tu equipo. Asumimos lo que no alcanzan a cubrir internamente y nos sumamos a la forma de trabajar que ya tienen." },
        { q: "¿Trabajan por proyecto o por mensualidad?",     a: "Trabajamos con un acompañamiento mensual continuo. Los resultados que mostramos se construyen con consistencia, no con esfuerzos aislados de una sola vez." },
        { q: "¿Necesito tener mi marca lista para empezar?",  a: "No. Si tu marca aún no existe o necesita refrescarse, partimos desde ahí. Si ya está definida, nos integramos a tus lineamientos y los llevamos a todos los canales." },
        { q: "¿Cómo medimos que está funcionando?",           a: "Definimos métricas claras desde el inicio según tus objetivos: ventas, citas agendadas, alcance, seguidores o tráfico web. Recibes reportes periódicos en lenguaje simple, sin tecnicismos." },
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

function FAQPage() {
  return (
    <SubPageLayout>
      <FAQ />
    </SubPageLayout>
  );
}
