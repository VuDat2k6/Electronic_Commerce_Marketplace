"use client";

import { ArrowRight, ChevronLeft, ChevronRight, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { heroSlides } from "@/lib/demo-data";

const AUTOPLAY_MS = 6000;
const slideBackgrounds = [
  "linear-gradient(135deg, #4c1d95 0%, #7e22ce 34%, #db2777 66%, #f97316 100%)",
  "linear-gradient(135deg, #0f172a 0%, #1d4ed8 42%, #06b6d4 100%)",
  "linear-gradient(135deg, #111827 0%, #4f46e5 38%, #ec4899 100%)",
  "linear-gradient(135deg, #831843 0%, #e11d48 46%, #f59e0b 100%)",
];

export function HeroSlider() {
  const slides = useMemo(() => heroSlides.slice(0, 4), []);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSlide = slides[activeIndex];

  const goToSlide = useCallback((index: number) => {
    setActiveIndex((index + slides.length) % slides.length);
  }, [slides.length]);

  const goNext = useCallback(() => {
    goToSlide(activeIndex + 1);
  }, [activeIndex, goToSlide]);

  const goPrevious = useCallback(() => {
    goToSlide(activeIndex - 1);
  }, [activeIndex, goToSlide]);

  useEffect(() => {
    const timer = window.setInterval(goNext, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [goNext]);

  return (
    <section
      className="relative overflow-hidden text-white"
      style={{ background: slideBackgrounds[activeIndex] || slideBackgrounds[0] }}
      aria-label="Featured marketplace promotions"
    >
      <motion.div
        className="absolute inset-0"
        animate={{ backgroundPosition: ["0% 0%", "100% 70%", "0% 0%"] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        style={{
          backgroundImage:
            "radial-gradient(circle at 18% 20%, rgba(255,255,255,.35), transparent 24%), radial-gradient(circle at 80% 20%, rgba(250,204,21,.35), transparent 22%), radial-gradient(circle at 70% 82%, rgba(6,182,212,.32), transparent 26%), linear-gradient(120deg, rgba(0,0,0,.22), rgba(0,0,0,.04))",
          backgroundSize: "180% 180%",
        }}
      />
      <motion.div
        className="absolute -left-32 top-20 h-80 w-80 rounded-full bg-white/20 blur-3xl"
        animate={{ x: [0, 90, 0], y: [0, -30, 0], scale: [1, 1.18, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-24 bottom-10 h-96 w-96 rounded-full bg-yellow-300/25 blur-3xl"
        animate={{ x: [0, -80, 0], y: [0, 40, 0], scale: [1, 1.12, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative mx-auto grid min-h-[620px] max-w-7xl items-center gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:py-16">
        <div className="z-10 max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlide.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            >
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-semibold shadow-lg backdrop-blur-md">
                <Sparkles className="h-4 w-4" />
                <span>{activeSlide.badge} DROP</span>
                {activeSlide.discount && (
                  <span className="rounded-full bg-yellow-300 px-2.5 py-1 text-xs font-black text-gray-950">
                    {activeSlide.discount}
                  </span>
                )}
              </div>

              <h2 className="text-4xl font-black leading-[1.02] tracking-normal sm:text-5xl lg:text-7xl">
                {activeSlide.title}
                <span className="block text-white/85">{activeSlide.subtitle}</span>
              </h2>

              <p className="mt-6 max-w-xl text-base leading-7 text-white/88 sm:text-lg">
                {activeSlide.description}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={activeSlide.link}
                  className="inline-flex items-center justify-center gap-3 rounded-full bg-white px-7 py-3.5 text-sm font-black text-gray-950 shadow-2xl transition hover:-translate-y-0.5 hover:shadow-white/30"
                >
                  {activeSlide.cta}
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/shop"
                  className="inline-flex items-center justify-center rounded-full border border-white/35 bg-white/10 px-7 py-3.5 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/20"
                >
                  Explore electronics
                </Link>
              </div>

              <div className="mt-9 grid max-w-xl grid-cols-3 gap-3 text-xs font-semibold text-white/90 sm:text-sm">
                <div className="rounded-2xl border border-white/20 bg-white/12 px-3 py-3 backdrop-blur-md">
                  <ShieldCheck className="mb-2 h-5 w-5" />
                  Verified sellers
                </div>
                <div className="rounded-2xl border border-white/20 bg-white/12 px-3 py-3 backdrop-blur-md">
                  <Truck className="mb-2 h-5 w-5" />
                  Fast delivery
                </div>
                <div className="rounded-2xl border border-white/20 bg-white/12 px-3 py-3 backdrop-blur-md">
                  <Sparkles className="mb-2 h-5 w-5" />
                  Premium picks
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlide.id}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(_, info) => {
                if (info.offset.x < -80) goNext();
                if (info.offset.x > 80) goPrevious();
              }}
              initial={{ opacity: 0, x: 80, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -80, scale: 0.96 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="relative mx-auto aspect-[4/3] w-full max-w-[680px] cursor-grab rounded-[2rem] border border-white/25 bg-white/12 p-3 shadow-2xl backdrop-blur-md active:cursor-grabbing"
            >
              <div className="relative h-full overflow-hidden rounded-[1.5rem] bg-gray-950/15">
                <Image
                  src={activeSlide.image}
                  alt={`${activeSlide.title} ${activeSlide.subtitle}`}
                  fill
                  priority={activeIndex === 0}
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 680px"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-5">
                  <p className="text-sm font-semibold uppercase tracking-wide text-white/75">Featured offer</p>
                  <p className="text-2xl font-black">{activeSlide.title} {activeSlide.subtitle}</p>
                </div>
              </div>
              {activeSlide.discount && (
                <motion.div
                  key={`voucher-badge-${activeSlide.id}`}
                  initial={{ opacity: 0, y: -14, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -14, scale: 0.92 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  className="absolute -right-2 top-8 rounded-2xl bg-yellow-300 px-4 py-3 text-gray-950 shadow-xl sm:right-4"
                >
                  <span className="block text-xs font-bold uppercase text-gray-700">Voucher</span>
                  <span className="mt-0.5 block text-lg font-black">{activeSlide.discount} OFF</span>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="relative z-20 mx-auto -mt-16 flex max-w-7xl items-center justify-between gap-4 px-4 pb-8 sm:px-6">
        <div className="flex gap-2">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => goToSlide(index)}
              className={`h-2.5 rounded-full transition-all ${activeIndex === index ? "w-10 bg-white" : "w-2.5 bg-white/40 hover:bg-white/70"}`}
              aria-label={`Show promotion ${index + 1}`}
            />
          ))}
        </div>

        <div className="hidden gap-2 sm:flex">
          <button
            type="button"
            onClick={goPrevious}
            className="rounded-full border border-white/25 bg-white/15 p-3 backdrop-blur-md transition hover:bg-white/25"
            aria-label="Previous promotion"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={goNext}
            className="rounded-full border border-white/25 bg-white/15 p-3 backdrop-blur-md transition hover:bg-white/25"
            aria-label="Next promotion"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}

export default HeroSlider;
