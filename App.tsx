import React, { useEffect, useState, useCallback } from 'react';
import { dbService } from './services/db';
import { Child, ViewState } from './types';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { AttendanceMarker } from './components/AttendanceMarker';
import { StudentManager } from './components/StudentManager';
import { Reports } from './components/Reports';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [childrenData, setChildrenData] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize DB and fetch data
  const fetchData = useCallback(async () => {
    try {
      await dbService.init();
      const data = await dbService.getAllChildren();
      setChildrenData(data);
    } catch (error) {
      console.error("Failed to load data", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handler to refresh data after updates
  const handleDataUpdate = async () => {
    const data = await dbService.getAllChildren();
    setChildrenData(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-saffron-50 gap-4">
        <Loader2 className="w-12 h-12 text-saffron-600 animate-spin" />
        <p className="text-saffron-700 font-medium">Loading Attendance System...</p>
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard children={childrenData} />;
      case 'attendance':
        return <AttendanceMarker childrenData={childrenData} onUpdate={handleDataUpdate} />;
      case 'students':
        return <StudentManager childrenData={childrenData} onUpdate={handleDataUpdate} />;
      case 'report':
        return <Reports childrenData={childrenData} />;
      default:
        return <Dashboard children={childrenData} />;
    }
  };

  return (
    <Layout currentView={currentView} setView={setCurrentView}>
      {renderView()}
    </Layout>
  );
}