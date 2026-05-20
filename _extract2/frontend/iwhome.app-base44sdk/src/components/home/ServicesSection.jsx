import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Layers, Palette, Home, ArrowUpRight } from 'lucide-react';

const services = [
  {
    icon: Layers,
    number: '01',
    title: 'Materiali',
    description: 'Selezioniamo materiali resistenti e di qualità, curando ogni dettaglio per garantire durata, bellezza e funzionalità.',
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&q=80'
  },
  {
    icon: Palette,
    number: '02',
    title: 'Design',
    description: 'Progettiamo soluzioni su misura dove estetica e praticità si incontrano, sempre in linea con il tuo stile.',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80'
  },
  {
    icon: Home,
    number: '03',
    title: 'Casa',
    description: 'È il tuo spazio, il tuo rifugio. La rendiamo accogliente, armoniosa e fatta per rispecchiarti davvero.',
    image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80'
  }
];

export default function ServicesSection() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);

  return (
    <section className="relative py-20 lg:py-32 bg-gradient-to-b from-[#343a40] via-[#495057] to-[#6c757d] overflow-hidden">
      {/* Animated Background */}
      <motion.div
        style={{ y }}
        className="absolute inset-0 opacity-10"
      >
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-[#f8f9fa] to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-[#e9ecef] to-transparent rounded-full blur-3xl" />
      </motion.div>

      <div className="relative max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <span className="text-[#f8f9fa] text-sm tracking-widest uppercase">Servizi</span>
          <h2 className="text-4xl lg:text-5xl font-light text-[#f8f9fa] mt-4">
            Scopri i nostri <span className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef]">servizi</span>
          </h2>
        </motion.div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="group h-full"
            >
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#343a40] to-[#495057] border border-[#f8f9fa]/10 shadow-2xl hover:shadow-[0_20px_80px_rgba(248,249,250,0.2)] transition-all duration-500 h-full flex flex-col hover-lift">
                {/* Image */}
                <div className="relative h-64 overflow-hidden flex-shrink-0">
                  <motion.img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.15, rotate: 2 }}
                    transition={{ duration: 0.8 }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#212529] via-[#212529]/50 to-transparent" />
                  <span className="absolute bottom-4 left-4 text-6xl font-light text-[#f8f9fa]/40">
                    {service.number}
                  </span>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center justify-between mb-4">
                    <motion.div
                      whileHover={{ rotate: 360, scale: 1.2 }}
                      transition={{ duration: 0.6 }}
                      className="w-12 h-12 rounded-xl bg-[#f8f9fa]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-gradient-to-br group-hover:from-[#f8f9fa]/30 group-hover:to-[#e9ecef]/20 transition-all"
                    >
                      <service.icon size={24} className="text-[#f8f9fa] group-hover:text-[#f8f9fa]" />
                    </motion.div>
                    <Link to={createPageUrl('Servizi')}>
                      <motion.div
                        whileHover={{ scale: 1.2, rotate: 45 }}
                        className="w-10 h-10 rounded-full bg-[#f8f9fa]/10 flex items-center justify-center cursor-pointer flex-shrink-0"
                      >
                        <ArrowUpRight size={18} className="text-[#f8f9fa]" />
                      </motion.div>
                    </Link>
                  </div>
                  <h3 className="text-xl font-medium text-[#f8f9fa] mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#f8f9fa] group-hover:to-[#e9ecef] transition-all">
                    {service.title}
                  </h3>
                  <p className="text-[#e9ecef]/70 text-sm leading-relaxed flex-grow">
                    {service.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <Link to={createPageUrl('Servizi')}>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 20px 60px rgba(248, 249, 250, 0.3)' }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef] text-[#212529] rounded-full font-medium transition-all duration-300 shadow-xl"
            >
              Scopri tutti i servizi
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}