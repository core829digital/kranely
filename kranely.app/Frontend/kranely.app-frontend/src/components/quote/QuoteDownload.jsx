import React from 'react';
import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';

export default function QuoteDownload({ quoteData, totalPrice }) {
  const generateQuoteNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `IWH-${timestamp}-${random}`;
  };

  const downloadPDF = async () => {
    const doc = new jsPDF();
    const quoteNumber = generateQuoteNumber();

    // Colors - Minimal palette
    /** @type {[number, number, number]} */
    const primary = [33, 37, 41];
    /** @type {[number, number, number]} */
    const secondary = [108, 117, 125];
    /** @type {[number, number, number]} */
    const light = [248, 249, 250];
    /** @type {[number, number, number]} */
    const white = [255, 255, 255];

    // Load logo image (black version)
    const logoImg = new Image();
    logoImg.crossOrigin = 'anonymous';
    logoImg.src = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/9dc587ed1_Kranelynero.png';

    await new Promise((resolve) => {
      logoImg.onload = resolve;
      logoImg.onerror = resolve;
    });

    // Clean header with branding
    doc.setFillColor(...white);
    doc.rect(0, 0, 210, 55, 'F');

    // Logo - centered and larger for branding
    if (logoImg.complete) {
      doc.addImage(logoImg, 'PNG', 20, 12, 25, 25, '', 'FAST');
    }

    // Brand name and tagline
    doc.setTextColor(...primary);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Kranely', 50, 23);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...secondary);
    doc.text('Showroom | Materiali, Design, Casa', 50, 30);

    // Quote info - right side, well spaced
    doc.setTextColor(...secondary);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Preventivo N. ${quoteNumber}`, 190, 23, { align: 'right' });
    doc.text(new Date().toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }), 190, 30, { align: 'right' });

    // Elegant divider line
    doc.setDrawColor(...secondary);
    doc.setLineWidth(0.5);
    doc.line(20, 52, 190, 52);

    let yPos = 68;

    // Title section - minimal and clear
    doc.setTextColor(...primary);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Preventivo Indicativo', 20, yPos);
    yPos += 15;

    // Quote type badge - well spaced
    const quoteTypeText = quoteData.quote_type === 'finestre' ? 'Solo Infissi' :
      quoteData.quote_type === 'chiavi_in_mano' ? 'Chiavi in Mano' :
        'Progetto Completo';
    doc.setFillColor(240, 240, 242);
    doc.roundedRect(20, yPos - 5, 55, 9, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setTextColor(...secondary);
    doc.setFont('helvetica', 'bold');
    doc.text(quoteTypeText, 47.5, yPos, { align: 'center' });
    yPos += 20;

    // Technical Schema - Show once at the beginning
    const schemaImg = new Image();
    schemaImg.crossOrigin = 'anonymous';
    schemaImg.src = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/cdb44c5dd_ideal4000schemaz40blackandwhite.png';

    await new Promise((resolve) => {
      schemaImg.onload = resolve;
      schemaImg.onerror = resolve;
    });

    if (schemaImg.complete) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primary);
      doc.text('Schema Tecnico Telaio Z40', 20, yPos);
      yPos += 10;

      doc.setFillColor(250, 250, 252);
      doc.roundedRect(20, yPos, 170, 60, 2, 2, 'F');
      doc.addImage(schemaImg, 'PNG', 40, yPos + 5, 130, 50, '', 'FAST');
      yPos += 68;
    }

    // Window Configurations - Multiple windows support
    if (quoteData.window_config?.windows && quoteData.window_config.windows.length > 0) {
      const windows = quoteData.window_config.windows;

      // Section title
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primary);
      doc.text(`Configurazione Infissi (${windows.length} ${windows.length === 1 ? 'Finestra' : 'Finestre'})`, 20, yPos);
      yPos += 12;

      // Iterate through all windows
      for (let i = 0; i < windows.length; i++) {
        const wc = windows[i];

        // Check if we need a new page
        if (yPos > 200) {
          doc.addPage();
          if (logoImg.complete) {
            doc.addImage(logoImg, 'PNG', 20, 15, 15, 15, '', 'FAST');
          }
          doc.setDrawColor(...secondary);
          doc.setLineWidth(0.3);
          doc.line(20, 35, 190, 35);
          yPos = 50;
        }

        // Window number badge
        doc.setFillColor(59, 130, 246);
        doc.roundedRect(20, yPos - 3, 40, 8, 2, 2, 'F');
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text(`Finestra #${i + 1}`, 40, yPos + 2, { align: 'center' });
        yPos += 12;

        // Window Preview Image and specs side by side
        if (wc.material === 'pvc' && wc.previewImage) {
          const windowImg = new Image();
          windowImg.crossOrigin = 'anonymous';
          windowImg.src = wc.previewImage;

          await new Promise((resolve) => {
            windowImg.onload = resolve;
            windowImg.onerror = resolve;
          });

          if (windowImg.complete) {
            // Left side: Window preview
            doc.setFillColor(250, 250, 252);
            doc.roundedRect(20, yPos, 55, 60, 2, 2, 'F');
            doc.addImage(windowImg, 'PNG', 23, yPos + 5, 50, 50, '', 'FAST');

            // Right side: Specs
            const specsX = 82;
            let specsY = yPos + 2;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...primary);
            doc.text('Specifiche Tecniche', specsX, specsY);
            specsY += 8;

            const specs = [
              { label: 'Materiale', value: wc.material?.toUpperCase() || '-' },
              { label: 'Telaio', value: 'Z40' },
              { label: 'Tipo', value: wc.windowType === 'finestra' ? 'Finestra' : 'Porta Finestra' },
              { label: 'Ante', value: `${wc.ante} ${wc.ante === '1' ? 'Anta' : 'Ante'}` },
              { label: 'Quantità', value: wc.quantity?.toString() || '-' },
              { label: 'Dimensioni', value: wc.width && wc.height ? `${wc.width} × ${wc.height} cm` : '-' },
              { label: 'Vetro', value: wc.glassType === 'doppio' ? 'Doppio Vetro' : 'Triplo Vetro' },
              { label: 'Colore', value: wc.color === 'bianco_pasta' ? 'Bianco Pasta' : wc.color === 'bianco_legno' ? 'Bianco/Effetto Legno' : 'Effetto Legno' },
              { label: 'Prezzo', value: `€${wc.price?.toLocaleString('it-IT') || '-'}` }
            ];

            doc.setFontSize(8);
            specs.forEach(spec => {
              doc.setTextColor(...secondary);
              doc.setFont('helvetica', 'normal');
              doc.text(`${spec.label}:`, specsX, specsY);

              doc.setTextColor(...primary);
              doc.setFont('helvetica', 'bold');
              doc.text(spec.value, specsX + 35, specsY);
              specsY += 5;
            });

            yPos += 68;
          }
        }
        // Divider between windows
        if (i < windows.length - 1) {
          doc.setDrawColor(...secondary);
          doc.setLineWidth(0.3);
          doc.line(20, yPos, 190, yPos);
          yPos += 10;
        }
      }

      yPos += 10;
    }

    // Project Configuration Table
    if (quoteData.project_config) {
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primary);
      doc.text('CONFIGURAZIONE PROGETTO', 20, yPos);
      yPos += 8;

      // Table header
      doc.setFillColor(248, 249, 250);
      doc.rect(20, yPos - 5, 170, 8, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primary);
      doc.text('CARATTERISTICA', 25, yPos);
      doc.text('DETTAGLIO', 100, yPos);
      yPos += 8;

      // Table rows
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...secondary);
      doc.setFontSize(9);

      const pc = quoteData.project_config;
      const bd = pc.breakdown || {};
      const sd = bd.servicesDetail || {};

      const formatLabel = (key) => {
        const labels = {
          tinteggiatura: 'Tinteggiatura',
          riscaldamento: 'Riscaldamento',
          impianto_idraulico: 'Impianto Idraulico',
          impianto_elettrico: 'Impianto Elettrico',
          demolizioni: 'Demolizioni',
          climatizzazione: 'Climatizzazione',
          pavimentazione: 'Pavimentazione',
          coibentazione: 'Coibentazione',
          appartamento: 'Appartamento',
          villa: 'Villa',
          casa_indipendente: 'Casa Indipendente',
          attico: 'Attico',
          standard: 'Standard',
          premium: 'Premium',
          luxury: 'Luxury',
        };
        return labels[key] || key?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || '-';
      };

      const projectRows = [
        ['Tipo di Immobile', formatLabel(pc.propertyType)],
        ['Superficie', pc.squareMeters ? `${pc.squareMeters} m²` : '-'],
        ['Numero di Stanze', pc.rooms?.toString() || '-'],
        ['Numero di Bagni', pc.bathrooms?.toString() || '-'],
        ['Livello di Qualità', formatLabel(pc.qualityLevel)]
      ];

      projectRows.forEach((row, index) => {
        if (index % 2 === 0) {
          doc.setFillColor(252, 252, 252);
          doc.rect(20, yPos - 4, 170, 7, 'F');
        }
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primary);
        doc.text(row[0], 25, yPos);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...secondary);
        doc.text(row[1], 100, yPos);
        yPos += 7;
      });

      // ── Price Breakdown Section ──
      if (bd.base || bd.services || bd.bathrooms || bd.windows) {
        yPos += 6;

        // Check page space
        if (yPos > 200) {
          doc.addPage();
          if (logoImg.complete) {
            doc.addImage(logoImg, 'PNG', 20, 15, 15, 15, '', 'FAST');
          }
          doc.setDrawColor(...secondary);
          doc.setLineWidth(0.3);
          doc.line(20, 35, 190, 35);
          yPos = 50;
        }

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primary);
        doc.text('DETTAGLIO COSTI', 20, yPos);
        yPos += 8;

        // Table header
        doc.setFillColor(33, 37, 41);
        doc.roundedRect(20, yPos - 5, 170, 8, 1, 1, 'F');
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('VOCE', 25, yPos);
        doc.text('IMPORTO', 185, yPos, { align: 'right' });
        yPos += 8;

        const priceRow = (label, amount, isBold = false, indent = false) => {
          if (yPos > 250) {
            doc.addPage();
            if (logoImg.complete) {
              doc.addImage(logoImg, 'PNG', 20, 15, 15, 15, '', 'FAST');
            }
            doc.setDrawColor(...secondary);
            doc.setLineWidth(0.3);
            doc.line(20, 35, 190, 35);
            yPos = 50;
          }
          doc.setFont('helvetica', isBold ? 'bold' : 'normal');
          doc.setTextColor(...(isBold ? primary : secondary));
          doc.setFontSize(9);
          doc.text(label, indent ? 30 : 25, yPos);
          doc.setFont('helvetica', isBold ? 'bold' : 'normal');
          doc.setTextColor(...primary);
          doc.text(`€${amount.toLocaleString('it-IT')}`, 185, yPos, { align: 'right' });

          // Light divider line
          doc.setDrawColor(230, 230, 230);
          doc.setLineWidth(0.2);
          doc.line(20, yPos + 2, 190, yPos + 2);
          yPos += 7;
        };

        // Base renovation cost
        if (bd.base) {
          priceRow('Ristrutturazione Base', bd.base, true);
        }

        // Services with individual breakdown
        if (bd.services && Object.keys(sd).length > 0) {
          // Services header
          doc.setFillColor(248, 249, 250);
          doc.rect(20, yPos - 4, 170, 7, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...primary);
          doc.setFontSize(9);
          doc.text('Servizi Aggiuntivi', 25, yPos);
          doc.text(`€${bd.services.toLocaleString('it-IT')}`, 185, yPos, { align: 'right' });
          yPos += 8;

          // Individual services
          Object.entries(sd).forEach(([key, value]) => {
            priceRow(`• ${formatLabel(key)}`, value, false, true);
          });
        }

        // Bathrooms
        if (bd.bathrooms) {
          priceRow(`Bagni (${pc.bathrooms || 0})`, bd.bathrooms, true);
        }

        // Windows
        if (bd.windows) {
          priceRow('Infissi Inclusi', bd.windows, true);
        }

        // Total row
        yPos += 2;
        doc.setFillColor(33, 37, 41);
        doc.roundedRect(20, yPos - 4, 170, 10, 1, 1, 'F');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('TOTALE PROGETTO', 25, yPos + 2);
        doc.setFontSize(12);
        doc.text(`€${(pc.estimatedPrice || 0).toLocaleString('it-IT')}`, 185, yPos + 2, { align: 'right' });
        yPos += 14;
      }

      yPos += 10;
    }

    // Notes section
    if (quoteData.notes) {
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primary);
      doc.text('NOTE AGGIUNTIVE', 20, yPos);
      yPos += 8;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...secondary);
      const splitNotes = doc.splitTextToSize(quoteData.notes, 170);
      doc.text(splitNotes, 20, yPos);
      yPos += splitNotes.length * 5 + 10;
    }

    // Check if we need a new page for disclaimer
    if (yPos > 185) {
      doc.addPage();

      // Repeat minimal header on new page with branding
      if (logoImg.complete) {
        doc.addImage(logoImg, 'PNG', 20, 15, 15, 15, '', 'FAST');
      }
      doc.setDrawColor(...secondary);
      doc.setLineWidth(0.3);
      doc.line(20, 35, 190, 35);
      yPos = 50;
    }

    // Disclaimer box - well spaced to avoid overlaps
    doc.setFillColor(255, 250, 240);
    doc.roundedRect(20, yPos, 170, 58, 3, 3, 'F');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primary);
    doc.text('⚠️  Informazioni Importanti', 25, yPos + 9);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...secondary);
    const disclaimer = [
      '• Prezzo indicativo e stimato - Non rappresenta il costo reale del preventivo finale',
      '• Il prezzo definitivo sarà comunicato dopo un sopralluogo e valutazione specifica',
      '• Tutti i prezzi includono posa in opera e sono da intendersi IVA esclusa',
      '• Per configurazioni diverse o materiali specifici (Alluminio, Legno), contattaci in sede',
      '• Validità preventivo: 30 giorni dalla data di emissione',
      '• Materiali certificati e conformi alle normative vigenti • Garanzia 2 anni'
    ];

    let disclaimerY = yPos + 18;
    disclaimer.forEach(line => {
      const wrapped = doc.splitTextToSize(line, 160);
      doc.text(wrapped, 25, disclaimerY);
      disclaimerY += wrapped.length * 5;
    });

    yPos += 65;

    // Total Price Box - ensure no overlaps
    if (yPos > 230) {
      doc.addPage();

      // Repeat branding on new page
      if (logoImg.complete) {
        doc.addImage(logoImg, 'PNG', 20, 15, 15, 15, '', 'FAST');
      }
      doc.setDrawColor(...secondary);
      doc.setLineWidth(0.3);
      doc.line(20, 35, 190, 35);
      yPos = 50;
    }

    // Add spacing before total box
    yPos += 15;

    const totalY = yPos;
    doc.setDrawColor(...secondary);
    doc.setLineWidth(0.8);
    doc.roundedRect(20, totalY, 170, 32, 2, 2, 'D');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...secondary);
    doc.text('Totale Stimato', 30, totalY + 13);

    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primary);
    doc.text(`€ ${totalPrice.toLocaleString('it-IT')}`, 185, totalY + 19, { align: 'right' });

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...secondary);
    doc.text('Posa inclusa • IVA esclusa', 185, totalY + 26, { align: 'right' });

    // Clean footer with branding - well positioned
    const footerY = 277;
    doc.setDrawColor(...secondary);
    doc.setLineWidth(0.3);
    doc.line(20, footerY, 190, footerY);

    // Add small logo in footer for branding consistency
    if (logoImg.complete) {
      doc.addImage(logoImg, 'PNG', 20, footerY + 3, 8, 8, '', 'FAST');
    }

    doc.setFontSize(8);
    doc.setTextColor(...primary);
    doc.setFont('helvetica', 'bold');
    doc.text('Kranely Showroom', 32, footerY + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...secondary);
    doc.text('Via Emilia 22/F, Reggio Emilia - 42124', 32, footerY + 11);
    doc.text('+39 389 182 0808  •  info@kranely.app  •  admin@kranely.app  •  P.IVA 03096130350', 105, footerY + 9, { align: 'center' });
    doc.text(`#${quoteNumber}`, 190, footerY + 9, { align: 'right' });

    doc.save(`Kranely-Preventivo-${quoteNumber}.pdf`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center"
    >
      <Button
        onClick={downloadPDF}
        className="px-8 py-4 rounded-full bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef] text-[#212529] hover:shadow-2xl border-2 border-transparent"
      >
        <Download size={18} className="mr-2" />
        Scarica Preventivo PDF
      </Button>
    </motion.div>
  );
}
