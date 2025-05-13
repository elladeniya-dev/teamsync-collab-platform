import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2'; // ✅ ADDED
import Modal from '../components/Modal';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { StaticDateTimePicker } from '@mui/x-date-pickers/StaticDateTimePicker';
import dayjs from 'dayjs';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTaskId, setEditTaskId] = useState(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignee: '',
    deadline: dayjs(),
    type: ''
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = () => {
    axios.get('http://localhost:5000/api/tasks')
      .then(res => {
        const sorted = res.data.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
        setTasks(sorted);
      })
      .catch(err => console.error('Error fetching tasks:', err));
  };

  const handleSaveTask = async () => {
    const { title, assignee, deadline, type } = newTask;

    if (!title.trim()) {
      return Swal.fire('⚠️ Missing Title', 'Please enter a task title.', 'warning');
    }

    if (!assignee.trim()) {
      return Swal.fire('⚠️ Missing Assignee', 'Please enter who is responsible.', 'warning');
    }

    if (!type.trim()) {
      return Swal.fire('⚠️ Missing Task Type', 'Please select a task type.', 'warning');
    }

    if (dayjs(deadline).isBefore(dayjs())) {
      return Swal.fire('⚠️ Invalid Deadline', 'Deadline must be in the future.', 'warning');
    }

    try {
      if (isEditing) {
        await axios.put(`http://localhost:5000/api/tasks/${editTaskId}`, {
          ...newTask,
          deadline: newTask.deadline.toISOString()
        });
        Swal.fire('✅ Task Updated', 'The task was updated successfully.', 'success');
      } else {
        await axios.post('http://localhost:5000/api/tasks', {
          ...newTask,
          deadline: newTask.deadline.toISOString()
        });
        Swal.fire('✅ Task Created', 'The task was added successfully.', 'success');
      }

      fetchTasks();
      setIsModalOpen(false);
      setIsEditing(false);
      setEditTaskId(null);
      setNewTask({ title: '', description: '', assignee: '', deadline: dayjs(), type: '' });

    } catch (err) {
      console.error('Error saving task:', err);
      Swal.fire('❌ Error', 'Something went wrong while saving the task.', 'error');
    }
  };

  const handleEditTask = (task) => {
    setIsEditing(true);
    setEditTaskId(task._id);
    setNewTask({
      title: task.title,
      description: task.description,
      assignee: task.assignee,
      deadline: dayjs(task.deadline),
      type: task.type
    });
    setIsModalOpen(true);
  };

  const handleDeleteTask = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "This task will be permanently deleted!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`http://localhost:5000/api/tasks/${id}`);
        fetchTasks();
        Swal.fire('🗑️ Deleted!', 'The task has been deleted.', 'success');
      } catch (err) {
        console.error('Error deleting task:', err);
        Swal.fire('❌ Error', 'Could not delete the task.', 'error');
      }
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'No deadline';
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: '2-digit',
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">📋 Task Manager</h1>
        <button
          className="px-5 py-2 bg-blue-600 text-white font-medium rounded-lg shadow hover:bg-blue-700"
          onClick={() => {
            setIsModalOpen(true);
            setIsEditing(false);
            setNewTask({ title: '', description: '', assignee: '', deadline: dayjs(), type: '' });
          }}
        >
          + Add Task
        </button>
      </div>

      <div className="grid gap-5 sm:grid-cols-1 md:grid-cols-2">
        {tasks.map(task => (
          <div key={task._id} className="bg-white rounded-xl border border-gray-200 shadow-md p-5 flex flex-col justify-between transition hover:shadow-lg">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-800">{task.title}</h2>
              <p className="text-gray-600 text-sm">{task.description}</p>
              <p className="text-gray-500 text-sm">👤 Assigned to: <span className="font-medium">{task.assignee}</span></p>
              <p className="text-gray-500 text-sm">⏰ Deadline: {formatDate(task.deadline)}</p>
              <span className={`inline-block mt-2 px-3 py-1 text-xs font-semibold rounded-full ${getTypeClass(task.type)}`}>{task.type}</span>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => handleEditTask(task)}
                className="text-blue-600 text-sm font-semibold hover:text-blue-800"
              >
                ✏️ Edit
              </button>
              <button
                onClick={() => handleDeleteTask(task._id)}
                className="text-red-600 text-sm font-semibold hover:text-red-800"
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setIsEditing(false); }}>
        <h2 className="text-xl font-bold mb-4 text-center">{isEditing ? 'Edit Task' : 'Add New Task'}</h2>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Title"
            className="w-full p-3 border rounded-md focus:outline-none focus:ring focus:border-blue-400"
            value={newTask.title}
            onChange={e => setNewTask({ ...newTask, title: e.target.value })}
          />
          <textarea
            placeholder="Description"
            className="w-full p-3 border rounded-md focus:outline-none focus:ring focus:border-blue-400"
            value={newTask.description}
            onChange={e => setNewTask({ ...newTask, description: e.target.value })}
          />
          <input
            type="text"
            placeholder="Assignee"
            className="w-full p-3 border rounded-md focus:outline-none focus:ring focus:border-blue-400"
            value={newTask.assignee}
            onChange={e => setNewTask({ ...newTask, assignee: e.target.value })}
          />

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <StaticDateTimePicker
              orientation="landscape"
              value={newTask.deadline}
              onChange={(value) => setNewTask({ ...newTask, deadline: value })}
              minDateTime={dayjs()} // ✅ Prevent past dates
            />
          </LocalizationProvider>

          <select
            className="w-full p-3 border rounded-md focus:outline-none focus:ring focus:border-blue-400"
            value={newTask.type}
            onChange={e => setNewTask({ ...newTask, type: e.target.value })}
          >
            <option value="">Select Type</option>
            <option value="Meeting">Meeting</option>
            <option value="Deadline">Deadline</option>
            <option value="Review">Review</option>
          </select>

          <div className="flex justify-end gap-3">
            <button
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              onClick={() => { setIsModalOpen(false); setIsEditing(false); }}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={handleSaveTask}
            >
              {isEditing ? 'Update Task' : 'Save Task'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Tasks;
