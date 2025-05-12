import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Paperclip } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface User {
  user_id: number;
  name: string;
  role: string;
}

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FileItem {
  name: string;
  size: string;
}

export function TaskDialog({ open, onOpenChange }: TaskDialogProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('http://localhost:8000/users');
        if (!response.ok) throw new Error('Failed to fetch users');
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    if (open) {
      fetchUsers();
    }
  }, [open]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(event.target.files || []).map(file => ({
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB'
    }));
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (fileName: string) => {
    setFiles(files.filter(file => file.name !== fileName));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const taskData = {
        title,
        description,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        user_ids: selectedUser ? [parseInt(selectedUser)] : [],
      };
      const response = await fetch('http://localhost:8000/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });
      if (!response.ok) throw new Error('Ошибка при создании задачи');
      setTitle('');
      setDescription('');
      setDeadline('');
      setFiles([]);
      setSelectedUser('');
      onOpenChange(false);
    } catch (e) {
      alert('Ошибка при создании задачи');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#EAE7DC] w-[500px] max-h-[90vh] rounded-lg border-black border overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-bold">Добавление задачи</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
          <div>
            <div className="mb-2 text-sm">Название задачи</div>
            <Input
              className="w-full border border-black bg-white"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>
          
          <div>
            <div className="mb-2 text-sm">Описание задачи</div>
            <textarea
              className="w-full h-32 border border-black rounded-md bg-white p-2 resize-none focus:outline-none focus:ring-2 focus:ring-gray-400"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          
          <div>
            <div className="mb-2 text-sm">Прикрепить файл</div>
            <div 
              className="flex flex-wrap gap-2 w-full min-h-[42px] border border-black rounded-md bg-white p-2 cursor-pointer hover:bg-gray-50"
              onClick={() => fileInputRef.current?.click()}
            >
              {files.length === 0 ? (
                <div className="flex items-center gap-2">
                  <Paperclip className="h-5 w-5 text-gray-500" />
                  <span className="text-gray-500">Нажмите, чтобы загрузить файл</span>
                </div>
              ) : (
                files.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 bg-gray-100 rounded px-2 py-1">
                    <Paperclip className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{file.name}</span>
                    <span className="text-xs text-gray-500">({file.size})</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(file.name);
                      }}
                      className="text-gray-500 hover:text-gray-700 ml-1"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
              multiple
            />
          </div>
          
          <div>
            <div className="mb-2 text-sm">Дата окончания</div>
            <Input
              type="date"
              className="w-full border border-black bg-white"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
            />
          </div>
          
          <div>
            <div className="mb-2 text-sm">Назначить</div>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="w-full border-black bg-white">
                <SelectValue placeholder="Выбрать пользователя" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.user_id} value={user.user_id.toString()}>
                    {user.name} ({user.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="px-4 py-3 mt-2">
          <Button
            type="button"
            className="w-full bg-black text-white hover:bg-gray-800"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Сохраняем...' : 'Сохранить'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}