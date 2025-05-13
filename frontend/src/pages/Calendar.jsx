import { useEffect, useState } from 'react';
import axios from 'axios';

const Calendar = () => {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/tasks')
      .then(res => {
        const sorted = res.data.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
        setTasks(sorted);
      })
      .catch(err => console.error('Failed to load tasks for calendar:', err));
  }, []);

  const formatDateTime = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'long',
      day: '2-digit',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getTypeClass = (type) => {
    const base = "inline-flex justify-center items-center text-center w-28 px-5 py-3 rounded-full text-sm font-semibold";
  
    switch (type) {
      case 'Meeting':
        return `${base} bg-blue-100 text-blue-700`;
      case 'Deadline':
        return `${base} bg-red-100 text-red-600`;
      case 'Review':
        return `${base} bg-green-100 text-green-700`;
      default:
        return `${base} bg-gray-100 text-gray-700`;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">🗓️ Team Calendar Overview</h1>

      {tasks.length === 0 ? (
        <p className="text-gray-500 italic">No scheduled tasks available.</p>
      ) : (
        <div className="space-y-4">
          {tasks.map(task => (
            <div
              key={task._id}
              className="bg-white border border-gray-200 p-5 rounded-xl shadow-md flex justify-between items-center hover:shadow-lg transition"
            >
              <div>
                <h2 className="text-lg font-bold text-gray-800">{task.title}</h2>
                <p className="text-sm text-gray-500">📅 {formatDateTime(task.deadline)}</p>
              </div>
              <span className={`px-4 py-1 rounded-full text-sm font-semibold ${getTypeClass(task.type)}`}>
                {task.type}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Calendar;