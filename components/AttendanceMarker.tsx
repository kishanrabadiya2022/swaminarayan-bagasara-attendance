import React, { useState, useMemo } from 'react';
import { Child } from '../types';
import { dbService } from '../services/db';
import { Search, Calendar, Check, X } from 'lucide-react';

interface AttendanceMarkerProps {
  childrenData: Child[];
  onUpdate: () => void;
}

export const AttendanceMarker: React.FC<AttendanceMarkerProps> = ({ childrenData, onUpdate }) => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [villageFilter, setVillageFilter] = useState('All');

  // Derive unique villages
  const villages = useMemo(() => 
    ['All', ...Array.from(new Set(childrenData.map(c => c.village))).sort()], 
  [childrenData]);

  // OPTIMIZATION: usage of useMemo instead of useEffect prevents double-renders.
  // This makes typing in the search bar much faster on mobile devices.
  const filteredChildren = useMemo(() => {
    let result = childrenData;
    
    if (villageFilter !== 'All') {
      result = result.filter(c => c.village === villageFilter);
    }
    
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(c => 
        c.fullName.toLowerCase().includes(lowerTerm) || 
        c.village.toLowerCase().includes(lowerTerm)
      );
    }
    
    // Sort logic: Unmarked first, then Alphabetical
    // We create a copy with [...result] to avoid mutating the original array reference during sort
    return [...result].sort((a, b) => {
        const aStatus = a.attendance[selectedDate];
        const bStatus = b.attendance[selectedDate];
        
        // If one is unmarked and other is marked, unmarked comes first
        if (!aStatus && bStatus) return -1;
        if (aStatus && !bStatus) return 1;
        
        // Otherwise sort by name
        return a.fullName.localeCompare(b.fullName);
    });
  }, [childrenData, searchTerm, villageFilter, selectedDate]);

  const markAttendance = async (child: Child, status: 'P' | 'A') => {
    const updatedChild = {
      ...child,
      attendance: {
        ...child.attendance,
        [selectedDate]: status
      }
    };
    
    await dbService.updateChild(updatedChild);
    onUpdate(); // Refresh global state
  };

  const markAll = async (status: 'P' | 'A') => {
      // Use Promise.all for faster bulk updates
      const promises = filteredChildren.map(child => {
          const updatedChild = {
              ...child,
              attendance: { ...child.attendance, [selectedDate]: status }
          };
          return dbService.updateChild(updatedChild);
      });
      await Promise.all(promises);
      onUpdate();
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Controls */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-saffron-100 flex flex-col md:flex-row gap-4 justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Calendar className="text-saffron-600 w-5 h-5" />
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border-gray-300 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-saffron-500 outline-none w-full"
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
             <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Search name..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-saffron-500 outline-none"
                />
            </div>
            <select 
                value={villageFilter}
                onChange={(e) => setVillageFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-saffron-500 outline-none"
            >
                {villages.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
        </div>
      </div>

      <div className="flex justify-between items-center px-2">
          <span className="text-gray-500 text-sm">Showing {filteredChildren.length} children</span>
          <div className="space-x-2">
              <button onClick={() => markAll('P')} className="text-xs px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200">Mark All Present</button>
          </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredChildren.map(child => {
          const status = child.attendance[selectedDate];
          return (
            <div 
              key={child.id} 
              className={`p-4 rounded-lg shadow-sm border transition-all ${
                status === 'P' ? 'bg-green-50 border-green-200' :
                status === 'A' ? 'bg-red-50 border-red-200' :
                'bg-white border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-bold text-gray-800">{child.fullName}</h4>
                  <p className="text-xs text-gray-500">{child.village}</p>
                </div>
                {status && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    status === 'P' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                  }`}>
                    {status === 'P' ? 'PRESENT' : 'ABSENT'}
                  </span>
                )}
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => markAttendance(child, 'P')}
                  className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-md font-medium text-sm transition-colors ${
                    status === 'P' 
                    ? 'bg-green-600 text-white shadow-md' 
                    : 'bg-white border border-green-600 text-green-600 hover:bg-green-50'
                  }`}
                >
                  <Check className="w-4 h-4" /> Present
                </button>
                <button 
                  onClick={() => markAttendance(child, 'A')}
                  className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-md font-medium text-sm transition-colors ${
                    status === 'A' 
                    ? 'bg-red-600 text-white shadow-md' 
                    : 'bg-white border border-red-600 text-red-600 hover:bg-red-50'
                  }`}
                >
                  <X className="w-4 h-4" /> Absent
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      {filteredChildren.length === 0 && (
          <div className="text-center py-10 text-gray-500">
              No children found matching your filters.
          </div>
      )}
    </div>
  );
};