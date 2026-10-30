import React, { useState, useEffect } from 'react';
import { taskApi } from '../api/client';
import { 
  Modal, 
  ChevronLeftIcon, 
  ChevronRightIcon 
} from '../components';
import { formatDate } from '../utils/dateUtils';
import { getTypeStyle } from '../utils/taskHelpers';

const Calendar = () => {
  const [tasks, setTasks] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await taskApi.getAll();
      setTasks(res.data || []);
    } catch (err) {
      console.error('Failed to load tasks for calendar:', err);
    } finally {
      setLoading(false);
    }
  };

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const monthName = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const today = new Date();

  // Map tasks to dates
  const tasksByDay = {};
  tasks.forEach((task) => {
    if (!task.deadline) return;
    const d = new Date(task.deadline);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const dayNum = d.getDate();
      if (!tasksByDay[dayNum]) tasksByDay[dayNum] = [];
      tasksByDay[dayNum].push(task);
    }
  });

  // Days array for the grid
  const daysArray = [];

  for (let i = firstDayIndex - 1; i >= 0; i--) {
    daysArray.push({
      day: prevMonthDays - i,
      currentMonth: false,
      date: new Date(year, month - 1, prevMonthDays - i)
    });
  }

  for (let i = 1; i <= totalDays; i++) {
    daysArray.push({
      day: i,
      currentMonth: true,
      tasks: tasksByDay[i] || [],
      isToday:
        today.getDate() === i &&
        today.getMonth() === month &&
        today.getFullYear() === year,
      date: new Date(year, month, i)
    });
  }

  const remainingCells = 42 - daysArray.length;
  for (let i = 1; i <= (remainingCells >= 7 ? remainingCells - 7 : remainingCells); i++) {
    daysArray.push({
      day: i,
      currentMonth: false,
      date: new Date(year, month + 1, i)
    });
  }

  return (
    <div className="h-full flex flex-col space-y-3 max-w-7xl mx-auto w-full">
      {/* Calendar Header with Navigation Controls */}
      <div className="shrink-0 bg-white px-4 sm:px-5 py-3 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>{monthName}</span>
          </h1>
          <p className="text-xs text-slate-500">Interactive delivery and milestone schedule</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
          >
            Today
          </button>
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
            <button
              onClick={prevMonth}
              className="p-1.5 hover:bg-white text-slate-600 rounded-md transition"
              title="Previous Month"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 hover:bg-white text-slate-600 rounded-md transition"
              title="Next Month"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Calendar Grid - fills remaining vertical viewport perfectly */}
      <div className="flex-1 min-h-[420px] bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
        {/* Days of the week header */}
        <div className="shrink-0 grid grid-cols-7 border-b border-slate-200 bg-slate-50/70 text-center py-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {d}
            </div>
          ))}
        </div>

        {/* Days Grid - dynamic rows so all rows fit screen height */}
        <div className={`flex-1 grid grid-cols-7 divide-x divide-y divide-slate-100 ${daysArray.length === 35 ? 'grid-rows-5' : 'grid-rows-6'}`}>
          {daysArray.map((cell, idx) => (
            <div
              key={idx}
              className={`p-1.5 sm:p-2 flex flex-col justify-start min-h-0 overflow-hidden transition ${
                cell.currentMonth ? 'bg-white' : 'bg-slate-50/40 text-slate-300'
              } ${cell.isToday ? 'bg-indigo-50/30' : ''}`}
            >
              {/* Day Number */}
              <div className="shrink-0 flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-semibold inline-flex items-center justify-center w-6 h-6 rounded-full ${
                    cell.isToday
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : cell.currentMonth
                      ? 'text-slate-800'
                      : 'text-slate-300'
                  }`}
                >
                  {cell.day}
                </span>

                {cell.tasks && cell.tasks.length > 0 && (
                  <span className="text-[10px] font-bold text-slate-400">
                    {cell.tasks.length}
                  </span>
                )}
              </div>

              {/* Task Chips inside Date Cell */}
              <div className="flex-1 overflow-y-auto space-y-1 pr-0.5">
                {cell.tasks?.map((task) => (
                  <button
                    key={task._id}
                    onClick={() => setSelectedTask(task)}
                    className={`w-full text-left truncate px-2 py-0.5 rounded text-[11px] font-semibold border transition block ${getTypeStyle(
                      task.type
                    ).chip}`}
                    title={`${task.title} (${task.assignee || 'Unassigned'})`}
                  >
                    {task.title}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Task Details Modal */}
      <Modal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        title="Deliverable Details"
      >
        {selectedTask && (
          <div className="space-y-4">
            <div>
              <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-semibold border ${getTypeStyle(selectedTask.type).pill} mb-2`}>
                {selectedTask.type}
              </span>
              <h3 className="text-xl font-bold text-slate-900">{selectedTask.title}</h3>
            </div>

            {selectedTask.description && (
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs text-slate-600 leading-relaxed">
                {selectedTask.description}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block mb-0.5">Assignee</span>
                <span className="font-semibold text-slate-800">{selectedTask.assignee || 'Unassigned'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block mb-0.5">Due Date</span>
                <span className="font-semibold text-slate-800">
                  {formatDate(selectedTask.deadline)}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedTask(null)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Calendar;
