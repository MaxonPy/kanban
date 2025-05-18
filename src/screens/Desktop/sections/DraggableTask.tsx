import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { FastForwardIcon, InfoIcon, Trash2Icon } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Task } from '../Desktop';
import { Button } from "../../../components/ui/button";

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
        <div className="absolute top-2 right-2 flex gap-2">
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 p-0 flex items-center justify-center hover:bg-red-50 group"
              onClick={handleDelete}
            >
              <Trash2Icon className="h-5 w-5 text-red-400 group-hover:text-red-600 transition-colors" />
            </Button>
            <InfoIcon className="w-5 h-5 text-gray-400" />
          </div>
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