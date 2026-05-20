import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ShareButton from '../seo/ShareButton';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';

export default function ReviewCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews-approved'],
    queryFn: () => base44.entities.Review.filter({ status: 'approved' }, '-created_date'),
    initialData: []
  });

  useEffect(() => {
    if (reviews.length > 0) {
      const timer = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % reviews.length);
      }, 6000);
      return () => clearInterval(timer);
    }
  }, [reviews.length]);

  if (reviews.length === 0) {
    return null;
  }

  const currentReview = reviews[currentIndex];

  return (
    <div className="relative bg-white rounded-2xl p-8 lg:p-12 shadow-xl">
      <div className="absolute top-6 left-6 text-[#C9A962]/20">
        <Quote size={48} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          <div className="flex gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={20}
                className={i < currentReview.rating ? 'fill-[#C9A962] text-[#C9A962]' : 'text-gray-300'}
              />
            ))}
          </div>

          <p className="text-[#2D3B35] text-lg leading-relaxed mb-6 italic">
            "{currentReview.comment}"
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {currentReview.project_photo && (
                <img
                  src={currentReview.project_photo}
                  alt="Progetto"
                  className="w-16 h-16 rounded-xl object-cover"
                />
              )}
              <div>
                <p className="font-medium text-[#2D3B35]">{currentReview.customer_name}</p>
                <p className="text-sm text-[#2D3B35]/60">
                  {currentReview.service_type === 'finestre' ? 'Finestre' :
                   currentReview.service_type === 'chiavi_in_mano' ? 'Ristrutturazione' : 'Cliente'}
                </p>
              </div>
            </div>
            <ShareButton
              title={`Recensione ${currentReview.rating}⭐ - IwHome`}
              description={`"${currentReview.comment.substring(0, 100)}..." - ${currentReview.customer_name}`}
            />
          </div>
        </motion.div>
      </AnimatePresence>

      {reviews.length > 1 && (
        <>
          <button
            onClick={() => setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#F5F5F3] flex items-center justify-center hover:bg-[#2D3B35]/10 transition-colors"
          >
            <ChevronLeft size={20} className="text-[#2D3B35]" />
          </button>
          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % reviews.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#F5F5F3] flex items-center justify-center hover:bg-[#2D3B35]/10 transition-colors"
          >
            <ChevronRight size={20} className="text-[#2D3B35]" />
          </button>

          <div className="flex justify-center gap-2 mt-6">
            {reviews.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`transition-all duration-300 rounded-full ${
                  idx === currentIndex ? 'w-8 h-2 bg-[#C9A962]' : 'w-2 h-2 bg-[#2D3B35]/20'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}