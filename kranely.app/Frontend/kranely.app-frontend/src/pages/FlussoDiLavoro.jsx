import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../../Backend/convex/_generated/api';
import { useUser } from '@clerk/clerk-react';
import useRBAC from '../hooks/useRBAC';
import { useTranslation } from 'react-i18next';
import {
  GitBranch, TrendingUp, DollarSign, Clock, CheckCircle, AlertCircle,
  Package, Truck, Star, BarChart2, Columns, Filter, ChevronRight
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// â”€â”€â”€ Pipeline stage config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const PIPELINE_STAGES = [
  { key: 'sent',         label: 'Sent',       color: 'bg-yellow-500',   border: 'border-yellow-500/40',  text: 'text-yellow-400'  },
  { key: 'received',     label: 'Ricevuta',       color: 'bg-[#FFC703]',     border: 'border-[#FFC703]/40',    text: 'text-[#FFC703]'    },
  { key: 'preventivato', label: 'Preventivata',   color: 'bg-purple-500',   border: 'border-purple-500/40',  text: 'text-purple-400'  },
  { key: 'accepted',     label: 'Accettata',      color: 'bg-emerald-500',  border: 'border-emerald-500/40', text: 'text-emerald-400' },
  { key: 'completed',    label: 'Completata',     color: 'bg-gray-400',     border: 'border-gray-400/40',    text: 'text-gray-400'    },
];

// â”€â”€â”€ Kanban column config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const KANBAN_COLS = [
  { key: 'in_attesa',   label: 'Pending',    bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', dot: 'bg-yellow-400' },
  { key: 'in_verifica', label: 'In Verifica',  bg: 'bg-[#FFC703]/10',   border: 'border-[#FFC703]/20',   dot: 'bg-blue-400'   },
  { key: 'pagato',      label: 'Pagato',       bg: 'bg-purple-500/10', border: 'border-purple-500/30', dot: 'bg-purple-400' },
  { key: 'confirmed',   label: 'Confirmed',   bg: 'bg-emerald-500/10',border: 'border-emerald-500/30',dot: 'bg-emerald-400'},
];

function AccessDenied() {
  return (
    <div className="min-h-screen bg-[#1C1A18] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
<h2 className="text-xl font-semibold text-white mb-2">{t('access.denied')}</h2>
        <p className="text-white/40">{t('access.no_permission')}</p>
      </div>
    </div>
  );
}

export default function FlussoDiLavoro() {
  const { user: clerkUser } = useUser();
  const { t } = useTranslation();
  const { isAdmin, isSupplier } = useRBAC();
  const [activeView, setActiveView] = useState('pipeline');
  const [draggedId, setDraggedId] = useState(null);

  const supplierRequests = useQuery(api.suppliers.listRequests, {}) || [];
  const payments = useQuery(api.payments.list, {}) || [];
  const suppliers = useQuery(api.suppliers.list, {}) || [];

  if (!isAdmin && !isSupplier) return <AccessDenied />;

  // â”€â”€â”€ Pipeline stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const pipelineCounts = PIPELINE_STAGES.reduce((acc, s) => {
    acc[s.key] = supplierRequests.filter(r => r.status === s.key).length;
    return acc;
  }, {});
  const totalRequests = supplierRequests.length;

  // â”€â”€â”€ Finance stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const totalPaid      = payments.filter(p => p.status === 'confirmed').reduce((s, p) => s + (p.confirmed_amount || p.amount || 0), 0);
  const totalPending   = payments.filter(p => p.status === 'in_attesa').reduce((s, p) => s + (p.amount || 0), 0);
  const totalVerifica  = payments.filter(p => p.status === 'in_verifica').reduce((s, p) => s + (p.amount || 0), 0);

  // â”€â”€â”€ Bar chart (max bar = 100% width) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const maxAmount = Math.max(totalPaid, totalPending, totalVerifica, 1);
  const barData = [
    { label: 'Confirmed',  value: totalPaid,     color: 'bg-emerald-500' },
    { label: 'In Verifica', value: totalVerifica, color: 'bg-[#FFC703]'    },
    { label: 'Pending',   value: totalPending,  color: 'bg-yellow-500'  },
  ];

  // â”€â”€â”€ Kanban data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const kanbanItems = KANBAN_COLS.reduce((acc, col) => {
    acc[col.key] = payments.filter(p => p.status === col.key);
    return acc;
  }, {});

  // â”€â”€â”€ Drag & Drop â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // movePayment: drag-drop not yet implemented "” display only

  return (
    <div className="min-h-screen bg-[#1C1A18] pt-0">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#1C1A18]/ backdrop-blur-xl p-5 sm:p-6 rounded-2xl border border-white/">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#FFC703]/20 rounded-xl">
              <GitBranch size={22} className="text-[#FFC703]" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-white">Flusso di Lavoro</h1>
              <p className="text-xs text-white/25">Pipeline Â· Finanza Â· Kanban</p>
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
                  ? 'bg-[#FFC703] hover:bg-[#FFC703] text-white border-0 text-xs'
                  : 'bg-transparent border-white/10 text-white/40 hover:text-white hover:border-white/10 text-xs'}
              >
                <Icon size={13} className="mr-1" /> {label}
              </Button>
            ))}
          </div>
        </header>

        {/* â”€â”€ PIPELINE VIEW â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {activeView === 'pipeline' && (
          <div className="space-y-6">
            {/* Stage funnel */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {PIPELINE_STAGES.map((stage, idx) => {
                const count = pipelineCounts[stage.key] || 0;
                const pct   = totalRequests > 0 ? Math.round((count / totalRequests) * 100) : 0;
                return (
                  <Card key={stage.key} className={`bg-[#1C1A18]/ border ${stage.border} rounded-2xl p-4 text-center`}>
                    <div className={`w-8 h-8 ${stage.color} rounded-full mx-auto mb-3 flex items-center justify-center text-white text-sm font-bold`}>
                      {idx + 1}
                    </div>
                    <p className="text-xs text-white/40 mb-1">{stage.label}</p>
                    <p className={`text-2xl font-light ${stage.text}`}>{count}</p>
                    <p className="text-[10px] text-white/25 mt-1">{pct}% del totale</p>
                    {/* mini progress bar */}
                    <div className="h-1 bg-[#535252] rounded-full mt-2 overflow-hidden">
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
                  <Card key={stage.key} className={`bg-[#1C1A18]/ border ${stage.border} rounded-2xl overflow-hidden`}>
                    <div className="px-4 py-3 border-b border-white/10/50 flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
                      <span className={`text-sm font-medium ${stage.text}`}>{stage.label}</span>
                      <span className="ml-auto text-xs text-white/25 bg-[#535252]/ px-2 py-0.5 rounded-full">{reqs.length}</span>
                    </div>
                    <div className="p-3 space-y-2 max-h-[240px] overflow-y-auto">
                      {reqs.map(req => {
                        const supplier = suppliers.find(s => s._id === req.supplier_id);
                        return (
                          <div key={req._id} className="flex items-center gap-2 bg-[#141210]/ rounded-lg px-3 py-2">
                            <Package size={13} className="text-white/25 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-white truncate">{req.title || 'Request'}</p>
                              {supplier && <p className="text-[10px] text-white/25 truncate">{supplier.name}</p>}
                            </div>
                            {req.quoted_price && (
                              <span className="text-xs text-emerald-400 shrink-0">â‚¬{req.quoted_price.toLocaleString('it-IT')}</span>
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

        {/* â”€â”€ FINANCE VIEW â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {activeView === 'finance' && (
          <div className="space-y-6">
            {/* KPI cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Incassato',   value: totalPaid,     color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: CheckCircle },
                { label: 'In Verifica', value: totalVerifica, color: 'text-[#FFC703]',    bg: 'bg-[#FFC703]/10',    border: 'border-[#FFC703]/20',    icon: Clock       },
                { label: 'Pending',   value: totalPending,  color: 'text-yellow-400',  bg: 'bg-yellow-500/10',  border: 'border-yellow-500/30',  icon: AlertCircle },
              ].map(({ label, value, color, bg, border, icon: Icon }) => (
                <Card key={label} className={`${bg} border ${border} rounded-2xl p-5`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon size={16} className={color} />
                    <span className="text-xs text-white/40">{label}</span>
                  </div>
                  <p className={`text-2xl sm:text-3xl font-light ${color}`}>
                    â‚¬{value.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                  </p>
                </Card>
              ))}
            </div>

            {/* Bar chart */}
            <Card className="bg-[#1C1A18]/ border border-white/ rounded-2xl p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-6">
                <BarChart2 size={16} className="text-[#FFC703]" />
                <h3 className="text-sm font-medium text-white">Payment Distribution</h3>
              </div>
              <div className="space-y-5">
                {barData.map(({ label, value, color }) => (
                  <div key={label}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs text-white/40">{label}</span>
                      <span className="text-xs font-medium text-white">
                        â‚¬{value.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="h-2.5 bg-[#535252] rounded-full overflow-hidden">
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
            <Card className="bg-[#1C1A18]/ border border-white/ rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10/50 flex items-center gap-2">
                <DollarSign size={15} className="text-emerald-400" />
                <h3 className="text-sm font-medium text-white">All Payments</h3>
                <span className="ml-auto text-xs text-white/25">{payments.length} totali</span>
              </div>
              <div className="divide-y divide-[#535252]/30 max-h-[400px] overflow-y-auto">
                {payments.length === 0 && (
                  <p className="text-sm text-white/25 text-center py-8">No payments recorded</p>
                )}
                {payments.map(p => {
                  const stageConf = KANBAN_COLS.find(c => c.key === p.status);
                  return (
                    <div key={p._id} className="flex items-center gap-3 px-5 py-3 hover:bg-[#535252]/ transition-colors">
                      <div className={`w-2 h-2 rounded-full ${stageConf?.dot || 'bg-gray-400'} shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white truncate">{p.title || p.description || 'Payment'}</p>
                        <p className="text-[10px] text-white/25">{stageConf?.label || p.status}</p>
                      </div>
                      <span className="text-sm font-medium text-white shrink-0">
                        â‚¬{(p.confirmed_amount || p.amount || 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {/* â”€â”€ KANBAN VIEW â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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
                    <span className="text-sm font-medium text-white">{col.label}</span>
                    <span className="ml-auto text-xs bg-[#535252]/ text-white/40 rounded-full px-2 py-0.5">{items.length}</span>
                  </div>
                  {/* Cards */}
                  <div className="p-3 space-y-2 flex-1 min-h-[120px] max-h-[60vh] overflow-y-auto">
                    {items.length === 0 && (
                      <div className="h-12 flex items-center justify-center text-[10px] text-white/25 border border-dashed border-white/10/50 rounded-lg">
                        Vuoto
                      </div>
                    )}
                    {items.map(p => (
                      <div
                        key={p._id}
                        draggable
                        onDragStart={() => setDraggedId(p._id)}
                        className="bg-[#1C1A18]/ border border-white/10/50 rounded-xl p-3 cursor-grab active:cursor-grabbing hover:border-white/10/70 transition-all group"
                      >
                        <p className="text-xs font-medium text-white truncate group-hover:text-white">
                          {p.title || p.description || 'Payment'}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] text-white/25">
                            {p._creationTime ? new Date(p._creationTime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '"”'}
                          </span>
                          <span className="text-xs font-semibold text-emerald-400">
                            â‚¬{(p.confirmed_amount || p.amount || 0).toLocaleString('it-IT')}
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





