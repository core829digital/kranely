import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import KanbanBoard from '../components/company/KanbanBoard';
import ChatChannels from '../components/company/ChatChannels';
import FinancialReport from '../components/company/FinancialReport';
import ProjectsDashboard from '../components/company/ProjectsDashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Building,
  Plus,
  Trash2,
  Edit
} from 'lucide-react';

export default function CompanyDashboard() {
  const [user, setUser] = useState(null);
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  const [showFatturaDialog, setShowFatturaDialog] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [selectedFattura, setSelectedFattura] = useState(null);
  const [preventivoData, setQuoteData] = useState({
    title: '',
    cliente: '',
    importo: 0,
    status: 'bozza'
  });
  const [fatturaData, setFatturaData] = useState({
    numero_fattura: '',
    cliente: '',
    importo: 0,
    status: 'in_corso',
    cantiere_id: ''
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const currentUser = await base44.auth.me();
    if (!currentUser.is_company || currentUser.company_role !== 'admin') {
      window.location.href = '/dashboard';
      return;
    }
    setUser(currentUser);
  };

  const { data: preventivi = [] } = useQuery({
    queryKey: ['preventivi', user?.email],
    queryFn: () => base44.entities.WorkflowQuote.filter({ company_email: user.email }),
    enabled: !!user
  });

  const { data: fatture = [] } = useQuery({
    queryKey: ['fatture', user?.email],
    queryFn: () => base44.entities.Fatturato.filter({ company_email: user.email }),
    enabled: !!user
  });

  const { data: cantieri = [] } = useQuery({
    queryKey: ['cantieri', user?.email],
    queryFn: () => base44.entities.Cantiere.filter({ company_email: user.email }),
    enabled: !!user
  });

  const createQuote = useMutation({
    mutationFn: (/** @type {any} */ data) => base44.entities.WorkflowQuote.create({
      ...data,
      company_email: user.email,
      history: [{
        date: new Date().toISOString(),
        action: 'Creato',
        user: user.email
      }]
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preventivi'] });
      setShowQuoteDialog(false);
      setQuoteData({ title: '', cliente: '', importo: 0, status: 'bozza' });
    }
  });

  const updateQuoteStatus = useMutation({
    mutationFn: async (/** @type {{id: string, status: string}} */ variables) => {
      const { id, status } = variables;
      const prev = preventivi.find(p => p.id === id);
      const history = [...(prev.history || []), {
        date: new Date().toISOString(),
        action: `Stato cambiato in ${status}`,
        user: user.email
      }];

      await base44.entities.WorkflowQuote.update(id, { status, history });

      // Notifica utente assegnato
      if (prev.assegnato_a) {
        await base44.entities.Notification.create({
          user_email: prev.assegnato_a,
          type: 'system',
          title: 'Quote Updateto',
          message: `Il preventivo "${prev.title}" è passato a ${status}`,
          link: '/company'
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['preventivi'] })
  });

  const createFattura = useMutation({
    mutationFn: (/** @type {any} */ data) => base44.entities.Fatturato.create({
      ...data,
      company_email: user.email,
      data_emissione: new Date().toISOString().split('T')[0]
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fatture'] });
      setShowFatturaDialog(false);
      setFatturaData({ numero_fattura: '', cliente: '', importo: 0, status: 'in_corso', cantiere_id: '' });
    }
  });

  const updateFattura = useMutation({
    mutationFn: (/** @type {{id: string, data: any}} */ variables) => base44.entities.Fatturato.update(variables.id, variables.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fatture'] })
  });

  const deleteFattura = useMutation({
    mutationFn: (/** @type {string} */ id) => base44.entities.Fatturato.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fatture'] })
  });

  const handleKanbanDragEnd = (result) => {
    if (!result.destination) return;
    const newStatus = result.destination.droppableId;
    updateQuoteStatus.mutate({ id: result.draggableId, status: newStatus });
  };

  const fatturatoInCorso = fatture.filter(f => f.status === 'in_corso').reduce((sum, f) => sum + (f.importo || 0), 0);
  const fatturatoCompleted = fatture.filter(f => f.status === 'pagato').reduce((sum, f) => sum + (f.importo || 0), 0);

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-white">Loading...</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-[#1C1A18] relative overflow-hidden">
      
      <div className="pt-0 relative z-10 min-h-screen pb-safe">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Building className="text-white" size={32} />
              <div>
                <h1 className="text-2xl sm:text-3xl font-medium text-white">Gestionale B2B</h1>
                <p className="text-white/70">{user.company_name}</p>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6 lg:mb-8">
            <Card className="bg-gradient-to-br from-[#FFC703] to-[#FFC703] border-0 shadow-lg">
              <CardContent className="p-3 sm:p-4">
                <div className="text-xs text-white/80 mb-1">Quotes</div>
                <div className="text-xl sm:text-2xl font-light text-white">{preventivi.length}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-600 to-green-700 border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="text-xs text-white/80 mb-1">Projects</div>
                <div className="text-2xl font-light text-white">{cantieri.length}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-600 to-orange-700 border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="text-xs text-white/80 mb-1">In Progress</div>
                <div className="text-xl font-light text-white">â‚¬{fatturatoInCorso.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#FFC703] to-[#FFC703] border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="text-xs text-white/80 mb-1">Completed</div>
                <div className="text-xl font-light text-white">â‚¬{fatturatoCompleted.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>

          {/* Main Tabs */}
          <Tabs defaultValue="preventivi" className="space-y-6">
            <TabsList className="bg-[#1C1A18] border border-white/ w-full flex overflow-x-auto sm:grid sm:grid-cols-5 h-auto">
              <TabsTrigger value="preventivi" className="flex-shrink-0 text-xs sm:text-sm">Quotes</TabsTrigger>
              <TabsTrigger value="cantieri" className="flex-shrink-0 text-xs sm:text-sm">Projects</TabsTrigger>
              <TabsTrigger value="fatture" className="flex-shrink-0 text-xs sm:text-sm">Fatture</TabsTrigger>
              <TabsTrigger value="chat" className="flex-shrink-0 text-xs sm:text-sm">Chat Team</TabsTrigger>
              <TabsTrigger value="finanza" className="flex-shrink-0 text-xs sm:text-sm">Report</TabsTrigger>
            </TabsList>

            {/* Quotes - Kanban */}
            <TabsContent value="preventivi">
              <div className="flex justify-end mb-4">
                <Button onClick={() => setShowQuoteDialog(true)} className="bg-[#FFC703]">
                  <Plus size={18} className="mr-2" />
                  New Quote
                </Button>
              </div>
              <KanbanBoard
                preventivi={preventivi}
                onDragEnd={handleKanbanDragEnd}
                onCardClick={(p) => setSelectedQuote(p)}
              />
            </TabsContent>

            {/* Projects Dashboard */}
            <TabsContent value="cantieri">
              <ProjectsDashboard user={user} />
            </TabsContent>

            {/* Fatture - Con collegamento cantieri */}
            <TabsContent value="fatture">
              <div className="flex justify-end mb-4">
                <Button onClick={() => setShowFatturaDialog(true)} className="bg-[#FFC703]">
                  <Plus size={18} className="mr-2" />
                  New Invoice
                </Button>
              </div>

              <div className="space-y-4">
                {fatture.map((fattura) => (
                  <Card key={fattura.id} className="bg-[#1C1A18]/ border-white/">
                    <CardContent className="pt-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                            <div className="font-medium text-white">
                              Fattura #{fattura.numero_fattura}
                            </div>
                            <Select
                              value={fattura.status}
                              onValueChange={(val) => updateFattura.mutate({
                                id: fattura.id,
                                data: { status: val }
                              })}
                            >
                              <SelectTrigger className="w-32 bg-[#535252]/ border-white/ text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="in_corso">In Progress</SelectItem>
                                <SelectItem value="pagato">Pagato</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="text-sm text-white/40">{fattura.cliente}</div>
                          {fattura.cantiere_id && (
                            <div className="text-xs text-white/25 mt-1">
                              Cantiere: {cantieri.find(c => c.id === fattura.cantiere_id)?.nome_cantiere}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-right">
                            <div className="text-xl sm:text-2xl font-light text-white">
                              â‚¬{fattura.importo?.toLocaleString()}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => {
                                setSelectedFattura(fattura);
                                setFatturaData({
                                  numero_fattura: fattura.numero_fattura,
                                  cliente: fattura.cliente,
                                  importo: fattura.importo,
                                  status: fattura.status,
                                  cantiere_id: fattura.cantiere_id || ''
                                });
                                setShowFatturaDialog(true);
                              }}
                              className="border-white/"
                            >
                              <Edit size={16} />
                            </Button>
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => {
                                if (confirm('Deletere questa fattura?')) {
                                  deleteFattura.mutate(fattura.id);
                                }
                              }}
                              className="border-red-500/30 text-red-400"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Chat Channels */}
            <TabsContent value="chat">
              <ChatChannels user={user} />
            </TabsContent>

            {/* Financial Report */}
            <TabsContent value="finanza">
              <FinancialReport user={user} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Quote Dialog */}
      <Dialog open={showQuoteDialog} onOpenChange={setShowQuoteDialog}>
        <DialogContent className="bg-[#1C1A18] border-white/">
          <DialogHeader>
            <DialogTitle className="text-white">
              {selectedQuote ? 'Edit Quote' : 'New Quote'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-white/70">Title</Label>
              <Input
                value={preventivoData.title}
                onChange={(e) => setQuoteData({ ...preventivoData, title: e.target.value })}
                className="bg-[#535252] border-white/ text-white"
              />
            </div>
            <div>
              <Label className="text-white/70">Client</Label>
              <Input
                value={preventivoData.cliente}
                onChange={(e) => setQuoteData({ ...preventivoData, cliente: e.target.value })}
                className="bg-[#535252] border-white/ text-white"
              />
            </div>
            <div>
              <Label className="text-white/70">Importo (â‚¬)</Label>
              <Input
                type="number"
                value={preventivoData.importo}
                onChange={(e) => setQuoteData({ ...preventivoData, importo: parseFloat(e.target.value) })}
                className="bg-[#535252] border-white/ text-white"
              />
            </div>
            <Button
              onClick={() => createQuote.mutate(preventivoData)}
              className="w-full"
            >
              Crea Quote
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fattura Dialog */}
      <Dialog open={showFatturaDialog} onOpenChange={setShowFatturaDialog}>
        <DialogContent className="bg-[#1C1A18] border-white/">
          <DialogHeader>
            <DialogTitle className="text-white">
              {selectedFattura ? 'Edit Invoice' : 'New Invoice'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-white/70">Numero Fattura</Label>
              <Input
                value={fatturaData.numero_fattura}
                onChange={(e) => setFatturaData({ ...fatturaData, numero_fattura: e.target.value })}
                className="bg-[#535252] border-white/ text-white"
              />
            </div>
            <div>
              <Label className="text-white/70">Client</Label>
              <Input
                value={fatturaData.cliente}
                onChange={(e) => setFatturaData({ ...fatturaData, cliente: e.target.value })}
                className="bg-[#535252] border-white/ text-white"
              />
            </div>
            <div>
              <Label className="text-white/70">Link to Project (optional)</Label>
              <Select
                value={fatturaData.cantiere_id}
                onValueChange={(val) => setFatturaData({ ...fatturaData, cantiere_id: val })}
              >
                <SelectTrigger className="bg-[#535252] border-white/ text-white">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Nessuno</SelectItem>
                  {cantieri.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nome_cantiere}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white/70">Importo (â‚¬)</Label>
              <Input
                type="number"
                value={fatturaData.importo}
                onChange={(e) => setFatturaData({ ...fatturaData, importo: parseFloat(e.target.value) })}
                className="bg-[#535252] border-white/ text-white"
              />
            </div>
            <Button
              onClick={() => {
                if (selectedFattura) {
                  updateFattura.mutate({ id: selectedFattura.id, data: fatturaData });
                  setSelectedFattura(null);
                } else {
                  createFattura.mutate(fatturaData);
                }
                setShowFatturaDialog(false);
              }}
              className="w-full"
            >
              {selectedFattura ? 'Update' : 'Crea'} Fattura
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

