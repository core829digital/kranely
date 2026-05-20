import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../Backend/convex/_generated/api';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';


import InteractiveCalendar from '../components/calendar/InteractiveCalendar';
import { useUser } from "@clerk/clerk-react";

import { Calendar, Clock, MapPin, CheckCircle, XCircle, X, List } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function MyAppointments() {
  const { user, isLoaded } = useUser();
  const [viewMode, setViewMode] = useState('calendar');

  const [showAll, setShowAll] = useState(false);

  const myAppointments = useQuery(api.appointments.get) || [];
  const allAppointments = useQuery(api.appointments.getAll) || [];

  const convexUser = useQuery(api.users.getByEmail, {
    email: user?.primaryEmailAddress?.emailAddress || ""
  });

  const isAdmin = convexUser?.role === 'admin' || convexUser?.role === 'superadmin';
  const isWorker = convexUser?.role?.startsWith('collaborator');
  const appointments = showAll && isAdmin ? allAppointments : myAppointments;

  const createAppointment = useMutation(api.appointments.create);
  const updateStatus = useMutation(api.appointments.updateStatus);
  const updateAppointment = useMutation(api.appointments.update);
  const deleteAppointment = useMutation(api.appointments.deleteAppointment);

  const handleCreateEvent = async (data) => {
    if (!user) return;
    await createAppointment({
      ...data,
      email: user.primaryEmailAddress?.emailAddress,
      full_name: user.fullName || "User",
    });
  };

  const handleUpdateEvent = async (id, data) => {
    await updateAppointment({
      id,
      appointment_date: data.appointment_date,
      appointment_time: data.appointment_time,
      project_type: data.project_type,
      notes: data.notes,
      full_name: data.full_name,
      phone: data.phone,
      email: data.email
    });
  };

  const handleDeleteEvent = (id) => {
    deleteAppointment({ id });
  };

  const handleCancelEvent = (id) => {
    updateStatus({ id, status: 'cancelled' });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="text-green-400" size={20} />;
      case 'cancelled': return <XCircle className="text-red-400" size={20} />;
      case 'rejected': return <XCircle className="text-red-600" size={20} />;
      case 'pending': return <Clock className="text-yellow-400" size={20} />;
      default: return <Clock className="text-[#adb5bd]" size={20} />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed': return 'Confermato';
      case 'cancelled': return 'Annullato';
      case 'completed': return 'Completato';
      case 'pending': return 'In Attesa';
      case 'rejected': return 'Rifiutato';
      default: return status;
    }
  };

  // if (!isLoaded || !user) check removed

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#212529] via-[#343a40] to-[#495057] relative overflow-hidden">
      

      

      <div className="lg:ml-[280px] pt-[76px] relative z-10 min-h-screen pb-safe">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-medium text-[#f8f9fa] mb-1">
                {showAll ? 'Tutti gli Appuntamenti' : 'I Miei Appuntamenti'}
              </h1>
              <p className="text-xs sm:text-sm text-[#dee2e6]">
                {showAll ? 'Gestione completa appuntamenti' :
                 isWorker ? 'I tuoi sopralluoghi e appuntamenti assegnati' :
                 'Gestisci le tue visite'}
              </p>
            </div>
            <div className="flex gap-2">
              {isAdmin && (
                <div className="flex bg-[#343a40] rounded-lg p-1 mr-2 border border-[#495057]">
                  <button
                    onClick={() => setShowAll(false)}
                    className={`px-3 py-1.5 rounded-md text-sm transition-all ${!showAll ? 'bg-[#495057] text-white shadow-sm' : 'text-[#adb5bd] hover:text-white'}`}
                  >
                    Miei
                  </button>
                  <button
                    onClick={() => setShowAll(true)}
                    className={`px-3 py-1.5 rounded-md text-sm transition-all ${showAll ? 'bg-blue-600 text-white shadow-sm' : 'text-[#adb5bd] hover:text-white'}`}
                  >
                    Tutti
                  </button>
                </div>
              )}

              <Button
                variant={viewMode === 'calendar' ? 'default' : 'outline'}
                onClick={() => setViewMode('calendar')}
                className={viewMode === 'calendar'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'border-[#f8f9fa]/30 bg-[#495057]/50 text-[#f8f9fa] hover:bg-[#495057] hover:text-white'}
              >
                <Calendar size={16} className="mr-2" />
                Calendario
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                onClick={() => setViewMode('list')}
                className={viewMode === 'list'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'border-[#f8f9fa]/30 bg-[#495057]/50 text-[#f8f9fa] hover:bg-[#495057] hover:text-white'}
              >
                <List size={16} className="mr-2" />
                Lista
              </Button>
            </div>
          </div>

          {/* Appointments View */}
          {appointments === undefined ? (
            <div className="text-center py-12 text-[#dee2e6]">Caricamento...</div>
          ) : viewMode === 'calendar' ? (
            <InteractiveCalendar
              appointments={appointments}
              onCreateEvent={handleCreateEvent}
              onUpdateEvent={handleUpdateEvent}
              onDeleteEvent={handleDeleteEvent}
            />
          ) : appointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar size={64} className="text-[#6c757d] mx-auto mb-4" />
              <p className="text-[#dee2e6] text-lg">Nessun appuntamento</p>
              <p className="text-[#adb5bd] text-sm mt-2 mb-6">Prenota la tua prima visita in showroom</p>
              <Link to={createPageUrl('Calcolatore')}>
                <Button className="bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef] text-[#212529]">
                  Prenota Ora
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
              {appointments.map((apt) => (
                <motion.div
                  key={apt._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                  className="bg-[#343a40]/30 backdrop-blur-xl border border-[#f8f9fa]/20 rounded-xl lg:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-xl hover:bg-[#343a40]/50 hover:shadow-2xl transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(apt.status)}
                      <div className="flex flex-col">
                        <span className="text-sm px-3 py-1 rounded-full bg-[#f8f9fa]/10 text-[#f8f9fa] backdrop-blur-sm w-fit">
                          {getStatusText(apt.status)}
                        </span>
                        {showAll && (
                          <span className="text-xs text-[#ced4da] mt-1">{apt.full_name}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 backdrop-blur-sm">
                        {apt.project_type}
                      </span>
                      {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                        <button
                          onClick={() => {
                            if (window.confirm("Sei sicuro di voler eliminare questo appuntamento?")) {
                              handleDeleteEvent(apt._id);
                            }
                          }}
                          className="p-1 rounded-lg hover:bg-red-500/20 text-red-400 transition-all"
                          title="Elimina"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-[#f8f9fa]">
                      <Calendar size={18} className="text-[#adb5bd]" />
                      <span>{format(new Date(apt.appointment_date), 'EEEE d MMMM yyyy', { locale: it })}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[#f8f9fa]">
                      <Clock size={18} className="text-[#adb5bd]" />
                      <span>ore {apt.appointment_time}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[#dee2e6]">
                      <MapPin size={18} className="text-[#adb5bd]" />
                      <span className="text-sm text-[#f8f9fa]">Showroom IwHome, Via Montefiorino 10/E</span>
                    </div>
                    {showAll && (
                      <div className="flex flex-col gap-1 mt-2 p-2 bg-[#495057]/30 rounded-lg">
                        <p className="text-xs text-[#ced4da] font-medium">Cliente:</p>
                        <p className="text-sm text-[#f8f9fa]">{apt.full_name}</p>
                        <p className="text-xs text-[#adb5bd]">{apt.email}</p>
                        {apt.phone && <p className="text-xs text-[#adb5bd]">{apt.phone}</p>}
                      </div>
                    )}
                  </div>

                  {apt.notes && (
                    <div className="mt-4 pt-4 border-t border-[#f8f9fa]/10">
                      <p className="text-sm text-[#dee2e6]">{apt.notes}</p>
                    </div>
                  )}

                  {apt.status === 'confirmed' && (
                    <div className="mt-4 pt-4 border-t border-[#f8f9fa]/10 flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (window.confirm("Sei sicuro di voler annullare questo appuntamento?")) {
                            handleCancelEvent(apt._id);
                          }
                        }}
                        className="flex-1 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 border border-red-500/20"
                      >
                        Annulla Appuntamento
                      </Button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}