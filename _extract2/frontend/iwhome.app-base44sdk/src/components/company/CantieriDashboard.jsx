import React from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../Backend/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building, TrendingUp, Euro, CheckCircle, AlertCircle, Link as LinkIcon } from 'lucide-react';
import TaskManager from './TaskManager';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function CantieriDashboard({ user }) {
  const [selectedCantiere, setSelectedCantiere] = React.useState(null);
  const [showDetails, setShowDetails] = React.useState(false);

  // Cantieri Query
  const cantieri = useQuery(api.cantieri.listCantieri, { company_email: user?.email }) || [];

  // Teams Query
  const teams = useQuery(api.cantieri.listTeams, { company_email: user?.email }) || [];

  // Update Mutation
  const updateCantiere = useMutation(api.cantieri.updateCantiere);

  const cantieriAttivi = cantieri.filter(c => c.status === 'attivo');
  const cantieriCompletati = cantieri.filter(c => c.status === 'completato');

  const totals = cantieri.reduce((acc, c) => ({
    valore: acc.valore + (c.valore_contratto || 0),
    costi: acc.costi + (c.costi_effettivi || 0)
  }), { valore: 0, costi: 0 });

  const margine = totals.valore - totals.costi;
  const marginePercent = totals.valore ? ((margine / totals.valore) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
        <Card className="bg-gradient-to-br from-blue-600/20 to-blue-700/20 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-blue-300 mb-1">Cantieri Attivi</div>
                <div className="text-2xl font-light text-[#f8f9fa]">{cantieriAttivi.length}</div>
              </div>
              <Building className="text-blue-400" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-600/20 to-green-700/20 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-green-300 mb-1">Completati</div>
                <div className="text-2xl font-light text-[#f8f9fa]">{cantieriCompletati.length}</div>
              </div>
              <CheckCircle className="text-green-400" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-600/20 to-purple-700/20 border-purple-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-purple-300 mb-1">Valore Totale</div>
                <div className="text-xl font-light text-[#f8f9fa]">€{totals.valore.toLocaleString()}</div>
              </div>
              <Euro className="text-purple-400" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-600/20 to-orange-700/20 border-orange-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-orange-300 mb-1">Margine</div>
                <div className="text-xl font-light text-[#f8f9fa]">{marginePercent}%</div>
              </div>
              <TrendingUp className="text-orange-400" size={32} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cantieri Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {cantieri.map((cantiere) => {
          const isOverBudget = cantiere.costi_effettivi > cantiere.valore_contratto;
          const budgetUsage = cantiere.valore_contratto
            ? (cantiere.costi_effettivi / cantiere.valore_contratto) * 100
            : 0;

          return (
            <Card
              key={cantiere._id}
              onClick={() => {
                setSelectedCantiere(cantiere);
                setShowDetails(true);
              }}
              className="bg-[#343a40]/30 border-[#f8f9fa]/20 cursor-pointer hover:bg-[#343a40]/50 transition-all"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-[#f8f9fa] text-lg">{cantiere.nome_cantiere}</CardTitle>
                    <p className="text-sm text-[#adb5bd]">{cantiere.cliente}</p>
                  </div>
                  <Badge className={
                    cantiere.status === 'attivo'
                      ? 'bg-blue-500/20 border-blue-500/30 text-blue-300'
                      : cantiere.status === 'completato'
                        ? 'bg-green-500/20 border-green-500/30 text-green-300'
                        : 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300'
                  }>
                    {cantiere.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-[#adb5bd] mb-1">
                    <span>Progresso</span>
                    <span>{cantiere.progresso || 0}%</span>
                  </div>
                  <Progress value={cantiere.progresso || 0} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-xs text-[#6c757d]">Contratto</div>
                    <div className="text-[#f8f9fa] font-medium">
                      €{cantiere.valore_contratto?.toLocaleString() || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#6c757d]">Costi</div>
                    <div className={`font-medium ${isOverBudget ? 'text-red-400' : 'text-[#f8f9fa]'}`}>
                      €{cantiere.costi_effettivi?.toLocaleString() || 0}
                    </div>
                  </div>
                </div>

                {isOverBudget && (
                  <div className="flex items-center gap-2 text-xs text-red-400">
                    <AlertCircle size={14} />
                    <span>Fuori budget</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-[#adb5bd]">
                  <LinkIcon size={12} />
                  <span>{cantiere.documenti_collegati?.length || 0} documenti</span>
                  <span>•</span>
                  <span>{cantiere.preventivi_collegati?.length || 0} preventivi</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="bg-[#343a40] border-[#f8f9fa]/20 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#f8f9fa]">{selectedCantiere?.nome_cantiere}</DialogTitle>
          </DialogHeader>
          {selectedCantiere && (
            <div className="space-y-4">
              <div>
                <Label className="text-[#f8f9fa]">Progresso (%)</Label>
                <Input
                  type="number"
                  defaultValue={selectedCantiere.progresso || 0}
                  onBlur={(e) => updateCantiere({
                    id: selectedCantiere._id,
                    data: { progresso: parseInt(e.target.value) }
                  })}
                  className="bg-[#495057]/30 border-[#f8f9fa]/20 text-[#f8f9fa]"
                />
              </div>

              <div>
                <Label className="text-[#f8f9fa]">Costi Effettivi (€)</Label>
                <Input
                  type="number"
                  defaultValue={selectedCantiere.costi_effettivi || 0}
                  onBlur={(e) => updateCantiere({
                    id: selectedCantiere._id,
                    data: { costi_effettivi: parseFloat(e.target.value) }
                  })}
                  className="bg-[#495057]/30 border-[#f8f9fa]/20 text-[#f8f9fa]"
                />
              </div>

              <div>
                <Label className="text-[#f8f9fa]">Team Assegnato</Label>
                <Select
                  value={selectedCantiere.team_assegnato || ''}
                  onValueChange={(v) => updateCantiere({
                    id: selectedCantiere._id,
                    data: { team_assegnato: v }
                  })}
                >
                  <SelectTrigger className="bg-[#495057]/30 border-[#f8f9fa]/20 text-[#f8f9fa]">
                    <SelectValue placeholder="Seleziona team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Nessuno</SelectItem>
                    {teams.map((t) => (
                      <SelectItem key={t._id} value={t._id}>{t.team_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4 border-t border-[#f8f9fa]/10">
                <TaskManager cantiereId={selectedCantiere._id} user={user} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}