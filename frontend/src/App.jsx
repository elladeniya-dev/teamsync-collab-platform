import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Calendar from './pages/Calendar';
import Team from './pages/Team';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-indigo-500 selection:text-white">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 p-6 md:p-8 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/team" element={<Team />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
