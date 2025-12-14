import React from 'react';
import { ViewState } from '../types';
import { LayoutDashboard, UserCheck, Users, FileText } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, setView }) => {
  const NavButton = ({ view, icon: Icon, label }: { view: ViewState, icon: any, label: string }) => (
    <button
      onClick={() => setView(view)}
      className={`flex flex-col items-center justify-center p-2 md:p-4 rounded-lg transition-all duration-200 ${
        currentView === view
          ? 'bg-saffron-600 text-white shadow-lg scale-105'
          : 'bg-white text-saffron-700 hover:bg-saffron-100'
      }`}
    >
      <Icon className="w-6 h-6 mb-1" />
      <span className="text-xs md:text-sm font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col max-w-7xl mx-auto bg-saffron-50 shadow-2xl overflow-hidden">
      {/* Header */}
      <header className="bg-gradient-to-r from-saffron-600 to-saffron-500 text-white p-6 shadow-md sticky top-0 z-50">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Shri Swaminarayan Mandir</h1>
            <p className="text-saffron-100 text-sm mt-1">Bagasara • Dhanurmas Attendance Program</p>
          </div>
          <div className="hidden md:block text-right">
            <p className="font-semibold text-lg">Jay Swaminarayan 🙏</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 overflow-y-auto">
        {children}
      </main>

      {/* Mobile/Desktop Navigation Bar */}
      <nav className="bg-white border-t border-saffron-200 p-2 md:p-4 sticky bottom-0 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <div className="grid grid-cols-4 gap-2 md:gap-4 max-w-lg mx-auto md:max-w-none">
          <NavButton view="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavButton view="attendance" icon={UserCheck} label="Attendance" />
          <NavButton view="students" icon={Users} label="Students" />
          <NavButton view="report" icon={FileText} label="Reports" />
        </div>
      </nav>
    </div>
  );
};