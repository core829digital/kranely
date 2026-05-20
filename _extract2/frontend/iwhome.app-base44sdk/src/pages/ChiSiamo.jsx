import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import SEO from '../components/seo/SEO';
import { Check, Users, Award, Clock, ArrowRight } from 'lucide-react';

const values = [
  {
    icon: Check,
    title: 'Qualità',
    description: 'Solo materiali certificati e di prima scelta',
    details: 'Selezioniamo esclusivamente fornitori certificati e materiali testati. Ogni prodotto viene controllato per garantire standard elevati di durata, sicurezza ed efficienza energetica.'
  },
  {
    icon: Users,
    title: 'Esperienza',
    description: 'Team di professionisti con anni di esperienza',
    details: 'Il nostro team vanta oltre 10 anni di esperienza nel settore. Ogni progetto è seguito da tecnici specializzati che conoscono le migliori soluzioni per ogni esigenza.'
  },
  {
    icon: Award,
    title: 'Garanzia',
    description: 'Lavori garantiti e assistenza post-vendita',
    details: 'Offriamo garanzia completa su tutti i nostri lavori e materiali. Il nostro servizio di assistenza post-vendita resta sempre disponibile per qualsiasi necessità.'
  },
  {
    icon: Clock,
    title: 'Puntualità',
    description: 'Rispetto dei tempi e delle scadenze concordate',
    details: 'La pianificazione accurata e il coordinamento professionale ci permettono di rispettare sempre i tempi concordati, senza compromessi sulla qualità del risultato finale.'
  }];

export default function ChiSiamo() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <div>
      <SEO
        title="Chi Siamo - IwHome | Esperti in Ristrutturazioni e Infissi dal 2010"
        description="Scopri IwHome: oltre 10 anni di esperienza in ristrutturazioni e infissi. Team qualificato, materiali certificati PVC, alluminio e legno, garanzia totale. Il tuo partner di fiducia per la casa."
        keywords="chi siamo iwhome, azienda ristrutturazioni reggio emilia, esperti infissi, materiali certificati, showroom infissi, professionisti edilizia"
        structuredData={{}}
      />

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 bg-gradient-to-br from-[#212529] via-[#343a40] to-[#495057] overflow-hidden">
        {/* Parallax Background */}
        <motion.div
          style={{ y }}
          className="absolute inset-0"
        >
          <img
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80"
            alt="Interior"
            className="w-full h-full object-cover opacity-20"
          />
        </motion.div>

        {/* Animated Orbs */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-[#f8f9fa]/10 to-transparent rounded-full blur-3xl"
        />

        <div className="relative max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-[#f8f9fa] text-sm tracking-widest uppercase">Chi Siamo</span>
            <h1 className="text-4xl lg:text-6xl font-light text-[#f8f9fa] mt-4 mb-6">
              Arredamento è la nostra <br />
              <span className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef]">parola d'ordine</span>
            </h1>
            <p className="text-[#dee2e6] max-w-2xl text-lg">
              Tu ci dici come vuoi vivere i tuoi spazi, noi li trasformiamo in realtà.
            </p>
          </motion.div>
        </div>
      </section>

      {/* About Content */}
      <section className="relative py-20 lg:py-32 bg-gradient-to-b from-[#495057] via-[#6c757d] to-[#495057] overflow-hidden">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          className="absolute top-0 left-0 w-[600px] h-[600px] bg-gradient-to-br from-[#f8f9fa]/5 to-transparent rounded-full blur-3xl"
        />

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl lg:text-4xl font-light text-[#f8f9fa] mb-6">
                Trasformiamo i tuoi sogni <br />
                in <span className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef]">spazi reali</span>
              </h2>
              <div className="space-y-4 text-[#dee2e6] leading-relaxed">
                <p>
                  Ci occupiamo di progettare e realizzare ambienti che uniscono stile e comfort,
                  con soluzioni pensate per durare nel tempo e adattarsi perfettamente al tuo modo di vivere.
                </p>
                <p>
                  Dalla scelta dei materiali al design su misura, fino alla realizzazione e installazione:
                  ti seguiamo in ogni fase del progetto per creare spazi funzionali, eleganti e pensati per durare.
                </p>
                <p>
                  Il nostro showroom è il luogo ideale per toccare con mano la qualità dei materiali
                  e delle finiture, e per confrontarti con il nostro team di esperti.
                </p>
              </div>
              <Link to="/#dove-siamo">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 20px 60px rgba(248, 249, 250, 0.3)' }}
                  whileTap={{ scale: 0.95 }}
                  className="mt-8 px-8 py-4 bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef] text-[#212529] rounded-full font-medium flex items-center gap-2 shadow-xl hover-lift"
                >
                  Contattaci
                  <ArrowRight size={18} />
                </motion.button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="grid grid-cols-2 gap-4">
                <motion.img
                  whileHover={{ scale: 1.05 }}
                  src="https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&q=80"
                  alt="Interior 1"
                  className="rounded-2xl w-full h-64 object-cover shadow-2xl hover-lift"
                />
                <motion.img
                  whileHover={{ scale: 1.05 }}
                  src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600&q=80"
                  alt="Interior 2"
                  className="rounded-2xl w-full h-64 object-cover mt-8 shadow-2xl hover-lift"
                />
              </div>
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="absolute -bottom-6 -left-6 bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] rounded-2xl p-6 text-[#212529] shadow-2xl"
              >
                <div className="text-4xl font-light">10+</div>
                <div className="text-sm">Anni di Esperienza</div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="relative py-20 lg:py-32 bg-gradient-to-br from-[#343a40] via-[#495057] to-[#343a40] overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-tl from-[#f8f9fa]/5 to-transparent rounded-full blur-3xl"
        />

        <div className="relative max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-[#f8f9fa] text-sm tracking-widest uppercase">I Nostri Valori</span>
            <h2 className="text-3xl lg:text-4xl font-light text-[#f8f9fa] mt-4 mb-6">
              Cosa ci <span className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef]">distingue</span>
            </h2>
            <p className="text-[#dee2e6] max-w-3xl mx-auto text-lg">
              In IwHome, la qualità e la professionalità non sono solo obiettivi, ma la base di ogni nostro progetto.
              Crediamo nel valore del lavoro ben fatto, nell'eccellenza dei materiali e nel rapporto di fiducia con i nostri clienti.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                className="p-8 rounded-3xl bg-gradient-to-br from-[#495057]/50 to-[#6c757d]/50 backdrop-blur-sm border border-[#f8f9fa]/10 hover:border-[#f8f9fa]/30 transition-all duration-300 shadow-xl"
              >
                <div className="flex items-start gap-6">
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className="w-16 h-16 rounded-2xl bg-[#f8f9fa]/10 flex items-center justify-center flex-shrink-0"
                  >
                    <value.icon size={28} className="text-[#f8f9fa]" />
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-medium text-[#f8f9fa] mb-2">{value.title}</h3>
                    <p className="text-[#dee2e6] mb-3">{value.description}</p>
                    <p className="text-sm text-[#adb5bd] leading-relaxed">{value.details}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-[#f8f9fa]/5 to-[#e9ecef]/5 backdrop-blur-sm border border-[#f8f9fa]/10 rounded-3xl p-8 lg:p-12 text-center"
          >
            <h3 className="text-2xl font-light text-[#f8f9fa] mb-4">
              Il nostro impegno per l'<span className="font-medium">eccellenza</span>
            </h3>
            <p className="text-[#dee2e6] max-w-3xl mx-auto leading-relaxed">
              Ogni dettaglio conta. Dalla consulenza iniziale alla realizzazione finale,
              ci impegniamo a superare le aspettative con soluzioni innovative, materiali di prima qualità
              e un'attenzione maniacale ai dettagli. La vostra soddisfazione è la nostra migliore pubblicità,
              e per questo mettiamo passione e professionalità in ogni singolo progetto che realizziamo.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}