import { FastForwardIcon, InfoIcon, SettingsIcon } from "lucide-react";
import React from "react";
import { useDroppable } from '@dnd-kit/core';
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";
import { Task } from "../../Desktop";
import { DraggableTask } from "../DraggableTask";

interface Props {
  tasks: Task[];
  activeId: number | null;
  onAddTask: () => void;
}

export const OverlapGroupWrapperByAnima = ({ tasks, activeId, onAddTask }: Props): JSX.Element => {
  const { setNodeRef } = useDroppable({
    id: 'assigned',
  });

  return (
    <div className="relative w-full shadow-[0px_4px_4px_#000000] rounded-[9px]" ref={setNodeRef}>
      <div className="relative bg-[#ecbebe] rounded-[9px] border border-solid border-black p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="[-webkit-text-stroke:1px_#000000] [font-family:'Poppins',Helvetica] font-normal text-black text-xl text-center tracking-[0] leading-5 whitespace-nowrap">
            НАЗНАЧЕНО
          </div>
          <SettingsIcon className="w-6 h-6" />
        </div>

        <div className="flex flex-col gap-3">
          {tasks.map((task) => (
            <DraggableTask key={task.id} task={task} activeId={activeId} />
          ))}
        </div>

        <Button 
          className="w-full h-[42px] mt-4 bg-[#c4c6c8] rounded-[7px] border border-solid border-black text-black hover:bg-[#b4b6b8]"
          onClick={onAddTask}
        >
          <span className="[font-family:'Poppins',Helvetica] font-bold text-black text-base text-center tracking-[-0.32px] leading-[16.0px]">
            Добавить задачу
          </span>
        </Button>
      </div>
    </div>
  );
};