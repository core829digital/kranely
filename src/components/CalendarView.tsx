"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Appointment {
  _id: string
  _creationTime: number
  title: string
  email: string
  appointmentDate: string
  appointmentTime?: string
  location?: string
  description?: string
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show"
  clientId?: string
  cantiereId?: string
  collaboratorId?: string
}

interface CalendarViewProps {
  appointments: Appointment[]
  onAppointmentClick?: (appointment: Appointment) => void
}

const DAYS_IT = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"]
const MONTHS_IT = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"]

const statusConfig: Record<string, { color: string; label: string }> = {
  scheduled: { color: "bg-blue-400/20 text-blue-400 border-blue-400/30", label: "Fissato" },
  confirmed: { color: "bg-green-400/20 text-green-400 border-green-400/30", label: "Confermato" },
  completed: { color: "bg-gray-400/20 text-gray-400 border-gray-400/30", label: "Completato" },
  cancelled: { color: "bg-red-400/20 text-red-400 border-red-400/30", label: "Annullato" },
  no_show: { color: "bg-orange-400/20 text-orange-400 border-orange-400/30", label: "No Show" },
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1
}

export function CalendarView({ appointments, onAppointmentClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const today = new Date().toISOString().split("T")[0]

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const getAppointmentsForDate = (dateStr: string) => {
    return appointments.filter((a) => a.appointmentDate === dateStr)
  }

  const selectedAppointments = selectedDate ? getAppointmentsForDate(selectedDate) : []

  const cells = []
  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`empty-${i}`} className="h-24 md:h-28 border border-white/5 bg-white/[0.01]" />)
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    const dayAppointments = getAppointmentsForDate(dateStr)
    const isToday = dateStr === today
    const isSelected = dateStr === selectedDate
    const isPast = dateStr < today

    cells.push(
      <div
        key={dateStr}
        className={cn(
          "h-24 md:h-28 border border-white/10 p-1 cursor-pointer transition-colors hover:bg-white/[0.04]",
          isSelected && "bg-kranely-accent/5 border-kranely-accent/30",
          isToday && "bg-white/[0.03]"
        )}
        onClick={() => setSelectedDate(dateStr === selectedDate ? null : dateStr)}
      >
        <div className="flex items-center justify-between mb-1">
          <span className={cn(
            "text-xs font-medium",
            isToday && "w-5 h-5 rounded-full bg-kranely-accent text-kranely-app-bg flex items-center justify-center",
            isPast && !isToday && "text-white/30"
          )}>{day}</span>
          {dayAppointments.length > 0 && (
            <span className="text-[10px] text-white/40">{dayAppointments.length}</span>
          )}
        </div>
        <div className="space-y-0.5 overflow-hidden">
          {dayAppointments.slice(0, 2).map((apt) => {
            const sc = statusConfig[apt.status]
            return (
              <div key={apt._id} className={cn(
                "text-[10px] px-1 py-0.5 rounded truncate border",
                sc.color
              )}>
                {apt.appointmentTime && <span className="mr-1">{apt.appointmentTime}</span>}
                {apt.title}
              </div>
            )
          })}
          {dayAppointments.length > 2 && (
            <div className="text-[10px] text-white/40 pl-1">+{dayAppointments.length - 2} altri</div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-5 h-5 text-kranely-accent" />
          <h2 className="text-lg font-semibold text-white">{MONTHS_IT[month]} {year}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())} className="text-xs text-kranely-accent hover:text-kranely-accent/80">
            Oggi
          </Button>
          <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-0">
        {DAYS_IT.map((day) => (
          <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-white/40 border-b border-white/10">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0 border border-white/10 rounded-lg overflow-hidden">
        {cells}
      </div>

      {selectedDate && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <h3 className="text-sm font-semibold text-white mb-3">
            Appuntamenti del {new Date(selectedDate).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </h3>
          {selectedAppointments.length > 0 ? (
            <div className="space-y-2">
              {selectedAppointments.map((apt) => {
                const sc = statusConfig[apt.status]
                return (
                  <div key={apt._id} className="flex items-start gap-3 p-3 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-colors cursor-pointer" onClick={() => onAppointmentClick?.(apt)}>
                    <div className="w-1 h-10 rounded-full bg-kranely-accent flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-white">{apt.title}</h4>
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", sc.color)}>{sc.label}</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-white/50">
                        {apt.appointmentTime && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{apt.appointmentTime}</span>}
                        {apt.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{apt.location}</span>}
                        {apt.email && <span className="flex items-center gap-1"><User className="w-3 h-3" />{apt.email}</span>}
                      </div>
                      {apt.description && <p className="text-xs text-white/40 mt-1">{apt.description}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-white/40">Nessun appuntamento per questa data</p>
          )}
        </div>
      )}
    </div>
  )
}
