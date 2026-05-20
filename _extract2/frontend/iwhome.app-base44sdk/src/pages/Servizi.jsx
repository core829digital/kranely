import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useUser, useClerk } from '@clerk/clerk-react';
import { createPageUrl } from '../utils';
import SEO from '../components/seo/SEO';
import ElectricalSystemIcon from '../components/services/ElectricalSystemIcon';
import {
  Layers,
  Palette,
  Home,
  Ruler,
  Paintbrush,
  Wrench,
  ArrowRight,
  Check
} from 'lucide-react';

const services = [
  {
    icon: Layers,
    title: 'Selezione Materiali',
    description: 'Selezioniamo materiali resistenti e di qualità, curando ogni dettaglio per garantire durata, bellezza e funzionalità.',
    features: ['Materiali certificati', 'Fornitori selezionati', 'Campionatura in showroom'],
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&q=80'
  },
  {
    icon: Palette,
    title: 'Design su Misura',
    description: 'Progettiamo soluzioni su misura dove estetica e praticità si incontrano, sempre in linea con il tuo stile.',
    features: ['Progettazione 3D', 'Render fotorealistici', 'Personalizzazione totale'],
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80'
  },
  {
    icon: Home,
    title: 'Ristrutturazione Chiavi in Mano',
    description: 'Gestiamo ogni aspetto del progetto, dalla demolizione alla consegna finale.',
    features: ['Gestione completa', 'Unico referente', 'Tempi garantiti'],
    image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80'
  },
  {
    icon: Ruler,
    title: 'Infissi e Serramenti',
    description: 'Finestre, porte e serramenti in PVC, alluminio e legno di alta qualità.',
    features: ['PVC, Alluminio, Legno', 'Alta efficienza energetica', 'Installazione professionale'],
    image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80'
  },
  {
    icon: Paintbrush,
    title: 'Interior Design',
    description: 'Creiamo ambienti armoniosi che riflettono la tua personalità e il tuo stile di vita.',
    features: ['Consulenza colori', 'Arredamento', 'Illuminotecnica'],
    image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80'
  },
  {
    icon: Wrench,
    title: 'Impianti',
    description: 'Realizzazione e rifacimento impianti elettrici, idraulici e di climatizzazione.',
    features: ['Certificazioni', 'Efficienza energetica', 'Manutenzione'],
    image: 'svg-icon'
  }
];

export default function Servizi() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const navigate = useNavigate();

  return (
    <div>
      <SEO
        title="Servizi - IwHome | Infissi e Ristrutturazioni Complete"
        description="Infissi su misura, ristrutturazioni chiavi in mano, impianti certificati. Servizio completo dalla progettazione alla realizzazione. Scopri tutti i nostri servizi."
        structuredData={{}}
      />

      {/* Hero */}
      <section className="relative py-20 lg:py-32 bg-gradient-to-br from-[#212529] via-[#343a40] to-[#495057] overflow-hidden">
        <motion.div

          style={{ y, willChange: 'transform' }}
          className="absolute inset-0"
        >
          <img
            src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=80"
            alt="Services"
            className="w-full h-full object-cover opacity-20"
            loading="lazy"
            decoding="async"
          />
        </motion.div>

        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-[#f8f9fa]/10 to-transparent rounded-full blur-3xl"
        />

        <div className="relative max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-[#f8f9fa] text-sm tracking-widest uppercase">Servizi</span>
            <h1 className="text-4xl lg:text-6xl font-light text-[#f8f9fa] mt-4 mb-6">
              Scopri i nostri <br />
              <span className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef]">servizi</span>
            </h1>
            <p className="text-[#dee2e6] max-w-2xl text-lg">
              Dalla scelta dei materiali al design su misura, fino alla realizzazione
              e installazione: ti seguiamo in ogni fase del progetto.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="relative py-20 lg:py-32 bg-gradient-to-b from-[#495057] via-[#6c757d] to-[#495057] overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle, #f8f9fa 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="space-y-24">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                  }`}
              >
                <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                  <div className="flex items-center gap-6 mb-6">
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                      className="w-14 h-14 rounded-2xl bg-[#f8f9fa]/10 flex items-center justify-center"
                    >
                      <service.icon size={28} className="text-[#f8f9fa]" />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                      className="relative"
                    >
                      <motion.span
                        className="text-7xl lg:text-8xl font-light bg-gradient-to-br from-[#f8f9fa] via-[#e9ecef] to-[#dee2e6] bg-clip-text text-transparent"
                        animate={{
                          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                        style={{ backgroundSize: '200% 200%' }}
                      >
                        {String(index + 1).padStart(2, '0')}
                      </motion.span>
                      <motion.div
                        className="absolute -inset-2 bg-gradient-to-r from-[#f8f9fa]/20 to-transparent rounded-2xl blur-xl"
                        animate={{ opacity: [0.5, 0.8, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </motion.div>
                  </div>
                  <h2 className="text-3xl font-medium text-[#f8f9fa] mb-4">
                    {service.title}
                  </h2>
                  <p className="text-[#dee2e6] mb-6 leading-relaxed">
                    {service.description}
                  </p>
                  <ul className="space-y-3 mb-8">
                    {service.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-[#f8f9fa]">
                        <Check size={18} className="text-[#f8f9fa] flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to={createPageUrl('Calcolatore')}>
                    <motion.button
                      whileHover={{ scale: 1.05, boxShadow: '0 20px 60px rgba(248, 249, 250, 0.3)' }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-3 bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef] text-[#212529] rounded-full text-sm font-medium flex items-center gap-2 shadow-xl"
                    >
                      Richiedi Preventivo
                      <ArrowRight size={16} />
                    </motion.button>
                  </Link>
                </div>

                <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.5 }}
                    className="relative overflow-hidden rounded-3xl shadow-2xl hover-lift"
                  >
                    {service.image === 'svg-icon' ? (
                      <ElectricalSystemIcon />
                    ) : (
                      <>
                        <img
                          src={service.image}
                          alt={service.title}
                          className="w-full h-80 lg:h-[450px] object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#212529]/50 to-transparent" />
                      </>
                    )}
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 lg:py-32 bg-gradient-to-br from-[#343a40] via-[#495057] to-[#343a40] overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute inset-0 bg-gradient-to-r from-[#f8f9fa]/5 to-[#e9ecef]/5 rounded-full blur-3xl"
        />

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-4xl font-light text-[#f8f9fa] mb-6">
              Pronto a iniziare il tuo <span className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef]">progetto</span>?
            </h2>
            <p className="text-[#dee2e6] mb-8 max-w-2xl mx-auto">
              Calcola un preventivo stimato online o prenota un appuntamento
              nel nostro showroom per una consulenza personalizzata.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={createPageUrl('Calcolatore')}>
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 20px 60px rgba(248, 249, 250, 0.3)' }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef] text-[#212529] rounded-full font-medium shadow-xl"
                >
                  Calcola Preventivo
                </motion.button>
              </Link>
              <button
                onClick={() => {
                  if (isSignedIn) {
                    navigate('/MyAppointments');
                  } else {
                    openSignIn({ redirectUrl: '/MyAppointments' });
                  }
                }}
              >
                <motion.div
                  whileHover={{ scale: 1.05, backgroundColor: '#495057' }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 border-2 border-[#f8f9fa]/30 text-[#f8f9fa] rounded-full font-medium backdrop-blur-sm transition-all duration-300 inline-block"
                >
                  Prenota Appuntamento
                </motion.div>
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}