import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { FastForwardIcon, InfoIcon, Trash2Icon } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Task } from '../Desktop';
import { Button } from "../../../components/ui/button";
import { useAuth } from '../../../lib/auth/AuthContext';

interface Props {
  task: Task;
  activeId: number | null;
  onDelete?: (taskId: number) => void;
  shadow?: boolean;
}

export const DraggableTask = ({ task, activeId, onDelete, shadow }: Props): JSX.Element => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
  });
  const { userType } = useAuth();

  const style = {
    ...(transform ? {
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      opacity: activeId === task.id ? 0.5 : 1,
    } : {}),
    ...(shadow ? {
      boxShadow: '0 4px 16px 0 rgba(0,0,0,0.10), 0 1.5px 4px 0 rgba(0,0,0,0.08)'
    } : {})
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(task.id);
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="bg-white border border-black rounded-xl shadow-sm cursor-move relative transition-all duration-200 hover:shadow-md"
      {...attributes}
      {...listeners}
    >
      <CardContent className="p-4 flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          <div className="font-bold text-base text-black truncate">{task.subject}</div>
          <div className="text-sm text-gray-700 break-words whitespace-pre-line">{task.description}</div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-400">
            {userType === 'teacher'
              ? <>Выполняет: <span className="text-gray-700 font-medium">{task.executorName}</span></>
              : <>Назначено: <span className="text-gray-700 font-medium">{task.assignedBy}</span></>
            }
          </span>
          <span className="text-xs text-gray-400">Приоритет: <span className="text-gray-700 font-medium">{task.priority}</span></span>
        </div>
        {Array.isArray(task.assigned_files) && task.assigned_files.length > 0 && (
          <div className="mt-1">
            <span className="text-xs text-[#2563eb] font-semibold">Файлы:</span>
            <ul className="list-disc ml-4">
              {task.assigned_files.map((fileUrl, idx) => (
                <li key={idx}>
                  <a
                    href={`http://localhost:8000${fileUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline text-xs"
                    download
                  >
                    {decodeURIComponent(fileUrl.split('/').pop() || 'Файл')}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="absolute right-2 top-2 flex items-center gap-1.5 z-10">
          {userType === 'teacher' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 p-0 flex items-center justify-center hover:bg-red-50 group"
              onClick={handleDelete}
            >
              <Trash2Icon className="h-8 w-8 text-red-400 group-hover:text-red-600 transition-colors" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 p-0 flex items-center justify-center hover:bg-gray-100 group"
            onClick={() => {/* TODO: handle info click, e.g., open details modal */}}
          >
            <InfoIcon className="h-8 w-8 text-gray-400 group-hover:text-blue-500 transition-colors" />
          </Button>
        </div>
        <div className="absolute right-4 bottom-2 flex items-center gap-0.5 z-10">
          <FastForwardIcon className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-bold text-blue-600 tracking-wide -mt-0.5 relative">{task.dueDate}</span>
        </div>
      </CardContent>
    </Card>
  );
};