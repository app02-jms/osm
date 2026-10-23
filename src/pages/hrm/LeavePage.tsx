import { useState, useMemo } from 'react';
import { useLeaveLedger, useEmployees, useHrmSettings, genId, getLeaveBalance } from '@/hrm/store';
import type { LeaveEntry, LeaveEntryType } from '@/hrm/types';
import { Button, Badge, Select, TextInput, Field } from '@/components/ui';
import { BookOpen, Plus, Save, TrendingUp, TrendingDown, Minus, PlusCircle, Wallet } from 'lucide-react';
import { localDateStr } from '@/hrm/dateUtils';

const TYPE_CONFIG: Record<LeaveEntryType, { label: string; color: 'primary' | 'success' | 'danger' | 'info'; sign: string }> = {
  opening: { label: 'Mở đầu', color: 'info', sign: '·' },
  accrual: { label: 'Tích lũy', color: 'success', sign: '+' },
  used: { label: 'Sử dụng', color: 'danger', sign: '-' },
  manual: { label: 'Điều chỉnh', color: 'primary', sign: '±' },
};

export default function LeavePage() {
  const [entries, setEntries] = useLeaveLedger();
  const [employees] = useEmployees();
  const [settings] = useHrmSettings();
  const [selectedEmp, setSelectedEmp] = useState<string>(employees[0]?.id ?? '');
  const [showAdjust, setShowAdjust] = useState(false);

  const employeesWithLeave = useMemo(() => employees.filter((e) => e.has_leave), [employees]);

  // Ensure selected employee has leave
  const currentEmpId = employeesWithLeave.find((e) => e.id === selectedEmp)?.id ?? employeesWithLeave[0]?.id ?? '';

  const empEntries = useMemo(() => {
    return entries
      .filter((e) => e.employee_id === currentEmpId)
      .sort((a, b) => b.entry_date.localeCompare(a.entry_date));
  }, [entries, currentEmpId]);

  const balance = useMemo(() => getLeaveBalance(entries, currentEmpId), [entries, currentEmpId]);

  const empName = (id: string) => employees.find((e) => e.id === id)?.display_name ?? '—';

  const handleAddManual = (days: number, note: string) => {
    const entry: LeaveEntry = {
      id: genId('l_'),
      employee_id: currentEmpId,
      entry_date: localDateStr(),
      type: 'manual',
      days,
      note,
      created_by: 'admin',
    };
    setEntries((prev) => [...prev, entry]);
    setShowAdjust(false);
  };

  // Stats
  const opening = empEntries.filter((e) => e.type === 'opening').reduce((s, e) => s + e.days, 0);
  const accrual = empEntries.filter((e) => e.type === 'accrual').reduce((s, e) => s + e.days, 0);
  const used = empEntries.filter((e) => e.type === 'used').reduce((s, e) => s + e.days, 0);
  const manual = empEntries.filter((e) => e.type === 'manual').reduce((s, e) => s + e.days, 0);

  return (
    <div className="px-8 pt-6 pb-8">
      {/* Page header */}
      <div className="mb-6">
        <nav className="flex items-center gap-1.5 text-xs font-medium text-info mb-2">
          <span>HRM</span>
          <span className="text-line">›</span>
          <span className="text-ink">Sổ phép</span>
        </nav>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-ink leading-tight">Sổ phép</h1>
              <p className="text-sm text-info mt-0.5">Theo dõi ngày phép còn lại và lịch sử nghỉ phép.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={currentEmpId} onChange={(e) => setSelectedEmp(e.target.value)} className="w-auto min-w-[180px]">
              {employeesWithLeave.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.display_name}</option>
              ))}
            </Select>
            <Button onClick={() => setShowAdjust(true)} disabled={!currentEmpId}>
              <Plus className="w-4 h-4" /> Điều chỉnh phép
            </Button>
          </div>
        </div>
      </div>

      {!currentEmpId ? (
        <div className="bg-card rounded-xl border border-line/30 py-12 text-center">
          <BookOpen className="w-10 h-10 text-line mx-auto mb-2" />
          <p className="text-sm text-info">Chưa có nhân viên nào có quyền phép</p>
        </div>
      ) : (
        <>
          {/* Balance cards */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            <div className="bg-card rounded-xl border border-line/30 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-info">Số dư hiện tại</span>
              </div>
              <p className="text-2xl font-bold text-ink">{balance.toFixed(1)}</p>
              <p className="text-xs text-line mt-0.5">ngày phép</p>
            </div>
            <div className="bg-card rounded-xl border border-line/30 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 flex items-center justify-center text-info text-xs">·</div>
                <span className="text-xs font-medium text-info">Mở đầu</span>
              </div>
              <p className="text-2xl font-bold text-info">{opening.toFixed(1)}</p>
              <p className="text-xs text-line mt-0.5">ngày</p>
            </div>
            <div className="bg-card rounded-xl border border-line/30 p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-success" />
                <span className="text-xs font-medium text-info">Tích lũy</span>
              </div>
              <p className="text-2xl font-bold text-success">+{accrual.toFixed(1)}</p>
              <p className="text-xs text-line mt-0.5">ngày</p>
            </div>
            <div className="bg-card rounded-xl border border-line/30 p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-danger" />
                <span className="text-xs font-medium text-info">Sử dụng</span>
              </div>
              <p className="text-2xl font-bold text-danger">-{Math.abs(used).toFixed(1)}</p>
              <p className="text-xs text-line mt-0.5">ngày</p>
            </div>
            <div className="bg-card rounded-xl border border-line/30 p-4">
              <div className="flex items-center gap-2 mb-2">
                <PlusCircle className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-info">Điều chỉnh</span>
              </div>
              <p className={`text-2xl font-bold ${manual >= 0 ? 'text-primary' : 'text-danger'}`}>
                {manual >= 0 ? '+' : ''}{manual.toFixed(1)}
              </p>
              <p className="text-xs text-line mt-0.5">ngày</p>
            </div>
          </div>

          {/* Accrual rate notice */}
          <div className="mb-4 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary-soft/30 border border-primary/10 text-xs text-info">
            <TrendingUp className="w-3.5 h-3.5 text-success" />
            <span>Tỷ lệ tích lũy: <strong className="text-ink">{settings.monthly_leave_accrual} ngày/tháng</strong></span>
          </div>

          {/* Transaction table */}
          <div className="bg-card rounded-xl border border-line/30 overflow-hidden">
            <div className="px-5 py-3 border-b border-line/30">
              <h3 className="text-sm font-semibold text-ink">Lịch sử giao dịch phép — {empName(currentEmpId)}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line/30 text-info text-xs bg-bg-main/50">
                    <th className="text-left py-3 px-4 font-medium">Ngày</th>
                    <th className="text-left py-3 px-4 font-medium">Loại</th>
                    <th className="text-right py-3 px-4 font-medium">Số ngày</th>
                    <th className="text-right py-3 px-4 font-medium">Số dư</th>
                    <th className="text-left py-3 px-4 font-medium">Ghi chú</th>
                    <th className="text-left py-3 px-4 font-medium">Người tạo</th>
                  </tr>
                </thead>
                <tbody>
                  {empEntries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center">
                        <BookOpen className="w-8 h-8 text-line mx-auto mb-2" />
                        <p className="text-sm text-info">Chưa có giao dịch phép nào</p>
                      </td>
                    </tr>
                  ) : (
                    empEntries.map((entry, i) => {
                      const cfg = TYPE_CONFIG[entry.type];
                      const runningBalance = empEntries
                        .slice(i)
                        .reduce((sum, e) => sum + e.days, 0);
                      return (
                        <tr key={entry.id} className="border-b border-line/20 hover:bg-bg-main/30 transition-colors">
                          <td className="py-3 px-4 text-info font-mono text-xs">{entry.entry_date}</td>
                          <td className="py-3 px-4">
                            <Badge color={cfg.color}>{cfg.label}</Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className={`font-medium ${entry.days > 0 ? 'text-success' : entry.days < 0 ? 'text-danger' : 'text-info'}`}>
                              {entry.days > 0 ? '+' : ''}{entry.days.toFixed(1)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right text-info font-medium">{runningBalance.toFixed(1)}</td>
                          <td className="py-3 px-4 text-info text-xs">{entry.note || '—'}</td>
                          <td className="py-3 px-4 text-info text-xs">{entry.created_by}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Manual adjustment modal */}
      {showAdjust && currentEmpId && (
        <ManualAdjustModal
          employeeName={empName(currentEmpId)}
          currentBalance={balance}
          onSave={handleAddManual}
          onClose={() => setShowAdjust(false)}
        />
      )}
    </div>
  );
}

function ManualAdjustModal({
  employeeName,
  currentBalance,
  onSave,
  onClose,
}: {
  employeeName: string;
  currentBalance: number;
  onSave: (days: number, note: string) => void;
  onClose: () => void;
}) {
  const [direction, setDirection] = useState<'add' | 'subtract'>('add');
  const [amount, setAmount] = useState('1');
  const [note, setNote] = useState('');

  const submit = () => {
    const n = parseFloat(amount);
    if (isNaN(n) || n <= 0 || !note.trim()) return;
    const signed = direction === 'add' ? n : -n;
    onSave(signed, note.trim());
  };

  const newBalance = currentBalance + (direction === 'add' ? parseFloat(amount) || 0 : -(parseFloat(amount) || 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card rounded-2xl shadow-2xl border border-line/30 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line/30">
          <h3 className="text-base font-semibold text-ink">Điều chỉnh phép — {employeeName}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-info hover:bg-primary-soft/40 transition-colors">✕</button>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div className="p-3 rounded-lg bg-primary-soft/20 border border-primary/10 flex items-center justify-between">
            <span className="text-xs text-info">Số dư hiện tại</span>
            <span className="text-lg font-bold text-ink">{currentBalance.toFixed(1)} ngày</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setDirection('add')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                direction === 'add'
                  ? 'bg-success/10 text-success border-success/30'
                  : 'bg-bg-main text-info border-line/30 hover:border-line'
              }`}
            >
              <Plus className="w-4 h-4" /> Cộng ngày
            </button>
            <button
              onClick={() => setDirection('subtract')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                direction === 'subtract'
                  ? 'bg-danger/10 text-danger border-danger/30'
                  : 'bg-bg-main text-info border-line/30 hover:border-line'
              }`}
            >
              <Minus className="w-4 h-4" /> Trừ ngày
            </button>
          </div>

          <Field label="Số ngày">
            <TextInput type="number" step="0.5" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>

          <Field label="Ghi chú (bắt buộc)">
            <TextInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="Lý do điều chỉnh phép" autoFocus />
          </Field>

          <div className="p-3 rounded-lg bg-bg-main border border-line/20 flex items-center justify-between">
            <span className="text-xs text-info">Số dư sau điều chỉnh</span>
            <span className={`text-lg font-bold ${newBalance >= 0 ? 'text-ink' : 'text-danger'}`}>{newBalance.toFixed(1)} ngày</span>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-line/30 flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Hủy</Button>
          <Button onClick={submit} disabled={!note.trim() || !amount}><Save className="w-3.5 h-3.5" /> Lưu điều chỉnh</Button>
        </div>
      </div>
    </div>
  );
}
