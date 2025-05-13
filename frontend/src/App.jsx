import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Calendar from './pages/Calendar';
import Sidebar from './components/Sidebar';
import Team from './pages/Team';

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="flex">
        <Sidebar />
        <div className="flex-1">
          <div className="p-4">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/team" element={<Team />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;