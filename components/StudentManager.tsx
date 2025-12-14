import React, { useState } from 'react';
import { Child } from '../types';
import { dbService } from '../services/db';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';

interface StudentManagerProps {
  childrenData: Child[];
  onUpdate: () => void;
}

const emptyChild: Child = {
  fullName: '',
  age: 0,
  gender: 'Male',
  village: '',
  mobileNumber: '',
  attendance: {}
};

export const StudentManager: React.FC<StudentManagerProps> = ({ childrenData, onUpdate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Child>(emptyChild);
  const [error, setError] = useState('');

  const resetForm = () => {
    setFormData(emptyChild);
    setEditingId(null);
    setIsAdding(false);
    setError('');
  };

  const handleEdit = (child: Child) => {
    setFormData(child);
    setEditingId(child.id!);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this child's record?")) {
      await dbService.deleteChild(id);
      onUpdate();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.village) {
        setError('Name and Village are required.');
        return;
    }

    try {
      if (editingId) {
        await dbService.updateChild(formData);
      } else {
        await dbService.addChild(formData);
      }
      resetForm();
      onUpdate();
    } catch (err) {
      setError('Failed to save record.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Student Management</h2>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-saffron-600 text-white px-4 py-2 rounded-lg shadow hover:bg-saffron-700 transition"
          >
            <Plus className="w-5 h-5" /> Add Child
          </button>
        )}
      </div>

      {/* Form */}
      {isAdding && (
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-saffron-500">
          <h3 className="text-lg font-bold mb-4">{editingId ? 'Edit Child' : 'New Child Registration'}</h3>
          {error && <p className="text-red-500 mb-3 text-sm">{error}</p>}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full border rounded-md p-2 focus:ring-saffron-500 placeholder-gray-400 placeholder-italic text-gray-800"
                placeholder="e.g. Rahul Kumar"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Village</label>
              <input
                type="text"
                name="village"
                value={formData.village}
                onChange={handleInputChange}
                className="w-full border rounded-md p-2 focus:ring-saffron-500 placeholder-gray-400 placeholder-italic text-gray-800"
                placeholder="e.g. Bagasara"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                className="w-full border rounded-md p-2 focus:ring-saffron-500 placeholder-gray-400 placeholder-italic text-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full border rounded-md p-2 focus:ring-saffron-500"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parent Mobile</label>
              <input
                type="tel"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleInputChange}
                className="w-full border rounded-md p-2 focus:ring-saffron-500 placeholder-gray-400 placeholder-italic text-gray-800"
                placeholder="9876543210"
              />
            </div>
            
            <div className="md:col-span-2 flex justify-end gap-3 mt-4">
              <button 
                type="button" 
                onClick={resetForm}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-6 py-2 bg-saffron-600 text-white rounded-md hover:bg-saffron-700 flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Save Record
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="p-4 border-b">ID</th>
                <th className="p-4 border-b">Name</th>
                <th className="p-4 border-b">Village</th>
                <th className="p-4 border-b">Age/Gen</th>
                <th className="p-4 border-b">Mobile</th>
                <th className="p-4 border-b text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {childrenData.map((child, idx) => (
                <tr key={child.id} className="hover:bg-saffron-50 transition-colors">
                  <td className="p-4 text-gray-500 text-sm">#{child.id}</td>
                  <td className="p-4 font-medium text-gray-800">{child.fullName}</td>
                  <td className="p-4 text-gray-600">{child.village}</td>
                  <td className="p-4 text-gray-600 text-sm">{child.age} / {child.gender.charAt(0)}</td>
                  <td className="p-4 text-gray-600 text-sm">{child.mobileNumber || '-'}</td>
                  <td className="p-4 text-right space-x-2">
                    <button 
                      onClick={() => handleEdit(child)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(child.id!)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {childrenData.length === 0 && (
           <div className="p-8 text-center text-gray-400">
             No students added yet. Click "Add Child" to begin.
           </div>
        )}
      </div>
    </div>
  );
};