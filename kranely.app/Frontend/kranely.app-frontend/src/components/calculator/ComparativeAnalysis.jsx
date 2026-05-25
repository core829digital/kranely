import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingDown, TrendingUp, Check, X } from 'lucide-react';

export default function ComparativeAnalysis({ currentConfig, alternatives, loading }) {
  if (loading) {
    return (
      <div className="bg-gradient-to-br from-[#495057] to-[#6c757d] rounded-2xl p-6 border border-[#f8f9fa]/20">
        <div className="flex items-center gap-3 mb-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <BarChart3 size={20} className="text-[#f8f9fa]" />
          </motion.div>
          <span className="font-medium text-[#f8f9fa]">Analisi comparativa in corso...</span>
        </div>
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 bg-[#f8f9fa]/10 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!alternatives || alternatives.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-[#495057] to-[#6c757d] rounded-2xl p-6 border border-[#f8f9fa]/20"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#f8f9fa]/20 flex items-center justify-center">
          <BarChart3 size={20} className="text-[#f8f9fa]" />
        </div>
        <div>
          <h3 className="font-medium text-[#f8f9fa]">Analisi Comparativa</h3>
          <p className="text-xs text-[#dee2e6]">Confronta diverse opzioni</p>
        </div>
      </div>

      <div className="space-y-4">
        {alternatives.map((alt, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-[#343a40]/50 backdrop-blur-sm rounded-xl p-5 border border-[#f8f9fa]/10"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-medium text-[#f8f9fa] mb-1">{alt.name}</h4>
                <p className="text-xs text-[#dee2e6]">{alt.description}</p>
              </div>
              <div className="text-right">
                <div className="text-xl font-light text-[#f8f9fa]">
                  €{alt.price.toLocaleString()}
                </div>
                <div className={`text-xs flex items-center gap-1 justify-end ${
                  alt.priceDifference < 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {alt.priceDifference < 0 ? (
                    <TrendingDown size={12} />
                  ) : (
                    <TrendingUp size={12} />
                  )}
                  <span>{alt.priceDifference > 0 ? '+' : ''}{alt.priceDifference}%</span>
                </div>
              </div>
            </div>

            {/* Pros & Cons */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <h5 className="text-xs font-medium text-[#f8f9fa] mb-2 flex items-center gap-1">
                  <Check size={12} className="text-green-400" />
                  Pro
                </h5>
                <ul className="space-y-1">
                  {alt.pros?.map((pro, i) => (
                    <li key={i} className="text-xs text-[#dee2e6] flex items-start gap-1">
                      <span className="text-green-400">•</span>
                      <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h5 className="text-xs font-medium text-[#f8f9fa] mb-2 flex items-center gap-1">
                  <X size={12} className="text-red-400" />
                  Contro
                </h5>
                <ul className="space-y-1">
                  {alt.cons?.map((con, i) => (
                    <li key={i} className="text-xs text-[#dee2e6] flex items-start gap-1">
                      <span className="text-red-400">•</span>
                      <span>{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}