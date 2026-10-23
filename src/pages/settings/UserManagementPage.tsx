import { useState, useMemo } from 'react';
import { useRouter } from '@/router/RouterContext';
import {
  useUsers,
  useHotels,
  useMappings,
  addUser,
  updateUser,
  deleteUser,
  setUserHotelMappings,
  FULL_PERMISSIONS,
  HOTEL_ADMIN_PERMISSIONS,
  STAFF_PERMISSIONS,
  PERMISSION_LABELS,
  MODULE_LABELS,
} from '@/store/authStore';
import type { User, HotelRole, PermissionLevel, FeatureModule } from '@/types/auth';
import { Button, Badge, TextInput, Select, Field, Toggle } from '@/components/ui';
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Search,
  Save,
  Shield,
  Building2,
  CheckCircle2,
} from 'lucide-react';

const PERMISSION_LEVELS: PermissionLevel[] = ['hidden', 'view', 'update', 'approve', 'delete'];
const MODULES: FeatureModule[] = ['hrm', 'frontdesk', 'housekeeping', 'inventory', 'sales', 'system'];

interface HotelAssignment {
  hotel_id: string;
  role: HotelRole;
  permissions: Record<FeatureModule, PermissionLevel>;
}

function defaultPermissionsForRole(role: HotelRole): Record<FeatureModule, PermissionLevel> {
  const base = role === 'hotel_admin' ? { ...HOTEL_ADMIN_PERMISSIONS } : { ...STAFF_PERMISSIONS };
  return MODULES.reduce((acc, m) => {
    acc[m] = base[m] ?? 'hidden';
    return acc;
  }, {} as Record<FeatureModule, PermissionLevel>);
}

function UserFormModal({
  editingUser,
  hotels,
  existingMappings,
  onSave,
  onClose,
}: {
  editingUser: User | null;
  hotels: { id: string; name: string; code: string }[];
  existingMappings: { hotel_id: string; role: HotelRole; permissions: Record<string, PermissionLevel> }[];
  onSave: (data: { user: Omit<User, 'id'> | User; assignments: HotelAssignment[]; isNew: boolean }) => void;
  onClose: () => void;
}) {
  const [username, setUsername] = useState(editingUser?.username ?? '');
  const [password, setPassword] = useState(editingUser?.password ?? '');
  const [fullName, setFullName] = useState(editingUser?.full_name ?? '');
  const [isSuperAdmin, setIsSuperAdmin] = useState(editingUser?.is_super_admin ?? false);
  const [assignments, setAssignments] = useState<HotelAssignment[]>(() => {
    if (existingMappings.length > 0) {
      return existingMappings.map((m) => ({
        hotel_id: m.hotel_id,
        role: m.role,
        permissions: MODULES.reduce((acc, mod) => {
          acc[mod] = m.permissions[mod] ?? 'hidden';
          return acc;
        }, {} as Record<FeatureModule, PermissionLevel>),
      }));
    }
    return [];
  });
  const [error, setError] = useState('');

  const toggleHotel = (hotelId: string) => {
    const existing = assignments.find((a) => a.hotel_id === hotelId);
    if (existing) {
      setAssignments((prev) => prev.filter((a) => a.hotel_id !== hotelId));
    } else {
      setAssignments((prev) => [...prev, { hotel_id: hotelId, role: 'staff' as HotelRole, permissions: defaultPermissionsForRole('staff') }]);
    }
  };

  const updateRole = (hotelId: string, role: HotelRole) => {
    setAssignments((prev) =>
      prev.map((a) => (a.hotel_id === hotelId ? { ...a, role, permissions: defaultPermissionsForRole(role) } : a))
    );
  };

  const updatePermission = (hotelId: string, module: FeatureModule, level: PermissionLevel) => {
    setAssignments((prev) =>
      prev.map((a) =>
        a.hotel_id === hotelId ? { ...a, permissions: { ...a.permissions, [module]: level } } : a
      )
    );
  };

  const submit = () => {
    if (!username.trim() || !password.trim() || !fullName.trim()) {
      setError('Vui lòng điền đầy đủ thông tin.');
      return;
    }
    if (!isSuperAdmin && assignments.length === 0) {
      setError('Phân công ít nhất 1 khách sạn cho nhân viên.');
      return;
    }
    const userData = isSuperAdmin
      ? { username: username.trim(), password: password.trim(), full_name: fullName.trim(), is_super_admin: true }
      : { username: username.trim(), password: password.trim(), full_name: fullName.trim(), is_super_admin: false };
    onSave({ user: editingUser ? { ...editingUser, ...userData } : userData, assignments: isSuperAdmin ? [] : assignments, isNew: !editingUser });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-card rounded-2xl shadow-2xl border border-line/30 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line/30">
          <h3 className="text-base font-semibold text-ink">{editingUser ? 'Sửa người dùng' : 'Thêm người dùng'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-info hover:bg-primary-soft/40 transition-colors">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {error && (
            <div className="px-3 py-2 rounded-lg bg-danger/10 border border-danger/20 text-xs text-danger">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Tên đăng nhập">
              <TextInput value={username} onChange={(e) => setUsername(e.target.value)} placeholder="VD: nvan" />
            </Field>
            <Field label="Mật khẩu">
              <TextInput value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mật khẩu" />
            </Field>
          </div>
          <Field label="Họ và tên">
            <TextInput value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="VD: Nguyễn Văn An" />
          </Field>

          <div className="p-4 rounded-lg bg-primary-soft/20 border border-primary/10">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-ink">Super Admin</span>
                <p className="text-xs text-info mt-0.5">Toàn quyền trên mọi khách sạn, không cần phân công</p>
              </div>
              <Toggle checked={isSuperAdmin} onChange={setIsSuperAdmin} />
            </div>
          </div>

          {!isSuperAdmin && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold text-ink">Phân công khách sạn & quyền</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {hotels.map((h) => {
                  const assigned = assignments.find((a) => a.hotel_id === h.id);
                  return (
                    <button
                      key={h.id}
                      onClick={() => toggleHotel(h.id)}
                      className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-all ${
                        assigned ? 'border-primary bg-primary/10' : 'border-line/30 hover:border-line bg-bg-main'
                      }`}
                    >
                      <Building2 className="w-4 h-4 text-info shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-ink truncate">{(h.name || '').toUpperCase()}</p>
                        <p className="text-[10px] text-line font-mono">{h.code}</p>
                      </div>
                      {assigned && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {assignments.map((a) => {
                const hotel = hotels.find((h) => h.id === a.hotel_id);
                if (!hotel) return null;
                return (
                  <div key={a.hotel_id} className="rounded-lg border border-line/30 p-3 bg-bg-main/50 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-ink">{(hotel.name || '').toUpperCase()}</span>
                      <Select value={a.role} onChange={(e) => updateRole(a.hotel_id, e.target.value as HotelRole)} className="w-auto">
                        <option value="staff">Nhân viên</option>
                        <option value="hotel_admin">Quản lý khách sạn</option>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {MODULES.map((m) => (
                        <div key={m} className="flex items-center justify-between gap-2">
                          <span className="text-xs text-info">{MODULE_LABELS[m]}</span>
                          <Select
                            value={a.permissions[m]}
                            onChange={(e) => updatePermission(a.hotel_id, m, e.target.value as PermissionLevel)}
                            className="w-auto text-xs py-1"
                          >
                            {PERMISSION_LEVELS.map((lvl) => (
                              <option key={lvl} value={lvl}>{PERMISSION_LABELS[lvl]}</option>
                            ))}
                          </Select>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-line/30 flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Hủy</Button>
          <Button onClick={submit}><Save className="w-3.5 h-3.5" /> Lưu</Button>
        </div>
      </div>
    </div>
  );
}

export default function UserManagementPage() {
  const { path } = useRouter();
  const [users] = useUsers();
  const [hotels] = useHotels();
  const [mappings] = useMappings();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  // Parse hotelId from query string (e.g. /system/users?hotelId=htl_xxx)
  const filterHotelId = useMemo(() => {
    const qIndex = path.indexOf('?');
    if (qIndex < 0) return null;
    const queryStr = path.slice(qIndex + 1);
    const params = new URLSearchParams(queryStr);
    return params.get('hotelId');
  }, [path]);

  const filterHotelName = filterHotelId ? hotels.find((h) => h.id === filterHotelId)?.name ?? filterHotelId : null;

  const hotelName = (id: string) => hotels.find((h) => h.id === id)?.name ?? '—';
  const userHotels = (userId: string) => mappings.filter((m) => m.user_id === userId);
  const userMappings = (userId: string) => mappings.filter((m) => m.user_id === userId);

  const filtered = useMemo(() => {
    let result = users;
    // Filter by hotelId if provided
    if (filterHotelId) {
      const userIdsForHotel = new Set(
        mappings.filter((m) => m.hotel_id === filterHotelId).map((m) => m.user_id)
      );
      result = result.filter((u) => u.is_super_admin || userIdsForHotel.has(u.id));
    }
    // Filter by search text
    if (search.trim()) {
      const q = (search || '').toLowerCase();
      result = result.filter((u) =>
        (u?.username || '').toLowerCase().includes(q) ||
        (u?.full_name || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [users, mappings, search, filterHotelId]);

  const blankUser = (): User => ({
    id: '',
    username: '',
    password: '',
    full_name: '',
    is_super_admin: false,
  });

  const handleSave = (data: { user: Omit<User, 'id'> | User; assignments: HotelAssignment[]; isNew: boolean }) => {
    if (data.isNew) {
      const created = addUser(data.user as Omit<User, 'id'>);
      if (data.assignments.length > 0) {
        setUserHotelMappings(created.id, data.assignments);
      }
    } else {
      const user = data.user as User;
      updateUser(user.id, { username: user.username, password: user.password, full_name: user.full_name, is_super_admin: user.is_super_admin });
      setUserHotelMappings(user.id, data.assignments);
    }
    setShowForm(false);
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    deleteUser(id);
  };

  return (
    <div className="px-8 pt-6 pb-8">
      <div className="mb-6">
        <nav className="flex items-center gap-1.5 text-xs font-medium text-info mb-2">
          <span>SYSTEM ADMIN</span>
          <span className="text-line">›</span>
          <span className="text-ink">Quản lý Người dùng</span>
          {filterHotelName && (
            <>
              <span className="text-line">›</span>
              <span className="text-primary">{(filterHotelName || '').toUpperCase()}</span>
            </>
          )}
        </nav>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-ink leading-tight">Quản lý Người dùng</h1>
              <p className="text-sm text-info mt-0.5">Tạo tài khoản, phân quyền và gán khách sạn cho người dùng.</p>
            </div>
          </div>
          <Button onClick={() => { setEditing(blankUser()); setShowForm(true); }}>
            <Plus className="w-4 h-4" /> Thêm người dùng
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-line/30 p-4 mb-4">
        <div className="relative flex-1 max-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-line" />
          <TextInput className="pl-10" placeholder="Tìm theo tên, username..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="bg-card rounded-xl border border-line/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line/30 text-info text-xs bg-bg-main/50">
                <th className="text-left py-3 px-4 font-medium">Tên đăng nhập</th>
                <th className="text-left py-3 px-4 font-medium">Họ tên</th>
                <th className="text-left py-3 px-4 font-medium">Vai trò</th>
                <th className="text-left py-3 px-4 font-medium">Khách sạn</th>
                <th className="text-right py-3 px-4 font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <Users className="w-10 h-10 text-line mx-auto mb-2" />
                    <p className="text-sm text-info">Không có người dùng nào</p>
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const hotels = userHotels(u.id);
                  const isSuper = u.is_super_admin;
                  return (
                    <tr key={u.id} className="border-b border-line/20 hover:bg-bg-main/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-mono text-xs font-medium text-ink">{u.username}</span>
                          <span className="text-[10px] text-line font-mono">{u.id}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4"><span className="font-medium text-ink">{(u.full_name || '—').toUpperCase()}</span></td>
                      <td className="py-3 px-4">
                        {isSuper ? (
                          <Badge color="primary">Super Admin</Badge>
                        ) : (
                          <Badge color="info">Người dùng</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {isSuper ? (
                          <span className="text-xs text-primary font-medium">Tất cả khách sạn</span>
                        ) : hotels.length === 0 ? (
                          <span className="text-xs text-line">Chưa phân công</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {hotels.map((h) => (
                              <Badge key={h.id} color="info">{(hotelName(h.hotel_id) || '').toUpperCase()}</Badge>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => { setEditing(u); setShowForm(true); }} className="p-1.5 rounded text-info hover:bg-primary-soft/40 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(u.id)} className="p-1.5 rounded text-danger hover:bg-danger/10 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
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

      {showForm && editing && (
        <UserFormModal
          editingUser={editing.id ? editing : null}
          hotels={hotels}
          existingMappings={editing.id ? userMappings(editing.id) : []}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}
    </div>
  );
}
