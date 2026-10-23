import { useState, useMemo } from 'react';
import {
  useApprovalRequests,
  useAttendanceLogs,
  useEmployees,
  useShifts,
  useSchedules,
  genId,
} from '@/hrm/store';
import type { ApprovalRequest, ApprovalStatus } from '@/hrm/types';
import { Button, Badge, TextInput } from '@/components/ui';
import {
  FileCheck,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  MessageSquare,
} from 'lucide-react';

function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '—';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

const STATUS_BADGE: Record<ApprovalStatus, { label: string; color: 'success' | 'danger' | 'info' | 'primary' }> = {
  pending: { label: 'Chờ duyệt', color: 'danger' },
  approved: { label: 'Đã duyệt', color: 'success' },
  rejected: { label: 'Từ chối', color: 'info' },
};

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useApprovalRequests();
  const [logs, setLogs] = useAttendanceLogs();
  const [employees] = useEmployees();
  const [shifts] = useShifts();
  const [schedules, setSchedules] = useSchedules();
  const [filter, setFilter] = useState<'pending' | 'all' | 'approved' | 'rejected'>('pending');
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({});

  const empName = (id: string) => employees.find((e) => e.id === id)?.display_name ?? '—';
  const empCode = (id: string) => employees.find((e) => e.id === id)?.employee_code ?? '';
  const shiftName = (id: string | null) => {
    if (!id) return '—';
    const s = shifts.find((x) => x.id === id);
    return s ? `${(s.code || 'OFF')} · ${s.name}` : '—';
  };
  const shiftCodeSafe = (id: string | null) => {
    if (!id) return '';
    const s = shifts.find((x) => x.id === id);
    return (s?.code || 'OFF').toUpperCase();
  };

  const filtered = useMemo(() => {
    let list = [...approvals];
    if (filter !== 'all') list = list.filter((a) => a.status === filter);
    return list.sort((a, b) => {
      // Pending first, then by most recent
      const aPending = a.status === 'pending' ? 0 : 1;
      const bPending = b.status === 'pending' ? 0 : 1;
      if (aPending !== bPending) return aPending - bPending;
      return b.id.localeCompare(a.id);
    });
  }, [approvals, filter]);

  const pendingCount = approvals.filter((a) => a.status === 'pending').length;

  const getLog = (attId: string) => logs.find((l) => l.id === attId);

  const handleApprove = (req: ApprovalRequest) => {
    const adjustedId = req.adjusted_shift_id ?? req.requested_shift_id;
    if (!adjustedId) return;

    // Update approval request
    setApprovals((prev) =>
      prev.map((a) =>
        a.id === req.id
          ? { ...a, status: 'approved', reviewed_by: 'admin', reviewed_at: new Date().toISOString() }
          : a
      )
    );

    // Update attendance log: set status to valid, update actual_shift_id to adjusted shift
    setLogs((prev) =>
      prev.map((l) =>
        l.id === req.attendance_id
          ? { ...l, status: 'valid', actual_shift_id: adjustedId, admin_note: 'Đã phê duyệt: ' + req.reason }
          : l
      )
    );

    // Overwrite the schedule entry for that date with the adjusted shift
    const log = getLog(req.attendance_id);
    if (log) {
      setSchedules((prev) => {
        const existing = prev.find(
          (s) => s.employee_id === log.employee_id && s.work_date === log.date
        );
        if (existing) {
          return prev.map((s) =>
            s.employee_id === log.employee_id && s.work_date === log.date
              ? { ...s, shift_id: adjustedId }
              : s
          );
        }
        return [
          ...prev,
          {
            employee_id: log.employee_id,
            work_date: log.date,
            shift_id: adjustedId,
            import_id: null,
          },
        ];
      });
    }
  };

  const handleReject = (req: ApprovalRequest) => {
    const note = (rejectNote[req.id] || '').trim();
    setApprovals((prev) =>
      prev.map((a) =>
        a.id === req.id
          ? { ...a, status: 'rejected', reviewed_by: 'admin', reviewed_at: new Date().toISOString() }
          : a
      )
    );
    setLogs((prev) =>
      prev.map((l) =>
        l.id === req.attendance_id
          ? { ...l, status: 'rejected', admin_note: note || 'Bị từ chối' }
          : l
      )
    );
    setRejectNote((prev) => {
      const next = { ...prev };
      delete next[req.id];
      return next;
    });
  };

  return (
    <div className="px-8 pt-6 pb-8">
      {/* Page header */}
      <div className="mb-6">
        <nav className="flex items-center gap-1.5 text-xs font-medium text-info mb-2">
          <span>HRM</span>
          <span className="text-line">›</span>
          <span className="text-ink">Duyệt điều chỉnh</span>
        </nav>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <FileCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-ink leading-tight">Duyệt điều chỉnh</h1>
              <p className="text-sm text-info mt-0.5">Xét duyệt các yêu cầu điều chỉnh chấm công từ nhân viên.</p>
            </div>
          </div>
          {pendingCount > 0 && (
            <div className="px-3 py-1.5 rounded-lg bg-danger/10 border border-danger/20">
              <span className="text-sm font-bold text-danger">{pendingCount} yêu cầu chờ duyệt</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mb-4 inline-flex gap-1 bg-primary-soft/30 border border-line/40 rounded-lg p-1">
        {[
          { key: 'pending', label: 'Chờ duyệt' },
          { key: 'approved', label: 'Đã duyệt' },
          { key: 'rejected', label: 'Từ chối' },
          { key: 'all', label: 'Tất cả' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key as 'pending' | 'all' | 'approved' | 'rejected')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
              filter === t.key ? 'bg-primary text-white shadow-sm' : 'text-info hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Request cards */}
      {filtered.length === 0 ? (
        <div className="bg-card rounded-xl border border-line/30 py-12 text-center">
          <FileCheck className="w-10 h-10 text-line mx-auto mb-2" />
          <p className="text-sm text-info">Không có yêu cầu nào trong mục này.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => {
            const log = getLog(req.attendance_id);
            const cfg = STATUS_BADGE[req.status] ?? STATUS_BADGE.pending;
            return (
              <div key={req.id} className="bg-card rounded-xl border border-line/30 p-5">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Employee + status */}
                  <div className="lg:col-span-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-primary">
                          {(empName(req.employee_id) || '?').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-ink">{empName(req.employee_id)}</p>
                        <p className="text-[10px] text-line font-mono">{empCode(req.employee_id)}</p>
                      </div>
                    </div>
                    <Badge color={cfg.color}>{cfg.label}</Badge>
                    {log && (
                      <p className="text-xs text-info mt-2">
                        Ngày: <span className="font-medium text-ink">{formatDateDisplay(log.date)}</span>
                      </p>
                    )}
                  </div>

                  {/* Shift comparison */}
                  <div className="lg:col-span-4">
                    <p className="text-xs text-info mb-1.5 font-medium">So sánh ca làm việc</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-lg bg-bg-main border border-line/20">
                        <p className="text-[10px] text-line mb-0.5">Ca lịch trình</p>
                        <div className="flex items-center gap-1">
                          {log && shiftCodeSafe(log.shift_id) && (
                            <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-bold border bg-primary/10 text-primary border-primary/20">
                              {shiftCodeSafe(log.shift_id)}
                            </span>
                          )}
                          <span className="text-xs font-medium text-ink">
                            {log ? shiftName(log.shift_id) : '—'}
                          </span>
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-primary-soft/20 border border-primary/10">
                        <p className="text-[10px] text-primary mb-0.5">Ca điều chỉnh</p>
                        <div className="flex items-center gap-1">
                          {shiftCodeSafe(req.adjusted_shift_id) && (
                            <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-bold border bg-primary/15 text-primary border-primary/25">
                              {shiftCodeSafe(req.adjusted_shift_id)}
                            </span>
                          )}
                          <span className="text-xs font-medium text-ink">
                            {shiftName(req.adjusted_shift_id)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-1.5 text-[10px] text-info">
                      Giờ thực tế: <span className="font-medium text-ink">{log?.clock_in || '—'}</span>
                      {log?.clock_out ? ` → ${log.clock_out}` : ''}
                    </div>
                    {log?.is_outside_radius && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <MapPin className="w-3.5 h-3.5 text-warning" />
                        <span className="text-[11px] text-warning font-medium">Chấm công ngoài bán kính</span>
                      </div>
                    )}
                  </div>

                  {/* Reason */}
                  <div className="lg:col-span-3">
                    <p className="text-xs text-info mb-1.5 font-medium">Lý do nhân viên</p>
                    <div className="flex items-start gap-1.5 p-2.5 rounded-lg bg-primary-soft/20 border border-primary/10">
                      <MessageSquare className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <p className="text-xs text-ink">{req.reason || '—'}</p>
                    </div>
                    {req.reviewed_by && (
                      <p className="text-[10px] text-line mt-1.5">
                        Duyệt bởi: {req.reviewed_by}
                        {req.reviewed_at && ` · ${new Date(req.reviewed_at).toLocaleDateString('vi-VN')}`}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="lg:col-span-2 flex flex-col justify-start gap-2">
                    {req.status === 'pending' ? (
                      <>
                        <Button size="sm" onClick={() => handleApprove(req)} className="w-full">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Phê duyệt
                        </Button>
                        <div className="space-y-1.5">
                          <TextInput
                            placeholder="Ghi chú (tùy chọn)"
                            value={rejectNote[req.id] || ''}
                            onChange={(e) =>
                              setRejectNote((prev) => ({ ...prev, [req.id]: e.target.value }))
                            }
                            className="text-xs"
                          />
                          <Button variant="danger" size="sm" onClick={() => handleReject(req)} className="w-full">
                            <XCircle className="w-3.5 h-3.5" /> Từ chối
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-info">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Đã xử lý</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
