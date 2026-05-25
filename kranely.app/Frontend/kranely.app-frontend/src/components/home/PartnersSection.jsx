import React from 'react';
import { motion } from 'framer-motion';

const partners = [
  { name: 'Immedial Work', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/5b21093d8_immedial-worknewlogo.png' },
  { name: 'Stelbi', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/8bbed5684_stelbinew.png' },
  { name: 'Winex Infissi', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/115ddeb1c_winex-infissinew.png' }];

export default function PartnersSection() {

  return (
    <section className="relative py-24 lg:py-32 bg-gradient-to-b from-[#6c757d] via-[#343a40] to-[#495057] overflow-hidden">
      {/* Animated White Light Glow */}
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.15, 0.3, 0.15],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-white rounded-full blur-[100px]"
      />
      {/* Gradient Vignette */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#343a40] via-transparent to-[#343a40] pointer-events-none z-10" />

      {/* Animated Grid Background */}
      <motion.div
        animate={{
          backgroundPosition: ['0px 0px', '50px 50px'],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `linear-gradient(#f8f9fa 1px, transparent 1px), linear-gradient(90deg, #f8f9fa 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-[#f8f9fa] text-sm tracking-widest uppercase">I nostri partner</span>
          <h2 className="text-3xl lg:text-4xl font-light text-[#f8f9fa] mt-4">
            Collaborazioni di <span className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef]">qualità</span>
          </h2>
        </motion.div>

        {/* Infinite Scrolling Partners - Full Width */}
      </div>
      
      <div className="w-full overflow-hidden">
        <div className="flex">
          <motion.div
            animate={{
              x: [0, -1920],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: 'linear',
              repeatType: 'loop',
            }}
            className="flex gap-16 items-center flex-shrink-0 py-4"
          >
            {[...partners, ...partners, ...partners, ...partners, ...partners, ...partners, ...partners, ...partners].map((partner, index) => (
              <div
                key={`${partner.name}-${index}`}
                className="w-80 h-48 rounded-2xl bg-[#f8f9fa]/10 border border-[#f8f9fa]/20 p-10 flex items-center justify-center shadow-lg flex-shrink-0"
              >
                <img
                  src={partner.logo}
                  alt={partner.name}
                  className="w-full h-full object-contain opacity-95"
                />
              </div>
            ))}
          </motion.div>
          {/* Duplicate for seamless loop */}
          <motion.div
            animate={{
              x: [0, -1920],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: 'linear',
              repeatType: 'loop',
            }}
            className="flex gap-16 items-center flex-shrink-0 py-4"
          >
            {[...partners, ...partners, ...partners, ...partners, ...partners, ...partners, ...partners, ...partners].map((partner, index) => (
              <div
                key={`${partner.name}-duplicate-${index}`}
                className="w-80 h-48 rounded-2xl bg-[#f8f9fa]/10 border border-[#f8f9fa]/20 p-10 flex items-center justify-center shadow-lg flex-shrink-0"
              >
                <img
                  src={partner.logo}
                  alt={partner.name}
                  className="w-full h-full object-contain opacity-95"
                />
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}