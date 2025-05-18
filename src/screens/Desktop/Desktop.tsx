import React, { useState, useEffect, useRef } from "react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { HeaderByAnima } from "./sections/HeaderByAnima/HeaderByAnima";
import { OverlapGroupWrapperByAnima } from "./sections/OverlapGroupWrapperByAnima";
import { OverlapWrapperByAnima } from "./sections/OverlapWrapperByAnima/OverlapWrapperByAnima";
import { ViewByAnima } from "./sections/ViewByAnima/ViewByAnima";
import { TaskDialog } from "../../components/TaskDialog";
import { DraggableTask } from "./sections/DraggableTask";
import { useAuth } from '../../lib/auth/AuthContext';

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
  const { userType, currentUser } = useAuth();

  const fetchTasks = async () => {
    if (!selectedGroup) return;
    try {
      let response, data;
      if (userType === 'student' && currentUser) {
        response = await fetch(`http://localhost:8000/users_tasks/${currentUser.user_id}`);
        data = await response.json();
        // data — массив задач, назначенных студенту
      } else {
        response = await fetch(`http://localhost:8000/tasks/group/${selectedGroup.id}`);
        data = await response.json();
      }
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

  const fetchTasksRef = useRef(fetchTasks);

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

  useEffect(() => {
    fetchTasksRef.current = fetchTasks;
  }, [fetchTasks]);

  // Автоматически выбираем группу 21ВА1 для студента
  useEffect(() => {
    if (userType === 'student' && !selectedGroup) {
      setSelectedGroup({ id: 1, name: '21ВА1' });
    }
  }, [userType, selectedGroup]);

  useEffect(() => {
    if (userType && currentUser) {
      let ws: WebSocket | null = null;
      let reconnectAttempts = 0;
      const maxReconnectAttempts = 5;
      const reconnectDelay = 3000; // 3 seconds

      const connectWebSocket = () => {
        try {
          ws = new WebSocket('ws://localhost:8000/ws/tasks');
          
          ws.onopen = () => {
            console.log('WebSocket connection established');
            reconnectAttempts = 0; // Reset reconnect attempts on successful connection
          };

          ws.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              if (
                ['new_task', 'delete_task', 'update_status'].includes(data.event) &&
                data.user_id === currentUser.user_id
              ) {
                if (data.timestamp) {
                  const now = Date.now();
                  const delay = now - data.timestamp;
                  console.log(`WS задержка (мс):`, delay);
                }
                fetchTasksRef.current();
              }
            } catch (error) {
              console.error('Error parsing WebSocket message:', error);
            }
          };

          ws.onerror = (error) => {
            console.error('WebSocket error:', error);
          };

          ws.onclose = () => {
            console.log('WebSocket connection closed');
            if (reconnectAttempts < maxReconnectAttempts) {
              reconnectAttempts++;
              console.log(`Attempting to reconnect (${reconnectAttempts}/${maxReconnectAttempts})...`);
              setTimeout(connectWebSocket, reconnectDelay);
            } else {
              console.error('Max reconnection attempts reached');
            }
          };
        } catch (error) {
          console.error('Error creating WebSocket connection:', error);
        }
      };

      connectWebSocket();

      return () => {
        if (ws) {
          ws.close();
        }
      };
    }
  }, [userType, currentUser]);

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

      // 1. Сразу обновляем UI (оптимистично)
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === activeTask.id ? { ...task, status: newStatus } : task
        )
      );

      try {
        await fetch(`http://localhost:8000/tasks/${activeTask.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: newStatus === 'assigned' ? 'todo' : newStatus === 'inProgress' ? 'in_progress' : 'done',
          }),
        });
        // Можно ничего не делать — WebSocket обновит, если что-то изменится на сервере
      } catch (error) {
        // 2. Если ошибка — откатываем UI обратно
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === activeTask.id ? { ...task, status: activeTask.status } : task
          )
        );
        console.error('Ошибка при обновлении статуса задачи:', error);
      }
    }
    setActiveId(null);
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Оптимистичное обновление UI
        setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
      } else {
        console.error('Ошибка при удалении задачи');
      }
    } catch (error) {
      console.error('Ошибка при удалении задачи:', error);
    }
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
                onDeleteTask={handleDeleteTask}
              />
              <OverlapWrapperByAnima
                tasks={getFilteredTasks('inProgress')}
                activeId={activeId}
                onAddTask={handleAddTask}
                onDeleteTask={handleDeleteTask}
              />
              <ViewByAnima
                tasks={getFilteredTasks('completed')}
                activeId={activeId}
                onAddTask={handleAddTask}
                onDeleteTask={handleDeleteTask}
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