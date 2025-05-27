import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useAuth } from '../lib/auth/AuthContext';
import { CalendarIcon, UserIcon, FlagIcon } from 'lucide-react';

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreated: () => void;
  selectedGroup: { id: number; name: string } | null;
}

export const TaskDialog: React.FC<TaskDialogProps> = ({
  open,
  onOpenChange,
  onTaskCreated,
  selectedGroup,
}) => {
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [priority, setPriority] = React.useState('medium');
  const [dueDate, setDueDate] = React.useState('');
  const [users, setUsers] = React.useState<{ user_id: number; name: string }[]>([]);
  const [selectedUser, setSelectedUser] = React.useState<number | null>(null);
  const { userType } = useAuth();
  const [file, setFile] = React.useState<File | null>(null);
  const [fileUrl, setFileUrl] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);

  // Если пользователь не преподаватель, закрываем диалог
  React.useEffect(() => {
    if (userType !== 'teacher') {
      onOpenChange(false);
    }
  }, [userType, onOpenChange]);

  React.useEffect(() => {
    if (!open || userType !== 'teacher') return;
    fetch('http://localhost:8000/users')
      .then(res => res.json())
      .then(data => {
        const students = data.filter((u: any) => u.role === 'student');
        setUsers(students);
      });
  }, [open, userType]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (userType !== 'teacher') {
      alert('Только преподаватели могут создавать задачи');
      return;
    }

    if (!selectedGroup) {
      alert('Пожалуйста, выберите группу');
      return;
    }
    if (!selectedUser) {
      alert('Пожалуйста, выберите студента');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          priority,
          deadline: dueDate,
          status: 'todo',
          group_id: selectedGroup.id,
          assigned_files: fileUrl ? [fileUrl] : undefined,
          user_id: selectedUser,
        }),
      });

      if (response.ok) {
        const task = await response.json();
        // POST в users_tasks
        
        setTitle('');
        setDescription('');
        setPriority('medium');
        setDueDate('');
        setSelectedUser(null);
        setFile(null);
        setFileUrl(null);
        onOpenChange(false);
        onTaskCreated();
      }
    } catch (error) {
      console.error('Ошибка при создании задачи:', error);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const selectedFile = e.target.files[0];
    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    try {
      const res = await fetch('http://localhost:8000/upload-file', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setFile(selectedFile);
      setFileUrl(data.file_path);
    } catch (err) {
      alert('Ошибка загрузки файла');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFileUrl(null);
  };

  // Если пользователь не преподаватель, не показываем диалог
  if (userType !== 'teacher') {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="dialog-desc" className="max-w-xl rounded-2xl bg-gradient-to-b from-[#e0f2fe] to-[#fff] shadow-2xl p-8 border-0">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">📝</span>
            <DialogTitle className="text-2xl font-bold text-[#60a5fa] tracking-tight">Новая задача</DialogTitle>
          </div>
          <div className="h-1 w-full bg-gradient-to-r from-[#60a5fa] to-[#e0f2fe] rounded mb-4" />
        </DialogHeader>
        <p id="dialog-desc" className="text-gray-500 mb-2">
          Заполните форму для создания новой задачи. Все поля обязательны для заполнения.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="title" className="font-semibold text-base text-[#2563eb] flex items-center gap-2">
              <FlagIcon className="w-4 h-4 text-[#60a5fa]" /> Название
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="rounded-lg border border-[#60a5fa] focus:ring-2 focus:ring-[#60a5fa] shadow-sm placeholder:text-blue-300 bg-blue-50 px-4 py-2 text-base font-semibold"
              placeholder="Введите название задачи"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="description" className="font-semibold text-base text-[#2563eb]">Описание</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full min-h-[80px] rounded-lg border border-[#60a5fa] bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#60a5fa] shadow-sm placeholder:text-blue-300"
              placeholder="Опишите задачу..."
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="priority" className="font-semibold text-base text-[#2563eb]">Приоритет</label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="rounded-lg border border-[#60a5fa] focus:ring-2 focus:ring-[#60a5fa] shadow-sm">
                <SelectValue placeholder="Выберите приоритет" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Низкий</SelectItem>
                <SelectItem value="medium">Средний</SelectItem>
                <SelectItem value="high">Высокий</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="dueDate" className="font-semibold text-base text-[#2563eb] flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-[#60a5fa]" /> Срок выполнения
            </label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="rounded-lg border border-[#60a5fa] focus:ring-2 focus:ring-[#60a5fa] shadow-sm"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="assignee" className="font-semibold text-base text-[#2563eb] flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-[#60a5fa]" /> Назначить студенту
            </label>
            <Select value={selectedUser?.toString() || ''} onValueChange={v => setSelectedUser(Number(v))}>
              <SelectTrigger className="rounded-lg border border-[#60a5fa] focus:ring-2 focus:ring-[#60a5fa] shadow-sm">
                <SelectValue placeholder="Выберите студента" />
              </SelectTrigger>
              <SelectContent>
                {users.map(user => (
                  <SelectItem key={user.user_id} value={user.user_id.toString()}>{user.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="file" className="font-semibold text-base text-[#2563eb]">Прикрепить файл</label>
            <input
              id="file"
              type="file"
              onChange={handleFileChange}
              disabled={uploading}
              className="rounded-lg border border-[#60a5fa] focus:ring-2 focus:ring-[#60a5fa] shadow-sm bg-white px-3 py-2 text-sm"
            />
            {uploading && <span className="text-blue-500 text-sm">Загрузка...</span>}
            {file && fileUrl && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-green-700 text-sm">{file.name}</span>
                <button type="button" onClick={handleRemoveFile} className="text-red-500 text-xs">Удалить</button>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              type="button"
              variant="outline"
              className="rounded-lg border border-gray-300 px-6 py-2"
              onClick={() => onOpenChange(false)}
            >
              Отмена
            </Button>
            <Button type="submit" className="rounded-lg bg-[#60a5fa] text-white font-bold px-6 py-2 shadow-md hover:bg-[#2563eb] transition">
              Создать
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};