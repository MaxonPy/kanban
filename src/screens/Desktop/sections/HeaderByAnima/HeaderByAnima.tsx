import { SearchIcon } from "lucide-react";
import React from "react";
import { Avatar } from "../../../../components/ui/avatar";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Separator } from "../../../../components/ui/separator";
import { SideMenu } from "../../../../components/SideMenu";
import { useAuth } from '../../../../lib/auth/AuthContext';

interface HeaderByAnimaProps {
  onNewTask: () => void;
  selectedGroup: string;
  onGroupSelect: (group: { id: number; name: string }) => void;
}

export const HeaderByAnima = ({ onNewTask, selectedGroup, onGroupSelect }: HeaderByAnimaProps): JSX.Element => {
  const [isSideMenuOpen, setIsSideMenuOpen] = React.useState(false);
  const { logout, userType } = useAuth();
  const roleText = userType === 'teacher' ? 'Преподаватель' : userType === 'student' ? 'Студент' : '';

  return (
    <>
      <SideMenu
        isOpen={isSideMenuOpen}
        selectedGroup={selectedGroup}
        onGroupSelect={onGroupSelect}
        onClose={() => setIsSideMenuOpen(false)}
      />
      <header className="w-full py-3 px-3 relative">
        <div className="flex flex-row items-center justify-between mb-5">
          <div className="flex space-x-3">
            {userType !== 'student' && (
            <div className="flex items-center">
              <button onClick={() => setIsSideMenuOpen(true)}>
                <img className="w-[39px] h-[37px]" alt="Grid" src="/grid-1.svg" />
              </button>
            </div>
            )}
            <div className="flex items-center">
              <img
                className="w-[39px] h-[37px]"
                alt="Calendar"
                src="/calendar-1.svg"
              />
            </div>
            <div className="flex items-center justify-center w-[47px] h-[45px] bg-[#fffafa] rounded-lg border border-solid border-black shadow-[0px_4px_4px_#00000040] transition-all duration-200 hover:bg-[#eae7dc] hover:scale-105 hover:shadow-lg cursor-pointer focus:ring-2 focus:ring-[#eae7dc]">
              <img className="w-[39px] h-[37px]" alt="Users" src="/users-1.svg" />
            </div>
          </div>

          <div className="flex-1 mx-5">
            <div className="relative">
              <Input
                className="h-[41px] pl-2 pr-10 font-bold text-sm text-[#bbbbbb] border border-solid border-black rounded-lg"
                placeholder="Поиск задач, проектов и уведомлений"
              />
              <SearchIcon className="absolute w-[15px] h-4 top-3 right-3 text-gray-500" />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {userType !== 'student' && (
            <Button
              className="h-[41px] w-[160px] bg-[#f5f5dc] text-black font-bold text-base border border-solid border-black rounded-lg shadow transition-all duration-200 hover:bg-[#eae7dc] hover:scale-105 hover:shadow-lg focus:ring-2 focus:ring-[#eae7dc]"
              onClick={onNewTask}
            >
              НОВАЯ ЗАДАЧА
            </Button>
            )}
            {roleText && (
              <div className="flex items-center bg-white px-3 py-1 rounded-lg border border-solid border-black text-black font-semibold text-sm">
                {roleText}
              </div>
            )}
            <Avatar className="w-[42px] h-[42px]">
              <img
                className="w-full h-full object-cover"
                alt="Profile"
                src="/profile.png"
              />
            </Avatar>
            <button className="flex items-center" onClick={logout} title="Выйти">
              <img className="w-10 h-[37px]" alt="Log out" src="/log-out-1.svg" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-2">
          <div className="font-bold text-xl text-[#202733] tracking-[-0.40px]">
            {selectedGroup ? `Группа ${selectedGroup}` : 'Выберите группу'}
          </div>

          <div className="flex items-center space-x-5">
            <div className="flex items-center">
              <span className="font-bold text-[15px] tracking-[-0.30px] mr-2">
                Фильтровать по
              </span>
              <img
                className="w-[18px] h-[17px]"
                alt="Filter dropdown"
                src="/------------.svg"
              />
            </div>

            <div className="flex items-center">
              <span className="font-bold text-[15px] tracking-[-0.30px] mr-2">
                Группировать по
              </span>
              <img
                className="w-[22px] h-3.5"
                alt="Group dropdown"
                src="/------------.svg"
              />
            </div>
          </div>
        </div>

        <Separator className="w-full h-[1px] bg-black" />
      </header>
    </>
  );
};