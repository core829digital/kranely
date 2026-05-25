import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { useUser, useClerk } from '@clerk/clerk-react';

export default function HeroSection() {
  const { scrollY } = useScroll();
  const [isMobile, setIsMobile] = React.useState(false);
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const navigate = useNavigate();

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const opacity = useTransform(scrollY, [0, 200], [1, 0]);
  const scale = useTransform(scrollY, [0, 200], [1, 0.8]);
  const y = useTransform(scrollY, [0, 200], [0, isMobile ? 50 : 100]);

  // Logo scroll effect - independent scroll follow until button position
  const logoY = useTransform(scrollY, [0, 700], [0, isMobile ? 300 : 600]);
  const logoOpacity = useTransform(scrollY, [0, 650, 700], [1, 1, 0]);
  const logoScale = useTransform(scrollY, [0, 700], [1, 0.5]);

  // Design word disappears faster
  const designOpacity = useTransform(scrollY, [0, 120], [1, 0]);

  const handleAreaPrivata = () => {
    if (isSignedIn) {
      navigate(createPageUrl('Dashboard'));
    } else {
      openSignIn({ redirectUrl: createPageUrl('Dashboard') });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Hero Background Image */}
      <motion.div
        style={{ y, willChange: 'transform' }}
        className="absolute inset-0"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#212529]/90 via-[#343a40]/85 to-[#495057]/90 z-10" />
        <img
          src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1920&q=80"
          alt="IwHome - Luxury Interior Design"
          className="w-full h-full object-cover"
          loading="eager"
          decoding="async"
        />
      </motion.div>

      {/* Animated Background Particles - Reduced on mobile */}
      {!isMobile && (
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-[#f8f9fa]/20 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                willChange: 'transform, opacity'
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      )}

      {/* Animated Gradient Orbs - Simplified on mobile */}
      <motion.div
        animate={!isMobile ? {
          scale: [1, 1.4, 1],
          opacity: [0.15, 0.35, 0.15],
          rotate: [0, 180, 360],
        } : { opacity: 0.15 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-[#f8f9fa]/20 to-[#e9ecef]/10 rounded-full blur-3xl md:blur-3xl blur-2xl z-10"
        style={{ willChange: isMobile ? 'auto' : 'transform, opacity' }}
      />
      <motion.div
        animate={!isMobile ? {
          scale: [1, 1.5, 1],
          opacity: [0.2, 0.4, 0.2],
          rotate: [360, 180, 0],
        } : { opacity: 0.2 }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        className="absolute bottom-0 left-0 w-[900px] h-[900px] bg-gradient-to-tr from-[#dee2e6]/15 to-[#f8f9fa]/5 rounded-full blur-3xl md:blur-3xl blur-2xl z-10"
        style={{ willChange: isMobile ? 'auto' : 'transform, opacity' }}
      />

      {/* 3D Floating Elements */}
      <motion.div
        animate={{
          y: [0, -20, 0],
          rotateZ: [0, 5, 0],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/4 left-[10%] w-32 h-32 border border-[#f8f9fa]/10 rounded-2xl hidden lg:block z-20"
        style={{ transform: 'perspective(500px) rotateY(15deg)' }}
      />
      <motion.div
        animate={{
          y: [0, 20, 0],
          rotateZ: [0, -5, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-1/4 right-[10%] w-40 h-40 border border-[#e9ecef]/10 rounded-full hidden lg:block z-20"
      />

      {/* Content */}
      <div className="relative z-30 max-w-5xl mx-auto px-6 text-center">
        {/* Logo - Independent scroll animation */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{ y: logoY, opacity: logoOpacity, scale: logoScale }}
          className="mb-6"
        >
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/95bae648d_logo.png"
            alt="IwHome Showroom"
            className="h-40 lg:h-48 w-auto mx-auto drop-shadow-2xl"
            loading="eager"
            decoding="async"
          />
        </motion.div>

        <motion.div style={{ opacity, scale, y }}>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-light text-[#f8f9fa] mb-8 sm:mb-12 tracking-tight leading-relaxed"
            style={{ overflow: 'visible' }}
          >
            Materiali.
            <motion.span
              style={{ opacity: designOpacity }}
              className="block text-transparent bg-clip-text bg-gradient-to-r from-[#f8f9fa] via-[#e9ecef] to-[#dee2e6] py-4"
            >
              Design.
            </motion.span>
            Casa.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-[#e9ecef]/80 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Tu ci dici come, noi realizziamo il progetto.
            <br />
            Soluzioni complete per trasformare i tuoi spazi.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to={createPageUrl('Calcolatore')}>
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 20px 60px rgba(248, 249, 250, 0.3)' }}
                whileTap={{ scale: 0.95 }}
                className="group px-8 py-4 bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef] text-[#212529] rounded-full font-medium flex items-center gap-2 justify-center transition-all duration-300 shadow-xl"
              >
                Calcola Preventivo
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </Link>
            <motion.button
              onClick={handleAreaPrivata}
              whileHover={{ scale: 1.05, backgroundColor: '#343a40' }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 border-2 border-[#f8f9fa]/30 text-[#f8f9fa] rounded-full font-medium backdrop-blur-sm transition-all duration-300"
            >
              Area Privata
            </motion.button>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-2 text-[#e9ecef]/60"
        >
          <span className="text-xs tracking-widest rotate-90 origin-center mb-8">SCROLL</span>
          <ChevronDown size={20} />
        </motion.div>
      </motion.div>
    </section>
  );
}