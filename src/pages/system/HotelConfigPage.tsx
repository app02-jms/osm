import { useState } from 'react';
import {
  useHotels,
  useMappings,
  useUsers,
  addHotel,
  updateHotel,
  addUser,
  setUserHotelMappings,
  HOTEL_ADMIN_PERMISSIONS,
} from '@/store/authStore';
import type { Hotel, CoreModule, UserHotelAccess, User } from '@/types/auth';
import { Button, Badge, TextInput, Field, Toggle } from '@/components/ui';
import { useRouter } from '@/router/RouterContext';
import {
  Hotel as HotelIcon,
  Plus,
  Pencil,
  Users,
  Save,
  Building2,
  CheckCircle2,
  Shield,
  X,
} from 'lucide-react';

const ALL_MODULES: { key: CoreModule; label: string; desc: string }[] = [
  { key: 'hrm', label: 'HRM', desc: 'Quản lý Nhân sự, Chấm công, Chốt công' },
  { key: 'frontdesk', label: 'FRONT DESK', desc: 'Lễ tân, Giao ca' },
  { key: 'housekeeping', label: 'HOUSEKEEPING', desc: 'Buồng phòng' },
  { key: 'inventory', label: 'INVENTORY', desc: 'Kho & Vật tư' },
];

const MODULE_BADGE: Record<CoreModule, string> = {
  hrm: 'HRM',
  frontdesk: 'Lễ tân',
  housekeeping: 'Buồng',
  inventory: 'Kho',
};

interface HotelModalProps {
  editingHotel: Hotel | null;
  onClose: () => void;
  onSave: (data: {
    hotelData: Omit<Hotel, 'id'>;
    adminData?: { username: string; password: string; full_name: string };
    isNew: boolean;
    hotelId?: string;
  }) => void;
}

function HotelModal({ editingHotel, onClose, onSave }: HotelModalProps) {
  const [name, setName] = useState(editingHotel?.name ?? '');
  const [code, setCode] = useState(editingHotel?.code ?? '');
  const [address, setAddress] = useState(editingHotel?.address ?? '');
  const [logoUrl, setLogoUrl] = useState(editingHotel?.logo_url ?? '');
  const [enabledModules, setEnabledModules] = useState<CoreModule[]>(
    editingHotel?.enabled_modules ?? ['hrm', 'frontdesk', 'housekeeping', 'inventory']
  );
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminFullName, setAdminFullName] = useState('');
  const [error, setError] = useState('');

  const toggleModule = (m: CoreModule) => {
    setEnabledModules((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  };

  const submit = () => {
    if (!name.trim() || !code.trim()) {
      setError('Vui lòng nhập Tên và Mã khách sạn.');
      return;
    }
    if (!editingHotel) {
      if (!adminUsername.trim() || !adminPassword.trim() || !adminFullName.trim()) {
        setError('Vui lòng tạo tài khoản Quản lý đầu tiên cho khách sạn.');
        return;
      }
    }
    onSave({
      hotelData: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        address: address.trim(),
        logo_url: logoUrl.trim() || null,
        enabled_modules: enabledModules,
      },
      adminData: !editingHotel
        ? { username: adminUsername.trim(), password: adminPassword.trim(), full_name: adminFullName.trim() }
        : undefined,
      isNew: !editingHotel,
      hotelId: editingHotel?.id,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-card rounded-2xl shadow-2xl border border-line/30 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line/30">
          <h3 className="text-base font-semibold text-ink">
            {editingHotel ? 'Sửa cấu hình khách sạn' : 'Thêm khách sạn mới'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-info hover:bg-primary-soft/40 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {error && (
            <div className="px-3 py-2 rounded-lg bg-danger/10 border border-danger/20 text-xs text-danger">{error}</div>
          )}

          {/* Hotel Info */}
          <div>
            <h4 className="text-sm font-semibold text-ink mb-3">Thông tin khách sạn</h4>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Tên khách sạn">
                <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Jenius Grand Hotel" />
              </Field>
              <Field label="Mã khách sạn / Tenant Code">
                <TextInput value={code} onChange={(e) => setCode(e.target.value)} placeholder="VD: JGH01" />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Địa chỉ">
                <TextInput value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Địa chỉ khách sạn" />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Logo URL (tùy chọn)">
                <TextInput value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." />
              </Field>
              {logoUrl.trim() && (
                <div className="mt-2 flex items-center gap-2">
                  <img src={logoUrl} alt="Logo preview" className="w-12 h-12 rounded-lg border border-line/30 object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  <span className="text-xs text-info">Xem trước logo</span>
                </div>
              )}
            </div>
          </div>

          {/* Module Toggles */}
          <div>
            <h4 className="text-sm font-semibold text-ink mb-3">Modules đã bật</h4>
            <div className="space-y-2">
              {ALL_MODULES.map((m) => (
                <div key={m.key} className="flex items-center justify-between p-3 rounded-lg border border-line/30 bg-bg-main/50">
                  <div>
                    <span className="text-sm font-medium text-ink">{m.label}</span>
                    <p className="text-xs text-info mt-0.5">{m.desc}</p>
                  </div>
                  <Toggle checked={enabledModules.includes(m.key)} onChange={() => toggleModule(m.key)} />
                </div>
              ))}
            </div>
          </div>

          {/* First Admin Setup (only for new hotels) */}
          {!editingHotel && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold text-ink">Tạo tài khoản Quản lý đầu tiên</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Tên đăng nhập Admin">
                  <TextInput value={adminUsername} onChange={(e) => setAdminUsername(e.target.value)} placeholder="VD: admin_jgh" />
                </Field>
                <Field label="Mật khẩu khởi tạo">
                  <TextInput value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="Mật khẩu" />
                </Field>
              </div>
              <div className="mt-4">
                <Field label="Họ và tên">
                  <TextInput value={adminFullName} onChange={(e) => setAdminFullName(e.target.value)} placeholder="VD: Nguyễn Văn Quản" />
                </Field>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-line/30 flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Hủy</Button>
          <Button onClick={submit}><Save className="w-3.5 h-3.5" /> Lưu</Button>
        </div>
      </div>
    </div>
  );
}

export default function HotelConfigPage() {
  const [hotels] = useHotels();
  const [mappings] = useMappings();
  const [users] = useUsers();
  const { navigate } = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Hotel | null>(null);

  const hotelAdmins = (hotelId: string): string[] => {
    const hotelMappings = mappings.filter((m) => m.hotel_id === hotelId && m.role === 'hotel_admin');
    return hotelMappings.map((m) => {
      const u = users.find((usr) => usr.id === m.user_id);
      return u?.full_name ?? u?.username ?? '—';
    });
  };

  const handleSave = (data: {
    hotelData: Omit<Hotel, 'id'>;
    adminData?: { username: string; password: string; full_name: string };
    isNew: boolean;
    hotelId?: string;
  }) => {
    if (data.isNew) {
      const hotel = addHotel(data.hotelData);
      if (data.adminData) {
        const admin = addUser({
          username: data.adminData.username,
          password: data.adminData.password,
          full_name: data.adminData.full_name,
          is_super_admin: false,
        });
        setUserHotelMappings(admin.id, [
          { hotel_id: hotel.id, role: 'hotel_admin', permissions: HOTEL_ADMIN_PERMISSIONS },
        ]);
      }
    } else if (data.hotelId) {
      updateHotel(data.hotelId, data.hotelData);
    }
    setShowModal(false);
    setEditing(null);
  };

  const openEdit = (hotel: Hotel) => {
    setEditing(hotel);
    setShowModal(true);
  };

  const openNew = () => {
    setEditing(null);
    setShowModal(true);
  };

  return (
    <div className="px-8 pt-6 pb-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <nav className="flex items-center gap-1.5 text-xs font-medium text-info mb-2">
          <span>SYSTEM ADMIN</span>
          <span className="text-line">›</span>
          <span className="text-ink">Cấu hình Khách sạn</span>
        </nav>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <HotelIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-ink leading-tight">Cấu hình Khách sạn</h1>
              <p className="text-sm text-info mt-0.5">Quản lý danh sách khách sạn, modules và tài khoản quản lý.</p>
            </div>
          </div>
          <Button onClick={openNew}>
            <Plus className="w-4 h-4" /> Thêm Khách Sạn Mới
          </Button>
        </div>
      </div>

      {/* Hotel Table */}
      <div className="bg-card rounded-xl border border-line/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line/30 text-info text-xs bg-bg-main/50">
                <th className="text-left py-3 px-4 font-medium">Mã khách sạn</th>
                <th className="text-left py-3 px-4 font-medium">Tên khách sạn</th>
                <th className="text-left py-3 px-4 font-medium">Modules đã bật</th>
                <th className="text-left py-3 px-4 font-medium">Tài khoản admin</th>
                <th className="text-left py-3 px-4 font-medium">Trạng thái</th>
                <th className="text-right py-3 px-4 font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {hotels.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <Building2 className="w-10 h-10 text-line mx-auto mb-2" />
                    <p className="text-sm text-info">Chưa có khách sạn nào. Nhấn "Thêm Khách Sạn Mới" để bắt đầu.</p>
                  </td>
                </tr>
              ) : (
                hotels.map((h) => {
                  const admins = hotelAdmins(h.id);
                  return (
                    <tr key={h.id} className="border-b border-line/20 hover:bg-bg-main/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-mono text-xs font-medium text-ink">{(h.code || '—').toUpperCase()}</span>
                          <span className="text-[10px] text-line font-mono">{h.id}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {h.logo_url ? (
                            <img src={h.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover border border-line/30" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <Building2 className="w-4 h-4 text-primary" />
                            </div>
                          )}
                          <span className="font-medium text-ink">{(h.name || '—').toUpperCase()}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {(h.enabled_modules || []).map((m) => (
                            <Badge key={m} color="primary">{MODULE_BADGE[m] ?? m}</Badge>
                          ))}
                          {(!h.enabled_modules || h.enabled_modules.length === 0) && (
                            <span className="text-xs text-line">Chưa bật</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {admins.length === 0 ? (
                          <span className="text-xs text-line">Chưa có</span>
                        ) : (
                          <div className="flex flex-col gap-0.5">
                            {admins.map((a, i) => (
                              <span key={i} className="text-xs text-ink">{(a || '—').toUpperCase()}</span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge color="success">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Hoạt động
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(h)}
                            className="flex items-center gap-1 px-2 py-1.5 rounded text-info hover:bg-primary-soft/40 transition-colors text-xs"
                            title="Sửa cấu hình"
                          >
                            <Pencil className="w-3.5 h-3.5" /> Sửa
                          </button>
                          <button
                            onClick={() => navigate(`/system/users?hotelId=${h.id}`)}
                            className="flex items-center gap-1 px-2 py-1.5 rounded text-info hover:bg-primary-soft/40 transition-colors text-xs"
                            title="Quản lý nhân viên"
                          >
                            <Users className="w-3.5 h-3.5" /> Nhân viên
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <HotelModal
          editingHotel={editing}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
