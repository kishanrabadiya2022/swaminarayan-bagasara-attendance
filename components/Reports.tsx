import React, { useMemo, useState, useRef } from 'react';
import { Child } from '../types';
import { dbService } from '../services/db'; // Ensure dbService is imported
import { Download, Upload, AlertCircle, Medal, Calendar } from 'lucide-react';

interface ReportsProps {
  childrenData: Child[];
}

export const Reports: React.FC<ReportsProps> = ({ childrenData }) => {
  // Export State
  const [exportMode, setExportMode] = useState<'month' | 'range'>('month');
  const [exportMonth, setExportMonth] = useState(new Date().toISOString().slice(0, 7));
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Statistics Logic (Global / All-time) ---
  const reportData = useMemo(() => {
    return childrenData.map(child => {
      const presentCount = Object.values(child.attendance).filter(s => s === 'P').length;
      const totalMarked = Object.values(child.attendance).length;
      const percentage = totalMarked > 0 ? (presentCount / totalMarked) * 100 : 0;
      return { ...child, presentCount, percentage };
    }).sort((a, b) => b.presentCount - a.presentCount);
  }, [childrenData]);

  const lowAttendance = reportData.filter(c => c.percentage < 50 && Object.keys(c.attendance).length > 5);

  // --- Actions ---

  const downloadJSON = () => {
    const dataStr = JSON.stringify(childrenData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dhanurmas_attendance_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm("⚠️ WARNING: This will merge/overwrite the current data with the backup file. Are you sure?")) {
        e.target.value = ''; // Reset input
        return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const json = JSON.parse(event.target?.result as string);
            if (Array.isArray(json)) {
                await dbService.restoreData(json);
                alert("Data restored successfully! Please refresh the page.");
                window.location.reload();
            } else {
                alert("Invalid backup file format.");
            }
        } catch (error) {
            alert("Error parsing backup file.");
            console.error(error);
        }
    };
    reader.readAsText(file);
  };

  const downloadCSV = () => {
    let dateColumns: string[] = [];
    let fileName = '';

    // 1. Determine Date Columns based on Mode
    if (exportMode === 'month') {
        const [year, month] = exportMonth.split('-').map(Number);
        const daysInMonth = new Date(year, month, 0).getDate();
        
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            dateColumns.push(dateStr);
        }
        fileName = `Attendance_Report_${exportMonth}.csv`;
    } else {
        // Range Mode Validation
        if (!rangeStart || !rangeEnd) {
            alert("Please select both 'From' and 'To' dates.");
            return;
        }
        if (rangeStart > rangeEnd) {
            alert("Start Date cannot be after End Date.");
            return;
        }

        // Generate Range
        // Use UTC date handling to prevent timezone/DST issues during iteration
        const current = new Date(rangeStart);
        const end = new Date(rangeEnd);
        let safetyCount = 0; 
        
        while (current <= end && safetyCount < 366) { // Limit to 1 year max for safety
            dateColumns.push(current.toISOString().split('T')[0]);
            // Strictly increment by 1 UTC day
            current.setUTCDate(current.getUTCDate() + 1);
            safetyCount++;
        }
        fileName = `Attendance_Report_${rangeStart}_to_${rangeEnd}.csv`;
    }

    // 2. Prepare Headers
    const headers = [
      "ID", 
      "Full Name", 
      "Village", 
      "Mobile", 
      ...dateColumns, 
      "Total Present", 
      "Total Absent", 
      "Attendance %"
    ];
    
    // 3. Generate Rows
    const rows = childrenData.map(c => {
        let rangePresent = 0;
        let rangeAbsent = 0;

        const dailyStatuses = dateColumns.map(date => {
            const status = c.attendance[date];
            if (status === 'P') rangePresent++;
            if (status === 'A') rangeAbsent++;
            return status || '-'; 
        });

        // Calculate totals ONLY for the selected range/month
        const totalInScope = rangePresent + rangeAbsent;
        const pct = totalInScope > 0 
            ? Math.round((rangePresent / totalInScope) * 100) + '%' 
            : '0%';
        
        const safeName = `"${c.fullName.replace(/"/g, '""')}"`;
        const safeVillage = `"${c.village.replace(/"/g, '""')}"`;
        const safeMobile = `"${(c.mobileNumber || '').replace(/"/g, '""')}"`;

        return [
            c.id, 
            safeName, 
            safeVillage, 
            safeMobile, 
            ...dailyStatuses, 
            rangePresent, 
            rangeAbsent, 
            pct
        ].join(",");
    });

    // 4. Create File
    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Control Panel */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Attendance Reports</h2>
            <p className="text-sm text-gray-500">Download Excel sheets or backup data.</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto">
            {/* Export Configuration Group */}
            <div className="flex flex-col md:flex-row items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                <select 
                    value={exportMode}
                    onChange={(e) => setExportMode(e.target.value as 'month' | 'range')}
                    className="border-gray-300 rounded-md text-sm py-2 pl-2 pr-6 focus:ring-saffron-500 border bg-white"
                >
                    <option value="month">Monthly Report</option>
                    <option value="range">Date Range</option>
                </select>

                {exportMode === 'month' ? (
                    <input 
                        type="month" 
                        value={exportMonth}
                        onChange={(e) => setExportMonth(e.target.value)}
                        className="border-gray-300 rounded-md px-2 py-1.5 text-sm border focus:ring-saffron-500 outline-none"
                    />
                ) : (
                    <div className="flex items-center gap-2">
                        <input 
                            type="date" 
                            value={rangeStart}
                            onChange={(e) => setRangeStart(e.target.value)}
                            className="border-gray-300 rounded-md px-2 py-1.5 text-sm w-32 border focus:ring-saffron-500 outline-none"
                            title="From Date"
                        />
                        <span className="text-gray-400">to</span>
                        <input 
                            type="date" 
                            value={rangeEnd}
                            onChange={(e) => setRangeEnd(e.target.value)}
                            className="border-gray-300 rounded-md px-2 py-1.5 text-sm w-32 border focus:ring-saffron-500 outline-none"
                            title="To Date"
                        />
                    </div>
                )}
                
                <button onClick={downloadCSV} className="w-full md:w-auto bg-green-600 text-white px-4 py-1.5 rounded-md hover:bg-green-700 text-sm flex items-center justify-center gap-2 font-medium transition-colors ml-1">
                    <Download className="w-4 h-4" /> Export Excel
                </button>
            </div>

            {/* Backup Group */}
            <div className="flex gap-2">
                <button onClick={downloadJSON} className="flex-1 md:flex-none bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 flex items-center justify-center gap-2 text-sm shadow-sm transition-colors">
                    <Download className="w-4 h-4" /> Backup
                </button>
                
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleRestore} 
                    accept=".json" 
                    className="hidden" 
                />
                <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className="flex-1 md:flex-none bg-saffron-600 text-white px-4 py-2 rounded-lg hover:bg-saffron-700 flex items-center justify-center gap-2 text-sm shadow-sm transition-colors"
                    title="Restore from Backup File"
                >
                    <Upload className="w-4 h-4" /> Restore
                </button>
            </div>
        </div>
      </div>

      {/* Top Students */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl border border-gold-200">
        <h3 className="font-bold text-saffron-800 flex items-center gap-2 mb-4">
          <Medal className="w-5 h-5 text-gold-500" />
          Top Attendance (100% Present - All Time)
        </h3>
        <div className="flex flex-wrap gap-2">
          {reportData.filter(c => c.percentage === 100 && Object.keys(c.attendance).length > 2).map(c => (
             <span key={c.id} className="bg-white border border-gold-200 text-gray-700 px-3 py-1 rounded-full text-sm shadow-sm">
               {c.fullName}
             </span>
          ))}
          {reportData.filter(c => c.percentage === 100).length === 0 && <p className="text-gray-500 text-sm">No 100% records yet.</p>}
        </div>
      </div>

      {/* Low Attendance Warning */}
      {lowAttendance.length > 0 && (
        <div className="bg-red-50 p-6 rounded-xl border border-red-200">
          <h3 className="font-bold text-red-800 flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5" />
            Low Attendance Alert (&lt; 50%)
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {lowAttendance.map(c => (
              <li key={c.id} className="flex justify-between text-sm p-2 bg-white rounded border border-red-100">
                <span>{c.fullName}</span>
                <span className="font-bold text-red-600">{Math.round(c.percentage)}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Full Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b bg-gray-50 font-medium text-gray-700 flex justify-between items-center">
            <span>Overall Performance Summary</span>
            <span className="text-xs text-gray-500 font-normal">Calculated from all-time data</span>
        </div>
        <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left border-collapse text-sm">
                <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                        <th className="p-3 border-b">Name</th>
                        <th className="p-3 border-b">Village</th>
                        <th className="p-3 border-b text-center">Days Present</th>
                        <th className="p-3 border-b text-center">%</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {reportData.map(child => (
                        <tr key={child.id} className="hover:bg-gray-50">
                            <td className="p-3">{child.fullName}</td>
                            <td className="p-3 text-gray-500">{child.village}</td>
                            <td className="p-3 text-center font-bold">{child.presentCount}</td>
                            <td className="p-3 text-center">
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div 
                                        className={`h-2.5 rounded-full ${child.percentage > 75 ? 'bg-green-600' : child.percentage > 40 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                        style={{ width: `${child.percentage}%` }}
                                    ></div>
                                </div>
                                <span className="text-xs text-gray-500">{Math.round(child.percentage)}%</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};