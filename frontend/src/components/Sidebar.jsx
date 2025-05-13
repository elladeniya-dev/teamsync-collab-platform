import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = () => {
  return (
    <div className="h-screen w-64 bg-gray-800 text-white flex flex-col">
      <div className="p-4 text-2xl font-bold">TeamSync</div>
      <nav className="flex flex-col p-4">
        <Link to="/" className="py-2 px-4 hover:bg-gray-700 rounded">Dashboard</Link>
        <Link to="/tasks" className="py-2 px-4 hover:bg-gray-700 rounded">Tasks</Link>
        <Link to="/calendar" className="py-2 px-4 hover:bg-gray-700 rounded">Calendar</Link>
        <Link to="/team" className="py-2 px-4 hover:bg-gray-700 rounded">My Team</Link>
      </nav>
    </div>
  );
};

export default Sidebar;