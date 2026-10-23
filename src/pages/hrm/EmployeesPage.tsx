import { useState, useMemo } from 'react';
import { useEmployees, useDepartments, useWorkStatuses, nextEmployeeCode, genId } from '@/hrm/store';
import type { Employee } from '@/hrm/types';
import { Field, TextInput, Select, Toggle, Button, Badge } from '@/components/ui';
import { Users, Plus, Pencil, Trash2, Search, Save, Phone, Calendar, Briefcase } from 'lucide-react';

const TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'active', label: 'Đang làm việc' },
  { key: 'inactive', label: 'Đã nghỉ việc' },
];

export default function EmployeesPage() {
  const [employees, setEmployees] = useEmployees();
  const [departments] = useDepartments();
  const [statuses] = useWorkStatuses();
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);

  const deptName = (id: string) => departments.find((d) => d.id === id)?.name ?? '—';
  const statusName = (id: string) => statuses.find((s) => s.id === id)?.name ?? '—';
  const statusObj = (id: string) => statuses.find((s) => s.id === id);

  const filtered = useMemo(() => {
    let list = employees;
    if (activeTab === 'active') {
      list = list.filter((e) => statusObj(e.status_id)?.can_schedule_and_clock);
    } else if (activeTab === 'inactive') {
      list = list.filter((e) => !statusObj(e.status_id)?.can_schedule_and_clock);
    }
    if (filterDept) list = list.filter((e) => e.department_id === filterDept);
    if (filterStatus) list = list.filter((e) => e.status_id === filterStatus);
    if (search.trim()) {
      const q = (search || '').toLowerCase();
      list = list.filter((e) =>
        (e.display_name || '').toLowerCase().includes(q) ||
        (e.employee_code || '').toLowerCase().includes(q) ||
        (e.job_title || '').toLowerCase().includes(q)
      );
    }
    return list;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employees, activeTab, filterDept, filterStatus, search, departments, statuses]);

  const blankEmployee = (): Employee => ({
    id: genId('e_'),
    employee_code: nextEmployeeCode(employees),
    display_name: '',
    full_name: '',
    department_id: departments[0]?.id ?? '',
    job_title: '',
    phone: '',
    start_date: new Date().toISOString().slice(0, 10),
    status_id: statuses[0]?.id ?? '',
    has_leave: true,
    opening_leave_balance: 12,
    user_id: null,
  });

  const handleSave = (emp: Employee) => {
    setEmployees((prev) => {
      const exists = prev.some((e) => e.id === emp.id);
      return exists ? prev.map((e) => (e.id === emp.id ? emp : e)) : [...prev, emp];
    });
    setShowForm(false);
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div className="px-8 pt-6 pb-8">
      {/* Page header with tabs */}
      <div className="mb-6">
        <nav className="flex items-center gap-1.5 text-xs font-medium text-info mb-2">
          <span>HRM</span>
          <span className="text-line">›</span>
          <span className="text-ink">Hồ sơ nhân viên</span>
        </nav>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-ink leading-tight">Hồ sơ nhân viên</h1>
              <p className="text-sm text-info mt-0.5">Quản lý thông tin và hồ sơ của nhân viên khách sạn.</p>
            </div>
          </div>
          <Button onClick={() => { setEditing(blankEmployee()); setShowForm(true); }}>
            <Plus className="w-4 h-4" /> Thêm nhân viên
          </Button>
        </div>
        <div className="mt-4 inline-flex gap-1 bg-primary-soft/30 border border-line/40 rounded-lg p-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                activeTab === tab.key ? 'bg-primary text-white shadow-sm' : 'text-info hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-line/30 p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-line" />
            <TextInput
              className="pl-10"
              placeholder="Tìm theo tên, mã NV, chức vụ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="w-auto">
            <option value="">Tất cả bộ phận</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
          <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-auto">
            <option value="">Tất cả trạng thái</option>
            {statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-line/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line/30 text-info text-xs bg-bg-main/50">
                <th className="text-left py-3 px-4 font-medium">Mã NV</th>
                <th className="text-left py-3 px-4 font-medium">Họ tên</th>
                <th className="text-left py-3 px-4 font-medium">Bộ phận</th>
                <th className="text-left py-3 px-4 font-medium">Chức vụ</th>
                <th className="text-left py-3 px-4 font-medium">Điện thoại</th>
                <th className="text-left py-3 px-4 font-medium">Trạng thái</th>
                <th className="text-left py-3 px-4 font-medium">Phép</th>
                <th className="text-right py-3 px-4 font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => {
                const st = statusObj(emp.status_id);
                return (
                  <tr key={emp.id} className="border-b border-line/20 hover:bg-bg-main/40 transition-colors">
                    <td className="py-3 px-4"><span className="font-mono text-xs font-medium text-ink">{emp.employee_code}</span></td>
                    <td className="py-3 px-4"><span className="font-medium text-ink">{emp.display_name}</span></td>
                    <td className="py-3 px-4 text-info">{deptName(emp.department_id)}</td>
                    <td className="py-3 px-4 text-info">{emp.job_title}</td>
                    <td className="py-3 px-4 text-info">{emp.phone || '—'}</td>
                    <td className="py-3 px-4">
                      <Badge color={st?.can_schedule_and_clock ? 'success' : 'danger'}>{statusName(emp.status_id)}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      {emp.has_leave ? <Badge color="primary">Có</Badge> : <span className="text-line text-xs">Không</span>}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setEditing(emp); setShowForm(true); }} className="p-1.5 rounded text-info hover:bg-primary-soft/40 transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(emp.id)} className="p-1.5 rounded text-danger hover:bg-danger/10 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <Users className="w-10 h-10 text-line mx-auto mb-2" />
            <p className="text-sm text-info">Không tìm thấy nhân viên nào</p>
          </div>
        )}
      </div>

      {showForm && editing && (
        <EmployeeFormModal
          employee={editing}
          departments={departments}
          statuses={statuses}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}
    </div>
  );
}

function EmployeeFormModal({
  employee,
  departments,
  statuses,
  onSave,
  onClose,
}: {
  employee: Employee;
  departments: { id: string; name: string }[];
  statuses: { id: string; name: string; can_schedule_and_clock: boolean }[];
  onSave: (e: Employee) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Employee>(employee);
  const isNew = !employee.display_name;

  const submit = () => {
    if (!form.display_name.trim()) return;
    onSave({
      ...form,
      full_name: form.full_name.trim() || form.display_name.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-card rounded-2xl shadow-2xl border border-line/30 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line/30">
          <h3 className="text-base font-semibold text-ink">{isNew ? 'Thêm nhân viên' : 'Sửa thông tin nhân viên'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-info hover:bg-primary-soft/40 transition-colors">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Mã nhân viên">
              <TextInput value={form.employee_code} readOnly className="bg-primary-soft/20 text-info" />
            </Field>
            <Field label="Ngày bắt đầu">
              <TextInput type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </Field>
          </div>
          <Field label="Tên hiển thị">
            <TextInput value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} placeholder="VD: Nguyễn Văn An" autoFocus />
          </Field>
          <Field label="Họ tên đầy đủ">
            <TextInput value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Bỏ trống nếu giống tên hiển thị" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Bộ phận">
              <Select value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })}>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
            </Field>
            <Field label="Chức vụ">
              <TextInput value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} placeholder="VD: Lễ tân" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Số điện thoại">
 <TextInput value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0901234567" />
            </Field>
            <Field label="Trạng thái làm việc">
              <Select value={form.status_id} onChange={(e) => setForm({ ...form, status_id: e.target.value })}>
                {statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </Field>
          </div>
          <div className="p-4 rounded-lg bg-primary-soft/20 border border-primary/10 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-ink">Có quyền phép</span>
                <p className="text-xs text-info">Bật nếu nhân viên được tích lũy ngày phép</p>
              </div>
              <Toggle checked={form.has_leave} onChange={(v) => setForm({ ...form, has_leave: v })} />
            </div>
            {form.has_leave && (
              <Field label="Số dư phép mở đầu (ngày)">
                <TextInput type="number" step="0.5" min="0" value={form.opening_leave_balance} onChange={(e) => setForm({ ...form, opening_leave_balance: parseFloat(e.target.value) || 0 })} />
              </Field>
            )}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-line/30 flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Hủy</Button>
          <Button onClick={submit}><Save className="w-3.5 h-3.5" /> Lưu</Button>
        </div>
      </div>
    </div>
  );
}
