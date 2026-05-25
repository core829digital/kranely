import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import {
  Search,
  FileText,
  MessageSquare,
  Calendar,
  X,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function GlobalSearch({ user, onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: results, isLoading } = useQuery({
    queryKey: ['global-search', debouncedQuery, user?.email],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return null;

      // TODO: Implement full-text search with Convex
      // For now, returning empty results to prevent Base44 crashes

      return {
        documents: [],
        messages: [],
        appointments: [],
        quotes: [],
        total: 0
      };
    },
    enabled: !!user && debouncedQuery.length >= 2,
    staleTime: 30000
  });

  const getConversationTitle = (message) => {
    const conv = message.conversation_id;
    return conv || 'Conversazione';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-2 sm:p-4 pt-16 sm:pt-20"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl bg-[#1C1A18]/ backdrop-blur-xl border border-white/ rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[85vh]"
      >
        {/* Search Input */}
        <div className="p-6 border-b border-white/">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca documenti, messaggi, appuntamenti..."
              autoFocus
              className="pl-12 pr-12 h-12 bg-[#535252]/ border-white/ text-white text-lg"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] sm:max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-white mx-auto mb-4" />
              <p className="text-white/70">Ricerca in corso...</p>
            </div>
          ) : !debouncedQuery || debouncedQuery.length < 2 ? (
            <div className="p-12 text-center">
              <Search className="w-12 h-12 text-white/25 mx-auto mb-4" />
              <p className="text-white/70 mb-2">Ricerca Globale</p>
              <p className="text-sm text-white/40">
                Cerca tra documenti, messaggi, appuntamenti e preventivi
              </p>
            </div>
          ) : !results || results.total === 0 ? (
            <div className="p-12 text-center">
              <Search className="w-12 h-12 text-white/25 mx-auto mb-4" />
              <p className="text-white/70">Nessun risultato trovato</p>
              <p className="text-sm text-white/40">
                Prova con parole chiave diverse
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#F0EBE8]/5">
              {/* Documents */}
              {results.documents.length > 0 && (
                <div className="p-4">
                  <h3 className="text-sm font-medium text-white/40 mb-3 px-2">
                    Documenti ({results.documents.length})
                  </h3>
                  <div className="space-y-2">
                    {results.documents.map((doc) => (
                      <Link
                        key={doc.id}
                        to={createPageUrl('Documents')}
                        onClick={onClose}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/8 transition-all group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-[#FFC703]/15 flex items-center justify-center flex-shrink-0">
                          <FileText size={20} className="text-[#FFC703]/80" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white truncate group-hover:text-[#FFC703] transition-colors">
                            {doc.title}
                          </div>
                          <div className="text-xs text-white/40 truncate">
                            {doc.file_name} • {doc.category}
                          </div>
                        </div>
                        <ArrowRight size={16} className="text-white/25 group-hover:text-white transition-colors" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages */}
              {results.messages.length > 0 && (
                <div className="p-4">
                  <h3 className="text-sm font-medium text-white/40 mb-3 px-2">
                    Messaggi ({results.messages.length})
                  </h3>
                  <div className="space-y-2">
                    {results.messages.map((msg) => (
                      <Link
                        key={msg.id}
                        to={createPageUrl('Messages')}
                        onClick={onClose}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/8 transition-all group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-[#FFC703]/20 flex items-center justify-center flex-shrink-0">
                          <MessageSquare size={20} className="text-[#FFC703]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-white/40 mb-1">
                            da {msg.sender_email.split('@')[0]}
                          </div>
                          <div className="text-sm text-white truncate">
                            {msg.content}
                          </div>
                        </div>
                        <ArrowRight size={16} className="text-white/25 group-hover:text-white transition-colors" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Appointments */}
              {results.appointments.length > 0 && (
                <div className="p-4">
                  <h3 className="text-sm font-medium text-white/40 mb-3 px-2">
                    Appuntamenti ({results.appointments.length})
                  </h3>
                  <div className="space-y-2">
                    {results.appointments.map((apt) => (
                      <Link
                        key={apt.id}
                        to={createPageUrl('MyAppointments')}
                        onClick={onClose}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/8 transition-all group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-white/8 flex items-center justify-center flex-shrink-0">
                          <Calendar size={20} className="text-white/60" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white truncate">
                            {apt.project_type}
                          </div>
                          <div className="text-xs text-white/40">
                            {new Date(apt.appointment_date).toLocaleDateString('it-IT')} • {apt.appointment_time}
                          </div>
                        </div>
                        <ArrowRight size={16} className="text-white/25 group-hover:text-white transition-colors" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Quotes */}
              {results.quotes.length > 0 && (
                <div className="p-4">
                  <h3 className="text-sm font-medium text-white/40 mb-3 px-2">
                    Preventivi ({results.quotes.length})
                  </h3>
                  <div className="space-y-2">
                    {results.quotes.map((quote) => (
                      <Link
                        key={quote.id}
                        to={createPageUrl('Dashboard')}
                        onClick={onClose}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/8 transition-all group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                          <FileText size={20} className="text-yellow-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white truncate">
                            {quote.quote_type}
                          </div>
                          <div className="text-xs text-white/40">
                            €{quote.estimated_price?.toLocaleString()}
                          </div>
                        </div>
                        <ArrowRight size={16} className="text-white/25 group-hover:text-white transition-colors" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {results && results.total > 0 && (
          <div className="p-4 border-t border-white/ text-center">
            <p className="text-sm text-white/40">
              {results.total} risultati trovati
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
