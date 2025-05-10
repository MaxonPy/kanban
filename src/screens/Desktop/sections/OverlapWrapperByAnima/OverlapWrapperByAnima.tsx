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

export const OverlapWrapperByAnima = ({ tasks, activeId, onAddTask }: Props): JSX.Element => {
  const { setNodeRef } = useDroppable({
    id: 'inProgress',
  });

  return (
    <div className="relative w-full shadow-[0px_4px_4px_#333a43]" ref={setNodeRef}>
      <div className="relative bg-[#edf2c0] rounded-[9px] border border-solid border-black shadow-[0px_4px_4px_#00000040] p-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-bold text-xl tracking-[-0.40px] font-['Poppins',Helvetica] text-[#040000]">
            В ПРОЦЕССЕ
          </h2>
          <Button variant="ghost" size="icon" className="p-0">
            <SettingsIcon className="w-6 h-6" />
          </Button>
        </div>

        <div className="space-y-4">
          {tasks.map((task) => (
            <DraggableTask key={task.id} task={task} activeId={activeId} />
          ))}
        </div>

        <Button 
          className="w-full mt-4 bg-[#c4c6c8] text-black rounded-[7px] border border-solid border-black hover:bg-[#b4b6b8]"
          onClick={onAddTask}
        >
          <span className="font-['Poppins',Helvetica] font-bold text-base tracking-[-0.32px] leading-[16px]">
            Добавить задачу
          </span>
        </Button>
      </div>
    </div>
  );
};