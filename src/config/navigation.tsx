import {
  Users,
  Clock,
  CalendarCheck,
  FileCheck,
  CalendarDays,
  BookOpen,
  ClipboardCheck,
  Settings,
  LogOut,
  NotebookPen,
  Wrench,
  FileSignature,
  SlidersHorizontal,
  Brush,
  BedDouble,
  PackageCheck,
  ClipboardList,
  Warehouse,
  Boxes,
  TrendingUp,
  ShoppingCart,
  Sliders,
  ShieldCheck,
  Hotel,
  type LucideIcon,
} from 'lucide-react';
export interface NavChildItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

export interface NavConfigItem {
  module: string;
  label: string;
  icon: LucideIcon;
  children: NavChildItem[];
}

export const NAVIGATION: NavConfigItem[] = [
  {
    module: 'hrm',
    label: 'HRM',
    icon: Users,
    children: [
      { label: 'Hồ sơ nhân viên', path: '/hrm/employees', icon: Users },
      { label: 'Chấm công', path: '/hrm/attendance', icon: Clock },
      { label: 'Bảng chấm công', path: '/hrm/timesheet', icon: CalendarCheck },
      { label: 'Duyệt điều chỉnh', path: '/hrm/approvals', icon: FileCheck },
      { label: 'Lịch làm việc', path: '/hrm/schedule', icon: CalendarDays },
      { label: 'Sổ phép', path: '/hrm/leave', icon: BookOpen },
      { label: 'Chốt công', path: '/hrm/payroll', icon: ClipboardCheck },
      { label: 'Cấu hình HRM', path: '/hrm/config', icon: Settings },
    ],
  },
  {
    module: 'frontdesk',
    label: 'FRONT DESK',
    icon: LogOut,
    children: [
      { label: 'Departure Record', path: '/frontdesk/departure', icon: LogOut },
      { label: 'Logbook', path: '/frontdesk/logbook', icon: NotebookPen },
      { label: 'Báo cáo Kỹ thuật', path: '/frontdesk/technical', icon: Wrench },
      { label: 'Phê duyệt', path: '/frontdesk/approvals', icon: FileSignature },
      { label: 'Cấu hình Lễ tân', path: '/frontdesk/config', icon: SlidersHorizontal },
    ],
  },
  {
    module: 'housekeeping',
    label: 'HOUSEKEEPING',
    icon: Brush,
    children: [
      { label: 'Worksheet', path: '/housekeeping/worksheet', icon: ClipboardList },
      { label: 'Tình trạng phòng', path: '/housekeeping/room-status', icon: BedDouble },
      { label: 'Giao nhận đồ vải', path: '/housekeeping/linen-transfer', icon: PackageCheck },
      { label: 'Bảng kê đồ vải', path: '/housekeeping/linen-list', icon: ClipboardList },
      { label: 'Cấu hình Buồng phòng', path: '/housekeeping/config', icon: SlidersHorizontal },
    ],
  },
  {
    module: 'inventory',
    label: 'INVENTORY',
    icon: Warehouse,
    children: [
      { label: 'Kho Lễ tân', path: '/inventory/frontdesk', icon: Warehouse },
      { label: 'Kho Buồng phòng', path: '/inventory/housekeeping', icon: Boxes },
      { label: 'Báo cáo X-N-T', path: '/inventory/report', icon: TrendingUp },
      { label: 'Đề nghị mua hàng', path: '/inventory/purchase', icon: ShoppingCart },
      { label: 'Cấu hình Kho', path: '/inventory/config', icon: SlidersHorizontal },
    ],
  },
  {
    module: 'sales',
    label: 'SALES & RMS',
    icon: TrendingUp,
    children: [
      { label: 'MiniRMS', path: '/sales/minirms', icon: TrendingUp },
      { label: 'Bảng giá phòng', path: '/sales/rates', icon: Sliders },
      { label: 'Cấu hình RMS', path: '/sales/config', icon: Settings },
    ],
  },
  {
    module: 'system',
    label: 'SYSTEM ADMIN',
    icon: ShieldCheck,
    children: [
      { label: 'Quản lý Người dùng', path: '/system/users', icon: Users },
      { label: 'Cấu hình Khách sạn', path: '/system/hotel-config', icon: Hotel },
    ],
  },
];

export function findNavByPath(path: string): { module: string; moduleLabel: string; childLabel: string } | null {
  for (const nav of NAVIGATION) {
    for (const child of nav.children) {
      if (path === child.path || path.startsWith(child.path + '/')) {
        return {
          module: nav.module,
          moduleLabel: nav.label,
          childLabel: child.label,
        };
      }
    }
  }
  return null;
}
