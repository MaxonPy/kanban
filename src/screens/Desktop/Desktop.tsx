import React, { useState, useEffect } from "react";
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
  group_id: number;
  group_name: string;
}

export const Desktop = (): JSX.Element => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<Record<number, string>>({});
  const [activeId, setActiveId] = useState<number | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<{ id: number; name: string } | null>(null);

  const fetchTasks = async () => {
    if (!selectedGroup) return;
    
    try {
      const response = await fetch(`http://localhost:8000/tasks/group/${selectedGroup.id}`);
      const data = await response.json();
      const mappedTasks = data.map((task: any) => ({
        id: task.task_id,
        subject: task.title,
        description: task.description || '',
        assignedBy: users[task.assigner_id] || 'Неизвестно',
        priority: task.priority || 'средний',
        dueDate: task.deadline ? new Date(task.deadline).toLocaleDateString() : 'Нет срока',
        status: typeof task.status === 'string' && task.status.toLowerCase() === 'todo'
          ? 'assigned'
          : typeof task.status === 'string' && task.status.toLowerCase() === 'in_progress'
            ? 'inProgress'
            : 'completed',
        group_id: task.group_id,
        group_name: selectedGroup.name
      }));
      setTasks(mappedTasks);
    } catch (error) {
      console.error('Ошибка при загрузке задач:', error);
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('http://localhost:8000/users');
        const data = await response.json();
        const userMap: Record<number, string> = {};
        data.forEach((user: any) => {
          userMap[user.user_id] = user.name;
        });
        setUsers(userMap);
      } catch (error) {
        console.error('Ошибка при загрузке пользователей:', error);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      fetchTasks();
    }
  }, [selectedGroup]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const activeTask = tasks.find((task) => task.id === active.id);
      if (!activeTask) return;

      let newStatus: Task['status'] = 'assigned';
      if (over.id === 'inProgress') newStatus = 'inProgress';
      if (over.id === 'completed') newStatus = 'completed';

      const movedTask = {
        ...activeTask,
        status: newStatus,
      };

      // Оптимистичное обновление UI
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === movedTask.id ? movedTask : task
        )
      );

      try {
        // Отправляем обновление на сервер
        await fetch(`http://localhost:8000/tasks/${activeTask.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: newStatus === 'assigned' ? 'todo' : newStatus === 'inProgress' ? 'in_progress' : 'done',
          }),
        });

        // Обновляем данные с сервера после успешного обновления
        await fetchTasks();
      } catch (error) {
        console.error('Ошибка при обновлении статуса задачи:', error);
        // В случае ошибки возвращаем предыдущее состояние
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === movedTask.id 
              ? { ...task, status: movedTask.status }
              : task
          )
        );
      }
    }
    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const getFilteredTasks = (status: Task['status']) => {
    return tasks.filter((task) => task.status === status);
  };

  const handleAddTask = () => {
    setIsTaskDialogOpen(true);
  };

  const handleCloseTaskDialog = () => {
    setIsTaskDialogOpen(false);
  };

  const handleGroupSelect = (group: { id: number; name: string }) => {
    setSelectedGroup(group);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f5dc]">
      <HeaderByAnima 
        onNewTask={handleAddTask} 
        selectedGroup={selectedGroup?.name || ''}
        onGroupSelect={handleGroupSelect}
      />
      <div className="flex-1 p-6">
        {selectedGroup ? (
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div className="grid grid-cols-3 gap-6">
              <OverlapGroupWrapperByAnima
                tasks={getFilteredTasks('assigned')}
                activeId={activeId}
                onAddTask={handleAddTask}
              />
              <OverlapWrapperByAnima
                tasks={getFilteredTasks('inProgress')}
                activeId={activeId}
                onAddTask={handleAddTask}
              />
              <ViewByAnima
                tasks={getFilteredTasks('completed')}
                activeId={activeId}
                onAddTask={handleAddTask}
              />
            </div>
            <DragOverlay>
              {activeId ? (
                <DraggableTask
                  task={tasks.find((task) => task.id === activeId)!}
                  activeId={activeId}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-xl text-gray-500">Выберите группу для просмотра задач</p>
          </div>
        )}
      </div>
      <TaskDialog 
        open={isTaskDialogOpen} 
        onOpenChange={setIsTaskDialogOpen} 
        onTaskCreated={fetchTasks}
        selectedGroup={selectedGroup}
      />
    </div>
  );
};