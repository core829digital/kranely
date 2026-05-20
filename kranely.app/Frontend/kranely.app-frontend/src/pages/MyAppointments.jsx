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
      default: return <Clock className="text-white/40" size={20} />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed': return 'Confirmed';
      case 'cancelled': return 'Cancelled';
      case 'completed': return 'Completed';
      case 'pending': return 'Pending';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  // if (!isLoaded || !user) check removed

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1C1A18 0%, #232323 60%, #2a2826 100%)' }}>
      

      

      <div className="pt-0 relative z-10 min-h-screen pb-safe">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-medium text-[#F0EBE8] mb-1">
                {showAll ? 'All Appointments' : 'My Appointments'}
              </h1>
              <p className="text-xs sm:text-sm text-[#F0EBE8]/50">
                {showAll ? 'Full appointment management' :
                 isWorker ? 'Your assigned site visits' :
                 'Manage your scheduled visits'}
              </p>
            </div>
            <div className="flex gap-2">
              {isAdmin && (
                <div className="flex bg-white/5 rounded-lg p-1 mr-2 border border-white/10">
                  <button onClick={() => setShowAll(false)} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${!showAll ? 'bg-[#FFC703]/20 text-[#FFC703]' : 'text-[#F0EBE8]/40 hover:text-[#F0EBE8]'}`}>Mine</button>
                  <button onClick={() => setShowAll(true)} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${showAll ? 'bg-[#FFC703]/20 text-[#FFC703]' : 'text-[#F0EBE8]/40 hover:text-[#F0EBE8]'}`}>All</button>
                </div>
              )}

              <button onClick={() => setViewMode('calendar')} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${viewMode === 'calendar' ? 'bg-[#FFC703]/20 text-[#FFC703] border border-[#FFC703]/25' : 'bg-white/5 text-[#F0EBE8]/50 border border-white/10 hover:text-[#F0EBE8]'}`}>
                <Calendar size={16} /> Calendar
              </button>
              <button onClick={() => setViewMode('list')} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${viewMode === 'list' ? 'bg-[#FFC703]/20 text-[#FFC703] border border-[#FFC703]/25' : 'bg-white/5 text-[#F0EBE8]/50 border border-white/10 hover:text-[#F0EBE8]'}`}>
                <List size={16} /> List
              </button>
            </div>
          </div>

          {/* Appointments View */}
          {appointments === undefined ? (
            <div className="text-center py-12 text-white/70">Loading...</div>
          ) : viewMode === 'calendar' ? (
            <InteractiveCalendar
              appointments={appointments}
              onCreateEvent={handleCreateEvent}
              onUpdateEvent={handleUpdateEvent}
              onDeleteEvent={handleDeleteEvent}
            />
          ) : appointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar size={64} className="text-white/25 mx-auto mb-4" />
              <p className="text-white/70 text-lg">No appointments</p>
              <p className="text-white/40 text-sm mt-2 mb-6">Book your first showroom visit</p>
              <Link to={createPageUrl('Calcolatore')}>
                <Button className="bg-gradient-to-r from-[#F0EBE8] to-[#f0ebe8] text-[#141210]">
                  Book Now
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
                  className="bg-[#1C1A18]/ backdrop-blur-xl border border-white/ rounded-xl lg:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-xl hover:bg-[#1C1A18]/ hover:shadow-2xl transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(apt.status)}
                      <div className="flex flex-col">
                        <span className="text-sm px-3 py-1 rounded-full bg-white/ text-white backdrop-blur-sm w-fit">
                          {getStatusText(apt.status)}
                        </span>
                        {showAll && (
                          <span className="text-xs text-white/40 mt-1">{apt.full_name}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-[#FFC703]/20 text-[#FFC703] backdrop-blur-sm">
                        {apt.project_type}
                      </span>
                      {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                        <button
                          onClick={() => {
                            if (window.confirm("Are you sure you want to delete this appointment?")) {
                              handleDeleteEvent(apt._id);
                            }
                          }}
                          className="p-1 rounded-lg hover:bg-red-500/20 text-red-400 transition-all"
                          title="Delete"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-[#F0EBE8]">
                      <Calendar size={18} className="text-[#FFC703]/60" />
                      <span>{format(new Date(apt.appointment_date), 'EEEE d MMMM yyyy', { locale: it })}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[#F0EBE8]">
                      <Clock size={18} className="text-[#FFC703]/60" />
                      <span>at {apt.appointment_time}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin size={18} className="text-[#FFC703]/60" />
                      <span className="text-sm text-[#F0EBE8]/50">Kranely Showroom</span>
                    </div>
                    {showAll && (
                      <div className="flex flex-col gap-1 mt-2 p-2 bg-[#535252]/ rounded-lg">
                        <p className="text-xs text-white/40 font-medium">Client:</p>
                        <p className="text-sm text-white">{apt.full_name}</p>
                        <p className="text-xs text-white/40">{apt.email}</p>
                        {apt.phone && <p className="text-xs text-white/40">{apt.phone}</p>}
                      </div>
                    )}
                  </div>

                  {apt.notes && (
                    <div className="mt-4 pt-4 border-t border-white/">
                      <p className="text-sm text-white/70">{apt.notes}</p>
                    </div>
                  )}

                  {apt.status === 'confirmed' && (
                    <div className="mt-4 pt-4 border-t border-white/ flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (window.confirm("Are you sure you want to cancel this appointment?")) {
                            handleCancelEvent(apt._id);
                          }
                        }}
                        className="flex-1 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 border border-red-500/20"
                      >
                        Cancel Appointment
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



