import { useState, useMemo } from 'react';
import {
  useRoleTemplates,
  addRoleTemplate,
  updateRoleTemplate,
  deleteRoleTemplate,
  PERMISSION_LABELS,
  MODULE_LABELS,
  SUBFEATURE_LABELS,
} from '@/store/authStore';
import type { RoleTemplate, PermissionLevel, FeatureModule, SubFeature, FeaturePermissionMatrix } from '@/types/auth';
import { MODULE_SUBFEATURES } from '@/types/auth';
import { Button, Badge, TextInput, Select, Field } from '@/components/ui';
import {
  Shield,
  Plus,
  Pencil,
  Trash2,
  Save,
  ChevronDown,
  IdCard,
} from 'lucide-react';
import { generateUniqueId } from '@/utils/idGenerator';

const PERMISSION_LEVELS: PermissionLevel[] = ['hidden', 'view', 'view_all', 'update', 'approve', 'delete'];
const ALL_MODULES: FeatureModule[] = ['hrm', 'frontdesk', 'housekeeping', 'inventory', 'sales', 'system'];
const ALL_SUBFEATURES: SubFeature[] = ALL_MODULES.flatMap((m) => MODULE_SUBFEATURES[m]);

function blankRoleTemplate(): RoleTemplate {
  return {
    id: '',
    name: '',
    description: '',
    permissions: ALL_SUBFEATURES.reduce((acc, sf) => {
      acc[sf] = 'hidden';
      return acc;
    }, {} as FeaturePermissionMatrix),
  };
}

function isModuleEnabled(perms: FeaturePermissionMatrix, module: FeatureModule): boolean {
  return MODULE_SUBFEATURES[module].some((sf) => (perms[sf] ?? 'hidden') !== 'hidden');
}

function setModuleEnabled(perms: FeaturePermissionMatrix, module: FeatureModule, enabled: boolean): FeaturePermissionMatrix {
  const next = { ...perms };
  for (const sf of MODULE_SUBFEATURES[module]) {
    next[sf] = enabled ? 'view' : 'hidden';
  }
  return next;
}

function countEnabledPerms(perms: FeaturePermissionMatrix): number {
  return ALL_SUBFEATURES.filter((sf) => (perms[sf] ?? 'hidden') !== 'hidden').length;
}

function RoleFormModal({
  editingRole,
  onSave,
  onClose,
}: {
  editingRole: RoleTemplate | null;
  onSave: (data: { role: Omit<RoleTemplate, 'id'> | RoleTemplate; isNew: boolean }) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(editingRole?.name ?? '');
  const [description, setDescription] = useState(editingRole?.description ?? '');
  const [permissions, setPermissions] = useState<FeaturePermissionMatrix>(() => {
    const base = editingRole?.permissions ?? {};
    return ALL_SUBFEATURES.reduce((acc, sf) => {
      acc[sf] = base[sf] ?? 'hidden';
      return acc;
    }, {} as FeaturePermissionMatrix);
  });
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');

  const toggleModuleEnabled = (module: FeatureModule) => {
    setPermissions((prev) => setModuleEnabled(prev, module, !isModuleEnabled(prev, module)));
  };

  const updateSubFeaturePermission = (sf: SubFeature, level: PermissionLevel) => {
    setPermissions((prev) => ({ ...prev, [sf]: level }));
  };

  const toggleModuleExpanded = (key: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const submit = () => {
    if (!name.trim()) {
      setError('Vui lòng nhập tên vai trò.');
      return;
    }
    const roleData = {
      name: name.trim(),
      description: description.trim() || undefined,
      permissions,
    };
    onSave({ role: editingRole ? { ...editingRole, ...roleData } : roleData, isNew: !editingRole });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-card rounded-2xl shadow-2xl border border-line/30 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line/30">
          <h3 className="text-base font-semibold text-ink">{editingRole ? 'Sửa vai trò' : 'Thêm vai trò'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-info hover:bg-primary-soft/40 transition-colors">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {error && (
            <div className="px-3 py-2 rounded-lg bg-danger/10 border border-danger/20 text-xs text-danger">{error}</div>
          )}

          <div className="grid grid-cols-1 gap-4">
            <Field label="Tên vai trò">
              <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Quản lý lễ tân" />
            </Field>
            <Field label="Mô tả">
              <TextInput value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mô tả ngắn gọn về vai trò" />
            </Field>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-semibold text-ink">Ma trận phân quyền</h4>
            </div>
            <div className="space-y-1.5">
              {ALL_MODULES.map((mod) => {
                const enabled = isModuleEnabled(permissions, mod);
                const expandKey = mod;
                const isExpanded = expandedModules.has(expandKey);
                const subs = MODULE_SUBFEATURES[mod];
                return (
                  <div key={mod} className="rounded-lg border border-line/20 overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 bg-bg-main/70">
                      <div className="flex items-center gap-2 flex-1">
                        <button
                          type="button"
                          onClick={() => toggleModuleEnabled(mod)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${enabled ? 'bg-primary' : 'bg-line/40'}`}
                        >
                          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-4.5' : 'translate-x-1'}`} />
                        </button>
                        <span className={`text-xs font-medium ${enabled ? 'text-ink' : 'text-line'}`}>
                          {MODULE_LABELS[mod]}
                        </span>
                      </div>
                      {enabled && (
                        <button
                          type="button"
                          onClick={() => toggleModuleExpanded(expandKey)}
                          className="p-1 rounded text-info hover:bg-primary-soft/30 transition-colors"
                        >
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      )}
                    </div>
                    {enabled && isExpanded && (
                      <div className="px-3 py-2 space-y-1.5 bg-bg-main/30 border-t border-line/15">
                        {subs.map((sf) => (
                          <div key={sf} className="flex items-center justify-between gap-2">
                            <span className="text-xs text-info">{SUBFEATURE_LABELS[sf]}</span>
                            <Select
                              value={permissions[sf] ?? 'hidden'}
                              onChange={(e) => updateSubFeaturePermission(sf, e.target.value as PermissionLevel)}
                              className="w-auto text-xs py-1"
                            >
                              {PERMISSION_LEVELS.map((lvl) => (
                                <option key={lvl} value={lvl}>{PERMISSION_LABELS[lvl]}</option>
                              ))}
                            </Select>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
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

export default function RoleManagementPage() {
  const [roles, setRoles] = useRoleTemplates();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<RoleTemplate | null>(null);

  const canEdit = true; // System module — super admins only (route guarded)

  const filtered = useMemo(() => {
    if (!search.trim()) return roles;
    const q = search.toLowerCase();
    return roles.filter((r) =>
      (r.name || '').toLowerCase().includes(q) ||
      (r.description || '').toLowerCase().includes(q)
    );
  }, [roles, search]);

  const handleSave = (data: { role: Omit<RoleTemplate, 'id'> | RoleTemplate; isNew: boolean }) => {
    if (data.isNew) {
      addRoleTemplate(data.role as Omit<RoleTemplate, 'id'>);
    } else {
      const role = data.role as RoleTemplate;
      updateRoleTemplate(role.id, { name: role.name, description: role.description, permissions: role.permissions });
    }
    setShowForm(false);
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    deleteRoleTemplate(id);
  };

  return (
    <div className="px-8 pt-6 pb-8">
      <div className="mb-6">
        <nav className="flex items-center gap-1.5 text-xs font-medium text-info mb-2">
          <span>SYSTEM ADMIN</span>
          <span className="text-line">›</span>
          <span className="text-ink">Quản lý Vai trò</span>
        </nav>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <IdCard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-ink leading-tight">Quản lý Vai trò</h1>
              <p className="text-sm text-info mt-0.5">Tạo mẫu vai trò với bộ phân quyền tái sử dụng cho người dùng.</p>
            </div>
          </div>
          {canEdit && (
            <Button onClick={() => { setEditing(blankRoleTemplate()); setShowForm(true); }}>
              <Plus className="w-4 h-4" /> Thêm vai trò
            </Button>
          )}
        </div>
      </div>

      <div className="bg-card rounded-xl border border-line/30 p-4 mb-4">
        <div className="relative flex-1 max-w-[300px]">
          <TextInput placeholder="Tìm theo tên vai trò..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="bg-card rounded-xl border border-line/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line/30 text-info text-xs bg-bg-main/50">
                <th className="text-left py-3 px-4 font-medium">Tên vai trò</th>
                <th className="text-left py-3 px-4 font-medium">Mô tả</th>
                <th className="text-left py-3 px-4 font-medium">Số quyền</th>
                <th className="text-right py-3 px-4 font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center">
                    <IdCard className="w-10 h-10 text-line mx-auto mb-2" />
                    <p className="text-sm text-info">Chưa có vai trò nào</p>
                  </td>
                </tr>
              ) : (
                filtered.map((role) => (
                  <tr key={role.id} className="border-b border-line/20 hover:bg-bg-main/30 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-medium text-ink">{role.name}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-info text-xs">{role.description || '—'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge color="primary">{countEnabledPerms(role.permissions)} quyền</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setEditing(role); setShowForm(true); }}
                          className="p-1.5 rounded text-info hover:bg-primary-soft/40 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(role.id)}
                          className="p-1.5 rounded text-danger hover:bg-danger/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && editing && (
        <RoleFormModal
          editingRole={editing.id ? editing : null}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}
    </div>
  );
}
