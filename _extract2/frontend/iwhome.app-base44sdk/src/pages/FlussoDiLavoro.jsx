import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../../Backend/convex/_generated/api';
import { useUser } from '@clerk/clerk-react';
import useRBAC from '../hooks/useRBAC';
import {
  GitBranch, TrendingUp, DollarSign, Clock, CheckCircle, AlertCircle,
  Package, Truck, Star, BarChart2, Columns, Filter, ChevronRight
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// ─── Pipeline stage config ─────────────────────────────────────────────────
const PIPELINE_STAGES = [
  { key: 'sent',         label: 'Inviata',       color: 'bg-yellow-500',   border: 'border-yellow-500/40',  text: 'text-yellow-400'  },
  { key: 'received',     label: 'Ricevuta',       color: 'bg-blue-500',     border: 'border-blue-500/40',    text: 'text-blue-400'    },
  { key: 'preventivato', label: 'Preventivata',   color: 'bg-purple-500',   border: 'border-purple-500/40',  text: 'text-purple-400'  },
  { key: 'accepted',     label: 'Accettata',      color: 'bg-emerald-500',  border: 'border-emerald-500/40', text: 'text-emerald-400' },
  { key: 'completed',    label: 'Completata',     color: 'bg-gray-400',     border: 'border-gray-400/40',    text: 'text-gray-400'    },
];

// ─── Kanban column config ───────────────────────────────────────────────────
const KANBAN_COLS = [
  { key: 'in_attesa',   label: 'In Attesa',    bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', dot: 'bg-yellow-400' },
  { key: 'in_verifica', label: 'In Verifica',  bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   dot: 'bg-blue-400'   },
  { key: 'pagato',      label: 'Pagato',       bg: 'bg-purple-500/10', border: 'border-purple-500/30', dot: 'bg-purple-400' },
  { key: 'confirmed',   label: 'Confermato',   bg: 'bg-emerald-500/10',border: 'border-emerald-500/30',dot: 'bg-emerald-400'},
];

function AccessDenied() {
  return (
    <div className="min-h-screen bg-[#212529] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-[#f8f9fa] mb-2">Accesso Negato</h2>
        <p className="text-[#adb5bd]">Solo amministratori e fornitori possono accedere a questa pagina.</p>
      </div>
    </div>
  );
}

export default function FlussoDiLavoro() {
  const { user: clerkUser } = useUser();
  const { isAdmin, isSupplier } = useRBAC();
  const [activeView, setActiveView] = useState('pipeline');
  const [draggedId, setDraggedId] = useState(null);

  const supplierRequests = useQuery(api.suppliers.listRequests, {}) || [];
  const payments = useQuery(api.payments.list, {}) || [];
  const suppliers = useQuery(api.suppliers.list, {}) || [];

  if (!isAdmin && !isSupplier) return <AccessDenied />;

  // ─── Pipeline stats ──────────────────────────────────────────────────────
  const pipelineCounts = PIPELINE_STAGES.reduce((acc, s) => {
    acc[s.key] = supplierRequests.filter(r => r.status === s.key).length;
    return acc;
  }, {});
  const totalRequests = supplierRequests.length;

  // ─── Finance stats ───────────────────────────────────────────────────────
  const totalPaid      = payments.filter(p => p.status === 'confirmed').reduce((s, p) => s + (p.confirmed_amount || p.amount || 0), 0);
  const totalPending   = payments.filter(p => p.status === 'in_attesa').reduce((s, p) => s + (p.amount || 0), 0);
  const totalVerifica  = payments.filter(p => p.status === 'in_verifica').reduce((s, p) => s + (p.amount || 0), 0);

  // ─── Bar chart (max bar = 100% width) ────────────────────────────────────
  const maxAmount = Math.max(totalPaid, totalPending, totalVerifica, 1);
  const barData = [
    { label: 'Confermati',  value: totalPaid,     color: 'bg-emerald-500' },
    { label: 'In Verifica', value: totalVerifica, color: 'bg-blue-500'    },
    { label: 'In Attesa',   value: totalPending,  color: 'bg-yellow-500'  },
  ];

  // ─── Kanban data ─────────────────────────────────────────────────────────
  const kanbanItems = KANBAN_COLS.reduce((acc, col) => {
    acc[col.key] = payments.filter(p => p.status === col.key);
    return acc;
  }, {});

  // ─── Drag & Drop ─────────────────────────────────────────────────────────
  // movePayment: drag-drop not yet implemented — display only

  return (
    <div className="min-h-screen bg-[#212529] pt-[76px]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#343a40]/60 backdrop-blur-xl p-5 sm:p-6 rounded-2xl border border-[#f8f9fa]/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/20 rounded-xl">
              <GitBranch size={22} className="text-indigo-400" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-[#f8f9fa]">Flusso di Lavoro</h1>
              <p className="text-xs text-[#6c757d]">Pipeline · Finanza · Kanban</p>
            </div>
          </div>
          {/* View switcher */}
          <div className="flex gap-2">
            {[
              { key: 'pipeline', label: 'Pipeline',   icon: ChevronRight },
              { key: 'finance',  label: 'Finanza',    icon: BarChart2    },
              { key: 'kanban',   label: 'Kanban',     icon: Columns      },
            ].map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                size="sm"
                variant={activeView === key ? 'default' : 'outline'}
                onClick={() => setActiveView(key)}
                className={activeView === key
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-0 text-xs'
                  : 'bg-transparent border-[#495057] text-[#adb5bd] hover:text-white hover:border-[#6c757d] text-xs'}
              >
                <Icon size={13} className="mr-1" /> {label}
              </Button>
            ))}
          </div>
        </header>

        {/* ── PIPELINE VIEW ────────────────────────────────────────────── */}
        {activeView === 'pipeline' && (
          <div className="space-y-6">
            {/* Stage funnel */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {PIPELINE_STAGES.map((stage, idx) => {
                const count = pipelineCounts[stage.key] || 0;
                const pct   = totalRequests > 0 ? Math.round((count / totalRequests) * 100) : 0;
                return (
                  <Card key={stage.key} className={`bg-[#343a40]/60 border ${stage.border} rounded-2xl p-4 text-center`}>
                    <div className={`w-8 h-8 ${stage.color} rounded-full mx-auto mb-3 flex items-center justify-center text-white text-sm font-bold`}>
                      {idx + 1}
                    </div>
                    <p className="text-xs text-[#adb5bd] mb-1">{stage.label}</p>
                    <p className={`text-2xl font-light ${stage.text}`}>{count}</p>
                    <p className="text-[10px] text-[#6c757d] mt-1">{pct}% del totale</p>
                    {/* mini progress bar */}
                    <div className="h-1 bg-[#495057] rounded-full mt-2 overflow-hidden">
                      <div className={`h-full ${stage.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Request list per stage */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {PIPELINE_STAGES.map(stage => {
                const reqs = supplierRequests.filter(r => r.status === stage.key);
                if (reqs.length === 0) return null;
                return (
                  <Card key={stage.key} className={`bg-[#343a40]/60 border ${stage.border} rounded-2xl overflow-hidden`}>
                    <div className="px-4 py-3 border-b border-[#495057]/50 flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
                      <span className={`text-sm font-medium ${stage.text}`}>{stage.label}</span>
                      <span className="ml-auto text-xs text-[#6c757d] bg-[#495057]/50 px-2 py-0.5 rounded-full">{reqs.length}</span>
                    </div>
                    <div className="p-3 space-y-2 max-h-[240px] overflow-y-auto">
                      {reqs.map(req => {
                        const supplier = suppliers.find(s => s._id === req.supplier_id);
                        return (
                          <div key={req._id} className="flex items-center gap-2 bg-[#212529]/50 rounded-lg px-3 py-2">
                            <Package size={13} className="text-[#6c757d] shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-[#f8f9fa] truncate">{req.title || 'Richiesta'}</p>
                              {supplier && <p className="text-[10px] text-[#6c757d] truncate">{supplier.name}</p>}
                            </div>
                            {req.quoted_price && (
                              <span className="text-xs text-emerald-400 shrink-0">€{req.quoted_price.toLocaleString('it-IT')}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* ── FINANCE VIEW ─────────────────────────────────────────────── */}
        {activeView === 'finance' && (
          <div className="space-y-6">
            {/* KPI cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Incassato',   value: totalPaid,     color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: CheckCircle },
                { label: 'In Verifica', value: totalVerifica, color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/30',    icon: Clock       },
                { label: 'In Attesa',   value: totalPending,  color: 'text-yellow-400',  bg: 'bg-yellow-500/10',  border: 'border-yellow-500/30',  icon: AlertCircle },
              ].map(({ label, value, color, bg, border, icon: Icon }) => (
                <Card key={label} className={`${bg} border ${border} rounded-2xl p-5`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon size={16} className={color} />
                    <span className="text-xs text-[#adb5bd]">{label}</span>
                  </div>
                  <p className={`text-2xl sm:text-3xl font-light ${color}`}>
                    €{value.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                  </p>
                </Card>
              ))}
            </div>

            {/* Bar chart */}
            <Card className="bg-[#343a40]/60 border border-[#f8f9fa]/10 rounded-2xl p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-6">
                <BarChart2 size={16} className="text-indigo-400" />
                <h3 className="text-sm font-medium text-[#f8f9fa]">Distribuzione Pagamenti</h3>
              </div>
              <div className="space-y-5">
                {barData.map(({ label, value, color }) => (
                  <div key={label}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs text-[#adb5bd]">{label}</span>
                      <span className="text-xs font-medium text-[#f8f9fa]">
                        €{value.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="h-2.5 bg-[#495057] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${color} rounded-full transition-all duration-700`}
                        style={{ width: `${(value / maxAmount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Payment list */}
            <Card className="bg-[#343a40]/60 border border-[#f8f9fa]/10 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#495057]/50 flex items-center gap-2">
                <DollarSign size={15} className="text-emerald-400" />
                <h3 className="text-sm font-medium text-[#f8f9fa]">Tutti i Pagamenti</h3>
                <span className="ml-auto text-xs text-[#6c757d]">{payments.length} totali</span>
              </div>
              <div className="divide-y divide-[#495057]/30 max-h-[400px] overflow-y-auto">
                {payments.length === 0 && (
                  <p className="text-sm text-[#6c757d] text-center py-8">Nessun pagamento registrato</p>
                )}
                {payments.map(p => {
                  const stageConf = KANBAN_COLS.find(c => c.key === p.status);
                  return (
                    <div key={p._id} className="flex items-center gap-3 px-5 py-3 hover:bg-[#495057]/20 transition-colors">
                      <div className={`w-2 h-2 rounded-full ${stageConf?.dot || 'bg-gray-400'} shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[#f8f9fa] truncate">{p.title || p.description || 'Pagamento'}</p>
                        <p className="text-[10px] text-[#6c757d]">{stageConf?.label || p.status}</p>
                      </div>
                      <span className="text-sm font-medium text-[#f8f9fa] shrink-0">
                        €{(p.confirmed_amount || p.amount || 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {/* ── KANBAN VIEW ──────────────────────────────────────────────── */}
        {activeView === 'kanban' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {KANBAN_COLS.map(col => {
              const items = kanbanItems[col.key] || [];
              return (
                <div
                  key={col.key}
                  className={`${col.bg} border ${col.border} rounded-2xl flex flex-col overflow-hidden`}
                >
                  {/* Column header */}
                  <div className="px-4 py-3 border-b border-inherit flex items-center gap-2 shrink-0">
                    <div className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                    <span className="text-sm font-medium text-[#f8f9fa]">{col.label}</span>
                    <span className="ml-auto text-xs bg-[#495057]/60 text-[#adb5bd] rounded-full px-2 py-0.5">{items.length}</span>
                  </div>
                  {/* Cards */}
                  <div className="p-3 space-y-2 flex-1 min-h-[120px] max-h-[60vh] overflow-y-auto">
                    {items.length === 0 && (
                      <div className="h-12 flex items-center justify-center text-[10px] text-[#6c757d] border border-dashed border-[#495057]/50 rounded-lg">
                        Vuoto
                      </div>
                    )}
                    {items.map(p => (
                      <div
                        key={p._id}
                        draggable
                        onDragStart={() => setDraggedId(p._id)}
                        className="bg-[#343a40]/80 border border-[#495057]/50 rounded-xl p-3 cursor-grab active:cursor-grabbing hover:border-[#6c757d]/70 transition-all group"
                      >
                        <p className="text-xs font-medium text-[#f8f9fa] truncate group-hover:text-white">
                          {p.title || p.description || 'Pagamento'}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] text-[#6c757d]">
                            {p._creationTime ? new Date(p._creationTime).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }) : '—'}
                          </span>
                          <span className="text-xs font-semibold text-emerald-400">
                            €{(p.confirmed_amount || p.amount || 0).toLocaleString('it-IT')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
