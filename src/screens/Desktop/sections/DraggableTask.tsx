import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { FastForwardIcon, InfoIcon } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Task } from '../Desktop';

interface Props {
  task: Task;
  activeId: number | null;
}

export const DraggableTask = ({ task, activeId }: Props): JSX.Element => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: activeId === task.id ? 0.5 : 1,
  } : undefined;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-lg border border-solid border-black cursor-move relative"
      {...attributes}
      {...listeners}
    >
      <CardContent className="p-2">
        <div className="flex flex-col gap-[11px]">
          <div className="[font-family:'Poppins',Helvetica] font-bold text-black text-[13px] tracking-[-0.26px] leading-[13.0px] whitespace-nowrap">
            {task.subject}
          </div>
          <div className="[font-family:'Poppins',Helvetica] font-normal text-black text-[13px] tracking-[-0.26px] leading-[13.0px] whitespace-nowrap">
            {task.description}
          </div>
          <div className="[font-family:'Poppins',Helvetica] font-normal text-black text-[11px] tracking-[-0.22px] leading-[11.0px]">
            Назначено: {task.assignedBy}
          </div>
          <div className="[font-family:'Poppins',Helvetica] font-bold text-black text-[11px] tracking-[-0.22px] leading-[11.0px]">
            Приоритет: {task.priority}
          </div>
        </div>
        <div className="absolute top-2 right-2">
          <InfoIcon className="w-[22px] h-[22px]" />
        </div>
        <div className="absolute bottom-2 right-2 flex items-center">
          <FastForwardIcon className="w-3.5 h-3 mr-1" />
          <span className="[font-family:'Poppins',Helvetica] font-normal text-black text-[11px] tracking-[-0.22px] leading-[11.0px]">
            {task.dueDate}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};