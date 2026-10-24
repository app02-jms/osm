import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  useClosures,
  useAttendanceLogs,
  useEmployees,
  useDepartments,
  useShifts,
  useLeaveLedger,
  genId,
  buildDailyBreakdown,
  computeWorkedHours,
  computeDailyOTHours,
} from '@/hrm/store';
import { useHrmPermission } from '@/hrm/usePermission';
import type {
  TimesheetClosure,
  EmployeeSummary,
  ClosureStatus,
  OTApprovalStatus,
  WorkerConfirmation,
  DailyBreakdownEntry,
} from '@/hrm/types';
import { Button, Badge, TextInput, Select, Field } from '@/components/ui';
import {
  ClipboardCheck,
  Rocket,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Search,
  Download,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  CalendarRange,
  UserCheck,
  MessageSquareWarning,
} from 'lucide-react';
import { localDateStr, localDateTimeStr, formatDateDisplay, formatDateTimeDisplay } from '@/hrm/dateUtils';

// ── OT threshold ──────────────────────────────────────────────
const OT_THRESHOLD_HOURS = 10;

// ── Helpers ───────────────────────────────────────────────────
function monthRange(year: number, month: number): { start: string; end: string } {
  const start = localDateStr(new Date(year, month, 1));
  const end = localDateStr(new Date(year, month + 1, 0));
  return { start, end };
}

function defaultLockDeadline(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  d.setHours(23, 59, 0, 0);
  return localDateTimeStr(d);
}

function isLocked(closure: TimesheetClosure): boolean {
  if (closure.status === 'locked') return true;
  return new Date().getTime() >= new Date(closure.lock_deadline).getTime();
}

// ── Summary builder ───────────────────────────────────────────
function buildEmployeeSummaries(
  logs: { employee_id: string; date: string; clock_in: string | null; clock_out: string | null; status: string }[],
  leaveEntries: { employee_id: string; entry_date: string; days: number }[],
  employeeIds: string[],
  startDate: string,
  endDate: string
): EmployeeSummary[] {
  return employeeIds.map((empId) => {
    const empLogs = logs.filter(
      (l) => l.employee_id === empId && l.date >= startDate && l.date <= endDate && l.status !== 'rejected'
    );
    const totalWorkDays = empLogs.filter((l) => l.clock_in).length;
    const leaveDays = leaveEntries
      .filter((e) => e.employee_id === empId && e.entry_date >= startDate && e.entry_date <= endDate)
      .reduce((sum, e) => sum + Math.abs(e.days), 0);

    let rawOtHours = 0;
    for (const l of empLogs) {
      rawOtHours += computeDailyOTHours(l.clock_in, l.clock_out);
    }
    rawOtHours = Math.round(rawOtHours * 100) / 100;

    return {
      employee_id: empId,
      total_work_days: totalWorkDays,
      total_leave_days: Math.round(leaveDays * 100) / 100,
      raw_ot_hours: rawOtHours,
      approved_ot_hours: 0,
      ot_approval_status: 'pending' as OTApprovalStatus,
      worker_confirmation: 'pending' as WorkerConfirmation,
      dispute_reason: '',
    };
  });
}

// ── Dispute Modal ─────────────────────────────────────────────
interface DisputeModalProps {
  employeeName: string;
  breakdown: DailyBreakdownEntry[];
  onSave: (reason: string) => void;
  onClose: () => void;
}

function DisputeModal({ employeeName, breakdown, onSave, onClose }: DisputeModalProps) {
  const [reason, setReason] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('');

  const submit = () => {
    const detail = selectedDate ? ` (Ngày ${formatDateDisplay(selectedDate)})` : '';
    onSave((reason.trim() + detail).trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card rounded-2xl shadow-2xl border border-line/30 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line/30">
          <div className="flex items-center gap-2">
            <MessageSquareWarning className="w-5 h-5 text-warning" />
            <h3 className="text-base font-semibold text-ink">Đề nghị điều chỉnh — {employeeName}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-info hover:bg-primary-soft/40 transition-colors">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div className="px-3 py-2.5 rounded-lg bg-warning/10 border border-warning/20">
            <p className="text-sm text-warning">
              Chọn ngày công cần điều chỉnh và mô tả lỗi để gửi yêu cầu cho Quản lý.
            </p>
          </div>
          <Field label="Ngày cần điều chỉnh">
            <Select value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}>
              <option value="">— Chọn ngày —</option>
              {breakdown.map((d) => (
                <option key={d.date} value={d.date}>
                  {formatDateDisplay(d.date)} — Vào {d.clock_in || '—'} / Ra {d.clock_out || '—'}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Lý do điều chỉnh (bắt buộc)">
            <TextInput
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="VD: Quên chấm ra ca, giờ ra sai..."
              autoFocus
            />
          </Field>
        </div>
        <div className="px-6 py-4 border-t border-line/30 flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Hủy</Button>
          <Button onClick={submit} disabled={!reason.trim()}>
            <MessageSquareWarning className="w-3.5 h-3.5" /> Gửi yêu cầu
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Drill-down Detail ──────────────────────────────────────────
function DailyDetailTable({ breakdown, shifts }: { breakdown: DailyBreakdownEntry[]; shifts: { id: string; code: string; name: string }[] }) {
  const shiftLabel = (id: string | null) => {
    if (!id) return '—';
    const s = shifts.find((x) => x.id === id);
    return s ? `${(s.code || '—')} · ${s.name}` : '—';
  };

  if (breakdown.length === 0) {
    return <p className="text-sm text-info py-4 text-center">Không có dữ liệu ngày công trong kỳ.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-line/30 text-info bg-bg-main/50">
            <th className="text-left py-2 px-3 font-medium">Ngày</th>
            <th className="text-left py-2 px-3 font-medium">Ca</th>
            <th className="text-left py-2 px-3 font-medium">Giờ vào</th>
            <th className="text-left py-2 px-3 font-medium">Giờ ra</th>
            <th className="text-right py-2 px-3 font-medium">Giờ làm</th>
            <th className="text-right py-2 px-3 font-medium">Tăng ca</th>
          </tr>
        </thead>
        <tbody>
          {breakdown.map((d) => (
            <tr key={d.date} className="border-b border-line/20 hover:bg-bg-main/30 transition-colors">
              <td className="py-2 px-3 text-info font-mono">{formatDateDisplay(d.date)}</td>
              <td className="py-2 px-3 text-info">{shiftLabel(d.actual_shift_id ?? d.shift_id)}</td>
              <td className="py-2 px-3 text-ink font-mono">{d.clock_in || '—'}</td>
              <td className="py-2 px-3 text-ink font-mono">{d.clock_out || '—'}</td>
              <td className="py-2 px-3 text-right text-ink font-mono">{d.worked_hours.toFixed(2)}</td>
              <td className="py-2 px-3 text-right">
                {d.daily_ot_hours > 0 ? (
                  <span className="inline-flex items-center gap-1 text-warning font-mono font-medium">
                    {d.has_long_shift_warning && <AlertTriangle className="w-3 h-3" />}
                    {d.daily_ot_hours.toFixed(2)}
                  </span>
                ) : (
                  <span className="text-line">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── CSV Export ─────────────────────────────────────────────────
function exportCSV(closure: TimesheetClosure, employees: { id: string; display_name: string; department_id: string }[], departments: { id: string; name: string }[]) {
  const deptName = (id: string) => departments.find((d) => d.id === id)?.name ?? '—';
  const header = ['Ten nhan vien', 'Bo phan', 'Ngay cong', 'Tang ca (gio)', 'Trang thai'];
  const rows = closure.employee_summaries.map((s) => {
    const emp = employees.find((e) => e.id === s.employee_id);
    const name = (emp?.display_name || '').toUpperCase();
    const dept = (deptName(emp?.department_id ?? '') || '');
    const status = closure.status === 'locked' ? 'Da khoa' : s.worker_confirmation;
    return [name, dept, String(s.total_work_days), s.approved_ot_hours.toFixed(2), status];
  });
  const csv = [header, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Bang_cong_${closure.period_name.replace(/[/\s]/g, '_')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Main Page ──────────────────────────────────────────────────
export default function PayrollPage() {
  const [closures, setClosures] = useClosures();
  const [logs] = useAttendanceLogs();
  const [employees] = useEmployees();
  const [departments] = useDepartments();
  const [shifts] = useShifts();
  const [leaveEntries] = useLeaveLedger();
  const { can, getLevel, LEVEL_RANK } = useHrmPermission();
  const canApprove = can('hrm_closures', 'approve');
  const canDelete = can('hrm_closures', 'delete');

  // Phase 1 form state
  const now = new Date();
  const [selMonth, setSelMonth] = useState<number>(now.getMonth());
  const [selYear, setSelYear] = useState<number>(now.getFullYear());
  const [useCustomRange, setUseCustomRange] = useState(false);
  const [customStart, setCustomStart] = useState(localDateStr(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [customEnd, setCustomEnd] = useState(localDateStr(new Date(now.getFullYear(), now.getMonth() + 1, 0)));
  const [lockDeadline, setLockDeadline] = useState(defaultLockDeadline());
  const [search, setSearch] = useState('');
  const [expandedEmp, setExpandedEmp] = useState<string | null>(null);
  const [disputeModalEmp, setDisputeModalEmp] = useState<string | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);

  // Auto-lock expired drafts
  useEffect(() => {
    const nowMs = Date.now();
    const hasExpired = closures.some((c) => c.status === 'draft' && new Date(c.lock_deadline).getTime() <= nowMs);
    if (hasExpired) {
      setClosures((prev) =>
        prev.map((c) =>
          c.status === 'draft' && new Date(c.lock_deadline).getTime() <= nowMs
            ? { ...c, status: 'locked' as ClosureStatus, locked_at: new Date().toISOString() }
            : c
        )
      );
    }
  }, [closures, setClosures]);

  const showToast = useCallback((ok: boolean, msg: string) => {
    setToast({ ok, msg });
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Date range from form
  const dateRange = useMemo(() => {
    if (useCustomRange) return { start: customStart, end: customEnd };
    return monthRange(selYear, selMonth);
  }, [useCustomRange, customStart, customEnd, selYear, selMonth]);

  const periodName = useMemo(() => {
    if (useCustomRange) return `Kỳ công ${formatDateDisplay(customStart)} - ${formatDateDisplay(customEnd)}`;
    return `Kỳ công Tháng ${selMonth + 1}/${selYear}`;
  }, [useCustomRange, customStart, customEnd, selMonth, selYear]);

  // Active closure (most recent draft or locked)
  const activeClosure = useMemo(() => {
    if (closures.length === 0) return null;
    return [...closures].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  }, [closures]);

  const isActiveDraft = activeClosure?.status === 'draft' && !isLocked(activeClosure);
  const isActiveLocked = activeClosure?.status === 'locked';

  // Pre-publish preview summaries (before creating a closure)
  const previewSummaries = useMemo(() => {
    if (activeClosure && activeClosure.status === 'draft') return activeClosure.employee_summaries;
    if (activeClosure && activeClosure.status === 'locked') return activeClosure.employee_summaries;
    // Build from raw data
    const empIds = employees.map((e) => e.id);
    return buildEmployeeSummaries(logs, leaveEntries, empIds, dateRange.start, dateRange.end);
  }, [activeClosure, employees, logs, leaveEntries, dateRange]);

  // Long shift warnings count
  const longShiftWarnings = useMemo(() => {
    let count = 0;
    for (const emp of employees) {
      const bd = buildDailyBreakdown(logs, emp.id, dateRange.start, dateRange.end);
      count += bd.filter((d) => d.has_long_shift_warning).length;
    }
    return count;
  }, [logs, employees, dateRange]);

  const deptName = (id: string) => departments.find((d) => d.id === id)?.name ?? '—';
  const empName = (id: string) => employees.find((e) => e.id === id)?.display_name ?? '—';
  const empDeptId = (id: string) => employees.find((e) => e.id === id)?.department_id ?? '';

  // Filtered summaries for display
  const filteredSummaries = useMemo(() => {
    let list = previewSummaries;
    if (search.trim()) {
      const q = (search || '').toLowerCase();
      list = list.filter((s) => (empName(s.employee_id) || '').toLowerCase().includes(q));
    }
    return list;
  }, [previewSummaries, search]);

  // ── Actions ─────────────────────────────────────────────────

  const handlePublishDraft = () => {
    const empIds = employees.map((e) => e.id);
    const summaries = buildEmployeeSummaries(logs, leaveEntries, empIds, dateRange.start, dateRange.end);
    const closure: TimesheetClosure = {
      id: genId('cls_'),
      period_name: periodName,
      start_date: dateRange.start,
      end_date: dateRange.end,
      lock_deadline: lockDeadline,
      status: 'draft',
      employee_summaries: summaries,
      created_at: new Date().toISOString(),
      locked_at: null,
    };
    setClosures((prev) => [...prev, closure]);
    showToast(true, 'Đã phát hành dự thảo chốt công. Nhân viên có thể đối soát.');
  };

  const updateSummary = (closureId: string, empId: string, patch: Partial<EmployeeSummary>) => {
    setClosures((prev) =>
      prev.map((c) =>
        c.id === closureId
          ? {
              ...c,
              employee_summaries: c.employee_summaries.map((s) =>
                s.employee_id === empId ? { ...s, ...patch } : s
              ),
            }
          : c
      )
    );
  };

  const handleApproveOT = (empId: string) => {
    if (!activeClosure) return;
    const summary = activeClosure.employee_summaries.find((s) => s.employee_id === empId);
    if (!summary) return;
    updateSummary(activeClosure.id, empId, {
      ot_approval_status: 'approved',
      approved_ot_hours: summary.raw_ot_hours,
    });
    showToast(true, `Đã duyệt tăng ca cho ${empName(empId)}.`);
  };

  const handleRejectOT = (empId: string) => {
    if (!activeClosure) return;
    updateSummary(activeClosure.id, empId, {
      ot_approval_status: 'rejected',
      approved_ot_hours: 0,
    });
    showToast(true, `Đã từ chối tăng ca cho ${empName(empId)}.`);
  };

  const handleBatchApproveOT = () => {
    if (!activeClosure) return;
    setClosures((prev) =>
      prev.map((c) =>
        c.id === activeClosure.id
          ? {
              ...c,
              employee_summaries: c.employee_summaries.map((s) =>
                s.ot_approval_status === 'pending' && s.raw_ot_hours > 0
                  ? { ...s, ot_approval_status: 'approved' as OTApprovalStatus, approved_ot_hours: s.raw_ot_hours }
                  : s
              ),
            }
          : c
      )
    );
    showToast(true, 'Đã duyệt hàng loạt tăng ca cho tất cả nhân viên.');
  };

  const handleConfirm = (empId: string) => {
    if (!activeClosure) return;
    updateSummary(activeClosure.id, empId, { worker_confirmation: 'confirmed' });
    showToast(true, `${empName(empId)} đã xác nhận công.`);
  };

  const handleDispute = (empId: string, reason: string) => {
    if (!activeClosure) return;
    updateSummary(activeClosure.id, empId, { worker_confirmation: 'disputed', dispute_reason: reason });
    setDisputeModalEmp(null);
    showToast(true, `Đã gửi yêu cầu điều chỉnh cho ${empName(empId)}.`);
  };

  const handleLockNow = () => {
    if (!activeClosure) return;
    setClosures((prev) =>
      prev.map((c) =>
        c.id === activeClosure.id
          ? { ...c, status: 'locked' as ClosureStatus, locked_at: new Date().toISOString() }
          : c
      )
    );
    showToast(true, 'Đã khóa kỳ công chính thức.');
  };

  const handleReopen = () => {
    if (!activeClosure) return;
    setClosures((prev) =>
      prev.map((c) =>
        c.id === activeClosure.id
          ? { ...c, status: 'draft' as ClosureStatus, locked_at: null }
          : c
      )
    );
    showToast(true, 'Đã mở khóa kỳ công.');
  };

  const handleExportCSV = () => {
    if (activeClosure) exportCSV(activeClosure, employees, departments);
  };

  // ── Render ───────────────────────────────────────────────────

  const timeRemaining = activeClosure && !isActiveLocked
    ? Math.max(0, new Date(activeClosure.lock_deadline).getTime() - Date.now())
    : 0;
  const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minsRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div className="px-8 pt-6 pb-8">
      {/* Page header */}
      <div className="mb-6">
        <nav className="flex items-center gap-1.5 text-xs font-medium text-info mb-2">
          <span>HRM</span>
          <span className="text-line">›</span>
          <span className="text-ink">Chốt công</span>
        </nav>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <ClipboardCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-ink leading-tight">
                {isActiveLocked ? 'BẢNG THỐNG KÊ CÔNG CHUẨN' : 'KHOẢNG CÔNG & DỰ THẢO CHỐT CÔNG'}
              </h1>
              <p className="text-sm text-info mt-0.5">
                {isActiveLocked
                  ? 'Kỳ công đã khóa chính thức. Không thể thay đổi.'
                  : 'Tạo dự thảo chốt công, duyệt tăng ca và đối soát với nhân viên.'}
              </p>
            </div>
          </div>
          {isActiveLocked && (
            <div className="flex items-center gap-2">
              {canDelete && (
                <Button variant="secondary" onClick={handleReopen}>
                  <Unlock className="w-4 h-4" /> Mở khóa
                </Button>
              )}
              <Button variant="secondary" onClick={handleExportCSV}>
                <Download className="w-4 h-4" /> Xuất Excel/CSV
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Closure status banner */}
      {activeClosure && (
        <div className={`mb-4 flex items-center gap-3 px-4 py-3 rounded-xl border ${
          isActiveLocked
            ? 'bg-success/10 border-success/20'
            : isActiveDraft
            ? 'bg-warning/10 border-warning/20'
            : 'bg-primary-soft/30 border-primary/15'
        }`}>
          {isActiveLocked ? (
            <>
              <Lock className="w-5 h-5 text-success shrink-0" />
              <div>
                <p className="text-sm font-semibold text-success">
                  {activeClosure.period_name} — Đã khóa
                </p>
                <p className="text-xs text-success/70">
                  Khóa lúc {activeClosure.locked_at ? new Date(activeClosure.locked_at).toLocaleString('vi-VN') : '—'}
                </p>
              </div>
            </>
          ) : isActiveDraft ? (
            <>
              <Clock className="w-5 h-5 text-warning shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-warning">
                  {activeClosure.period_name} — Dự thảo (Chờ đối soát)
                </p>
                <p className="text-xs text-warning/70">
                  Hạn xác nhận: {formatDateTimeDisplay(activeClosure.lock_deadline)}
                  {timeRemaining > 0 && ` · Còn ${hoursRemaining}h ${minsRemaining}m`}
                </p>
              </div>
              <Button variant="danger" size="sm" onClick={handleLockNow} disabled={!canApprove}>
                <Lock className="w-3.5 h-3.5" /> Khóa ngay
              </Button>
            </>
          ) : null}
        </div>
      )}

      {/* Long shift warning */}
      {!isActiveLocked && longShiftWarnings > 0 && (
        <div className="mb-4 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-warning/10 border border-warning/20 text-xs text-warning">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            Có <strong className="text-warning">{longShiftWarnings}</strong> ca làm trên {OT_THRESHOLD_HOURS} giờ — kiểm tra quên chấm ra ca trước khi duyệt tăng ca.
          </span>
        </div>
      )}

      {/* Phase 1: Create draft controls (only when no active closure or locked) */}
      {!activeClosure && canApprove && (
        <div className="bg-card rounded-xl border border-line/30 p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <CalendarRange className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-ink">Chọn khoảng công</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Field label="Phương thức chọn">
              <Select value={useCustomRange ? 'custom' : 'month'} onChange={(e) => setUseCustomRange(e.target.value === 'custom')}>
                <option value="month">Theo tháng</option>
                <option value="custom">Tùy chỉnh khoảng</option>
              </Select>
            </Field>
            {useCustomRange ? (
              <>
                <Field label="Từ ngày">
                  <TextInput type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
                </Field>
                <Field label="Đến ngày">
                  <TextInput type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
                </Field>
              </>
            ) : (
              <>
                <Field label="Tháng">
                  <Select value={String(selMonth)} onChange={(e) => setSelMonth(parseInt(e.target.value, 10))}>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i} value={String(i)}>Tháng {i + 1}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Năm">
                  <Select value={String(selYear)} onChange={(e) => setSelYear(parseInt(e.target.value, 10))}>
                    {Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map((y) => (
                      <option key={y} value={String(y)}>{y}</option>
                    ))}
                  </Select>
                </Field>
              </>
            )}
            <Field label="Thời hạn xác nhận">
              <TextInput type="datetime-local" value={lockDeadline} onChange={(e) => setLockDeadline(e.target.value)} />
            </Field>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-info">
              Kỳ công: <strong className="text-ink">{periodName}</strong> · {formatDateDisplay(dateRange.start)} → {formatDateDisplay(dateRange.end)}
            </p>
            <Button onClick={handlePublishDraft}>
              <Rocket className="w-4 h-4" /> Phát hành dự thảo chốt công
            </Button>
          </div>
        </div>
      )}

      {/* OT batch approve bar */}
      {isActiveDraft && canApprove && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {previewSummaries.filter((s) => s.ot_approval_status === 'pending' && s.raw_ot_hours > 0).length > 0 && (
              <Button variant="secondary" size="sm" onClick={handleBatchApproveOT}>
                <CheckCircle2 className="w-3.5 h-3.5" /> Duyệt hàng loạt tăng ca
              </Button>
            )}
          </div>
          <div className="relative flex-1 max-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-line" />
            <TextInput
              className="pl-10"
              placeholder="Tìm nhân viên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Summary table */}
      <div className="bg-card rounded-xl border border-line/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line/30 text-info text-xs bg-bg-main/50">
                <th className="text-left py-3 px-4 font-medium">Tên nhân viên</th>
                <th className="text-left py-3 px-4 font-medium">Bộ phận</th>
                <th className="text-center py-3 px-4 font-medium">Ngày công {isActiveLocked ? '' : 'dự kiến'}</th>
                <th className="text-center py-3 px-4 font-medium">Tăng ca {isActiveLocked ? '' : 'dự kiến'} (giờ)</th>
                <th className="text-center py-3 px-4 font-medium">Trạng thái xác nhận</th>
                <th className="text-center py-3 px-4 font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredSummaries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <ClipboardCheck className="w-10 h-10 text-line mx-auto mb-2" />
                    <p className="text-sm text-info">
                      {activeClosure ? 'Không có nhân viên trong kỳ công này.' : 'Chưa có dự thảo chốt công. Hãy tạo dự thảo ở trên.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSummaries.map((s) => {
                  const isExpanded = expandedEmp === s.employee_id;
                  const breakdown = activeClosure
                    ? buildDailyBreakdown(logs, s.employee_id, activeClosure.start_date, activeClosure.end_date)
                    : buildDailyBreakdown(logs, s.employee_id, dateRange.start, dateRange.end);
                  return (
                    <>
                      <tr key={s.employee_id} className="border-b border-line/20 hover:bg-bg-main/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setExpandedEmp(isExpanded ? null : s.employee_id)}
                              className="p-0.5 rounded text-info hover:bg-primary-soft/30 transition-colors"
                            >
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                            <div className="flex flex-col">
                              <span className="font-medium text-ink text-sm">{(empName(s.employee_id) || '—').toUpperCase()}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-info">{(deptName(empDeptId(s.employee_id)) || '—')}</td>
                        <td className="py-3 px-4 text-center text-ink font-medium">{s.total_work_days}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className={`font-medium ${s.raw_ot_hours > 0 ? 'text-warning' : 'text-line'}`}>
                              {s.raw_ot_hours.toFixed(2)}
                            </span>
                            {isActiveDraft && s.ot_approval_status === 'approved' && (
                              <span className="text-[10px] text-success">Đã duyệt: {s.approved_ot_hours.toFixed(2)}h</span>
                            )}
                            {isActiveDraft && s.ot_approval_status === 'rejected' && (
                              <span className="text-[10px] text-danger">Tăng ca bị từ chối</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isActiveLocked ? (
                            <Badge color="success">Đã khóa</Badge>
                          ) : !activeClosure ? (
                            <Badge color="info">Chưa phát hành</Badge>
                          ) : s.worker_confirmation === 'confirmed' ? (
                            <Badge color="success">NV đã xác nhận</Badge>
                          ) : s.worker_confirmation === 'disputed' ? (
                            <Badge color="danger">Có khiếu nại</Badge>
                          ) : (
                            <Badge color="info">
                              Dự thảo · Hạn: {formatDateTimeDisplay(activeClosure.lock_deadline)}
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {/* OT approve/reject (approve level, draft only) */}
                            {isActiveDraft && canApprove && s.raw_ot_hours > 0 && s.ot_approval_status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApproveOT(s.employee_id)}
                                  className="p-1.5 rounded text-success hover:bg-success/10 transition-colors"
                                  title="Duyệt tăng ca"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleRejectOT(s.employee_id)}
                                  className="p-1.5 rounded text-danger hover:bg-danger/10 transition-colors"
                                  title="Từ chối tăng ca"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                            {/* Worker confirm/dispute (draft only) */}
                            {isActiveDraft && s.worker_confirmation === 'pending' && (
                              <>
                                <Button size="sm" variant="secondary" onClick={() => handleConfirm(s.employee_id)}>
                                  <UserCheck className="w-3 h-3" /> Xác nhận
                                </Button>
                                <Button size="sm" variant="danger" onClick={() => setDisputeModalEmp(s.employee_id)}>
                                  <MessageSquareWarning className="w-3 h-3" /> Điều chỉnh
                                </Button>
                              </>
                            )}
                            {isActiveDraft && s.worker_confirmation === 'disputed' && (
                              <span className="text-[10px] text-danger max-w-[160px] truncate" title={s.dispute_reason}>
                                {s.dispute_reason}
                              </span>
                            )}
                            {/* Drill-down toggle */}
                            <button
                              onClick={() => setExpandedEmp(isExpanded ? null : s.employee_id)}
                              className="text-xs text-primary hover:underline whitespace-nowrap"
                            >
                              Xem chi tiết
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-bg-main/30">
                          <td colSpan={6} className="py-3 px-4">
                            <div className="rounded-lg border border-line/20 overflow-hidden">
                              <DailyDetailTable breakdown={breakdown} shifts={shifts} />
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Locked closure export */}
      {isActiveLocked && activeClosure && (
        <div className="mt-4 flex items-center justify-between">
          {canDelete && (
            <Button variant="secondary" onClick={handleReopen}>
              <Unlock className="w-4 h-4" /> Mở khóa
            </Button>
          )}
          <Button variant="secondary" onClick={handleExportCSV}>
            <FileSpreadsheet className="w-4 h-4" /> Xuất Excel/CSV
          </Button>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm ${
          toast.ok ? 'bg-success text-white' : 'bg-danger text-white'
        }`}>
          {toast.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Dispute modal */}
      {disputeModalEmp && activeClosure && (
        <DisputeModal
          employeeName={empName(disputeModalEmp)}
          breakdown={buildDailyBreakdown(logs, disputeModalEmp, activeClosure.start_date, activeClosure.end_date)}
          onSave={(reason) => handleDispute(disputeModalEmp, reason)}
          onClose={() => setDisputeModalEmp(null)}
        />
      )}
    </div>
  );
}
