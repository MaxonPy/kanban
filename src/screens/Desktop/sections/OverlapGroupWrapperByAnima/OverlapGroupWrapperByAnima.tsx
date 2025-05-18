import { FastForwardIcon, InfoIcon, SettingsIcon } from "lucide-react";
import React from "react";
import { useDroppable } from '@dnd-kit/core';
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";
import { Task } from "../../Desktop";
import { DraggableTask } from "../DraggableTask";
import { useAuth } from '../../../../lib/auth/AuthContext';
import { PencilIcon } from 'lucide-react';

interface Props {
  tasks: Task[];
  activeId: number | null;
  onAddTask: () => void;
  onDeleteTask: (taskId: number) => void;
}

export const OverlapGroupWrapperByAnima = ({ tasks, activeId, onAddTask, onDeleteTask }: Props): JSX.Element => {
  const { userType } = useAuth();
  const { setNodeRef } = useDroppable({
    id: 'assigned',
  });

  return (
    <div className="relative w-full shadow-[0px_6px_16px_#00000022] rounded-[16px] overflow-hidden border border-solid border-black bg-gradient-to-b from-[#e8bcbc] to-[#f5dada] flex flex-col" ref={setNodeRef}>
      <div className="relative p-6 flex flex-col flex-grow">
        <div className="flex items-center mb-2">
          <span className="mr-2 text-2xl">📝</span>
          <h2 className="font-bold text-2xl tracking-[-0.40px] font-['Poppins',Helvetica] text-[#2d1c1c]">НАЗНАЧЕНО</h2>
          <SettingsIcon className="w-6 h-6 ml-auto" />
        </div>
        <div className="h-1 w-full bg-gradient-to-r from-[#e57373] to-[#f5dada] rounded mb-4" />
        <div className="flex flex-col gap-5 flex-1">
          {tasks.length === 0 ? (
            <div className="flex flex-1 items-center justify-center text-gray-400 italic text-lg">Нет задач</div>
          ) : (
            tasks.map((task) => (
              <DraggableTask 
                key={task.id} 
                task={task} 
                activeId={activeId} 
                onDelete={onDeleteTask}
                shadow
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};