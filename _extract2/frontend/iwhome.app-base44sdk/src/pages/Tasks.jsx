import React from 'react';
import { useQuery } from "convex/react";
import { api } from "../../../../Backend/convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Calendar, Building2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function Tasks() {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress || "";
  
  const tasks = useQuery(api.adminStats.getStaffTasks, { email }) || [];
  const myCollaborator = useQuery(api.collaborators.getByEmail, { email });

  const pendingTasks = tasks.filter(t => t.status !== 'completato');
  const completedTasks = tasks.filter(t => t.status === 'completato');

  return (
    <div className="lg:ml-[280px] pt-[76px] min-h-screen bg-[#212529] text-[#f8f9fa] p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Link to={createPageUrl('Dashboard')} className="text-indigo-400 hover:text-indigo-300 flex items-center gap-2 text-xs font-bold mb-4 transition-colors">
              <ArrowLeft size={14} /> Torna alla Dashboard
            </Link>
            <h1 className="text-3xl font-light tracking-tight">Le Mie <span className="font-bold">Attività</span></h1>
            <p className="text-[#adb5bd] text-sm mt-1">Gestisci tutti i task assegnati nei vari cantieri.</p>
          </div>
          <div className="flex gap-2">
             <Badge variant="outline" className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 px-3 py-1">
               {pendingTasks.length} Da fare
             </Badge>
             <Badge variant="outline" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 px-3 py-1">
               {completedTasks.length} Completati
             </Badge>
          </div>
        </header>

        <div className="grid gap-6">
          {pendingTasks.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Clock className="text-indigo-400" size={18} /> In Corso
              </h2>
              <div className="grid gap-3">
                {pendingTasks.map(task => (
                  <TaskCard key={task._id} task={task} />
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-[#343a40]/30 border border-[#f8f9fa]/5 rounded-3xl p-12 text-center">
               <CheckCircle className="mx-auto text-emerald-500 mb-4" size={48} />
               <p className="text-lg font-bold">Ottimo lavoro!</p>
               <p className="text-[#adb5bd] text-sm">Non hai attività in sospeso al momento.</p>
            </div>
          )}

          {completedTasks.length > 0 && (
            <div className="space-y-4 pt-4">
              <h2 className="text-lg font-bold text-[#6c757d] flex items-center gap-2">
                <CheckCircle size={18} /> Recentemente completati
              </h2>
              <div className="grid gap-3 opacity-60">
                {completedTasks.slice(0, 5).map(task => (
                  <TaskCard key={task._id} task={task} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task }) {
  const isHigh = task.priority === 'alta' || task.priority === 'urgente';
  
  return (
    <Card className="bg-[#343a40]/60 backdrop-blur-xl border border-[#f8f9fa]/10 p-5 rounded-2xl hover:bg-[#343a40]/80 transition-all group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-md ${
              isHigh ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
            }`}>
              {task.priority || 'media'}
            </span>
            <span className="text-[10px] text-[#6c757d] flex items-center gap-1">
              <Calendar size={10} /> {task.deadline ? new Date(task.deadline).toLocaleDateString('it-IT') : 'Senza scadenza'}
            </span>
          </div>
          <h3 className="text-base font-bold text-[#f8f9fa] group-hover:text-indigo-400 transition-colors">{task.title}</h3>
          <p className="text-sm text-[#adb5bd] mt-1 line-clamp-2 italic">{task.description || 'Nessuna descrizione.'}</p>
          
          <div className="flex items-center gap-4 mt-4 text-[10px] font-bold text-[#6c757d]">
             <div className="flex items-center gap-1.5">
               <Building2 size={12} className="text-indigo-400/50" />
               <span className="uppercase tracking-widest">{task.nome_cantiere || 'Cantiere N/D'}</span>
             </div>
             {task.phase_name && (
               <div className="flex items-center gap-1.5">
                 <AlertTriangle size={12} className="text-amber-400/50" />
                 <span className="uppercase tracking-widest">Fase: {task.phase_name}</span>
               </div>
             )}
          </div>
        </div>
        
        <Link to={createPageUrl('CantieriDashboard')} className="flex-shrink-0">
           <div className="w-10 h-10 rounded-xl bg-[#212529] border border-[#f8f9fa]/10 flex items-center justify-center text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all shadow-lg">
              <Clock size={18} />
           </div>
        </Link>
      </div>
    </Card>
  );
}
