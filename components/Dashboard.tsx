import React, { useMemo } from 'react';
import { Child } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, UserCheck, UserX, TrendingUp, AlertTriangle } from 'lucide-react';

interface DashboardProps {
  children: Child[];
}

export const Dashboard: React.FC<DashboardProps> = ({ children }) => {
  const today = new Date().toISOString().split('T')[0];

  const stats = useMemo(() => {
    let presentToday = 0;
    let absentToday = 0;

    children.forEach(child => {
      const status = child.attendance[today];
      if (status === 'P') presentToday++;
      if (status === 'A') absentToday++;
    });

    return {
      total: children.length,
      present: presentToday,
      absent: absentToday,
      unmarked: children.length - (presentToday + absentToday)
    };
  }, [children, today]);

  const chartData = [
    { name: 'Present', value: stats.present, color: '#16a34a' }, // green-600
    { name: 'Absent', value: stats.absent, color: '#dc2626' },   // red-600
    { name: 'Pending', value: stats.unmarked, color: '#ca8a04' } // yellow-600
  ];

  const StatCard = ({ title, value, icon: Icon, colorClass, bgClass }: any) => (
    <div className={`p-6 rounded-xl shadow-md border border-white/50 ${bgClass} transition-transform hover:scale-[1.02]`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 uppercase tracking-wider">{title}</p>
          <p className={`text-3xl font-bold mt-2 ${colorClass}`}>{value}</p>
        </div>
        <div className={`p-3 rounded-full bg-white/50 ${colorClass}`}>
          <Icon className="w-8 h-8" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Children" 
          value={stats.total} 
          icon={Users} 
          colorClass="text-blue-600" 
          bgClass="bg-blue-50" 
        />
        <StatCard 
          title="Present Today" 
          value={stats.present} 
          icon={UserCheck} 
          colorClass="text-green-600" 
          bgClass="bg-green-50" 
        />
        <StatCard 
          title="Absent Today" 
          value={stats.absent} 
          icon={UserX} 
          colorClass="text-red-600" 
          bgClass="bg-red-50" 
        />
        <StatCard 
          title="Today's %" 
          value={`${stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}%`} 
          icon={TrendingUp} 
          colorClass="text-purple-600" 
          bgClass="bg-purple-50" 
        />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Today's Overview ({today})</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={80} />
              <Tooltip cursor={{fill: 'transparent'}} />
              <Bar dataKey="value" barSize={40} radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500 text-gray-800 text-sm shadow-sm">
        <h4 className="font-bold flex items-center gap-2 text-orange-800 mb-2">
          <AlertTriangle className="w-5 h-5" /> 
          IMPORTANT: How to keep data safe
        </h4>
        <ul className="list-disc ml-5 space-y-1 text-gray-700">
            <li>Data is stored <strong>only on this device</strong>. Do not clear browser history.</li>
            <li><strong>Do not use Incognito / Private mode.</strong> Data will be lost when you close.</li>
            <li>Go to <strong>Reports &rarr; Backup</strong> every day to download a safety copy.</li>
        </ul>
      </div>
    </div>
  );
};