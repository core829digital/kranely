import React, { useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../Backend/convex/_generated/api";
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function TaskManager({ cantiereId, user }) {
  const [showDialog, setShowDialog] = useState(false);
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    status: 'da_fare',
    priority: 'media'
  });

  const tasks = useQuery(api.tasks.list, { cantiere_id: cantiereId }) || [];

  const createTask = useMutation(api.tasks.create);
  const updateTask = useMutation(api.tasks.update);
  const deleteTask = useMutation(api.tasks.remove);

  const handleCreateTask = async () => {
    await createTask({
      ...taskData,
      cantiere_id: cantiereId
    });
    setShowDialog(false);
    setTaskData({ title: '', description: '', status: 'da_fare', priority: 'media' });
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const newStatus = result.destination.droppableId;
    updateTask({ id: result.draggableId, data: { status: newStatus } });
  };

  const columns = [
    { id: 'da_fare', label: 'Da Fare', color: 'border-gray-500/30' },
    { id: 'in_corso', label: 'In Corso', color: 'border-[#FFC703]/20' },
    { id: 'completato', label: 'Completato', color: 'border-green-500/30' }
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-[#f8f9fa]">Task</h3>
        <Button onClick={() => setShowDialog(true)} size="sm" className="bg-[#FFC703]">
          <Plus size={16} className="mr-1" />
          Nuovo Task
        </Button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {columns.map((column) => {
            const columnTasks = tasks.filter(t => t.status === column.id);
            return (
              <Droppable key={column.id} droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`rounded-xl p-3 min-h-[200px] ${snapshot.isDraggingOver ? 'bg-[#495057]/50' : 'bg-[#343a40]/20'
                      } border-2 ${column.color}`}
                  >
                    <div className="text-sm font-medium text-[#f8f9fa] mb-3">
                      {column.label} ({columnTasks.length})
                    </div>
                    <div className="space-y-2">
                      {columnTasks.map((task, index) => (
                        <Draggable key={task._id} draggableId={task._id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <Card className="bg-[#495057]/50 border-[#f8f9fa]/10">
                                <CardContent className="p-3">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="font-medium text-[#f8f9fa] text-sm">{task.title}</div>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => deleteTask({ id: task._id })}
                                      className="h-6 w-6 text-red-400"
                                    >
                                      <Trash2 size={12} />
                                    </Button>
                                  </div>
                                  {task.description && (
                                    <p className="text-xs text-[#adb5bd] mb-2">{task.description}</p>
                                  )}
                                  <div className="flex items-center gap-2 text-xs">
                                    <span className={`px-2 py-0.5 rounded ${task.priority === 'alta' ? 'bg-red-500/20 text-red-300' :
                                      task.priority === 'media' ? 'bg-yellow-500/20 text-yellow-300' :
                                        'bg-[#FFC703]/20 text-[#FFC703]'
                                      }`}>
                                      {task.priority}
                                    </span>
                                    {task.scadenza && (
                                      <span className="text-[#6c757d]">{task.scadenza}</span>
                                    )}
                                  </div>
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
            );
          })}
        </div>
      </DragDropContext>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#343a40] border-[#f8f9fa]/20">
          <DialogHeader>
            <DialogTitle className="text-[#f8f9fa]">Nuovo Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-[#dee2e6]">Titolo</Label>
              <Input
                value={taskData.title}
                onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
                className="bg-[#495057] border-[#f8f9fa]/20 text-[#f8f9fa]"
              />
            </div>
            <div>
              <Label className="text-[#dee2e6]">Descrizione</Label>
              <Input
                value={taskData.description}
                onChange={(e) => setTaskData({ ...taskData, description: e.target.value })}
                className="bg-[#495057] border-[#f8f9fa]/20 text-[#f8f9fa]"
              />
            </div>
            <div>
              <Label className="text-[#dee2e6]">Priorità</Label>
              <Select value={taskData.priority} onValueChange={(v) => setTaskData({ ...taskData, priority: v })}>
                <SelectTrigger className="bg-[#495057] border-[#f8f9fa]/20 text-[#f8f9fa]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bassa">Bassa</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreateTask} className="w-full">
              Crea Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
