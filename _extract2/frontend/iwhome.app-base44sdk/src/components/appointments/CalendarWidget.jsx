import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from "convex/react";
import { api } from "../../../../../Backend/convex/_generated/api";
import { format, isSameDay } from 'date-fns';
import { it } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock, Plus } from 'lucide-react';

export default function CalendarWidget({ onSelectDate, user }) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const appointments = useQuery(api.appointments.get) || [];

  const appointmentsForSelectedDate = appointments.filter(apt =>
    isSameDay(new Date(apt.appointment_date), selectedDate)
  );

  const confirmedDates = appointments
    .filter(apt => apt.status === 'confirmed')
    .map(apt => new Date(apt.appointment_date));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Calendar */}
      <Card className="bg-gradient-to-br from-[#495057] to-[#6c757d] border-[#f8f9fa]/20">
        <CardHeader>
          <CardTitle className="text-[#f8f9fa] flex items-center gap-2">
            <CalendarIcon size={20} />
            I Tuoi Appuntamenti
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-[#343a40]/50 rounded-xl p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={it}
              className="rounded-xl [&_.rdp-day]:text-[#f8f9fa] [&_.rdp-caption]:text-[#f8f9fa] [&_.rdp-nav_button]:text-[#f8f9fa] [&_.rdp-head_cell]:text-[#dee2e6]"
              modifiers={{
                confirmed: confirmedDates
              }}
              modifiersStyles={{
                confirmed: {
                  backgroundColor: 'rgba(248, 249, 250, 0.2)',
                  fontWeight: 'bold'
                }
              }}
              classNames={{
                day_selected: "bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef] text-[#212529] hover:from-[#e9ecef] hover:to-[#f8f9fa]",
                day_today: "bg-[#6c757d] text-[#f8f9fa]",
              }}
            />
          </div>

          <div className="mt-4 flex items-center gap-4 text-xs text-[#dee2e6]">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[#f8f9fa]/20"></div>
              <span>Appuntamento confermato</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      <Card className="bg-gradient-to-br from-[#495057] to-[#6c757d] border-[#f8f9fa]/20">
        <CardHeader>
          <CardTitle className="text-[#f8f9fa] flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Clock size={20} />
              {format(selectedDate, 'd MMMM yyyy', { locale: it })}
            </span>
            {appointmentsForSelectedDate.length === 0 && (
              <Button
                size="sm"
                onClick={() => onSelectDate?.(selectedDate)}
                className="bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef] text-[#212529] rounded-full"
              >
                <Plus size={16} className="mr-1" />
                Nuovo
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {appointmentsForSelectedDate.length > 0 ? (
            <div className="space-y-3">
              {appointmentsForSelectedDate.map((apt) => (
                <motion.div
                  key={apt._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-[#343a40]/50 rounded-xl p-4 border border-[#f8f9fa]/10"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-[#f8f9fa]">{apt.appointment_time}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${apt.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                      apt.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                      {apt.status}
                    </span>
                  </div>
                  <p className="text-sm text-[#dee2e6]">{apt.project_type}</p>
                  {apt.notes && (
                    <p className="text-xs text-[#adb5bd] mt-2">{apt.notes}</p>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-[#adb5bd]">
              <Clock size={48} className="mx-auto mb-4 opacity-30" />
              <p className="mb-4">Nessun appuntamento per questo giorno</p>
              <Button
                onClick={() => onSelectDate?.(selectedDate)}
                className="bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef] text-[#212529] rounded-full"
              >
                <Plus size={16} className="mr-2" />
                Prenota Appuntamento
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}