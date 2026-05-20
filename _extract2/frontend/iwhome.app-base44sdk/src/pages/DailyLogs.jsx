
import React, { useState } from 'react';
import { useQuery } from "convex/react";
import { api } from "../../../../Backend/convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import {
  Calendar,
  MapPin,
  Clock,
  ChevronLeft,
  Search,
  CheckCircle2,
  Clock3,
  TrendingUp,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';

export default function DailyLogs() {
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch current collaborator profile
  const myCollaborator = useQuery(api.collaborators.getByEmail, {
    email: user?.primaryEmailAddress?.emailAddress || ""
  });

  // Fetch hours logs
  const myHours = useQuery(api.collaborators.listHours,
    myCollaborator ? { collaborator_id: myCollaborator._id } : "skip"
  ) || [];

  const filteredLogs = myHours
    .filter(log =>
      log.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.date.includes(searchTerm)
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalHours = myHours.reduce((acc, curr) => acc + curr.hours_worked, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#212529] via-[#343a40] to-[#495057] relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="lg:ml-[280px] pt-[76px] relative z-10 min-h-screen pb-safe">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
          {/* Header & Stats Section */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
              <Link
                to={createPageUrl('Dashboard')}
                className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-all font-medium text-sm group"
              >
                <div className="p-2 bg-white/5 rounded-xl group-hover:bg-white/10 transition-all">
                  <ChevronLeft size={16} />
                </div>
                Torna alla Dashboard
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
                Log <span className="text-blue-500">Ore</span>
              </h1>
              <p className="text-white/50 text-lg max-w-xl leading-relaxed">
                Riepilogo delle tue attività lavorative e storico delle ore registrate.
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] flex items-center gap-6 shadow-2xl">
              <div className="p-4 bg-blue-500/20 rounded-2xl">
                <Clock className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-white/40 tracking-widest mb-1">Totale Ore</p>
                <p className="text-4xl font-black text-white">{totalHours}</p>
              </div>
            </div>

            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] flex items-center gap-6 shadow-2xl">
              <div className="p-4 bg-emerald-500/20 rounded-2xl">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-white/40 tracking-widest mb-1">Approvati</p>
                <p className="text-4xl font-black text-white">{myHours.filter(h => h.approved).length}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Search & Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative max-w-lg"
        >
          <div className="absolute left-5 top-1/2 -translate-y-1/2">
            <Search className="text-white/30" size={20} />
          </div>
          <input
            type="text"
            placeholder="Cerca per data o attività..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white placeholder:text-white/20 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all shadow-xl font-medium"
          />
        </motion.div>

        {/* Logs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLogs.map((log, index) => (
            <motion.div
              key={log._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + (index * 0.05) }}
            >
              <Card className="h-full bg-white/[0.03] backdrop-blur-xl border border-white/10 shadow-2xl rounded-[2.5rem] overflow-hidden group hover:bg-white/[0.05] hover:border-blue-500/30 transition-all duration-500 flex flex-col">
                <CardHeader className="p-8 pb-4">
                  <div className="flex items-center justify-between mb-8">
                    <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/5 flex items-center gap-2">
                      <Calendar size={14} className="text-blue-400" />
                      <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">
                        {new Date(log.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>

                    {log.approved ? (
                      <Badge variant="default" className="bg-emerald-500/10 text-emerald-400 border-none px-3 py-1 rounded-lg font-bold text-[10px]">
                        APPROVATO
                      </Badge>
                    ) : (
                      <Badge variant="default" className="bg-amber-500/10 text-amber-400 border-none px-3 py-1 rounded-lg font-bold text-[10px]">
                        IN ATTESA
                      </Badge>
                    )}
                  </div>

                  <CardTitle className="text-5xl font-black text-white tracking-tighter">
                    {log.hours_worked} <span className="text-xl font-bold text-white/30">H</span>
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-8 pt-4 space-y-6 flex-grow flex flex-col">
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase font-bold text-white/20 tracking-widest">Descrizione</p>
                    <p className="text-white/60 leading-relaxed line-clamp-3 italic">
                      "{log.description || "Nessun dettaglio inserito."}"
                    </p>
                  </div>

                  <div className="mt-auto pt-6 flex items-center justify-between border-t border-white/5">
                    <div className="flex items-center gap-2 text-white/40 uppercase text-[10px] font-bold tracking-widest">
                      <MapPin size={12} className="text-blue-500" />
                      {log.cantiere_id ? "CANTIERE ASSEGNATO" : "OFFSITE"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {filteredLogs.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full py-32 text-center"
            >
              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8">
                <Clock size={40} className="text-white/20" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Nessun log trovato</h3>
              <p className="text-white/40 mb-8 max-w-md mx-auto">Non abbiamo trovato registrazioni per i criteri di ricerca specificati.</p>
              <Link to={createPageUrl('Dashboard')}>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 rounded-2xl font-bold text-lg">
                  Registra Nuove Ore
                </Button>
              </Link>
            </motion.div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
