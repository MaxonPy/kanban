import { SettingsIcon } from "lucide-react";
import React from "react";
import { useDroppable } from '@dnd-kit/core';
import { Button } from "../../../../components/ui/button";
import { Task } from "../../Desktop";
import { DraggableTask } from "../DraggableTask";
import { useAuth } from '../../../../lib/auth/AuthContext';

interface Props {
  tasks: Task[];
  activeId: number | null;
  onAddTask: () => void;
  onDeleteTask: (taskId: number) => void;
}

export const ViewByAnima = ({ tasks, activeId, onAddTask, onDeleteTask }: Props): JSX.Element => {
  const { userType } = useAuth();
  const { setNodeRef } = useDroppable({
    id: 'completed',
  });

  return (
    <div className="w-full shadow-[0px_6px_16px_#00000022] rounded-[16px] overflow-hidden border border-solid border-black bg-gradient-to-b from-[#b8e6b8] to-[#d6f5d6] flex flex-col" ref={setNodeRef}>
      <div className="relative p-6 flex flex-col flex-grow">
        <div className="flex items-center mb-2">
          <span className="mr-2 text-2xl">✅</span>
          <h2 className="font-bold text-2xl tracking-[-0.40px] font-['Poppins',Helvetica] text-[#1c2d1c]">ВЫПОЛНЕНО</h2>
          <SettingsIcon className="w-6 h-6 ml-auto" />
        </div>
        <div className="h-1 w-full bg-gradient-to-r from-[#4ac47a] to-[#d6f5d6] rounded mb-4" />
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