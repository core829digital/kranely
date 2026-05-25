import React from 'react';
import { motion } from 'framer-motion';

export default function ElectricalSystemIcon() {
  return (
    <div className="w-full h-80 lg:h-[450px] bg-gradient-to-br from-[#343a40] to-[#495057] flex items-center justify-center relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle, #f8f9fa 1px, transparent 1px)`,
          backgroundSize: '30px 30px',
        }} />
      </div>

      {/* Animated glow */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute w-64 h-64 bg-[#f8f9fa]/20 rounded-full blur-3xl"
      />

      {/* Main SVG Icon */}
      <svg
        width="280"
        height="280"
        viewBox="0 0 280 280"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10"
      >
        {/* Circuit board background */}
        <motion.path
          d="M40 140 H80 M200 140 H240 M140 40 V80 M140 200 V240"
          stroke="#f8f9fa"
          strokeWidth="3"
          strokeOpacity="0.3"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
        />
        
        {/* Central power symbol */}
        <circle cx="140" cy="140" r="50" stroke="#f8f9fa" strokeWidth="4" fill="none" opacity="0.4" />
        <motion.circle
          cx="140"
          cy="140"
          r="50"
          stroke="#f8f9fa"
          strokeWidth="4"
          fill="none"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.2, opacity: 0 }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        
        {/* Lightning bolt */}
        <path
          d="M140 100 L130 140 L150 140 L140 180"
          stroke="#f8f9fa"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        
        {/* Connection nodes */}
        <motion.circle
          cx="80"
          cy="140"
          r="8"
          fill="#f8f9fa"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0 }}
        />
        <motion.circle
          cx="200"
          cy="140"
          r="8"
          fill="#f8f9fa"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        />
        <motion.circle
          cx="140"
          cy="80"
          r="8"
          fill="#f8f9fa"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 2, repeat: Infinity, delay: 1 }}
        />
        <motion.circle
          cx="140"
          cy="200"
          r="8"
          fill="#f8f9fa"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
        />

        {/* Corner circuit elements */}
        <rect x="30" y="30" width="30" height="30" stroke="#f8f9fa" strokeWidth="2" fill="none" opacity="0.3" />
        <rect x="220" y="30" width="30" height="30" stroke="#f8f9fa" strokeWidth="2" fill="none" opacity="0.3" />
        <rect x="30" y="220" width="30" height="30" stroke="#f8f9fa" strokeWidth="2" fill="none" opacity="0.3" />
        <rect x="220" y="220" width="30" height="30" stroke="#f8f9fa" strokeWidth="2" fill="none" opacity="0.3" />
      </svg>
    </div>
  );
}