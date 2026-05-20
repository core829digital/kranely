import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { base44 } from '@/api/base44Client';
import { Star, Upload, Check } from 'lucide-react';

export default function ReviewForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    customer_name: '',
    rating: 5,
    comment: '',
    service_type: 'generale',
    project_photo: ''
  });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFormData(prev => ({ ...prev, project_photo: file_url }));
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    await base44.entities.Review.create({
      ...formData,
      status: 'pending'
    });

    setSubmitting(false);
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 lg:p-8 shadow-lg space-y-6">
      <div>
        <Label className="text-[#2D3B35] mb-2">Nome</Label>
        <Input
          value={formData.customer_name}
          onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
          required
          placeholder="Il tuo nome"
          className="rounded-xl"
        />
      </div>

      <div>
        <Label className="text-[#2D3B35] mb-3 block">Valutazione</Label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <motion.button
              key={star}
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
              className="focus:outline-none"
            >
              <Star
                size={32}
                className={star <= formData.rating ? 'fill-[#C9A962] text-[#C9A962]' : 'text-gray-300'}
              />
            </motion.button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-[#2D3B35] mb-2">Tipo di Servizio</Label>
        <RadioGroup
          value={formData.service_type}
          onValueChange={(value) => setFormData(prev => ({ ...prev, service_type: value }))}
          className="flex gap-4 mt-2"
        >
          <label className="flex items-center gap-2 cursor-pointer">
            <RadioGroupItem value="finestre" />
            <span className="text-sm">Finestre</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <RadioGroupItem value="chiavi_in_mano" />
            <span className="text-sm">Chiavi in Mano</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <RadioGroupItem value="generale" />
            <span className="text-sm">Generale</span>
          </label>
        </RadioGroup>
      </div>

      <div>
        <Label className="text-[#2D3B35] mb-2">Commento</Label>
        <Textarea
          value={formData.comment}
          onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
          required
          placeholder="Raccontaci la tua esperienza..."
          className="rounded-xl min-h-[120px]"
        />
      </div>

      <div>
        <Label className="text-[#2D3B35] mb-2">Foto del Progetto (opzionale)</Label>
        <div className="relative">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            id="photo-upload"
          />
          <label
            htmlFor="photo-upload"
            className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#C9A962] transition-colors"
          >
            {uploading ? (
              <span className="text-sm text-gray-500">Caricamento...</span>
            ) : formData.project_photo ? (
              <span className="text-sm text-[#C9A962] flex items-center gap-2">
                <Check size={16} /> Foto caricata
              </span>
            ) : (
              <>
                <Upload size={20} className="text-gray-400" />
                <span className="text-sm text-gray-500">Carica una foto</span>
              </>
            )}
          </label>
        </div>
      </div>

      <Button
        type="submit"
        disabled={submitting}
        className="w-full bg-[#C9A962] hover:bg-[#d4b76d] text-[#2D3B35] rounded-full"
      >
        {submitting ? 'Invio in corso...' : 'Invia Recensione'}
      </Button>

      <p className="text-xs text-gray-500 text-center">
        La tua recensione sarà pubblicata dopo la moderazione
      </p>
    </form>
  );
}