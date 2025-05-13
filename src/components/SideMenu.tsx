import React, { useEffect, useState } from 'react';
import { cn } from '../lib/utils';

interface Group {
  group_id: number;
  name: string;
  description: string;
  created_at: string;
}

interface SideMenuProps {
  isOpen: boolean;
  selectedGroup: string;
  onGroupSelect: (group: { id: number; name: string }) => void;
  onClose: () => void;
}

export const SideMenu: React.FC<SideMenuProps> = ({
  isOpen,
  selectedGroup,
  onGroupSelect,
  onClose,
}) => {
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await fetch('http://localhost:8000/groups');
        const data = await response.json();
        setGroups(data);
      } catch (error) {
        console.error('Ошибка при загрузке групп:', error);
      }
    };

    fetchGroups();
  }, []);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}
      
      {/* Side Menu */}
      <div
        className={cn(
          'fixed left-0 top-0 h-full w-64 bg-[#f5f5dc] border-r border-black shadow-lg transform transition-transform duration-300 ease-in-out z-50',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">Группы</h2>
          <div className="space-y-2">
            {groups.map((group) => (
              <button
                key={group.group_id}
                onClick={() => onGroupSelect({ id: group.group_id, name: group.name })}
                className={cn(
                  'w-full text-left px-4 py-2 rounded-lg transition-colors',
                  selectedGroup === group.name
                    ? 'bg-[#eae7dc] border border-black'
                    : 'hover:bg-[#eae7dc]'
                )}
              >
                {group.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}; 