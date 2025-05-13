import { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2'; // ✅ SweetAlert2 added

const Team = () => {
  const [members, setMembers] = useState([]);
  const [newMember, setNewMember] = useState({ name: '', email: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('http://localhost:5000/api/team')
      .then(res => setMembers(res.data))
      .catch(err => console.error('Error loading members:', err));
  }, []);

  const handleAdd = async () => {
    setError('');
    const name = newMember.name.trim();
    const email = newMember.email.trim();

    if (!name) {
      setError('Name is required');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/team', { name, email });
      setMembers(prev => [...prev, res.data]);
      setNewMember({ name: '', email: '' });

      Swal.fire('✅ Added!', `${name} was added successfully`, 'success'); // ✅
    } catch (err) {
      console.error('Add failed:', err);
      Swal.fire('❌ Error', 'Failed to add member.', 'error'); // ✅
    }
  };

  const handleRemove = async (id) => {
    const target = members.find(m => m._id === id);
    const confirm = await Swal.fire({
      title: `Remove ${target?.name}?`,
      text: "This action cannot be undone.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, remove'
    });

    if (confirm.isConfirmed) {
      try {
        await axios.delete(`http://localhost:5000/api/team/${id}`);
        setMembers(prev => prev.filter(m => m._id !== id));
        Swal.fire('🗑️ Removed!', `${target?.name} has been removed.`, 'success'); // ✅
      } catch (err) {
        console.error('Remove failed:', err);
        Swal.fire('❌ Error', 'Failed to remove member.', 'error'); // ✅
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">🧑‍🤝‍🧑 Team Members</h1>

      <div className="bg-gray-50 p-6 rounded-lg shadow space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">➕ Add New Member</h2>
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Full Name"
            className="flex-1 border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={newMember.name}
            onChange={e => setNewMember({ ...newMember, name: e.target.value })}
          />
          <input
            type="email"
            placeholder="Email Address"
            className="flex-1 border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={newMember.email}
            onChange={e => setNewMember({ ...newMember, email: e.target.value })}
          />
          <button
            onClick={handleAdd}
            className="bg-blue-600 text-white px-6 py-3 rounded font-medium hover:bg-blue-700 transition"
          >
            Add
          </button>
        </div>
        {error && <p className="text-red-600 font-medium mt-2">⚠️ {error}</p>}
      </div>

      <ul className="space-y-4">
        {members.map(member => (
          <li
            key={member._id}
            className="flex justify-between items-center bg-white border p-4 rounded-lg shadow hover:shadow-md transition"
          >
            <span className="text-gray-800 font-medium">
              👤 {member.name} <span className="text-sm text-gray-500">({member.email})</span>
            </span>
            <button
              className="text-sm text-red-600 font-semibold hover:text-red-800"
              onClick={() => handleRemove(member._id)}
            >
              🗑️ Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Team;
