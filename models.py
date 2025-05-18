from datetime import datetime
from sqlalchemy import Column, Integer, String, Table, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
import enum

Base = declarative_base()
 

class RoleEnum(enum.Enum):
    teacher = "teacher"
    student = "student"
    admin = "admin"

class TaskStatusEnum(enum.Enum):
    todo = "todo"
    in_progress = "in_progress"
    done = "done"

class NotificationStatusEnum(enum.Enum):
    pending = "pending"
    sent = "sent"
    failed = "failed"


users_tasks_table = Table(
    "users_tasks",
    Base.metadata,
    Column("user_id", ForeignKey("users.user_id"), primary_key=True),
    Column("task_id", ForeignKey("tasks.task_id"), primary_key=True),
    Column("assigned_at", DateTime, default=datetime.now)
)

class Users(Base):
    __tablename__ = "users"
    user_id = Column(Integer, primary_key=True)
    telegram_id = Column(Integer, unique=True, nullable=False)
    name = Column(String, nullable=False)
    role = Column(Enum(RoleEnum), nullable=False)
    email = Column(String, unique=True)
    created_at = Column(DateTime, default=datetime.now())

    '''
    back_populates  означает, что в соответствующих моделях
    (UsersTasks, Notifications, KanbanBoards) есть поле user,
    которое ссылается обратно на пользователя
    '''
    # notification = relationship()
    # notifications = relationship("Notifications", back_populates="user")
    boards = relationship("KanbanBoards", back_populates="user")
    groups = relationship("UserGroups", back_populates="user")
    tasks = relationship("Tasks", secondary=users_tasks_table, back_populates="users")

class Tasks(Base):
    __tablename__ = "tasks"
    task_id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    deadline = Column(DateTime, nullable=False)
    status = Column(Enum(TaskStatusEnum), nullable=False)
    assigned_files = Column(Integer)
    priority = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.now().date())
    updated_at = Column(DateTime, default=datetime.now(), onupdate=datetime.now())

    
    group_id = Column(Integer, ForeignKey("groups.group_id"))
    board_id = Column(Integer, ForeignKey("kanban_boards.board_id"))
        
    group = relationship("Groups", back_populates="tasks")
    board = relationship("KanbanBoards", back_populates="tasks")
    # events = relationship("CalendarTasks", back_populates="tasks")
    users = relationship("Users", secondary=users_tasks_table, back_populates="tasks")
    


class Groups(Base):
    __tablename__ = "groups"
    group_id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.now())

    tasks = relationship("Tasks", back_populates="group")
    users = relationship("UserGroups", back_populates="group")


class UserGroups(Base):
    __tablename__ = "user_groups"
    user_id = Column(Integer, ForeignKey("users.user_id"), primary_key=True)
    group_id = Column(Integer, ForeignKey("groups.group_id"), primary_key=True)

    user = relationship("Users", back_populates="groups")
    group = relationship("Groups", back_populates="users")


class KanbanBoards(Base):
    __tablename__ = "kanban_boards"
    board_id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.now())
    updated_at = Column(DateTime, default=datetime.now(), onupdate=datetime.now())
    user = relationship("Users", back_populates="boards")
    tasks = relationship("Tasks", back_populates="board")


# class CalendarEvents(Base):
#     __tablename__ = "calendar_events"
    
#     event_id = Column(Integer, primary_key=True)
#     deadline_time = Column(DateTime, nullable=False)
#     created_at = Column(DateTime, default=datetime.utcnow)
#     description = Column(Text)

#     task = relationship("Tasks", back_populates="events")


# class CalendarTasks(Base):
#     __tablename__ = "calendar_tasks"
#     event_id = Column(Integer, ForeignKey("calendar_events.event_id"), primary_key=True)
#     task_id = Column(Integer, ForeignKey("tasks.task_id"), primary_key=True)

#     event = relationship("CalendarEvents", back_populates="tasks")
#     task = relationship("Tasks", back_populates="events")


# class Notifications(Base):
#     __tablename__ = "notifications"
#     notification_id = Column(Integer, primary_key=True)
#     user_id = Column(Integer, ForeignKey("users.user_id"))
#     message = Column(Text, nullable=False)
#     status = Column(Enum(NotificationStatusEnum), nullable=False)
#     sent_at = Column(DateTime)
#     created_at = Column(DateTime, default=datetime.now())

#     user = relationship("Users", back_populates="notifications")
