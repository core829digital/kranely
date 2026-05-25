import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import SEO from '../components/seo/SEO';
import { Button } from '@/components/ui/button';
import ReviewForm from '../components/reviews/ReviewForm';
import ReviewCarousel from '../components/reviews/ReviewCarousel';
import { Star, MessageCircle, Check } from 'lucide-react';

export default function Recensioni() {
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews-approved'],
    queryFn: () => base44.entities.Review.filter({ status: 'approved' }, '-created_date'),
    initialData: []
  });

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 5.0;

  return (
    <div className="pt-24">
      <SEO 
        title="Recensioni Clienti - IwHome | Testimonianze Reali"
        description={`${reviews.length} recensioni verificate dai nostri clienti. Media ${avgRating}/5 stelle. Scopri le esperienze di chi ha scelto IwHome per la propria casa.`}
      />
      <section className="py-16 lg:py-24 bg-[#2D3B35]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <span className="text-[#C9A962] text-sm tracking-widest uppercase">Recensioni</span>
            <h1 className="text-4xl lg:text-5xl font-light text-white mt-4 mb-6">
              Cosa dicono i <span className="font-medium">nostri clienti</span>
            </h1>
            <div className="flex items-center justify-center gap-4 mt-8">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={24} className="fill-[#C9A962] text-[#C9A962]" />
                ))}
              </div>
              <p className="text-white text-2xl font-light">{avgRating}/5</p>
              <p className="text-white/60">({reviews.length} recensioni)</p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-[#F5F5F3]">
        <div className="max-w-5xl mx-auto px-6">
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-12 text-center shadow-xl"
            >
              <div className="w-20 h-20 rounded-full bg-[#C9A962]/10 flex items-center justify-center mx-auto mb-6">
                <Check size={40} className="text-[#C9A962]" />
              </div>
              <h2 className="text-2xl font-medium text-[#2D3B35] mb-4">
                Grazie per la tua recensione!
              </h2>
              <p className="text-[#2D3B35]/60 mb-8">
                La tua recensione sarà pubblicata dopo la moderazione del nostro team.
              </p>
              <Button
                onClick={() => {
                  setSubmitted(false);
                  setShowForm(false);
                }}
                className="bg-[#2D3B35] hover:bg-[#3D4F47] rounded-full"
              >
                Torna alle Recensioni
              </Button>
            </motion.div>
          ) : showForm ? (
            <div>
              <div className="mb-8">
                <Button
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="rounded-full"
                >
                  ← Indietro
                </Button>
              </div>
              <ReviewForm onSuccess={() => setSubmitted(true)} />
            </div>
          ) : (
            <div className="space-y-12">
              <div className="text-center">
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-[#C9A962] hover:bg-[#d4b76d] text-[#2D3B35] rounded-full px-8"
                >
                  <MessageCircle size={18} className="mr-2" />
                  Scrivi una Recensione
                </Button>
              </div>

              <ReviewCarousel />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
                {reviews.map((review, idx) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white rounded-xl p-6 shadow-lg"
                  >
                    <div className="flex gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={i < review.rating ? 'fill-[#C9A962] text-[#C9A962]' : 'text-gray-300'}
                        />
                      ))}
                    </div>
                    <p className="text-[#2D3B35] text-sm mb-4 line-clamp-4">
                      "{review.comment}"
                    </p>
                    {review.project_photo && (
                      <img
                        src={review.project_photo}
                        alt="Progetto"
                        className="w-full h-32 object-cover rounded-lg mb-4"
                      />
                    )}
                    <p className="font-medium text-[#2D3B35] text-sm">{review.customer_name}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}