import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, DollarSign, CheckCircle2 } from 'lucide-react';

export default function AISuggestions({ suggestions, loading }) {
  if (loading) {
    return (
      <div className="bg-gradient-to-br from-[#495057] to-[#6c757d] rounded-2xl p-6 border border-[#f8f9fa]/20">
        <div className="flex items-center gap-3 mb-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 rounded-full bg-[#f8f9fa]/20 flex items-center justify-center"
          >
            <Sparkles size={18} className="text-[#f8f9fa]" />
          </motion.div>
          <span className="text-[#f8f9fa] font-medium">AI sta analizzando la configurazione...</span>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 bg-[#f8f9fa]/10 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!suggestions) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-[#C9A962]/5 to-[#2D3B35]/5 rounded-2xl p-6 border border-[#C9A962]/20"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#C9A962]/20 flex items-center justify-center">
          <Sparkles size={20} className="text-[#C9A962]" />
        </div>
        <div>
          <h3 className="font-medium text-[#2D3B35]">Suggerimenti AI</h3>
          <p className="text-xs text-[#2D3B35]/60">Basati sulla tua configurazione</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Main Recommendation */}
        {suggestions.mainRecommendation && (
          <div className="bg-white rounded-xl p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={18} className="text-[#C9A962] mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-[#2D3B35] text-sm mb-1">Raccomandazione Principale</h4>
                <p className="text-[#2D3B35]/70 text-sm">{suggestions.mainRecommendation}</p>
              </div>
            </div>
          </div>
        )}

        {/* Budget Optimization */}
        {suggestions.budgetOptimization && (
          <div className="bg-white rounded-xl p-4">
            <div className="flex items-start gap-3">
              <DollarSign size={18} className="text-[#2D3B35] mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-[#2D3B35] text-sm mb-1">Ottimizzazione Budget</h4>
                <p className="text-[#2D3B35]/70 text-sm">{suggestions.budgetOptimization}</p>
              </div>
            </div>
          </div>
        )}

        {/* Quality Upgrade */}
        {suggestions.qualityUpgrade && (
          <div className="bg-white rounded-xl p-4">
            <div className="flex items-start gap-3">
              <TrendingUp size={18} className="text-[#C9A962] mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-[#2D3B35] text-sm mb-1">Migliora la Qualità</h4>
                <p className="text-[#2D3B35]/70 text-sm">{suggestions.qualityUpgrade}</p>
              </div>
            </div>
          </div>
        )}

        {/* Additional Tips */}
        {suggestions.tips && suggestions.tips.length > 0 && (
          <div className="space-y-2">
            {suggestions.tips.map((tip, index) => (
              <div key={index} className="flex items-start gap-2 text-sm text-[#2D3B35]/70">
                <span className="text-[#C9A962] mt-0.5">•</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}