import { SettingsIcon } from "lucide-react";
import React from "react";
import { useDroppable } from '@dnd-kit/core';
import { Button } from "../../../../components/ui/button";
import { Task } from "../../Desktop";
import { DraggableTask } from "../DraggableTask";

interface Props {
  tasks: Task[];
  activeId: number | null;
  onAddTask: () => void;
}

export const ViewByAnima = ({ tasks, activeId, onAddTask }: Props): JSX.Element => {
  const { setNodeRef } = useDroppable({
    id: 'completed',
  });

  return (
    <div className="w-full shadow-[0px_4px_4px_#000000]" ref={setNodeRef}>
      <div className="relative bg-[#ccf2cb] rounded-[9px] border border-solid border-black shadow-[0px_4px_4px_#00000040] p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="[font-family:'Poppins',Helvetica] font-bold text-black text-xl tracking-[-0.40px] leading-[20.0px]">
            ВЫПОЛНЕНО
          </div>
          <SettingsIcon className="w-6 h-6" />
        </div>

        <div className="space-y-4">
          {tasks.map((task) => (
            <DraggableTask key={task.id} task={task} activeId={activeId} />
          ))}
        </div>

        <Button 
          className="w-full h-[42px] mt-4 bg-[#c4c6c8] rounded-[7px] border border-solid border-black text-black hover:bg-[#b4b6b8]"
          onClick={onAddTask}
        >
          <div className="[font-family:'Poppins',Helvetica] font-bold text-black text-base text-center tracking-[-0.32px] leading-[16.0px]">
            Добавить задачу
          </div>
        </Button>
      </div>
    </div>
  );
};