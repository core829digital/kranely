import React from 'react';
import { motion } from 'framer-motion';

export default function AnimatedBackground() {
  const [dimensions, setDimensions] = React.useState({ width: 1024, height: 768 });

  React.useEffect(() => {
    const updateDimensions = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const isMobile = dimensions.width < 640;
  const isTablet = dimensions.width >= 640 && dimensions.width < 1024;
  
  // Smart sizing based on viewport
  const size1 = isMobile ? 200 : isTablet ? 350 : 500;
  const size2 = isMobile ? 250 : isTablet ? 450 : 600;
  
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <motion.div 
        animate={{ 
          x: [0, isMobile ? 30 : 60, 0],
          y: [0, isMobile ? -20 : -40, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{ duration: isMobile ? 35 : 25, repeat: Infinity, ease: "linear" }}
        style={{ width: size1, height: size1 }}
        className="absolute top-0 left-0 bg-gradient-to-br from-blue-500/15 via-purple-500/10 to-transparent rounded-full blur-3xl"
      />
      
      <motion.div 
        animate={{ 
          x: [0, isMobile ? -30 : -60, 0],
          y: [0, isMobile ? 30 : 60, 0],
          scale: [1, 1.15, 1]
        }}
        transition={{ duration: isMobile ? 40 : 30, repeat: Infinity, ease: "linear", delay: 2 }}
        style={{ width: size2, height: size2 }}
        className="absolute bottom-0 right-0 bg-gradient-to-tl from-pink-500/15 via-orange-500/10 to-transparent rounded-full blur-3xl"
      />
    </div>
  );
}