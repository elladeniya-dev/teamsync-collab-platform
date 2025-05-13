import { useState, useEffect } from 'react';
import axios from 'axios';

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/team')
      .then(res => setMembers(res.data))
      .catch(err => console.error('Error loading members:', err));
  }, []);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/tasks');
        const sortedTasks = response.data.sort((a, b) => {
          const priorityOrder = { high: 1, medium: 2, low: 3 };
          if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[a.priority] - priorityOrder[b.priority];
          }
          return new Date(a.deadline) - new Date(b.deadline);
        });
        setTasks(sortedTasks);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    };

    fetchTasks();
  }, []);

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return colors[priority] || colors.medium;
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">📊 Team Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Upcoming Tasks */}
        <div className="bg-white p-6 rounded-xl shadow border">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">🗓️ Upcoming Tasks</h2>
          <div className="space-y-3">
            {tasks.length === 0 ? (
              <p className="text-gray-500 italic">No tasks available.</p>
            ) : (
              tasks.map(task => (
                <div key={task._id} className={`p-4 rounded-lg ${getPriorityColor(task.priority)} shadow-sm`}>
                  <h3 className="font-semibold text-lg">{task.title}</h3>
                  <p className="text-sm">📅 Due: {formatDate(task.deadline)}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Team Activity */}
        <div className="bg-white p-6 rounded-xl shadow border">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">👥 Team Activity</h2>
          <p className="text-gray-600">Recent updates from your team will appear here.</p>
        </div>

        {/* Notifications */}
        <div className="bg-white p-6 rounded-xl shadow border">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">🔔 Notifications</h2>
          <p className="text-gray-600">🎉 You're all caught up!</p>
        </div>

        {/* Team Members */}
        <div className="bg-white p-6 rounded-xl shadow border lg:col-span-1 md:col-span-2">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">🧑‍🤝‍🧑 Team Members</h2>
          {members.length === 0 ? (
            <p className="text-gray-500 italic">No members found.</p>
          ) : (
            <ul className="space-y-2">
              {members.map(member => (
                <li key={member._id} className="text-gray-800 font-medium bg-gray-50 px-4 py-2 rounded-md shadow-sm">
                  👤 {member.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;