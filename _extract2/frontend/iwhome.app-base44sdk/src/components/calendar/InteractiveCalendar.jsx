import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, ChevronLeft, ChevronRight, Download, Edit, Trash2, Clock } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { it } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function InteractiveCalendar({ appointments, onCreateEvent, onUpdateEvent, onDeleteEvent }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [eventFormData, setEventFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    appointment_date: '',
    appointment_time: '',
    project_type: 'finestre',
    notes: ''
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

  const getAppointmentsForDate = (date) => {
    return appointments.filter(apt =>
      isSameDay(new Date(apt.appointment_date), date)
    );
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    const dayAppointments = getAppointmentsForDate(date);
    if (dayAppointments.length === 1) {
      setSelectedAppointment(dayAppointments[0]);
    }
  };

  const handleCreateEvent = () => {
    setEventFormData({
      full_name: '',
      email: '',
      phone: '',
      appointment_date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
      appointment_time: '10:00',
      project_type: 'finestre',
      notes: ''
    });
    setSelectedAppointment(null);
    setShowEventDialog(true);
  };

  const handleEditEvent = (appointment) => {
    setEventFormData({
      full_name: appointment.full_name,
      email: appointment.email,
      phone: appointment.phone || '',
      appointment_date: appointment.appointment_date,
      appointment_time: appointment.appointment_time,
      project_type: appointment.project_type || 'finestre',
      notes: appointment.notes || ''
    });
    setSelectedAppointment(appointment);
    setShowEventDialog(true);
  };

  const handleSaveEvent = async () => {
    try {
      if (selectedAppointment) {
        await onUpdateEvent(selectedAppointment._id, eventFormData);
      } else {
        await onCreateEvent(eventFormData);
      }
      setShowEventDialog(false);
      setSelectedAppointment(null);
    } catch (error) {
      alert("Errore: " + error.message);
    }
  };

  const handleDownloadICS = (appointment) => {
    const startDate = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour later

    const formatICSDate = (date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//IwHome//Appointment//IT',
      'BEGIN:VEVENT',
      `UID:${appointment._id}@iwhome.it`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `DTSTART:${formatICSDate(startDate)}`,
      `DTEND:${formatICSDate(endDate)}`,
      `SUMMARY:Appuntamento IwHome - ${appointment.project_type}`,
      `DESCRIPTION:Cliente: ${appointment.full_name}\\nTipo: ${appointment.project_type}\\nNote: ${appointment.notes || 'Nessuna nota'}`,
      `LOCATION:Via Montefiorino 10/E, Reggio Emilia`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `appuntamento-${appointment._id}.ics`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const weekDays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-[#f8f9fa] capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: it })}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa] hover:bg-[#495057]"
          >
            <ChevronLeft size={20} />
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentMonth(new Date())}
            className="bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa] hover:bg-[#495057]"
          >
            Oggi
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa] hover:bg-[#495057]"
          >
            <ChevronRight size={20} />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-[#343a40]/30 backdrop-blur-xl rounded-2xl border border-[#f8f9fa]/20 overflow-hidden">
        {/* Week Days Header */}
        <div className="grid grid-cols-7 border-b border-[#f8f9fa]/10">
          {weekDays.map((day) => (
            <div
              key={day}
              className="p-3 text-center text-sm font-medium text-[#adb5bd] border-r border-[#f8f9fa]/5 last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {dateRange.map((date, idx) => {
            const dayAppointments = getAppointmentsForDate(date);
            const isCurrentMonth = isSameMonth(date, currentMonth);
            const isToday = isSameDay(date, new Date());
            const isSelected = selectedDate && isSameDay(date, selectedDate);

            return (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.02 }}
                onClick={() => handleDateClick(date)}
                className={`min-h-[100px] p-2 border-r border-b border-[#f8f9fa]/5 cursor-pointer transition-all ${!isCurrentMonth ? 'bg-[#343a40]/20' : 'bg-transparent hover:bg-[#495057]/30'
                  } ${isToday ? 'ring-2 ring-blue-500' : ''} ${isSelected ? 'bg-[#495057]/50' : ''}`}
              >
                <div className={`text-sm font-medium mb-1 ${!isCurrentMonth ? 'text-[#6c757d]' : isToday ? 'text-blue-400' : 'text-[#f8f9fa]'
                  }`}>
                  {format(date, 'd')}
                </div>

                <div className="space-y-1">
                  {dayAppointments.map((apt) => (
                    <div
                      key={apt._id}
                      className={`text-xs p-1 rounded truncate ${apt.status === 'confirmed' ? 'bg-green-500/20 text-green-300' :
                        apt.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                          apt.status === 'cancelled' ? 'bg-red-500/20 text-red-300' :
                            'bg-blue-500/20 text-blue-300'
                        }`}
                    >
                      {apt.appointment_time} - {apt.full_name}
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Selected Date Appointments */}
      {selectedDate && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#343a40]/30 backdrop-blur-xl rounded-2xl border border-[#f8f9fa]/20 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-[#f8f9fa]">
              {format(selectedDate, 'EEEE d MMMM yyyy', { locale: it })}
            </h3>
            <Button
              onClick={handleCreateEvent}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
            >
              <Plus size={16} className="mr-2" />
              Nuovo Evento
            </Button>
          </div>

          <div className="space-y-3">
            {getAppointmentsForDate(selectedDate).length === 0 ? (
              <p className="text-[#adb5bd] text-center py-4">Nessun appuntamento per questo giorno</p>
            ) : (
              getAppointmentsForDate(selectedDate).map((apt) => (
                <motion.div
                  key={apt._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-[#495057]/50 rounded-xl p-4 border border-[#f8f9fa]/10"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock size={16} className="text-[#adb5bd]" />
                        <span className="text-[#f8f9fa] font-medium">{apt.appointment_time}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${apt.status === 'confirmed' ? 'bg-green-500/20 text-green-300' :
                          apt.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                            apt.status === 'cancelled' ? 'bg-red-500/20 text-red-300' :
                              'bg-blue-500/20 text-blue-300'
                          }`}>
                          {apt.status}
                        </span>
                      </div>
                      <h4 className="text-[#f8f9fa] font-medium mb-1">{apt.full_name}</h4>
                      <p className="text-sm text-[#adb5bd]">{apt.email}</p>
                      {apt.phone && <p className="text-sm text-[#adb5bd]">{apt.phone}</p>}
                      {apt.project_type && (
                        <p className="text-sm text-[#dee2e6] mt-2">Tipo: {apt.project_type}</p>
                      )}
                      {apt.notes && (
                        <p className="text-sm text-[#adb5bd] mt-2">{apt.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDownloadICS(apt)}
                        className="text-[#dee2e6] hover:text-[#f8f9fa] hover:bg-[#f8f9fa]/10"
                        title="Scarica ICS"
                      >
                        <Download size={16} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEditEvent(apt)}
                        className="text-[#dee2e6] hover:text-[#f8f9fa] hover:bg-[#f8f9fa]/10"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); if (window.confirm('Sei sicuro di voler eliminare questo appuntamento?')) { onDeleteEvent(apt._id); } }}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      )}

      {/* Event Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="bg-gradient-to-br from-[#495057] to-[#6c757d] border-[#f8f9fa]/20 text-[#f8f9fa] max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#f8f9fa]">
              {selectedAppointment ? 'Modifica Evento' : 'Nuovo Evento'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-[#dee2e6]">Nome Completo</Label>
              <Input
                value={eventFormData.full_name}
                onChange={(e) => setEventFormData({ ...eventFormData, full_name: e.target.value })}
                className="bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa]"
              />
            </div>

            <div>
              <Label className="text-[#dee2e6]">Email</Label>
              <Input
                type="email"
                value={eventFormData.email}
                onChange={(e) => setEventFormData({ ...eventFormData, email: e.target.value })}
                className="bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa]"
              />
            </div>

            <div>
              <Label className="text-[#dee2e6]">Telefono</Label>
              <Input
                value={eventFormData.phone}
                onChange={(e) => setEventFormData({ ...eventFormData, phone: e.target.value })}
                className="bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#dee2e6]">Data</Label>
                <Input
                  type="date"
                  value={eventFormData.appointment_date}
                  onChange={(e) => setEventFormData({ ...eventFormData, appointment_date: e.target.value })}
                  className="bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa]"
                />
              </div>

              <div>
                <Label className="text-[#dee2e6]">Ora</Label>
                <Input
                  type="time"
                  value={eventFormData.appointment_time}
                  onChange={(e) => setEventFormData({ ...eventFormData, appointment_time: e.target.value })}
                  className="bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa]"
                />
              </div>
            </div>

            <div>
              <Label className="text-[#dee2e6]">Tipo Progetto</Label>
              <select
                value={eventFormData.project_type}
                onChange={(e) => setEventFormData({ ...eventFormData, project_type: e.target.value })}
                className="w-full px-3 py-2 bg-[#343a40]/50 border border-[#f8f9fa]/20 rounded-md text-[#f8f9fa]"
              >
                <option value="finestre">Finestre</option>
                <option value="chiavi_in_mano">Chiavi in Mano</option>
                <option value="consulenza">Consulenza</option>
              </select>
            </div>

            <div>
              <Label className="text-[#dee2e6]">Note</Label>
              <Textarea
                value={eventFormData.notes}
                onChange={(e) => setEventFormData({ ...eventFormData, notes: e.target.value })}
                className="bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa]"
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end mt-6">
              <Button
                variant="outline"
                onClick={() => setShowEventDialog(false)}
                className="bg-[#343a40] border-[#6c757d] text-[#f8f9fa] hover:bg-[#495057] hover:text-white"
              >
                Annulla
              </Button>
              <Button
                onClick={handleSaveEvent}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
              >
                {selectedAppointment ? 'Aggiorna' : 'Crea'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}