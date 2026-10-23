import { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import { useShifts, useDepartments, useWorkStatuses, useHrmSettings, genId } from '@/hrm/store';
import type { Shift, Department, WorkStatus, ShiftKind } from '@/hrm/types';
import { Field, TextInput, Select, Toggle, Button, Badge } from '@/components/ui';
import { Settings, Clock, MapPin, Building2, CalendarOff, Plus, Pencil, Trash2, Save, MapPinCheck } from 'lucide-react';

const TABS = [
  { key: 'shifts', label: 'Ca làm việc' },
  { key: 'gps', label: 'Quy tắc Chấm công & GPS' },
  { key: 'dept-status', label: 'Bộ phận & Trạng thái' },
  { key: 'leave', label: 'Cài đặt Sổ phép' },
];

export default function HrmConfigPage() {
  const [activeTab, setActiveTab] = useState('shifts');

  return (
    <div className="px-8 pt-6 pb-8">
      <PageHeader
        path="/hrm/config"
        icon={Settings}
        title="Cấu hình HRM"
        subtitle="Thiết lập ca làm việc, phòng ban và quy tắc chấm công."
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === 'shifts' && <ShiftsTab />}
      {activeTab === 'gps' && <GpsTab />}
      {activeTab === 'dept-status' && <DeptStatusTab />}
      {activeTab === 'leave' && <LeaveTab />}
    </div>
  );
}

// ── Tab 1: Shifts ──────────────────────────────────────────────
function ShiftsTab() {
  const [shifts, setShifts] = useShifts();
  const [editing, setEditing] = useState<Shift | null>(null);
  const [showForm, setShowForm] = useState(false);

  const blankShift = (): Shift => ({ id: genId('s_'), code: '', name: '', start_time: '', end_time: '', kind: 'work', deducts_leave: false });

  const handleSave = (shift: Shift) => {
    setShifts((prev) => {
      const exists = prev.some((s) => s.id === shift.id);
      return exists ? prev.map((s) => (s.id === shift.id ? shift : s)) : [...prev, shift];
    });
    setShowForm(false);
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    setShifts((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="bg-card rounded-xl border border-line/30 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-ink">Danh sách ca làm việc</h3>
        </div>
        <Button size="sm" onClick={() => { setEditing(blankShift()); setShowForm(true); }}>
          <Plus className="w-3.5 h-3.5" /> Thêm ca
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line/30 text-info text-xs">
              <th className="text-left py-2.5 px-3 font-medium">Mã</th>
              <th className="text-left py-2.5 px-3 font-medium">Tên ca</th>
              <th className="text-left py-2.5 px-3 font-medium">Bắt đầu</th>
              <th className="text-left py-2.5 px-3 font-medium">Kết thúc</th>
              <th className="text-left py-2.5 px-3 font-medium">Loại</th>
              <th className="text-left py-2.5 px-3 font-medium">Trừ phép</th>
              <th className="text-right py-2.5 px-3 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {shifts.map((s) => (
              <tr key={s.id} className="border-b border-line/20 hover:bg-bg-main/50 transition-colors">
                <td className="py-2.5 px-3"><span className="font-mono font-medium text-ink">{s.code}</span></td>
                <td className="py-2.5 px-3 text-ink">{s.name}</td>
                <td className="py-2.5 px-3 text-info">{s.start_time || '—'}</td>
                <td className="py-2.5 px-3 text-info">{s.end_time || '—'}</td>
                <td className="py-2.5 px-3">
                  <Badge color={s.kind === 'work' ? 'primary' : 'info'}>
                    {s.kind === 'work' ? 'Làm việc' : 'Nghỉ'}
                  </Badge>
                </td>
                <td className="py-2.5 px-3">
                  {s.deducts_leave ? <Badge color="danger">Có</Badge> : <span className="text-line text-xs">Không</span>}
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => { setEditing(s); setShowForm(true); }} className="p-1.5 rounded text-info hover:bg-primary-soft/40 transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded text-danger hover:bg-danger/10 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && editing && (
        <ShiftFormModal
          shift={editing}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}
    </div>
  );
}

function ShiftFormModal({ shift, onSave, onClose }: { shift: Shift; onSave: (s: Shift) => void; onClose: () => void }) {
  const [form, setForm] = useState<Shift>(shift);

  const submit = () => {
    if (!form.code.trim() || !form.name.trim()) return;
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-card rounded-2xl shadow-2xl border border-line/30 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line/30">
          <h3 className="text-base font-semibold text-ink">{shift.code ? 'Sửa ca làm việc' : 'Thêm ca làm việc'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-info hover:bg-primary-soft/40 transition-colors">✕</button>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Mã ca">
              <TextInput value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="VD: S, C, D" />
            </Field>
            <Field label="Tên ca">
              <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="VD: Ca Sáng" />
            </Field>
            <Field label="Giờ bắt đầu">
              <TextInput type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} disabled={form.kind === 'off'} />
            </Field>
            <Field label="Giờ kết thúc">
              <TextInput type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} disabled={form.kind === 'off'} />
            </Field>
          </div>
          <Field label="Loại ca">
            <Select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as ShiftKind, ...(e.target.value === 'off' ? { start_time: '', end_time: '' } : {}) })}>
              <option value="work">Làm việc</option>
              <option value="off">Nghỉ</option>
            </Select>
          </Field>
          <div className="flex items-center gap-3">
            <Toggle checked={form.deducts_leave} onChange={(v) => setForm({ ...form, deducts_leave: v })} />
            <span className="text-sm text-ink">Trừ ngày phép khi sử dụng ca này</span>
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

// ── Tab 2: GPS Settings ────────────────────────────────────────
function GpsTab() {
  const [settings, setSettings] = useHrmSettings();
  const [gettingLocation, setGettingLocation] = useState(false);
  const [saved, setSaved] = useState(false);

  const update = (patch: Partial<typeof settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
    setSaved(false);
  };

  const getCurrentLocation = () => {
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        update({ hotel_lat: pos.coords.latitude, hotel_lng: pos.coords.longitude });
        setGettingLocation(false);
      },
      () => {
        setGettingLocation(false);
        alert('Không thể lấy vị trí hiện tại. Vui lòng kiểm tra quyền truy cập vị trí.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-card rounded-xl border border-line/30 p-6 max-w-2xl">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-ink">Quy tắc Chấm công & GPS</h3>
      </div>

      <div className="space-y-5">
        {/* Hotel location */}
        <div className="p-4 rounded-lg bg-primary-soft/20 border border-primary/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-ink">Vị trí khách sạn</span>
            <Button size="sm" variant="secondary" onClick={getCurrentLocation} disabled={gettingLocation}>
              <MapPinCheck className="w-3.5 h-3.5" /> {gettingLocation ? 'Đang lấy vị trí...' : 'Lấy vị trí hiện tại'}
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Vĩ độ (Latitude)">
              <TextInput type="number" step="0.0001" value={settings.hotel_lat} onChange={(e) => update({ hotel_lat: parseFloat(e.target.value) || 0 })} />
            </Field>
            <Field label="Kinh độ (Longitude)">
              <TextInput type="number" step="0.0001" value={settings.hotel_lng} onChange={(e) => update({ hotel_lng: parseFloat(e.target.value) || 0 })} />
            </Field>
          </div>
        </div>

        {/* Geofence settings */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Bán kính chấm công (mét)">
            <TextInput type="number" value={settings.radius_m} onChange={(e) => update({ radius_m: parseInt(e.target.value) || 0 })} />
          </Field>
          <Field label="Dung sai GPS (mét)">
            <TextInput type="number" value={settings.tolerance} onChange={(e) => update({ tolerance: parseInt(e.target.value) || 0 })} />
          </Field>
          <Field label="Cửa sổ trước ca (phút)">
            <TextInput type="number" value={settings.window_before} onChange={(e) => update({ window_before: parseInt(e.target.value) || 0 })} />
          </Field>
          <Field label="Cửa sổ sau ca (phút)">
            <TextInput type="number" value={settings.window_after} onChange={(e) => update({ window_after: parseInt(e.target.value) || 0 })} />
          </Field>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleSave}><Save className="w-3.5 h-3.5" /> {saved ? 'Đã lưu!' : 'Lưu cấu hình'}</Button>
          {saved && <span className="text-xs text-success font-medium">Cấu hình đã được cập nhật</span>}
        </div>
      </div>
    </div>
  );
}

// ── Tab 3: Departments & Statuses ──────────────────────────────
function DeptStatusTab() {
  const [departments, setDepartments] = useDepartments();
  const [statuses, setStatuses] = useWorkStatuses();
  const [newDept, setNewDept] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [newCanSchedule, setNewCanSchedule] = useState(true);

  const addDept = () => {
    if (!newDept.trim()) return;
    setDepartments((prev) => [...prev, { id: genId('d_'), name: newDept.trim() }]);
    setNewDept('');
  };

  const deleteDept = (id: string) => {
    setDepartments((prev) => prev.filter((d) => d.id !== id));
  };

  const addStatus = () => {
    if (!newStatus.trim()) return;
    setStatuses((prev) => [...prev, { id: genId('w_'), name: newStatus.trim(), can_schedule_and_clock: newCanSchedule }]);
    setNewStatus('');
    setNewCanSchedule(true);
  };

  const toggleStatus = (id: string) => {
    setStatuses((prev) => prev.map((s) => s.id === id ? { ...s, can_schedule_and_clock: !s.can_schedule_and_clock } : s));
  };

  const deleteStatus = (id: string) => {
    setStatuses((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Departments */}
      <div className="bg-card rounded-xl border border-line/30 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-ink">Bộ phận</h3>
        </div>
        <div className="space-y-2 mb-4">
          {departments.map((d) => (
            <div key={d.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-bg-main border border-line/20">
              <span className="text-sm text-ink">{d.name}</span>
              <button onClick={() => deleteDept(d.id)} className="p-1 rounded text-danger hover:bg-danger/10 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {departments.length === 0 && <p className="text-xs text-line text-center py-4">Chưa có bộ phận nào</p>}
        </div>
        <div className="flex gap-2">
          <TextInput value={newDept} onChange={(e) => setNewDept(e.target.value)} placeholder="Tên bộ phận" onKeyDown={(e) => e.key === 'Enter' && addDept()} />
          <Button onClick={addDept}><Plus className="w-3.5 h-3.5" /></Button>
        </div>
      </div>

      {/* Work Statuses */}
      <div className="bg-card rounded-xl border border-line/30 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Badge color="primary">Trạng thái</Badge>
          <h3 className="text-sm font-semibold text-ink">Trạng thái làm việc</h3>
        </div>
        <div className="space-y-2 mb-4">
          {statuses.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-bg-main border border-line/20">
              <div className="flex items-center gap-2.5">
                <Toggle checked={s.can_schedule_and_clock} onChange={() => toggleStatus(s.id)} />
                <div>
                  <span className="text-sm text-ink block">{s.name}</span>
                  <span className="text-[10px] text-info">{s.can_schedule_and_clock ? 'Có thể phân lịch & chấm công' : 'Không phân lịch'}</span>
                </div>
              </div>
              <button onClick={() => deleteStatus(s.id)} className="p-1 rounded text-danger hover:bg-danger/10 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <TextInput value={newStatus} onChange={(e) => setNewStatus(e.target.value)} placeholder="Tên trạng thái" onKeyDown={(e) => e.key === 'Enter' && addStatus()} />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Toggle checked={newCanSchedule} onChange={setNewCanSchedule} />
              <span className="text-xs text-info">Cho phép phân lịch & chấm công</span>
            </div>
            <Button size="sm" onClick={addStatus}><Plus className="w-3.5 h-3.5" /> Thêm</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tab 4: Leave Settings ──────────────────────────────────────
function LeaveTab() {
  const [settings, setSettings] = useHrmSettings();
  const [saved, setSaved] = useState(false);

  const update = (patch: Partial<typeof settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-card rounded-xl border border-line/30 p-6 max-w-md">
      <div className="flex items-center gap-2 mb-4">
        <CalendarOff className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-ink">Cài đặt Sổ phép</h3>
      </div>
      <Field label="Tỷ lệ tích lũy phép tháng (ngày/tháng)">
        <TextInput
          type="number"
          step="0.1"
          min="0"
          value={settings.monthly_leave_accrual}
          onChange={(e) => update({ monthly_leave_accrual: parseFloat(e.target.value) || 0 })}
        />
      </Field>
      <p className="text-xs text-info mt-2">
        Mỗi tháng, hệ thống sẽ tự động cộng thêm số ngày phép này vào sổ phép của nhân viên có quyền phép.
      </p>
      <div className="flex items-center gap-3 pt-4">
        <Button onClick={handleSave}><Save className="w-3.5 h-3.5" /> {saved ? 'Đã lưu!' : 'Lưu'}</Button>
        {saved && <span className="text-xs text-success font-medium">Đã cập nhật</span>}
      </div>
    </div>
  );
}
