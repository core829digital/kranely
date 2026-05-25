import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

export default function PageTransition({ children }) {
  const location = useLocation();

  return (
    <div className="w-full h-full">
      {children}
    </div>
  );
}