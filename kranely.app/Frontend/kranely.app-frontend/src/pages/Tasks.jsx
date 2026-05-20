import React from 'react';
import { useQuery } from "convex/react";
import { api } from "../../../../Backend/convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Calendar, Building2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useTranslation } from 'react-i18next';

export default function Tasks() {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress || "";
  const { t } = useTranslation();
  
  const tasks = useQuery(api.adminStats.getStaffTasks, { email }) || [];
  const myCollaborator = useQuery(api.collaborators.getByEmail, { email });

  const pendingTasks = tasks.filter(t => t.status !== 'completato');
  const completedTasks = tasks.filter(t => t.status === 'completato');

  return (
    <div className="pt-0 min-h-screen bg-[#1C1A18] text-white p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Link to={createPageUrl('Dashboard')} className="text-[#FFC703] hover:text-[#FFC703] flex items-center gap-2 text-xs font-bold mb-4 transition-colors">
              <ArrowLeft size={14} /> {t('tasks.back_dashboard')}
            </Link>
            <h1 className="text-3xl font-light tracking-tight">My <span className="font-bold">{t('tasks.title')}</span></h1>
            <p className="text-white/40 text-sm mt-1">{t('tasks.subtitle')}</p>
          </div>
           <div className="flex gap-2">
              <Badge variant="outline" className="bg-[#FFC703]/20 text-[#FFC703] border-[#FFC703]/20 px-3 py-1">
                {pendingTasks.length} {t('tasks.todo')}
              </Badge>
              <Badge variant="outline" className="bg-[#FFC703]/10 text-emerald-300 border-emerald-500/30 px-3 py-1">
                {completedTasks.length} {t('tasks.completed')}
              </Badge>
           </div>
        </header>

        <div className="grid gap-6">
          {pendingTasks.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Clock className="text-[#FFC703]" size={18} /> In Progress
              </h2>
              <div className="grid gap-3">
                {pendingTasks.map(task => (
                  <TaskCard key={task._id} task={task} />
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-[#1C1A18]/ border border-white/ rounded-3xl p-12 text-center">
               <CheckCircle className="mx-auto text-emerald-500 mb-4" size={48} />
<p className="text-lg font-bold">Great job!</p>
               <p className="text-white/40 text-sm">You have no pending activities at the moment.</p>
            </div>
          )}

          {completedTasks.length > 0 && (
            <div className="space-y-4 pt-4">
              <h2 className="text-lg font-bold text-white/25 flex items-center gap-2">
                <CheckCircle size={18} /> Recently completed
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
    <Card className="bg-[#1C1A18]/ backdrop-blur-xl border border-white/ p-5 rounded-2xl hover:bg-[#1C1A18]/ transition-all group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-md ${
              isHigh ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-[#FFC703]/20 text-[#FFC703] border border-[#FFC703]/20'
            }`}>
              {task.priority || 'media'}
            </span>
            <span className="text-[10px] text-white/25 flex items-center gap-1">
              <Calendar size={10} /> {task.deadline ? new Date(task.deadline).toLocaleDateString('en-GB') : 'No deadline'}
            </span>
          </div>
          <h3 className="text-base font-bold text-white group-hover:text-[#FFC703] transition-colors">{task.title}</h3>
          <p className="text-sm text-white/40 mt-1 line-clamp-2 italic">{task.description || 'No description.'}</p>
          
          <div className="flex items-center gap-4 mt-4 text-[10px] font-bold text-white/25">
             <div className="flex items-center gap-1.5">
               <Building2 size={12} className="text-[#FFC703]/50" />
               <span className="uppercase tracking-widest">{task.nome_cantiere || 'Project N/A'}</span>
             </div>
             {task.phase_name && (
               <div className="flex items-center gap-1.5">
                 <AlertTriangle size={12} className="text-amber-400/50" />
                 <span className="uppercase tracking-widest">Phase: {task.phase_name}</span>
               </div>
             )}
          </div>
        </div>
        
        <Link to={createPageUrl('ProjectsDashboard')} className="flex-shrink-0">
           <div className="w-10 h-10 rounded-xl bg-[#1C1A18] border border-white/10 flex items-center justify-center text-[#FFC703] hover:bg-[#FFC703] hover:text-white transition-all shadow-lg">
              <Clock size={18} />
           </div>
        </Link>
      </div>
    </Card>
  );
}



