import React from 'react';
import { motion } from 'framer-motion';

const images = [
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/65d445a5d_gallery-1.jpg',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/ca1a4b708_gallery-4.jpg',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/8fd84c0f9_gallery-5.jpg',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/d452179f1_gallery-6.jpg',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/a50050fa3_gallery-7.jpg',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/7db741baa_gallery-8.jpg',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/ca17baedd_gallery-9.jpg',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/8066fc0e3_gallery-10.jpg',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/508e1e578_gallery-11.jpg',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/a3525bd44_gallery-12.jpg',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/d71c5f8f3_minimalistic-25-g.jpg',
];

const CARD_W = 320;
const GAP = 16;
// Width of exactly one full set — used as the seamless loop offset
const LOOP_PX = images.length * (CARD_W + GAP); // 11 × 336 = 3696 px

// Row 1: original order, scrolls left
const ROW1 = [...images, ...images, ...images];

// Row 2: reversed order for visual contrast, scrolls right
const ROW2 = [...[...images].reverse(), ...[...images].reverse(), ...[...images].reverse()];

// Shared CSS edge-fade mask for both rows
const MASK_STYLE = {
  maskImage:
    'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
  WebkitMaskImage:
    'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
};

/**
 * A single infinite-scroll marquee row.
 * direction='left'  → strip moves from x=0 to x=-LOOP_PX (content enters from right)
 * direction='right' → strip moves from x=-LOOP_PX to x=0  (content enters from left)
 *
 * Both directions are seamless because the strip contains 3× the images,
 * so the content at x=0 is visually identical to the content at x=-LOOP_PX.
 */
function MarqueeRow({ strip, direction, duration }) {
  const xAnim = direction === 'left' ? [0, -LOOP_PX] : [-LOOP_PX, 0];

  return (
    <div className="relative w-full overflow-hidden" style={MASK_STYLE}>
      <motion.div
        className="flex"
        style={{ gap: GAP }}
        animate={{ x: xAnim }}
        transition={{
          duration,
          repeat: Infinity,
          ease: 'linear',
          repeatType: 'loop',
        }}
      >
        {strip.map((src, i) => (
          <div
            key={i}
            className="flex-shrink-0 rounded-2xl overflow-hidden shadow-xl"
            style={{ width: CARD_W, height: 230 }}
          >
            <img
              src={src}
              alt={`IwHome showroom ${(i % images.length) + 1}`}
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              loading="lazy"
              draggable={false}
            />
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export default function GalleryCarousel() {
  return (
    <section className="relative py-24 lg:py-40 bg-gradient-to-b from-[#343a40] via-[#495057] to-[#6c757d] overflow-hidden">
      {/* Ambient glow */}
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.12, 0.25, 0.12] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-white rounded-full blur-[120px] pointer-events-none"
      />

      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #f8f9fa 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      {/* Section header */}
      <div className="relative max-w-7xl mx-auto px-6 mb-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <span className="text-[#f8f9fa] text-sm tracking-widest uppercase">Showroom</span>
          <h2 className="text-4xl lg:text-5xl font-light text-[#f8f9fa] mt-4">
            Il nostro{' '}
            <span className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef]">
              showroom
            </span>
          </h2>
        </motion.div>
      </div>

      {/* ── Row 1 — scrolls LEFT (→ content enters from right) ── */}
      <MarqueeRow strip={ROW1} direction="left" duration={35} />

      {/* Vertical gap between the two rows */}
      <div className="h-4" />

      {/* ── Row 2 — scrolls RIGHT (→ content enters from left) ── */}
      <MarqueeRow strip={ROW2} direction="right" duration={42} />
    </section>
  );
}
