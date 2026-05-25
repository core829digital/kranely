import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Euro, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const STATUS_CONFIG = {
  bozza: { label: 'Bozza', color: 'bg-gray-500/20 border-gray-500/30 text-gray-300' },
  revisione_interna: { label: 'Revisione Interna', color: 'bg-blue-500/20 border-blue-500/30 text-blue-300' },
  attesa_cliente: { label: 'Attesa Cliente', color: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300' },
  approvato: { label: 'Approvato', color: 'bg-green-500/20 border-green-500/30 text-green-300' },
  rifiutato: { label: 'Rifiutato', color: 'bg-red-500/20 border-red-500/30 text-red-300' }
};

export default function KanbanBoard({ preventivi, onDragEnd, onCardClick }) {
  const columns = Object.keys(STATUS_CONFIG);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
        {columns.map((status) => {
          const items = preventivi.filter(p => p.status === status);
          const config = STATUS_CONFIG[status];

          return (
            <div key={status} className="flex flex-col">
              <div className="mb-3 px-2">
                <h3 className="text-sm font-medium text-[#f8f9fa] mb-1">{config.label}</h3>
                <div className="text-xs text-[#adb5bd]">{items.length} preventivi</div>
              </div>

              <Droppable droppableId={status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 rounded-xl p-2 sm:p-3 transition-all min-h-[200px] sm:min-h-[300px] lg:min-h-[400px] ${
                      snapshot.isDraggingOver 
                        ? 'bg-[#495057]/50 border-2 border-[#f8f9fa]/30' 
                        : 'bg-[#343a40]/20 border-2 border-transparent'
                    }`}
                  >
                    <div className="space-y-3">
                      {items.map((preventivo, index) => (
                        <Draggable key={preventivo.id} draggableId={preventivo.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => onCardClick(preventivo)}
                              className={`cursor-pointer transition-all ${
                                snapshot.isDragging ? 'rotate-2 scale-105' : ''
                              }`}
                            >
                              <Card className={`${config.color} border hover:bg-opacity-30 transition-all`}>
                                <CardContent className="p-4 space-y-3">
                                  <div>
                                    <h4 className="font-medium text-[#f8f9fa] mb-1">{preventivo.title}</h4>
                                    <p className="text-xs text-[#dee2e6]">{preventivo.cliente}</p>
                                  </div>

                                  <div className="flex items-center gap-2 text-[#f8f9fa]">
                                    <Euro size={14} />
                                    <span className="text-sm font-medium">
                                      €{preventivo.importo?.toLocaleString() || '0'}
                                    </span>
                                  </div>

                                  {preventivo.assegnato_a && (
                                    <div className="flex items-center gap-2 text-xs text-[#adb5bd]">
                                      <User size={12} />
                                      <span>{preventivo.assegnato_a}</span>
                                    </div>
                                  )}

                                  {preventivo.scadenza && (
                                    <div className="flex items-center gap-2 text-xs">
                                      <Clock size={12} />
                                      <span className={
                                        new Date(preventivo.scadenza) < new Date() 
                                          ? 'text-red-400' 
                                          : 'text-[#adb5bd]'
                                      }>
                                        {format(new Date(preventivo.scadenza), 'dd MMM', { locale: it })}
                                      </span>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}