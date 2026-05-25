"use client"

import { useState } from "react"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core"
import { SortableContext, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable"
import { GripVertical, Clock, Loader, CheckCircle2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Id } from "../../convex/_generated/dataModel"

interface Task {
  _id: Id<"phaseTasks">
  _creationTime: number
  title: string
  description?: string
  status: "da_fare" | "in_corso" | "completato"
  priority: "alta" | "media" | "bassa"
  assignedTo?: string
  dueDate?: string
  completedDate?: string
  phase: "in_lavorazione" | "posa_in_opera" | "completato"
  cantiereId: Id<"cantieri">
  organizationId: Id<"organizations">
}

interface KanbanColumn {
  id: string
  title: string
  icon: React.ReactNode
  color: string
  tasks: Task[]
}

interface KanbanBoardProps {
  tasks: Task[]
  onStatusChange: (taskId: Id<"phaseTasks">, newStatus: "da_fare" | "in_corso" | "completato") => void
}

function KanbanCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task._id })

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition: transition || undefined,
    opacity: isDragging ? 0.5 : 1,
  }

  const priorityConfig = {
    alta: { color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/20", label: "Alta" },
    media: { color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/20", label: "Media" },
    bassa: { color: "text-green-400", bg: "bg-green-400/10", border: "border-green-400/20", label: "Bassa" },
  }

  const p = priorityConfig[task.priority]

  return (
    <div ref={setNodeRef} style={style} className={cn(
      "group rounded-lg border border-white/10 bg-white/[0.03] p-3 hover:border-white/20 hover:bg-white/[0.06] transition-all cursor-grab active:cursor-grabbing",
      isDragging && "ring-2 ring-kranely-accent/50 shadow-lg shadow-kranely-accent/10"
    )}>
      <div className="flex items-start gap-2">
        <div {...attributes} {...listeners} className="mt-0.5 opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity">
          <GripVertical className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-white truncate">{task.title}</h4>
          {task.description && <p className="text-xs text-white/50 mt-1 line-clamp-2">{task.description}</p>}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", p.bg, p.color, p.border)}>{p.label}</Badge>
            {task.assignedTo && (
              <span className="text-[10px] text-white/40">{task.assignedTo}</span>
            )}
            {task.dueDate && (
              <span className="text-[10px] text-white/40 flex items-center gap-0.5">
                <Clock className="w-2.5 h-2.5" />
                {new Date(task.dueDate).toLocaleDateString("it-IT", { day: "2-digit", month: "short" })}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function KanbanColumnComponent({ column, onStatusChange }: { column: KanbanColumn; onStatusChange: (taskId: Id<"phaseTasks">, newStatus: "da_fare" | "in_corso" | "completato") => void }) {
  const [dragOver, setDragOver] = useState(false)

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border transition-colors min-h-[400px]",
        dragOver ? "border-kranely-accent/50 bg-kranely-accent/5" : "border-white/10 bg-white/[0.02]"
      )}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={() => setDragOver(false)}
    >
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          {column.icon}
          <h3 className="text-sm font-semibold text-white">{column.title}</h3>
          <span className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded-full">{column.tasks.length}</span>
        </div>
      </div>
      <div className="flex-1 p-3 space-y-2 overflow-y-auto">
        <SortableContext items={column.tasks.map((t) => t._id)}>
          {column.tasks.map((task) => (
            <KanbanCard key={task._id} task={task} />
          ))}
        </SortableContext>
        {column.tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-white/30">
            <AlertCircle className="w-6 h-6 mb-2" />
            <p className="text-xs">Nessun task</p>
          </div>
        )}
      </div>
    </div>
  )
}

export function KanbanBoard({ tasks, onStatusChange }: KanbanBoardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const columns: KanbanColumn[] = [
    {
      id: "da_fare",
      title: "Da Fare",
      icon: <Clock className="w-4 h-4 text-blue-400" />,
      color: "blue",
      tasks: tasks.filter((t) => t.status === "da_fare"),
    },
    {
      id: "in_corso",
      title: "In Corso",
      icon: <Loader className="w-4 h-4 text-yellow-400" />,
      color: "yellow",
      tasks: tasks.filter((t) => t.status === "in_corso"),
    },
    {
      id: "completato",
      title: "Completato",
      icon: <CheckCircle2 className="w-4 h-4 text-green-400" />,
      color: "green",
      tasks: tasks.filter((t) => t.status === "completato"),
    },
  ]

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const taskId = active.id as Id<"phaseTasks">
    const targetColumnId = over.id as string

    const validStatuses = ["da_fare", "in_corso", "completato"]
    if (validStatuses.includes(targetColumnId)) {
      onStatusChange(taskId, targetColumnId as "da_fare" | "in_corso" | "completato")
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((column) => (
          <KanbanColumnComponent key={column.id} column={column} onStatusChange={onStatusChange} />
        ))}
      </div>
    </DndContext>
  )
}
