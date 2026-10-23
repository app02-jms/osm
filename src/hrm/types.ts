// HRM Types

export type ShiftKind = 'work' | 'off';

export interface Shift {
  id: string;
  code: string;
  name: string;
  start_time: string; // "HH:MM"
  end_time: string; // "HH:MM"
  kind: ShiftKind;
  deducts_leave: boolean;
}

export interface Department {
  id: string;
  name: string;
}

export interface WorkStatus {
  id: string;
  name: string;
  can_schedule_and_clock: boolean;
}

export interface Employee {
  id: string;
  employee_code: string;
  display_name: string;
  full_name: string;
  department_id: string;
  job_title: string;
  phone: string;
  start_date: string; // YYYY-MM-DD
  status_id: string;
  has_leave: boolean;
  opening_leave_balance: number;
  user_id: string | null;
}

export interface Schedule {
  employee_id: string;
  work_date: string; // YYYY-MM-DD
  shift_id: string;
  import_id: string | null;
}

export type LeaveEntryType = 'opening' | 'accrual' | 'used' | 'manual';

export interface LeaveEntry {
  id: string;
  employee_id: string;
  entry_date: string; // YYYY-MM-DD
  type: LeaveEntryType;
  days: number;
  note: string;
  created_by: string;
}

export interface HrmSettings {
  hotel_lat: number;
  hotel_lng: number;
  radius_m: number;
  window_before: number; // minutes
  window_after: number; // minutes
  tolerance: number; // meters
  monthly_leave_accrual: number;
}

export type AttendanceStatus = 'valid' | 'pending_approval' | 'rejected';

export interface AttendanceLog {
  id: string;
  employee_id: string;
  date: string; // YYYY-MM-DD
  shift_id: string | null; // scheduled shift
  actual_shift_id: string | null;
  clock_in: string | null; // HH:mm
  clock_out: string | null; // HH:mm
  lat: number | null;
  lng: number | null;
  is_outside_radius: boolean;
  status: AttendanceStatus;
  mismatch_reason: string;
  admin_note: string;
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type ApprovalRequestType = 'shift_mismatch' | 'manual_adjust';

export interface ApprovalRequest {
  id: string;
  attendance_id: string;
  employee_id: string;
  request_type: ApprovalRequestType;
  requested_shift_id: string | null;
  adjusted_shift_id: string | null;
  reason: string;
  status: ApprovalStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
}
