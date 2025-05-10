import React, { useState } from "react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { HeaderByAnima } from "./sections/HeaderByAnima/HeaderByAnima";
import { OverlapGroupWrapperByAnima } from "./sections/OverlapGroupWrapperByAnima";
import { OverlapWrapperByAnima } from "./sections/OverlapWrapperByAnima/OverlapWrapperByAnima";
import { ViewByAnima } from "./sections/ViewByAnima/ViewByAnima";
import { TaskDialog } from "../../components/TaskDialog";
import { DraggableTask } from "./sections/DraggableTask";

export interface Task {
  id: number;
  subject: string;
  description: string;
  assignedBy: string;
  priority: string;
  dueDate: string;
  status: 'assigned' | 'inProgress' | 'completed';
}

export const Desktop = (): JSX.Element => {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 1,
      subject: "Функциональное программирование",
      description: "Изучить синтаксис языка Haskell",
      assignedBy: "Бождай А.С.",
      priority: "высокий",
      dueDate: "15.05.25",
      status: 'assigned'
    },
    {
      id: 2,
      subject: "ООП",
      description: "Прочитать теорию по делегатам в С#",
      assignedBy: "Подмарькова Е.М.",
      priority: "средний",
      dueDate: "23.05.25",
      status: 'assigned'
    },
    {
      id: 3,
      subject: "Информационные технологии",
      description: "Выполнить лабораторную работу №2",
      assignedBy: "Бождай А.С.",
      priority: "высокий",
      dueDate: "5.05.25",
      status: 'inProgress'
    },
    {
      id: 4,
      subject: "Экономика",
      description: "Подготовка к зачету",
      assignedBy: "Влазнева С.А.",
      priority: "средний",
      dueDate: "05.04.25",
      status: 'completed'
    },
  ]);

  const [activeId, setActiveId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(Number(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setTasks(tasks.map(task => {
        if (task.id === Number(active.id)) {
          return {
            ...task,
            status: over.id as 'assigned' | 'inProgress' | 'completed'
          };
        }
        return task;
      }));
    }
    
    setActiveId(null);
  };

  return (
    <div className="flex justify-center w-full min-h-screen bg-transparent">
      <div className="w-full">
        <div className="flex flex-col w-full h-full bg-[#eae7dc] min-h-screen">
          <HeaderByAnima onNewTask={() => setIsDialogOpen(true)} />
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex flex-row justify-between gap-6 px-6 py-4 h-[calc(100vh-120px)]">
              <div className="flex-1 min-w-0">
                <OverlapGroupWrapperByAnima
                  tasks={tasks.filter(task => task.status === 'assigned')}
                  activeId={activeId}
                  onAddTask={() => setIsDialogOpen(true)}
                />
              </div>
              <div className="flex-1 min-w-0">
                <OverlapWrapperByAnima
                  tasks={tasks.filter(task => task.status === 'inProgress')}
                  activeId={activeId}
                  onAddTask={() => setIsDialogOpen(true)}
                />
              </div>
              <div className="flex-1 min-w-0">
                <ViewByAnima
                  tasks={tasks.filter(task => task.status === 'completed')}
                  activeId={activeId}
                  onAddTask={() => setIsDialogOpen(true)}
                />
              </div>
            </div>
            <DragOverlay dropAnimation={null} style={{zIndex: 9999}}>
              {activeId !== null ? (
                <DraggableTask task={tasks.find(t => t.id === activeId)!} activeId={activeId} />
              ) : null}
            </DragOverlay>
          </DndContext>
          <TaskDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
        </div>
      </div>
    </div>
  );
};