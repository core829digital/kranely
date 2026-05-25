import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useMutation } from 'convex/react';
import { api } from '../../../../../Backend/convex/_generated/api';
import { useUser } from '@clerk/clerk-react';
import { Box, Check, Plus, X, Send, Layers, Home, AlertCircle, Mail, User } from 'lucide-react';

const ROOMS = [
  { id: 'soggiorno', label: 'Soggiorno', emoji: '🛋️' },
  { id: 'cucina', label: 'Cucina', emoji: '🍳' },
  { id: 'sala_pranzo', label: 'Sala da Pranzo', emoji: '🍽️' },
  { id: 'camera_matrimoniale', label: 'Camera Matrimoniale', emoji: '🛏️' },
  { id: 'camera_singola', label: 'Camera Singola', emoji: '🛏️' },
  { id: 'bagno_principale', label: 'Bagno Principale', emoji: '🚿' },
  { id: 'bagno_secondario', label: 'Bagno Secondario', emoji: '🚿' },
  { id: 'studio', label: 'Studio / Ufficio', emoji: '💼' },
  { id: 'corridoio', label: 'Corridoio / Ingresso', emoji: '🚪' },
  { id: 'ripostiglio', label: 'Ripostiglio', emoji: '📦' },
  { id: 'terrazza', label: 'Terrazza / Balcone', emoji: '🌿' },
  { id: 'garage', label: 'Garage / Box', emoji: '🚗' },
];

export default function CalcolatoreRender3D() {
  const { user } = useUser();
  const createRender3DRequest = useMutation(api.edilizia.createRender3DRequest);

  const [mode, setMode] = useState('per_stanza'); // 'per_stanza' | 'appartamento_intero'
  // rooms state: { [room_id]: { selected: bool, mq: string } }
  const [rooms, setRooms] = useState(
    Object.fromEntries(ROOMS.map(r => [r.id, { selected: false, mq: '' }]))
  );
  const [contactForm, setContactForm] = useState({
    email: user?.primaryEmailAddress?.emailAddress || '',
    full_name: user?.fullName || '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  // Sync Clerk data
  React.useEffect(() => {
    if (user) {
      setContactForm(prev => ({
        ...prev,
        email: prev.email || user.primaryEmailAddress?.emailAddress || '',
        full_name: prev.full_name || user.fullName || '',
      }));
    }
  }, [user]);

  // Mode change: when switching modes, keep room MQs but adjust selection logic
  const handleModeChange = (newMode) => {
    setMode(newMode);
    if (newMode === 'appartamento_intero') {
      // In apartment mode, all rooms are "visible" by default — none auto-selected
      setRooms(prev => Object.fromEntries(
        Object.entries(prev).map(([id, data]) => [id, { ...data, selected: false }])
      ));
    }
  };

  const toggleRoom = (roomId) => {
    setRooms(prev => ({
      ...prev,
      [roomId]: { ...prev[roomId], selected: !prev[roomId].selected, mq: prev[roomId].selected ? '' : prev[roomId].mq },
    }));
  };

  const setRoomMq = (roomId, val) => {
    setRooms(prev => ({ ...prev, [roomId]: { ...prev[roomId], mq: val } }));
  };

  const selectedRooms = ROOMS.filter(r => rooms[r.id]?.selected);

  const totalMq = useMemo(() =>
    selectedRooms.reduce((sum, r) => sum + (Number(rooms[r.id]?.mq) || 0), 0),
    [rooms, selectedRooms]
  );

  const validate = () => {
    const e = {};
    if (!contactForm.email) e.email = 'Email obbligatoria';
    if (!contactForm.full_name) e.full_name = 'Nome obbligatorio';
    if (selectedRooms.length === 0) e.rooms = 'Seleziona almeno una stanza';
    const missingMq = selectedRooms.some(r => !rooms[r.id]?.mq || Number(rooms[r.id].mq) <= 0);
    if (missingMq) e.mq = 'Inserisci i MQ per ogni stanza selezionata';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await createRender3DRequest({
        email: contactForm.email,
        full_name: contactForm.full_name,
        mode,
        rooms: selectedRooms.map(r => ({
          room_id: r.id,
          room_label: r.label,
          mq: Number(rooms[r.id].mq),
        })),
        total_mq: totalMq,
        notes: contactForm.notes || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Render3D request error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-[#495057] to-[#6c757d] border border-[#FFC703]/20 rounded-3xl p-10 text-center max-w-lg mx-auto shadow-2xl"
      >
        <div className="w-16 h-16 rounded-full bg-[#FFC703]/20 border border-[#FFC703]/20 flex items-center justify-center mx-auto mb-5">
          <Check size={28} className="text-[#FFC703]" />
        </div>
        <h3 className="text-2xl font-medium text-[#f8f9fa] mb-3">Richiesta Inviata!</h3>
        <p className="text-[#dee2e6] text-sm leading-relaxed mb-6">
          Il nostro team elaborerà il preventivo Render 3D per ogni stanza e ti invierà via email il dettaglio dei costi.
        </p>
        <div className="bg-[#343a40]/60 rounded-xl p-4 text-left mb-6">
          <p className="text-[#adb5bd] text-xs uppercase tracking-wider mb-2">Stanze richieste</p>
          <div className="flex flex-wrap gap-2">
            {selectedRooms.map(r => (
              <span key={r.id} className="px-2.5 py-1 bg-[#FFC703]/20 border border-[#FFC703]/20 rounded-full text-blue-200 text-xs">
                {r.emoji} {r.label} — {rooms[r.id]?.mq} MQ
              </span>
            ))}
          </div>
        </div>
        <button
          onClick={() => {
            setSubmitted(false);
            setRooms(Object.fromEntries(ROOMS.map(r => [r.id, { selected: false, mq: '' }])));
          }}
          className="text-[#adb5bd] text-sm hover:text-[#f8f9fa] transition-colors"
        >
          Nuova richiesta
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">

      {/* Header */}
      <div className="text-center pb-2">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFC703]/10 border border-[#FFC703]/20 rounded-full mb-4">
          <Box size={14} className="text-[#FFC703]" />
          <span className="text-blue-200 text-xs font-medium uppercase tracking-wider">Render 3D</span>
        </div>
        <p className="text-[#dee2e6] text-sm max-w-md mx-auto">
          Seleziona le stanze e i relativi MQ. Il nostro team ti invierà il preventivo personalizzato via email.
        </p>
      </div>

      {/* Contact */}
      <div className="bg-gradient-to-br from-[#495057] to-[#6c757d] border border-[#f8f9fa]/15 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-[#f8f9fa]/10 flex items-center justify-center">
            <User size={16} className="text-[#f8f9fa]" />
          </div>
          <h3 className="text-[#f8f9fa] font-medium">Dati di Contatto</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-[#dee2e6] text-xs mb-1.5 block">Nome e Cognome *</Label>
            <Input
              value={contactForm.full_name}
              onChange={e => setContactForm(prev => ({ ...prev, full_name: e.target.value }))}
              disabled={!!user?.fullName}
              placeholder="Mario Rossi"
              className={`rounded-xl bg-[#212529]/60 border-[#f8f9fa]/20 text-[#f8f9fa] placeholder:text-[#6c757d] focus:border-[#f8f9fa]/50 disabled:opacity-60 ${errors.full_name ? 'border-red-400' : ''}`}
            />
            {errors.full_name && <p className="text-red-400 text-xs mt-1">{errors.full_name}</p>}
          </div>
          <div>
            <Label className="text-[#dee2e6] text-xs mb-1.5 flex items-center gap-1.5">
              <Mail size={11} /> Email *
            </Label>
            <Input
              type="email"
              value={contactForm.email}
              onChange={e => setContactForm(prev => ({ ...prev, email: e.target.value }))}
              disabled={!!user}
              placeholder="mario@email.it"
              className={`rounded-xl bg-[#212529]/60 border-[#f8f9fa]/20 text-[#f8f9fa] placeholder:text-[#6c757d] focus:border-[#f8f9fa]/50 disabled:opacity-60 ${errors.email ? 'border-red-400' : ''}`}
            />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
          </div>
        </div>
        {user && (
          <div className="mt-3 flex items-center gap-2 text-xs text-green-400">
            <Check size={12} /> Dati pre-compilati dal tuo account
          </div>
        )}
      </div>

      {/* Mode Toggle */}
      <div className="bg-gradient-to-br from-[#495057] to-[#6c757d] border border-[#f8f9fa]/15 rounded-2xl p-6 shadow-xl">
        <p className="text-[#adb5bd] text-xs uppercase tracking-wider mb-4">Modalità di selezione</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => handleModeChange('per_stanza')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all ${
              mode === 'per_stanza'
                ? 'border-[#FFC703] bg-blue-400/15 text-blue-200'
                : 'border-[#f8f9fa]/20 text-[#dee2e6] hover:border-[#f8f9fa]/40'
            }`}
          >
            <Layers size={16} />
            <span className="text-sm font-medium">Per Stanza</span>
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('appartamento_intero')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all ${
              mode === 'appartamento_intero'
                ? 'border-[#FFC703] bg-blue-400/15 text-blue-200'
                : 'border-[#f8f9fa]/20 text-[#dee2e6] hover:border-[#f8f9fa]/40'
            }`}
          >
            <Home size={16} />
            <span className="text-sm font-medium">Appartamento Intero</span>
          </button>
        </div>
        <p className="text-[#6c757d] text-xs mt-3">
          {mode === 'per_stanza'
            ? 'Clicca su una stanza per aggiungerla alla richiesta, poi inserisci i MQ.'
            : 'Seleziona tutte le stanze del tuo appartamento inserendo i MQ per ognuna.'}
        </p>
      </div>

      {/* Room Selection */}
      <div className="bg-gradient-to-br from-[#495057] to-[#6c757d] border border-[#f8f9fa]/15 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-[#f8f9fa] font-medium">Seleziona le Stanze</h3>
            {errors.rooms && <p className="text-red-400 text-xs mt-1">{errors.rooms}</p>}
            {errors.mq && <p className="text-red-400 text-xs mt-0.5">{errors.mq}</p>}
          </div>
          {selectedRooms.length > 0 && (
            <span className="px-3 py-1 bg-[#FFC703]/20 border border-[#FFC703]/20 rounded-full text-blue-200 text-xs">
              {selectedRooms.length} stanze — {totalMq} MQ tot.
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {ROOMS.map(room => {
            const isSelected = rooms[room.id]?.selected;
            return (
              <div key={room.id} className={`rounded-xl border-2 transition-all overflow-hidden ${
                isSelected
                  ? 'border-[#FFC703] bg-[#FFC703]/10'
                  : 'border-[#f8f9fa]/15 bg-[#343a40]/40 hover:border-[#f8f9fa]/30'
              }`}>
                <button
                  type="button"
                  onClick={() => toggleRoom(room.id)}
                  className="w-full flex items-center gap-2.5 p-3 text-left"
                >
                  <span className="text-lg flex-shrink-0">{room.emoji}</span>
                  <span className={`text-xs font-medium leading-tight flex-1 min-w-0 ${isSelected ? 'text-blue-200' : 'text-[#dee2e6]'}`}>
                    {room.label}
                  </span>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                    isSelected ? 'bg-blue-400' : 'bg-[#f8f9fa]/10'
                  }`}>
                    {isSelected ? <Check size={11} className="text-white" /> : <Plus size={11} className="text-[#adb5bd]" />}
                  </div>
                </button>

                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3 flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          value={rooms[room.id]?.mq || ''}
                          onChange={e => setRoomMq(room.id, e.target.value)}
                          placeholder="MQ"
                          onClick={e => e.stopPropagation()}
                          className="h-8 text-xs rounded-lg bg-[#212529]/60 border-[#FFC703]/20 text-[#f8f9fa] placeholder:text-[#6c757d] focus:border-[#FFC703]/60"
                        />
                        <span className="text-[#FFC703] text-xs flex-shrink-0">MQ</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected rooms summary */}
      <AnimatePresence>
        {selectedRooms.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-[#212529]/80 border border-[#FFC703]/20 rounded-2xl p-5"
          >
            <p className="text-[#adb5bd] text-xs uppercase tracking-wider mb-3">Riepilogo richiesta</p>
            <div className="space-y-2">
              {selectedRooms.map(r => (
                <div key={r.id} className="flex items-center justify-between">
                  <span className="text-[#dee2e6] text-sm">{r.emoji} {r.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[#f8f9fa] text-sm font-medium">
                      {rooms[r.id]?.mq ? `${rooms[r.id].mq} MQ` : <span className="text-[#6c757d]">MQ mancanti</span>}
                    </span>
                    <button type="button" onClick={() => toggleRoom(r.id)} className="text-[#6c757d] hover:text-red-400 transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
              <div className="border-t border-[#f8f9fa]/10 pt-2 mt-2 flex justify-between">
                <span className="text-[#adb5bd] text-sm">Totale</span>
                <span className="text-[#f8f9fa] font-medium">{totalMq} MQ</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notes */}
      <div className="bg-gradient-to-br from-[#495057] to-[#6c757d] border border-[#f8f9fa]/15 rounded-2xl p-5 shadow-xl">
        <Label className="text-[#dee2e6] text-xs mb-2 block">Note aggiuntive <span className="text-[#6c757d]">(opzionale)</span></Label>
        <Textarea
          value={contactForm.notes}
          onChange={e => setContactForm(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Stile preferito, materiali, riferimenti fotografici, planimetria disponibile..."
          className="rounded-xl bg-[#212529]/60 border-[#f8f9fa]/20 text-[#f8f9fa] placeholder:text-[#6c757d] focus:border-[#f8f9fa]/50 min-h-[80px] text-sm"
        />
      </div>

      {/* Info box + Submit */}
      <div className="bg-gradient-to-r from-[#212529] to-[#343a40] border border-[#FFC703]/20 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-start gap-3 mb-5">
          <AlertCircle size={16} className="text-[#FFC703] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[#f8f9fa] text-sm font-medium mb-1">Come funziona il preventivo Render 3D</p>
            <p className="text-[#adb5bd] text-xs leading-relaxed">
              Invia la richiesta con le stanze e i MQ. Il nostro team calcolerà il prezzo per ogni stanza e ti invierà il preventivo completo via email entro 24/48h.
            </p>
          </div>
        </div>
        <Button
          type="submit"
          disabled={isSubmitting || selectedRooms.length === 0}
          className="w-full py-5 bg-gradient-to-r from-[#FFC703] to-[#FFC703] text-white hover:from-blue-400 hover:to-[#FFC703] hover:shadow-2xl rounded-full text-base font-medium transition-all disabled:opacity-50"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              Invio in corso...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Send size={16} />
              Richiedi Preventivo Render 3D
              {selectedRooms.length > 0 && <span className="ml-1 text-blue-200 text-sm">({selectedRooms.length} stanze)</span>}
            </span>
          )}
        </Button>
      </div>
    </form>
  );
}

