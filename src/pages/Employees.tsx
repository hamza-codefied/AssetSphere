import { useState } from 'react';
import { Card, Badge, Button, Modal, CustomSelect } from '../components/ui';
import { UserPlus, Briefcase, ChevronRight } from 'lucide-react';

import type { Employee } from '../types';
import { useSystemState } from '../hooks/useSystemState';
import { useAuth } from '../auth/AuthContext';

export const Employees = ({ state }: { state: ReturnType<typeof useSystemState> }) => {
  const { employees, hardware, tools, addEmployee, updateEmployee } = state;
  const { can } = useAuth();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Engineer');

  const handleAdd = () => {
    addEmployee({
      name: name || 'New Employee',
      email: email || 'user@company.com',
      role,
      status: 'Active',
      assignedAssetCount: 0,
      assignedToolCount: 0
    });
    setIsModalOpen(false);
    setIsAddMode(false);
    setName('');
    setEmail('');
  };

  const getAssignedHardware = (empId: string) => hardware.filter(h => h.assignedToId === empId);
  const getAssignedTools = (empId: string) => tools.filter(t => t.assignedToId === empId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground">Directory of team members and their assigned resources.</p>
        </div>
        {can('employees.create') && (
          <Button onClick={() => { setIsAddMode(true); setIsModalOpen(true); }}>
            <UserPlus className="w-4 h-4" />
            Onboard Employee
          </Button>
        )}
      </div>

      <Card className="p-0 overflow-hidden shadow-premium">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-accent/50 border-b">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Name</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Role</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">Hardware</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">Tools</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {employees.map((emp) => (
                <tr 
                  key={emp.id} 
                  className="hover:bg-accent/30 transition-all group cursor-pointer"
                  onClick={() => {
                    setSelectedEmployee(emp);
                    setIsAddMode(false);
                    setIsModalOpen(true);
                  }}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-500 border group-hover:border-primary/50 transition-all">
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold block text-sm">{emp.name}</span>
                        <span className="text-xs text-muted-foreground block truncate max-w-[150px]">{emp.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                       <span className="text-sm">{emp.role}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-blue-50 text-blue-600 text-[11px] font-bold border border-blue-200">
                      {getAssignedHardware(emp.id).length}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 text-[11px] font-bold border border-indigo-200">
                      {getAssignedTools(emp.id).length}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={emp.status === 'Active' ? 'success' : 'danger'}>{emp.status}</Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform inline" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setIsAddMode(false); }} 
        title={isAddMode ? 'Onboard New Employee' : 'Employee Profile'}
      >
        {isAddMode ? (
          <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-accent p-2.5 rounded-xl border-none outline-none" placeholder="e.g. Alice Smith" />
             </div>
             <div className="space-y-2">
                <label className="text-sm font-medium">Work Email</label>
                <input value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-accent p-2.5 rounded-xl border-none outline-none" placeholder="e.g. alice@company.com" />
             </div>
             <div className="space-y-2">
                <label className="text-sm font-medium">Department Role</label>
                <CustomSelect 
                  value={role} 
                  onChange={val => setRole(val)} 
                  options={[
                    { value: 'Engineer', label: 'Engineer' },
                    { value: 'Designer', label: 'Designer' },
                    { value: 'Manager', label: 'Manager' },
                    { value: 'Support', label: 'Support' }
                  ]}
                />
             </div>
             <div className="flex gap-3 pt-4">
               <Button variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancel</Button>
               <Button className="flex-1" onClick={handleAdd}>Complete Onboarding</Button>
             </div>
          </div>
        ) : selectedEmployee ? (
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center space-y-3 pb-6 border-b">
              <div className="w-24 h-24 rounded-3xl bg-slate-100 flex items-center justify-center text-3xl font-bold border shadow-inner">
                {selectedEmployee.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{selectedEmployee.name}</h2>
                <p className="text-muted-foreground font-medium">{selectedEmployee.role}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Assigned Inventory</h3>
                <div className="space-y-3">
                   <div className="bg-accent/30 rounded-2xl p-4">
                      <span className="text-sm font-bold block mb-2">Hardware</span>
                      <ul className="space-y-2">
                        {getAssignedHardware(selectedEmployee.id).map(h => (
                          <li key={h.id} className="text-xs bg-white dark:bg-slate-800 p-2 rounded-lg border flex justify-between">
                            <span>{h.name}</span>
                            <span className="opacity-50">{h.serialNumber}</span>
                          </li>
                        ))}
                        {getAssignedHardware(selectedEmployee.id).length === 0 && <p className="text-xs italic text-muted-foreground">No hardware assigned.</p>}
                      </ul>
                   </div>
                   <div className="bg-accent/30 rounded-2xl p-4">
                      <span className="text-sm font-bold block mb-2">Tools</span>
                      <div className="flex flex-wrap gap-2">
                        {getAssignedTools(selectedEmployee.id).map(t => (
                          <Badge key={t.id} variant="info">{t.name}</Badge>
                        ))}
                         {getAssignedTools(selectedEmployee.id).length === 0 && <p className="text-xs italic text-muted-foreground">No tools assigned.</p>}
                      </div>
                   </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>Close</Button>
              {can('employees.deactivate') && (
                <Button 
                  variant={selectedEmployee.status === 'Active' ? 'danger' : 'success'} 
                  className="flex-1"
                  onClick={() => {
                    updateEmployee(selectedEmployee.id, { status: selectedEmployee.status === 'Active' ? 'Inactive' : 'Active' });
                    setIsModalOpen(false);
                  }}
                >
                  {selectedEmployee.status === 'Active' ? 'Deactivate' : 'Activate'}
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};
