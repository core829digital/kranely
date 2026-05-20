import React from 'react';
import { motion, useInView } from 'framer-motion';

const stats = [
  { value: '3K+', label: 'Progetti sviluppati' },
  { value: '20+', label: 'Membri del team' },
  { value: '200+', label: 'Clienti globali' }];

function AnimatedCounter({ target, duration = 2 }) {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    if (isInView) {
      const numericTarget = parseInt(target.replace(/\D/g, ''));
      const increment = numericTarget / (duration * 60);
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= numericTarget) {
          setCount(numericTarget);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, 1000 / 60);

      return () => clearInterval(timer);
    }
  }, [isInView, target, duration]);

  return <span ref={ref}>{count}{target.replace(/[0-9]/g, '')}</span>;
}

export default function StatsSection() {
  return (
    <section className="relative py-16 lg:py-24 bg-gradient-to-b from-[#6c757d] via-[#495057] to-[#343a40] overflow-hidden">
      {/* Animated Background */}
      <motion.div
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'linear-gradient(45deg, #f8f9fa 0%, transparent 50%, #e9ecef 100%)',
          backgroundSize: '200% 200%',
        }}
      />

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-[#f8f9fa]/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="relative max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30, scale: 0.8 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ 
                delay: index * 0.2,
                type: 'spring',
                stiffness: 100
              }}
              whileHover={{ 
                scale: 1.05,
                transition: { duration: 0.3 }
              }}
              className="relative text-center group"
            >
              {/* Glow Effect */}
              <motion.div
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: index * 0.5,
                }}
                className="absolute inset-0 bg-gradient-to-r from-[#f8f9fa]/10 to-[#e9ecef]/10 rounded-3xl blur-xl"
              />

              {/* Card */}
              <div className="relative bg-gradient-to-br from-[#343a40]/50 to-[#495057]/50 backdrop-blur-sm rounded-3xl p-8 border border-[#f8f9fa]/10 shadow-2xl group-hover:border-[#f8f9fa]/30 transition-all duration-500">
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ 
                    delay: index * 0.2 + 0.3, 
                    type: 'spring',
                    stiffness: 200
                  }}
                  className="text-5xl lg:text-6xl font-light text-transparent bg-clip-text bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef] mb-3"
                >
                  <AnimatedCounter target={stat.value} />
                </motion.div>
                <p className="text-[#dee2e6] text-sm uppercase tracking-widest">
                  {stat.label}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}