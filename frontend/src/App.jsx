import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Calculator, FileText, BarChart3, Users, Settings, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Dashboard from './components/Dashboard';
import EstimatorCanvas from './components/EstimatorCanvas';
import GanttView from './components/GanttView';
import StaffingView from './components/StaffingView';
import AdminView from './components/AdminView';
import './App.css';

const Navigation = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/estimator', icon: Calculator, label: 'Estimator' },
    { path: '/gantt', icon: BarChart3, label: 'Gantt' },
    { path: '/staffing', icon: Users, label: 'Staffing' },
    { path: '/admin', icon: Settings, label: 'Admin' },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-2">
            <FileText className="h-8 w-8 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">Project Estimator</h1>
          </div>
          
          <div className="flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className="flex items-center space-x-2"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/estimator" element={<EstimatorCanvas />} />
          <Route path="/estimator/:id" element={<EstimatorCanvas />} />
          <Route path="/gantt" element={<GanttView />} />
          <Route path="/gantt/:id" element={<GanttView />} />
          <Route path="/staffing" element={<StaffingView />} />
          <Route path="/staffing/:id" element={<StaffingView />} />
          <Route path="/admin" element={<AdminView />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;

