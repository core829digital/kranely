import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, Phone } from 'lucide-react';


export default function MapSection() {
  const [mapUrl, setMapUrl] = useState('');
  const address = "Via Emilia 22/F, Reggio Emilia, Italia";

  useEffect(() => {
    const encodedAddress = encodeURIComponent(address);
    setMapUrl(`https://maps.google.com/maps?q=${encodedAddress}&t=&z=15&ie=UTF8&iwloc=&output=embed`);
  }, []);

  return (
    <section id="dove-siamo" className="relative py-20 lg:py-32 bg-gradient-to-b from-[#495057] via-[#6c757d] to-[#495057] overflow-hidden">
      {/* Animated Background */}
      <motion.div
        animate={{
          rotate: [0, 360],
        }}
        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
        className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-[#f8f9fa]/5 to-transparent rounded-full blur-3xl"
      />

      <div className="relative max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-[#f8f9fa] text-sm tracking-widest uppercase">Dove Siamo</span>
          <h2 className="text-4xl lg:text-5xl font-light text-[#f8f9fa] mt-4">
            Vieni a trovarci nel nostro <span className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef]">showroom</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Map */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden shadow-2xl h-[400px] lg:h-[500px] group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#f8f9fa]/10 to-transparent z-10 pointer-events-none group-hover:opacity-0 transition-opacity duration-500" />
            {mapUrl && (
              <iframe
                src={mapUrl}
                className="w-full h-full border-0"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            )}
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-col justify-center space-y-8"
          >
            {/* Address */}
            <motion.div
              whileHover={{ x: 10 }}
              className="flex items-start gap-4 p-6 rounded-2xl bg-gradient-to-br from-[#343a40]/50 to-[#495057]/50 backdrop-blur-sm border border-[#f8f9fa]/10 hover:border-[#f8f9fa]/30 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-[#f8f9fa]/10 flex items-center justify-center flex-shrink-0">
                <MapPin size={24} className="text-[#f8f9fa]" />
              </div>
              <div>
                <h3 className="text-[#f8f9fa] font-medium mb-1">Indirizzo</h3>
                <p className="text-[#dee2e6] text-sm">{address}</p>
                <p className="text-[#dee2e6] text-xs mt-1 opacity-70">CAP 42124</p>
              </div>
            </motion.div>

            {/* Hours */}
            <motion.div
              whileHover={{ x: 10 }}
              className="flex items-start gap-4 p-6 rounded-2xl bg-gradient-to-br from-[#343a40]/50 to-[#495057]/50 backdrop-blur-sm border border-[#f8f9fa]/10 hover:border-[#f8f9fa]/30 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-[#f8f9fa]/10 flex items-center justify-center flex-shrink-0">
                <Clock size={24} className="text-[#f8f9fa]" />
              </div>
              <div>
                <h3 className="text-[#f8f9fa] font-medium mb-1">Orari</h3>
                <p className="text-[#dee2e6] text-sm">Lun-Ven: 9:00 - 18:00</p>
                <p className="text-[#dee2e6] text-sm">Sabato: Su appuntamento</p>
              </div>
            </motion.div>

            {/* Contact */}
            <motion.div
              whileHover={{ x: 10 }}
              className="flex items-start gap-4 p-6 rounded-2xl bg-gradient-to-br from-[#343a40]/50 to-[#495057]/50 backdrop-blur-sm border border-[#f8f9fa]/10 hover:border-[#f8f9fa]/30 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-[#f8f9fa]/10 flex items-center justify-center flex-shrink-0">
                <Phone size={24} className="text-[#f8f9fa]" />
              </div>
              <div>
                <h3 className="text-[#f8f9fa] font-medium mb-1">Contatti</h3>
                <p className="text-[#dee2e6] text-sm">+39 389 182 0808</p>
                <p className="text-[#dee2e6] text-sm mt-1">info@kranely.app</p>
                <p className="text-[#dee2e6] text-sm">admin@kranely.app</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
