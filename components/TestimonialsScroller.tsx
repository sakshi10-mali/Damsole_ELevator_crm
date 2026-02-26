"use client";

import React, { useEffect, useState } from "react";
import { testimonialsAPI } from "@/lib/api";
import { IoChatbubbles } from "react-icons/io5";

export default function TestimonialsScroller() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const data = await testimonialsAPI.getAll(); // backend returns only approved for public
        if (!mounted) return;
        const list = Array.isArray(data) ? data : [];

        // Pick up to 3 unique testimonials for a single scroll (prefer first/latest)
        let selected = list.slice(0, 3);
        // If fewer than 3 available, repeat items to reach 3 (keeps smooth scroll)
        if (selected.length > 0) {
          let i = 0;
          while (selected.length < 3) {
            selected.push(list[i % list.length]);
            i++;
          }
        }

        // normalized set to exactly the 3 items we'll show per loop
        const normalized = selected.slice();

        // Duplicate once more for seamless infinite scroll but avoid immediate repetition:
        // rotate the second copy so the same testimonial isn't adjacent to its duplicate.
        const len = normalized.length;
        const offset = len > 1 ? Math.floor(len / 2) : 0;
        const rotated = offset > 0 ? normalized.slice(offset).concat(normalized.slice(0, offset)) : normalized.slice();
        const doubled = normalized.concat(rotated);
        setItems(doubled);
      } catch (err) {
        console.error("Failed to load testimonials", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4 text-center text-gray-500">Loading testimonials…</div>
      </section>
    );
  }

  if (!items || items.length === 0) {
    return null;
  }

  // Duration controls speed; base per original unique items count
  const uniqueCount = Math.max(1, Math.floor(items.length / 2));
  const secondsPerItem = 6; // controls speed; tweak for smoothness
  const duration = Math.max(18, uniqueCount * secondsPerItem);

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <p className="text-sm sm:text-base font-semibold text-gray-600 uppercase tracking-wider mb-2">
            TESTIMONIALS
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
            Trusted by Our Happy Clients
          </h2>
        </div>

        <div className="relative">
          {/* optional fade overlays */}
          <div className="pointer-events-none hidden md:block absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none hidden md:block absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent" />

          <div className="overflow-hidden">
            <div
              className="scroll-wrap"
              style={{}}
            >
              <div
                className="scroll-track flex gap-4 items-stretch py-2"
                style={{
                  animation: `scroll ${duration}s linear infinite`,
                }}
              >
                {items.map((t: any, idx: number) => (
                  <article
                    key={`${t.id || idx}-${idx}`}
                    className="min-w-[320px] sm:min-w-[420px] bg-white rounded-[18px] border border-gray-100 shadow-lg p-6 sm:p-8 min-h-[220px] flex flex-col hover:-translate-y-1 hover:shadow-2xl transition-transform duration-300"
                    role="group"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                        {t.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={t.image} alt={t.customerName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500 font-semibold">
                            {String(t.customerName || "U").slice(0,2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{t.customerName}</div>
                        <div className="text-xs text-gray-500">{t.companyName || ""}</div>
                      </div>
                      <div className="ml-auto text-sm text-gray-400">{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : ""}</div>
                    </div>

                    <div className="text-yellow-400 mb-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={i < (t.rating || 0) ? "" : "text-gray-200"}>★</span>
                      ))}
                    </div>

                    <div className="text-gray-700 text-sm leading-relaxed flex-1">{t.message}</div>

                    <div className="mt-4 text-gray-400 text-6xl opacity-10 absolute right-8 top-8 pointer-events-none">
                      <IoChatbubbles />
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>

      <style jsx>{`
        .scroll-wrap { overflow: hidden; }
        .scroll-track {
          display: flex;
          align-items: stretch;
          will-change: transform;
        }
        .scroll-wrap:hover .scroll-track { animation-play-state: paused; }
        @keyframes scroll {
          from { transform: translate3d(0,0,0); }
          to { transform: translate3d(-50%,0,0); }
        }
        @media (max-width: 640px) {
          .scroll-track { gap: 12px; }
        }
      `}</style>
    </section>
  );
}


