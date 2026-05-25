import React from 'react';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';

export default function ShareButton({ title, description, url }) {
  const handleShare = async () => {
    const shareData = {
      title,
      text: description,
      url: url || window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copia URL
        await navigator.clipboard.writeText(shareData.url);
        alert('Link copiato negli appunti!');
      }
    } catch (err) {
      console.error('Errore condivisione:', err);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      className="gap-2"
    >
      <Share2 size={16} />
      Condividi
    </Button>
  );
}