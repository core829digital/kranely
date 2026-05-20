import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';


import UniversalPdfViewer from '../components/dashboard/UniversalPdfViewer';
import {
  FileText,
  Plus,
  Download,
  Eye,
  Trash2,
  Edit,
  Save,
  Image as ImageIcon,
  Type,
  Table as TableIcon,
  PenTool,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  ShoppingCart
} from 'lucide-react';
import jsPDF from 'jspdf';
import SignatureCanvas from '../components/pdf/SignatureCanvas';
import ProductCatalog from '../components/pdf/ProductCatalog';

export default function PdfEditor() {
  const [user, setUser] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [companySignature, setCompanySignature] = useState(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [viewPdfUrl, setViewPdfUrl] = useState(null);
  const [sendData, setSendData] = useState({ cliente_email: '', cliente_nome: '' });
  const [activeTab, setActiveTab] = useState('editor');
  const [quoteItems, setQuoteItems] = useState([]);
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [giorniValidita, setGiorniValidita] = useState(30);
  const [customFieldsData, setCustomFieldsData] = useState({});
  const [templateData, setTemplateData] = useState({
    template_name: '',
    template_type: 'custom',
    elements: [],
    fields: []
  });
  const [previewData, setPreviewData] = useState({
    numero_preventivo: 'PREV-001',
    data_emissione: new Date().toLocaleDateString('it-IT'),
    data_validita: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('it-IT'),
    cliente_nome: 'Mario Rossi',
    cliente_indirizzo: 'Via Roma 123, Milano',
    cliente_telefono: '+39 123 456 7890',
    cliente_email: 'mario.rossi@email.com',
    termini_pagamento: '50% acconto, 50% a consegna',
    note: 'Preventivo valido 30 giorni'
  });

  const queryClient = useQueryClient();

  React.useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);
  };

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['pdf-templates', user?.email],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.PDFTemplate.filter({
        company_email: user.email
      });
    },
    enabled: !!user
  });

  const { data: signatures = [] } = useQuery({
    queryKey: ['quote-signatures', user?.email],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.QuoteSignature.filter({
        created_by: user.email
      });
    },
    enabled: !!user,
    refetchInterval: 5000
  });

  const createTemplateMutation = useMutation({
    /** @param {any} data */
    mutationFn: async (data) => {
      return await base44.entities.PDFTemplate.create({
        company_email: user.email,
        template_name: data.template_name,
        template_data: data,
        elements: data.elements
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdf-templates'] });
      setIsCreating(false);
      setTemplateData({
        template_name: '',
        template_type: 'custom',
        elements: [],
        fields: []
      });
    }
  });

  const updateTemplateMutation = useMutation({
    /** @param {{id: string, data: any}} params */
    mutationFn: async ({ id, data }) => {
      return await base44.entities.PDFTemplate.update(id, {
        template_name: data.template_name,
        template_data: data,
        elements: data.elements
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdf-templates'] });
      setSelectedTemplate(null);
    }
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id) => base44.entities.PDFTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdf-templates'] });
    }
  });

  const createSignatureMutation = useMutation({
    /** @param {any} data */
    mutationFn: async (data) => {
      return await base44.entities.QuoteSignature.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote-signatures'] });
    }
  });

  const updateSignatureMutation = useMutation({
    /** @param {{id: string, data: any}} params */
    mutationFn: async ({ id, data }) => {
      return await base44.entities.QuoteSignature.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote-signatures'] });
    }
  });

  const generateQuoteNumber = async () => {
    const year = new Date().getFullYear();

    // Get or create counter for current year
    const counters = await base44.entities.QuoteCounter.filter({
      company_email: user.email,
      anno: year
    });

    let counter;
    if (counters.length === 0) {
      counter = await base44.entities.QuoteCounter.create({
        company_email: user.email,
        anno: year,
        ultimo_numero: 1
      });
    } else {
      counter = counters[0];
      await base44.entities.QuoteCounter.update(counter.id, {
        ultimo_numero: counter.ultimo_numero + 1
      });
      counter.ultimo_numero += 1;
    }

    const numeroProgressivo = String(counter.ultimo_numero).padStart(3, '0');
    return `PREV-${year}-${numeroProgressivo}`;
  };

  const calculateTotals = () => {
    const subtotale = quoteItems.reduce((sum, item) => sum + (item.quantita * item.prezzo_unitario), 0);
    const iva = subtotale * 0.22; // 22% IVA
    const totale = subtotale + iva;
    return { subtotale, iva, totale };
  };

  const addProductToQuote = (product) => {
    const newItem = {
      id: Date.now(),
      product_id: product.id,
      nome: product.nome,
      quantita: 1,
      prezzo_unitario: product.prezzo_unitario,
      unita_misura: product.unita_misura
    };
    setQuoteItems([...quoteItems, newItem]);
    setShowCatalogModal(false);
  };

  const updateQuoteItem = (id, updates) => {
    setQuoteItems(quoteItems.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const removeQuoteItem = (id) => {
    setQuoteItems(quoteItems.filter(item => item.id !== id));
  };

  const predefinedTemplates = {
    finestre: {
      name: 'Preventivo Finestre',
      elements: [
        { id: 1, type: 'text', content: 'Cliente: {{cliente_nome}}', x: 20, y: 60, style: { fontSize: 12 } },
        { id: 2, type: 'text', content: 'Indirizzo: {{cliente_indirizzo}}', x: 20, y: 75, style: { fontSize: 10 } },
        { id: 3, type: 'text', content: 'Tel: {{cliente_telefono}} | Email: {{cliente_email}}', x: 20, y: 90, style: { fontSize: 10 } },
        { id: 4, type: 'text', content: 'Preventivo N.: {{numero_preventivo}}', x: 20, y: 110, style: { fontSize: 11, fontWeight: 'bold' } },
        { id: 5, type: 'text', content: 'Data: {{data_emissione}}', x: 20, y: 125, style: { fontSize: 10 } },
        { id: 6, type: 'table', x: 20, y: 150, width: 170, height: 80 },
        { id: 7, type: 'text', content: 'Termini di pagamento: {{termini_pagamento}}', x: 20, y: 240, style: { fontSize: 10 } },
        { id: 8, type: 'text', content: 'Validità: {{data_validita}}', x: 20, y: 255, style: { fontSize: 10 } },
        { id: 9, type: 'text', content: 'Note: {{note}}', x: 20, y: 270, style: { fontSize: 9 } }
      ]
    },
    chiavi_in_mano: {
      name: 'Preventivo Chiavi in Mano',
      elements: [
        { id: 1, type: 'text', content: 'PROGETTO COMPLETO CHIAVI IN MANO', x: 20, y: 50, style: { fontSize: 14, fontWeight: 'bold' } },
        { id: 2, type: 'text', content: 'Cliente: {{cliente_nome}}', x: 20, y: 70, style: { fontSize: 12 } },
        { id: 3, type: 'text', content: '{{cliente_indirizzo}}', x: 20, y: 85, style: { fontSize: 10 } },
        { id: 4, type: 'text', content: 'Preventivo: {{numero_preventivo}} | Data: {{data_emissione}}', x: 20, y: 105, style: { fontSize: 10 } },
        { id: 5, type: 'table', x: 20, y: 130, width: 170, height: 100 },
        { id: 6, type: 'text', content: 'Modalità di pagamento: {{termini_pagamento}}', x: 20, y: 245, style: { fontSize: 10 } },
        { id: 7, type: 'text', content: 'Offerta valida fino al: {{data_validita}}', x: 20, y: 260, style: { fontSize: 10 } }
      ]
    },
    ristrutturazione: {
      name: 'Preventivo Ristrutturazione',
      elements: [
        { id: 1, type: 'text', content: 'PREVENTIVO RISTRUTTURAZIONE', x: 20, y: 50, style: { fontSize: 14, fontWeight: 'bold' } },
        { id: 2, type: 'text', content: 'Spett.le {{cliente_nome}}', x: 20, y: 70, style: { fontSize: 11 } },
        { id: 3, type: 'text', content: 'Indirizzo intervento: {{cliente_indirizzo}}', x: 20, y: 85, style: { fontSize: 10 } },
        { id: 4, type: 'text', content: 'Rif.: {{numero_preventivo}} del {{data_emissione}}', x: 20, y: 100, style: { fontSize: 10 } },
        { id: 5, type: 'text', content: 'DESCRIZIONE LAVORI:', x: 20, y: 120, style: { fontSize: 11, fontWeight: 'bold' } },
        { id: 6, type: 'table', x: 20, y: 140, width: 170, height: 90 },
        { id: 7, type: 'text', content: 'Pagamenti: {{termini_pagamento}}', x: 20, y: 245, style: { fontSize: 10 } },
        { id: 8, type: 'text', content: 'Preventivo valido: {{data_validita}}', x: 20, y: 260, style: { fontSize: 10 } },
        { id: 9, type: 'text', content: '{{note}}', x: 20, y: 275, style: { fontSize: 9 } }
      ]
    }
  };

  const loadPredefinedTemplate = (type) => {
    const template = predefinedTemplates[type];
    if (template) {
      const defaultFields = [
        { id: Date.now() + 1, name: 'durata_lavori', label: 'Durata Lavori', type: 'text', defaultValue: '30 giorni' },
        { id: Date.now() + 2, name: 'garanzia', label: 'Garanzia', type: 'text', defaultValue: '2 anni' },
        { id: Date.now() + 3, name: 'termini_condizioni', label: 'Termini e Condizioni', type: 'textarea', defaultValue: 'Come da preventivo allegato' }
      ];

      setTemplateData({
        template_name: template.name,
        template_type: type,
        elements: template.elements,
        fields: defaultFields
      });

      // Initialize custom fields with defaults
      const initialData = {};
      defaultFields.forEach(field => {
        initialData[field.name] = field.defaultValue || '';
      });
      setCustomFieldsData(initialData);

      setIsCreating(true);
    }
  };

  const addElement = (type) => {
    const newElement = {
      id: Date.now(),
      type,
      x: 20,
      y: 20 + (templateData.elements.length * 30),
      width: type === 'image' ? 100 : 200,
      height: type === 'table' ? 80 : 30,
      content: type === 'text' ? 'Testo esempio' : '',
      style: {
        fontSize: 12,
        fontWeight: 'normal',
        color: '#000000'
      }
    };
    setTemplateData({
      ...templateData,
      elements: [...templateData.elements, newElement]
    });
  };

  const addField = () => {
    setTemplateData({
      ...templateData,
      fields: [...templateData.fields, { id: Date.now(), name: '', label: '', type: 'text', defaultValue: '' }]
    });
  };

  const updateField = (id, updates) => {
    setTemplateData({
      ...templateData,
      fields: templateData.fields.map(f => f.id === id ? { ...f, ...updates } : f)
    });
  };

  const removeField = (id) => {
    setTemplateData({
      ...templateData,
      fields: templateData.fields.filter(f => f.id !== id)
    });
  };

  const updateElement = (id, updates) => {
    setTemplateData({
      ...templateData,
      elements: templateData.elements.map(el =>
        el.id === id ? { ...el, ...updates } : el
      )
    });
  };

  const removeElement = (id) => {
    setTemplateData({
      ...templateData,
      elements: templateData.elements.filter(el => el.id !== id)
    });
  };

  const replaceVariables = (text) => {
    if (!text) return text;
    let result = text;

    // Replace standard fields
    Object.keys(previewData).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, previewData[key] || '');
    });

    // Replace custom fields
    Object.keys(customFieldsData).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, customFieldsData[key] || '');
    });

    return result;
  };

  const handleSaveSignature = (signatureData) => {
    setCompanySignature(signatureData);
    setShowSignatureModal(false);
  };

  const sendForSignature = async () => {
    if (!sendData.cliente_email || !sendData.cliente_nome) return;

    // Generate automatic quote number
    const numeroPreventivo = await generateQuoteNumber();

    // Calculate expiration date
    const dataScadenza = new Date();
    dataScadenza.setDate(dataScadenza.getDate() + giorniValidita);

    // Generate PDF
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text('PREVENTIVO', 105, 20, { align: 'center' });

    templateData.elements.forEach(element => {
      if (element.type === 'text') {
        doc.setFontSize(element.style.fontSize || 12);
        if (element.style.fontWeight === 'bold') {
          doc.setFont(undefined, 'bold');
        }
        const content = replaceVariables(element.content);
        doc.text(content, element.x, element.y);
        doc.setFont(undefined, 'normal');
      }
    });

    const pdfBlob = doc.output('blob');
    const file = new File([pdfBlob], `preventivo_${previewData.numero_preventivo}.pdf`, { type: 'application/pdf' });

    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    const { subtotale, iva, totale } = calculateTotals();

    // Create automation record
    await base44.entities.QuoteAutomation.create({
      preventivo_id: selectedTemplate?.id || Date.now().toString(),
      numero_preventivo: numeroPreventivo,
      data_scadenza: dataScadenza.toISOString().split('T')[0],
      giorni_validita: giorniValidita,
      cliente_email: sendData.cliente_email,
      prodotti: quoteItems,
      totale_imponibile: subtotale,
      totale_iva: iva,
      totale_generale: totale,
      notifica_inviata: false,
      notifica_giorni_prima: 7
    });

    // Create signature request
    await createSignatureMutation.mutateAsync({
      preventivo_id: selectedTemplate?.id || Date.now().toString(),
      numero_preventivo: numeroPreventivo,
      cliente_nome: sendData.cliente_nome,
      cliente_email: sendData.cliente_email,
      pdf_url: file_url,
      status: 'pending',
      sent_at: new Date().toISOString(),
      company_signature: companySignature
    });

    // Send email
    await base44.integrations.Core.SendEmail({
      to: sendData.cliente_email,
      subject: `Preventivo ${numeroPreventivo} - Richiesta Firma`,
      body: `Gentile ${sendData.cliente_nome},\n\nLe inviamo il preventivo ${numeroPreventivo} per un importo totale di € ${totale.toFixed(2)}.\n\nIl preventivo è valido fino al ${dataScadenza.toLocaleDateString('it-IT')}.\n\nPuò visualizzare e firmare il documento accedendo alla piattaforma IwHome.\n\nCordiali saluti,\nIwHome Team`
    });

    setShowSendModal(false);
    setSendData({ cliente_email: '', cliente_nome: '' });
  };

  const generatePDF = () => {
    const doc = new jsPDF();

    // Logo e intestazione
    doc.setFontSize(20);
    doc.text('PREVENTIVO', 105, 20, { align: 'center' });

    // Elementi del template con dati dinamici
    templateData.elements.forEach(element => {
      if (element.type === 'text') {
        doc.setFontSize(element.style.fontSize || 12);
        if (element.style.fontWeight === 'bold') {
          doc.setFont(undefined, 'bold');
        }
        const content = replaceVariables(element.content);
        doc.text(content, element.x, element.y);
        doc.setFont(undefined, 'normal');
      } else if (element.type === 'table') {
        const startY = element.y;
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text('Descrizione', element.x, startY);
        doc.text('Q.tà', element.x + 80, startY);
        doc.text('Prezzo', element.x + 120, startY);
        doc.text('Totale', element.x + 160, startY);
        doc.setFont(undefined, 'normal');
        doc.line(element.x, startY + 2, element.x + element.width, startY + 2);

        // Riga esempio
        doc.text('Prodotto esempio', element.x, startY + 10);
        doc.text('1', element.x + 80, startY + 10);
        doc.text('€ 0.00', element.x + 120, startY + 10);
        doc.text('€ 0.00', element.x + 160, startY + 10);
      }
    });

    // Totale
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('TOTALE: € _______', 20, 270);
    doc.setFont(undefined, 'normal');

    // Footer
    doc.setFontSize(8);
    doc.text('IwHome - Via Emilia 22/F, Reggio Emilia - 42124', 105, 285, { align: 'center' });
    doc.text('Tel: +39 389 182 0808 | info@iwhome.it | amministrazione@iwhome.it | P.IVA 03096130350', 105, 290, { align: 'center' });

    // Add company signature if exists
    if (companySignature) {
      doc.addImage(companySignature, 'PNG', 20, 255, 50, 20);
      doc.setFontSize(8);
      doc.text('Firma Azienda', 20, 278);
    }

    doc.save(`preventivo_${replaceVariables(previewData.numero_preventivo)}.pdf`);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock size={16} className="text-yellow-500" />;
      case 'signed': return <CheckCircle size={16} className="text-green-500" />;
      case 'rejected': return <XCircle size={16} className="text-red-500" />;
      default: return null;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'In attesa';
      case 'signed': return 'Firmato';
      case 'rejected': return 'Rifiutato';
      default: return status;
    }
  };

  const saveTemplate = () => {
    if (selectedTemplate) {
      updateTemplateMutation.mutate({
        id: selectedTemplate.id,
        data: templateData
      });
    } else {
      createTemplateMutation.mutate(templateData);
    }
  };

  const loadTemplate = (template) => {
    setSelectedTemplate(template);
    const loadedData = template.template_data || {
      template_name: template.template_name,
      template_type: template.template_type || 'custom',
      elements: template.elements || [],
      fields: template.fields || []
    };
    setTemplateData(loadedData);

    // Initialize custom fields data with default values
    const initialCustomData = {};
    (loadedData.fields || []).forEach(field => {
      initialCustomData[field.name] = field.defaultValue || '';
    });
    setCustomFieldsData(initialCustomData);

    setIsCreating(true);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[#f8f9fa]">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#212529] via-[#343a40] to-[#495057] relative overflow-hidden">
      
      
      <UniversalPdfViewer
        isOpen={!!viewPdfUrl}
        onClose={() => setViewPdfUrl(null)}
        url={viewPdfUrl}
        title="Visualizzazione Documento"
      />

      <div className="lg:ml-[280px] pt-[76px] relative z-10 min-h-screen pb-safe">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-medium text-[#f8f9fa] mb-1">
                Editor PDF Preventivi
              </h1>
              <p className="text-xs sm:text-sm text-[#dee2e6]">Crea, gestisci e invia preventivi con firma elettronica</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  setIsCreating(true);
                  setActiveTab('editor');
                  setSelectedTemplate(null);
                  setTemplateData({ template_name: '', template_type: 'custom', elements: [], fields: [] });
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
              >
                <Plus size={18} className="mr-2" />
                Nuovo
              </Button>
            </div>
          </div>

          {/* Tabs */}
          {(isCreating || activeTab === 'catalogo') && (
            <div className="flex gap-2 mb-6 border-b border-[#f8f9fa]/20">
              <button
                onClick={() => setActiveTab('editor')}
                className={`px-4 py-2 text-sm font-medium transition-all ${activeTab === 'editor'
                  ? 'text-[#f8f9fa] border-b-2 border-blue-500'
                  : 'text-[#adb5bd] hover:text-[#f8f9fa]'
                  }`}
              >
                Editor
              </button>
              <button
                onClick={() => setActiveTab('prodotti')}
                className={`px-4 py-2 text-sm font-medium transition-all ${activeTab === 'prodotti'
                  ? 'text-[#f8f9fa] border-b-2 border-green-500'
                  : 'text-[#adb5bd] hover:text-[#f8f9fa]'
                  }`}
              >
                Prodotti
              </button>
              <button
                onClick={() => setActiveTab('firme')}
                className={`px-4 py-2 text-sm font-medium transition-all ${activeTab === 'firme'
                  ? 'text-[#f8f9fa] border-b-2 border-purple-500'
                  : 'text-[#adb5bd] hover:text-[#f8f9fa]'
                  }`}
              >
                Firme ({signatures.length})
              </button>
              <button
                onClick={() => setActiveTab('catalogo')}
                className={`px-4 py-2 text-sm font-medium transition-all ${activeTab === 'catalogo'
                  ? 'text-[#f8f9fa] border-b-2 border-orange-500'
                  : 'text-[#adb5bd] hover:text-[#f8f9fa]'
                  }`}
              >
                <Package size={16} className="inline mr-1" />
                Catalogo
              </button>
            </div>
          )}

          {!isCreating ? (
            <>
              {/* Predefined Templates */}
              <div className="mb-6">
                <h2 className="text-lg font-medium text-[#f8f9fa] mb-4">Template Predefiniti</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Card
                    className="bg-[#343a40]/30 backdrop-blur-xl border-[#f8f9fa]/20 hover:bg-[#343a40]/50 transition-all cursor-pointer"
                    onClick={() => loadPredefinedTemplate('finestre')}
                  >
                    <CardContent className="p-4 text-center">
                      <FileText size={32} className="text-blue-400 mx-auto mb-2" />
                      <h3 className="text-sm font-medium text-[#f8f9fa]">Finestre</h3>
                    </CardContent>
                  </Card>
                  <Card
                    className="bg-[#343a40]/30 backdrop-blur-xl border-[#f8f9fa]/20 hover:bg-[#343a40]/50 transition-all cursor-pointer"
                    onClick={() => loadPredefinedTemplate('chiavi_in_mano')}
                  >
                    <CardContent className="p-4 text-center">
                      <FileText size={32} className="text-green-400 mx-auto mb-2" />
                      <h3 className="text-sm font-medium text-[#f8f9fa]">Chiavi in Mano</h3>
                    </CardContent>
                  </Card>
                  <Card
                    className="bg-[#343a40]/30 backdrop-blur-xl border-[#f8f9fa]/20 hover:bg-[#343a40]/50 transition-all cursor-pointer"
                    onClick={() => loadPredefinedTemplate('ristrutturazione')}
                  >
                    <CardContent className="p-4 text-center">
                      <FileText size={32} className="text-purple-400 mx-auto mb-2" />
                      <h3 className="text-sm font-medium text-[#f8f9fa]">Ristrutturazione</h3>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Templates List */}
              <div>
                <h2 className="text-lg font-medium text-[#f8f9fa] mb-4">
                  I Miei Template
                  <Button
                    onClick={() => setActiveTab('catalogo')}
                    className="ml-4 bg-green-600 hover:bg-green-700"
                    size="sm"
                  >
                    <Package size={16} className="mr-2" />
                    Gestisci Catalogo
                  </Button>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                  {templates.map((template) => (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -4 }}
                    >
                      <Card className="bg-[#343a40]/30 backdrop-blur-xl border-[#f8f9fa]/20 hover:bg-[#343a40]/50 transition-all">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                <FileText size={20} className="text-blue-400" />
                              </div>
                              <div>
                                <CardTitle className="text-base text-[#f8f9fa]">
                                  {template.template_name}
                                </CardTitle>
                                <p className="text-xs text-[#adb5bd] mt-1">
                                  {template.elements?.length || 0} elementi
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => loadTemplate(template)}
                              className="flex-1 border-[#f8f9fa]/30 text-[#f8f9fa] hover:bg-[#f8f9fa]/10"
                            >
                              <Edit size={14} className="mr-1" />
                              Modifica
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteTemplateMutation.mutate(template.id)}
                              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}

                  {templates.length === 0 && (
                    <div className="col-span-full text-center py-12">
                      <FileText size={64} className="text-[#6c757d] mx-auto mb-4" />
                      <p className="text-[#dee2e6] text-lg mb-2">Nessun template trovato</p>
                      <p className="text-[#adb5bd] text-sm">Crea il tuo primo template per iniziare</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : activeTab === 'catalogo' ? (
            /* Catalog Section */
            <Card className="bg-[#343a40]/30 backdrop-blur-xl border-[#f8f9fa]/20">
              <CardContent className="p-6">
                <ProductCatalog user={user} onAddToQuote={addProductToQuote} />
              </CardContent>
            </Card>
          ) : activeTab === 'prodotti' ? (
            /* Products in Quote */
            <div className="space-y-4">
              <Card className="bg-[#343a40]/30 backdrop-blur-xl border-[#f8f9fa]/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-[#f8f9fa]">Prodotti nel Preventivo</CardTitle>
                    <Button
                      onClick={() => setShowCatalogModal(true)}
                      className="bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      <Plus size={16} className="mr-2" />
                      Aggiungi dal Catalogo
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {quoteItems.length > 0 ? (
                    <div className="space-y-3">
                      {quoteItems.map((item) => (
                        <div key={item.id} className="bg-[#495057]/30 rounded-lg p-3 border border-[#f8f9fa]/10">
                          <div className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-4">
                              <p className="text-sm text-[#f8f9fa] font-medium">{item.nome}</p>
                            </div>
                            <div className="col-span-2">
                              <Input
                                type="number"
                                min="1"
                                value={item.quantita}
                                onChange={(e) => updateQuoteItem(item.id, { quantita: parseInt(e.target.value) })}
                                className="bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa] text-sm h-8"
                              />
                            </div>
                            <div className="col-span-2">
                              <p className="text-sm text-[#dee2e6]">€ {item.prezzo_unitario.toFixed(2)}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-sm text-green-400 font-medium">
                                € {(item.quantita * item.prezzo_unitario).toFixed(2)}
                              </p>
                            </div>
                            <div className="col-span-2 text-right">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeQuoteItem(item.id)}
                                className="h-7 px-2 text-red-400 hover:text-red-300"
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}

                      <div className="border-t border-[#f8f9fa]/20 pt-3 mt-4">
                        <div className="space-y-2 text-right">
                          <div className="flex justify-between text-sm">
                            <span className="text-[#dee2e6]">Imponibile:</span>
                            <span className="text-[#f8f9fa]">€ {calculateTotals().subtotale.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-[#dee2e6]">IVA (22%):</span>
                            <span className="text-[#f8f9fa]">€ {calculateTotals().iva.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-lg font-bold">
                            <span className="text-[#f8f9fa]">TOTALE:</span>
                            <span className="text-green-400">€ {calculateTotals().totale.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <ShoppingCart size={48} className="text-[#6c757d] mx-auto mb-4" />
                      <p className="text-[#dee2e6]">Nessun prodotto aggiunto</p>
                      <p className="text-[#adb5bd] text-sm mt-2">Aggiungi prodotti dal catalogo</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : activeTab === 'firme' ? (
            /* Signatures Section */
            <div className="space-y-4">
              <Card className="bg-[#343a40]/30 backdrop-blur-xl border-[#f8f9fa]/20">
                <CardHeader>
                  <CardTitle className="text-[#f8f9fa]">Gestione Firme Elettroniche</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4">
                    {signatures.map((sig) => (
                      <div key={sig.id} className="bg-[#495057]/30 rounded-lg p-4 border border-[#f8f9fa]/10">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getStatusIcon(sig.status)}
                              <h3 className="text-[#f8f9fa] font-medium">
                                {sig.numero_preventivo}
                              </h3>
                              <span className={`text-xs px-2 py-1 rounded ${sig.status === 'signed' ? 'bg-green-500/20 text-green-400' :
                                sig.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                                  'bg-yellow-500/20 text-yellow-400'
                                }`}>
                                {getStatusText(sig.status)}
                              </span>
                            </div>
                            <p className="text-sm text-[#dee2e6]">Cliente: {sig.cliente_nome}</p>
                            <p className="text-xs text-[#adb5bd]">{sig.cliente_email}</p>
                            <p className="text-xs text-[#adb5bd] mt-1">
                              Inviato: {new Date(sig.sent_at).toLocaleString('it-IT')}
                            </p>
                            {sig.signed_at && (
                              <p className="text-xs text-green-400 mt-1">
                                Firmato: {new Date(sig.signed_at).toLocaleString('it-IT')}
                              </p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setViewPdfUrl(sig.pdf_url)}
                            className="border-[#f8f9fa]/30 text-[#f8f9fa]"
                          >
                            <Eye size={14} className="mr-1" />
                            PDF
                          </Button>
                        </div>
                        {sig.signature_data && (
                          <div className="mt-3 pt-3 border-t border-[#f8f9fa]/10">
                            <p className="text-xs text-[#adb5bd] mb-2">Firma Cliente:</p>
                            <img src={sig.signature_data} alt="Firma" className="h-16 bg-white rounded p-2" />
                          </div>
                        )}
                      </div>
                    ))}
                    {signatures.length === 0 && (
                      <div className="text-center py-12">
                        <PenTool size={48} className="text-[#6c757d] mx-auto mb-4" />
                        <p className="text-[#dee2e6]">Nessuna richiesta di firma</p>
                        <p className="text-[#adb5bd] text-sm mt-2">
                          Genera un preventivo e invialo per la firma
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Editor */
            <div className="space-y-4">
              {/* Data Input Panel */}
              <Card className="bg-[#343a40]/30 backdrop-blur-xl border-[#f8f9fa]/20">
                <CardHeader>
                  <CardTitle className="text-[#f8f9fa]">Dati Standard</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-[#f8f9fa] text-xs">Numero Preventivo</Label>
                      <Input
                        value={previewData.numero_preventivo}
                        onChange={(e) => setPreviewData({ ...previewData, numero_preventivo: e.target.value })}
                        className="bg-[#495057]/50 border-[#f8f9fa]/20 text-[#f8f9fa] text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-[#f8f9fa] text-xs">Data Emissione</Label>
                      <Input
                        value={previewData.data_emissione}
                        onChange={(e) => setPreviewData({ ...previewData, data_emissione: e.target.value })}
                        className="bg-[#495057]/50 border-[#f8f9fa]/20 text-[#f8f9fa] text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-[#f8f9fa] text-xs">Validità fino al</Label>
                      <Input
                        value={previewData.data_validita}
                        onChange={(e) => setPreviewData({ ...previewData, data_validita: e.target.value })}
                        className="bg-[#495057]/50 border-[#f8f9fa]/20 text-[#f8f9fa] text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-[#f8f9fa] text-xs">Nome Cliente</Label>
                      <Input
                        value={previewData.cliente_nome}
                        onChange={(e) => setPreviewData({ ...previewData, cliente_nome: e.target.value })}
                        className="bg-[#495057]/50 border-[#f8f9fa]/20 text-[#f8f9fa] text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-[#f8f9fa] text-xs">Indirizzo Cliente</Label>
                      <Input
                        value={previewData.cliente_indirizzo}
                        onChange={(e) => setPreviewData({ ...previewData, cliente_indirizzo: e.target.value })}
                        className="bg-[#495057]/50 border-[#f8f9fa]/20 text-[#f8f9fa] text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-[#f8f9fa] text-xs">Telefono</Label>
                      <Input
                        value={previewData.cliente_telefono}
                        onChange={(e) => setPreviewData({ ...previewData, cliente_telefono: e.target.value })}
                        className="bg-[#495057]/50 border-[#f8f9fa]/20 text-[#f8f9fa] text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-[#f8f9fa] text-xs">Email Cliente</Label>
                      <Input
                        value={previewData.cliente_email}
                        onChange={(e) => setPreviewData({ ...previewData, cliente_email: e.target.value })}
                        className="bg-[#495057]/50 border-[#f8f9fa]/20 text-[#f8f9fa] text-sm"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-[#f8f9fa] text-xs">Termini di Pagamento</Label>
                      <Input
                        value={previewData.termini_pagamento}
                        onChange={(e) => setPreviewData({ ...previewData, termini_pagamento: e.target.value })}
                        className="bg-[#495057]/50 border-[#f8f9fa]/20 text-[#f8f9fa] text-sm"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-[#f8f9fa] text-xs">Giorni Validità</Label>
                      <Input
                        type="number"
                        value={giorniValidita}
                        onChange={(e) => setGiorniValidita(parseInt(e.target.value))}
                        className="bg-[#495057]/50 border-[#f8f9fa]/20 text-[#f8f9fa] text-sm"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <Label className="text-[#f8f9fa] text-xs">Note</Label>
                      <Textarea
                        value={previewData.note}
                        onChange={(e) => setPreviewData({ ...previewData, note: e.target.value })}
                        className="bg-[#495057]/50 border-[#f8f9fa]/20 text-[#f8f9fa] text-sm"
                        rows={2}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Custom Fields Panel */}
              {templateData.fields && templateData.fields.length > 0 && (
                <Card className="bg-[#343a40]/30 backdrop-blur-xl border-[#f8f9fa]/20">
                  <CardHeader>
                    <CardTitle className="text-[#f8f9fa]">Campi Personalizzati</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {templateData.fields.map((field) => (
                        <div key={field.id}>
                          <Label className="text-[#f8f9fa] text-xs">{field.label}</Label>
                          {field.type === 'textarea' ? (
                            <Textarea
                              value={customFieldsData[field.name] || ''}
                              onChange={(e) => setCustomFieldsData({
                                ...customFieldsData,
                                [field.name]: e.target.value
                              })}
                              className="bg-[#495057]/50 border-[#f8f9fa]/20 text-[#f8f9fa] text-sm"
                              placeholder={field.defaultValue || `Inserisci ${field.label.toLowerCase()}`}
                              rows={3}
                            />
                          ) : field.type === 'number' ? (
                            <Input
                              type="number"
                              value={customFieldsData[field.name] || ''}
                              onChange={(e) => setCustomFieldsData({
                                ...customFieldsData,
                                [field.name]: e.target.value
                              })}
                              className="bg-[#495057]/50 border-[#f8f9fa]/20 text-[#f8f9fa] text-sm"
                              placeholder={field.defaultValue || `0`}
                            />
                          ) : field.type === 'date' ? (
                            <Input
                              type="date"
                              value={customFieldsData[field.name] || ''}
                              onChange={(e) => setCustomFieldsData({
                                ...customFieldsData,
                                [field.name]: e.target.value
                              })}
                              className="bg-[#495057]/50 border-[#f8f9fa]/20 text-[#f8f9fa] text-sm"
                            />
                          ) : (
                            <Input
                              value={customFieldsData[field.name] || ''}
                              onChange={(e) => setCustomFieldsData({
                                ...customFieldsData,
                                [field.name]: e.target.value
                              })}
                              className="bg-[#495057]/50 border-[#f8f9fa]/20 text-[#f8f9fa] text-sm"
                              placeholder={field.defaultValue || `Inserisci ${field.label.toLowerCase()}`}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                {/* Left Panel - Controls */}
                <div className="lg:col-span-1 space-y-4">
                  <Card className="bg-[#343a40]/30 backdrop-blur-xl border-[#f8f9fa]/20">
                    <CardHeader>
                      <CardTitle className="text-[#f8f9fa] text-base">Impostazioni</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-[#f8f9fa] text-sm">Nome Template</Label>
                        <Input
                          value={templateData.template_name}
                          onChange={(e) => setTemplateData({ ...templateData, template_name: e.target.value })}
                          className="bg-[#495057]/50 border-[#f8f9fa]/20 text-[#f8f9fa]"
                          placeholder="Es: Preventivo Finestre"
                        />
                      </div>

                      <div>
                        <Label className="text-[#f8f9fa] mb-2 block text-sm">Aggiungi Elementi</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Button
                            size="sm"
                            onClick={() => addElement('text')}
                            className="bg-[#495057]/50 hover:bg-[#495057] border border-[#f8f9fa]/20"
                            title="Aggiungi Testo"
                          >
                            <Type size={16} />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => addElement('image')}
                            className="bg-[#495057]/50 hover:bg-[#495057] border border-[#f8f9fa]/20"
                            title="Aggiungi Immagine"
                          >
                            <ImageIcon size={16} />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => addElement('table')}
                            className="bg-[#495057]/50 hover:bg-[#495057] border border-[#f8f9fa]/20"
                            title="Aggiungi Tabella"
                          >
                            <TableIcon size={16} />
                          </Button>
                        </div>
                        <p className="text-xs text-[#adb5bd] mt-2">
                          Usa {'{{variabile}}'} per dati dinamici
                        </p>
                      </div>

                      {/* Custom Fields Management */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-[#f8f9fa] text-sm">Campi Personalizzati</Label>
                          <Button
                            size="sm"
                            onClick={addField}
                            className="h-7 bg-green-600 hover:bg-green-700"
                          >
                            <Plus size={12} className="mr-1" />
                            Campo
                          </Button>
                        </div>
                        <div className="space-y-2 max-h-[200px] overflow-y-auto">
                          {templateData.fields.map((field) => (
                            <div key={field.id} className="bg-[#495057]/30 rounded p-2 border border-[#f8f9fa]/10">
                              <div className="grid grid-cols-2 gap-2 mb-2">
                                <Input
                                  placeholder="Nome (es: durata_lavori)"
                                  value={field.name}
                                  onChange={(e) => updateField(field.id, { name: e.target.value })}
                                  className="bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa] text-xs h-7"
                                />
                                <Input
                                  placeholder="Label (es: Durata Lavori)"
                                  value={field.label}
                                  onChange={(e) => updateField(field.id, { label: e.target.value })}
                                  className="bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa] text-xs h-7"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <Select
                                  value={field.type}
                                  onValueChange={(v) => updateField(field.id, { type: v })}
                                >
                                  <SelectTrigger className="bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa] text-xs h-7">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="text">Testo</SelectItem>
                                    <SelectItem value="textarea">Area Testo</SelectItem>
                                    <SelectItem value="number">Numero</SelectItem>
                                    <SelectItem value="date">Data</SelectItem>
                                  </SelectContent>
                                </Select>
                                <div className="flex gap-1">
                                  <Input
                                    placeholder="Valore default"
                                    value={field.defaultValue || ''}
                                    onChange={(e) => updateField(field.id, { defaultValue: e.target.value })}
                                    className="bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa] text-xs h-7"
                                  />
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => removeField(field.id)}
                                    className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
                                  >
                                    <Trash2 size={12} />
                                  </Button>
                                </div>
                              </div>
                              <p className="text-[10px] text-[#adb5bd] mt-1">
                                Usa {'{{' + field.name + '}}'} nel testo
                              </p>
                            </div>
                          ))}
                          {templateData.fields.length === 0 && (
                            <p className="text-xs text-[#adb5bd] text-center py-2">
                              Nessun campo personalizzato
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button
                          onClick={saveTemplate}
                          disabled={!templateData.template_name}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <Save size={16} className="mr-2" />
                          Salva
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setIsCreating(false)}
                          className="border-[#f8f9fa]/30 text-[#f8f9fa]"
                        >
                          Annulla
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Button
                          onClick={() => setShowSignatureModal(true)}
                          className="w-full bg-purple-600 hover:bg-purple-700"
                        >
                          <PenTool size={16} className="mr-2" />
                          {companySignature ? 'Modifica Firma' : 'Aggiungi Firma'}
                        </Button>

                        {companySignature && (
                          <div className="bg-white rounded p-2">
                            <p className="text-xs text-gray-600 mb-1">Anteprima firma:</p>
                            <img src={companySignature} alt="Firma" className="h-12" />
                          </div>
                        )}

                        <Button
                          onClick={() => setShowSendModal(true)}
                          disabled={!templateData.template_name || !companySignature}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          <Send size={16} className="mr-2" />
                          Invia per Firma
                        </Button>

                        <Button
                          onClick={generatePDF}
                          disabled={!templateData.template_name}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          <Download size={16} className="mr-2" />
                          Scarica PDF
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Elements List */}
                  <Card className="bg-[#343a40]/30 backdrop-blur-xl border-[#f8f9fa]/20">
                    <CardHeader>
                      <CardTitle className="text-[#f8f9fa] text-base">Elementi ({templateData.elements.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
                      {templateData.elements.map((element) => (
                        <div
                          key={element.id}
                          className="p-2 bg-[#495057]/30 rounded-lg border border-[#f8f9fa]/10"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-[#f8f9fa] capitalize">{element.type}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeElement(element.id)}
                              className="h-5 w-5 p-0 text-red-400 hover:text-red-300"
                            >
                              <Trash2 size={12} />
                            </Button>
                          </div>
                          {element.type === 'text' && (
                            <div>
                              <Input
                                value={element.content}
                                onChange={(e) => updateElement(element.id, { content: e.target.value })}
                                className="bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa] text-xs mb-1"
                                placeholder="Usa {{variabile}} per dati dinamici"
                              />
                              <div className="flex gap-1">
                                <Input
                                  type="number"
                                  value={element.style?.fontSize || 12}
                                  onChange={(e) => updateElement(element.id, {
                                    style: { ...element.style, fontSize: parseInt(e.target.value) }
                                  })}
                                  className="bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa] text-xs h-6 w-16"
                                  placeholder="Size"
                                />
                                <Select
                                  value={element.style?.fontWeight || 'normal'}
                                  onValueChange={(v) => updateElement(element.id, {
                                    style: { ...element.style, fontWeight: v }
                                  })}
                                >
                                  <SelectTrigger className="bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa] text-xs h-6">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="normal">Normal</SelectItem>
                                    <SelectItem value="bold">Bold</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      {templateData.elements.length === 0 && (
                        <p className="text-xs text-[#adb5bd] text-center py-4">Nessun elemento aggiunto</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Custom Fields Reference */}
                  {templateData.fields.length > 0 && (
                    <Card className="bg-[#343a40]/30 backdrop-blur-xl border-[#f8f9fa]/20">
                      <CardHeader>
                        <CardTitle className="text-[#f8f9fa] text-sm">Campi Disponibili</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-1">
                        {templateData.fields.map((field) => (
                          <div key={field.id} className="flex items-center justify-between text-xs">
                            <span className="text-[#dee2e6]">{field.label}:</span>
                            <code className="text-[#adb5bd] bg-[#495057]/30 px-2 py-1 rounded">
                              {'{{' + field.name + '}}'}
                            </code>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Right Panel - Preview */}
                <div className="lg:col-span-2">
                  <Card className="bg-white border-[#f8f9fa]/20 min-h-[600px]">
                    <CardHeader className="border-b">
                      <CardTitle className="text-[#212529]">Preview con Dati Dinamici</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-8">
                      <div className="bg-white shadow-xl rounded-lg p-4 sm:p-8 min-h-[500px]">
                        {/* Header */}
                        <div className="text-center mb-6">
                          <h2 className="text-2xl font-bold text-[#212529]">PREVENTIVO</h2>
                          <p className="text-sm text-[#6c757d] mt-2">
                            {templateData.template_name || 'Nome Template'}
                          </p>
                        </div>

                        {/* Elements with dynamic data */}
                        <div className="space-y-3">
                          {templateData.elements.map((element) => (
                            <div key={element.id} className="pb-2">
                              {element.type === 'text' && (
                                <p
                                  className="text-[#212529]"
                                  style={{
                                    fontSize: element.style.fontSize,
                                    fontWeight: element.style.fontWeight
                                  }}
                                >
                                  {replaceVariables(element.content)}
                                </p>
                              )}
                              {element.type === 'table' && (
                                <div className="overflow-x-auto border rounded">
                                  <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                      <tr className="border-b">
                                        <th className="text-left py-2 px-3">Descrizione</th>
                                        <th className="text-center py-2 px-3">Q.tà</th>
                                        <th className="text-right py-2 px-3">Prezzo</th>
                                        <th className="text-right py-2 px-3">Totale</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      <tr className="border-b">
                                        <td className="py-2 px-3">Finestra PVC 120x150</td>
                                        <td className="text-center py-2 px-3">2</td>
                                        <td className="text-right py-2 px-3">€ 450.00</td>
                                        <td className="text-right py-2 px-3">€ 900.00</td>
                                      </tr>
                                      <tr className="border-b">
                                        <td className="py-2 px-3">Installazione</td>
                                        <td className="text-center py-2 px-3">1</td>
                                        <td className="text-right py-2 px-3">€ 200.00</td>
                                        <td className="text-right py-2 px-3">€ 200.00</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              )}
                              {element.type === 'image' && (
                                <div className="w-32 h-32 bg-gray-200 rounded flex items-center justify-center">
                                  <ImageIcon className="text-gray-400" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Footer */}
                        <div className="mt-8 pt-4 border-t">
                          <div className="text-right">
                            <div className="text-sm text-gray-600 mb-1">Subtotale: € 1.100.00</div>
                            <div className="text-sm text-gray-600 mb-1">IVA 22%: € 242.00</div>
                            <div className="text-lg font-bold text-[#212529]">TOTALE: € 1.342.00</div>
                          </div>
                        </div>

                        <div className="mt-8 text-center text-xs text-[#6c757d] border-t pt-4">
                          IwHome - Via Montefiorino 10/E, Reggio Emilia<br />
                          Tel: +39 340 292 1052 | info@iwhome.it
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Signature Modal */}
      <Dialog open={showSignatureModal} onOpenChange={setShowSignatureModal}>
        <DialogContent className="bg-gradient-to-br from-[#495057] to-[#6c757d] border-[#f8f9fa]/20 text-[#f8f9fa] max-w-2xl" style={{ maxWidth: 'min(calc(100vw - 3rem), 30rem)' }}>
          <DialogHeader>
            <DialogTitle className="text-[#f8f9fa]">Firma Digitale Azienda</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <p className="text-sm text-[#dee2e6] mb-4">
              Disegna la tua firma nell'area sottostante usando il mouse o il touch
            </p>
            <SignatureCanvas
              onSave={handleSaveSignature}
              onCancel={() => setShowSignatureModal(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Catalog Modal */}
      <Dialog open={showCatalogModal} onOpenChange={setShowCatalogModal}>
        <DialogContent className="bg-gradient-to-br from-[#495057] to-[#6c757d] border-[#f8f9fa]/20 text-[#f8f9fa] max-w-4xl" style={{ maxWidth: 'min(calc(100vw - 3rem), 44rem)' }}>
          <DialogHeader>
            <DialogTitle className="text-[#f8f9fa]">Seleziona Prodotto</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <ProductCatalog user={user} onAddToQuote={addProductToQuote} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Send for Signature Modal */}
      <Dialog open={showSendModal} onOpenChange={setShowSendModal}>
        <DialogContent className="bg-gradient-to-br from-[#495057] to-[#6c757d] border-[#f8f9fa]/20 text-[#f8f9fa]">
          <DialogHeader>
            <DialogTitle className="text-[#f8f9fa]">Invia per Firma al Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-[#f8f9fa]">Nome Cliente</Label>
              <Input
                value={sendData.cliente_nome}
                onChange={(e) => setSendData({ ...sendData, cliente_nome: e.target.value })}
                className="bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa]"
                placeholder="Mario Rossi"
              />
            </div>
            <div>
              <Label className="text-[#f8f9fa]">Email Cliente</Label>
              <Input
                type="email"
                value={sendData.cliente_email}
                onChange={(e) => setSendData({ ...sendData, cliente_email: e.target.value })}
                className="bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa]"
                placeholder="mario.rossi@email.com"
              />
            </div>
            {templateData.fields && templateData.fields.length > 0 && (
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 mb-3">
                <p className="text-xs text-[#dee2e6] font-medium mb-2">Campi Personalizzati Inclusi:</p>
                <div className="space-y-1">
                  {templateData.fields.map((field) => (
                    <div key={field.id} className="text-xs text-[#adb5bd]">
                      • {field.label}: {customFieldsData[field.name] || 'Non compilato'}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <p className="text-xs text-[#dee2e6]">
                Il preventivo verrà inviato via email al cliente con un link per visualizzarlo e firmarlo digitalmente.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowSendModal(false)}
                className="flex-1 border-[#f8f9fa]/30 text-[#f8f9fa]"
              >
                Annulla
              </Button>
              <Button
                onClick={sendForSignature}
                disabled={!sendData.cliente_email || !sendData.cliente_nome}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Send size={16} className="mr-2" />
                Invia
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}