import { useState } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { Logo } from '@/components/common/Logo';
import { Lock, User as UserIcon, Eye, EyeOff, AlertCircle, Building2, CheckCircle2 } from 'lucide-react';
import type { Hotel } from '@/types/auth';

export default function LoginPage() {
  const { login, selectHotel } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingHotels, setPendingHotels] = useState<Hotel[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = login(username, password);
    if (!result.ok) {
      setError('Tên đăng nhập hoặc mật khẩu không đúng.');
    } else if (result.needsHotelSelect) {
      setPendingHotels(result.hotels);
    }
    setLoading(false);
  };

  const handleSelectHotel = (hotelId: string) => {
    selectHotel(hotelId);
    setPendingHotels([]);
  };

  // ── Hotel Selection Modal ─────────────────────────────────────
  if (pendingHotels.length > 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-main px-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary-soft/40 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
        </div>
        <div className="relative w-full max-w-lg">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 mb-4">
              <Logo className="w-14 h-14" />
            </div>
            <h2 className="text-xl font-bold text-ink tracking-tight">CHỌN KHÁCH SẠN LÀM VIỆC</h2>
            <p className="text-sm text-info mt-2">Vui lòng chọn khách sạn để tiếp tục.</p>
          </div>
          <div className="space-y-3">
            {pendingHotels.map((hotel) => (
              <button
                key={hotel.id}
                onClick={() => handleSelectHotel(hotel.id)}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-line/40 bg-card hover:border-primary hover:bg-primary-soft/20 transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink">{(hotel.name || '').toUpperCase()}</p>
                  <p className="text-xs text-info mt-0.5 truncate">{hotel.address || '—'}</p>
                  <p className="text-[10px] text-line font-mono mt-0.5">{hotel.code} · {hotel.id}</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-line group-hover:text-primary transition-colors shrink-0" />
              </button>
            ))}
          </div>
          <button
            onClick={() => { setPendingHotels([]); setUsername(''); setPassword(''); }}
            className="w-full mt-4 py-2 rounded-lg text-sm text-info hover:text-ink hover:bg-primary-soft/20 transition-all"
          >
            Quay lại đăng nhập
          </button>
        </div>
      </div>
    );
  }

  // ── Login Form ────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-main px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary-soft/40 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
            <Logo className="w-16 h-16" />
          </div>
          <h1 className="text-3xl font-bold text-ink tracking-tight">OMS BY JENIUS</h1>
          <p className="text-sm text-info mt-2">Hotel Operations Management System</p>
        </div>

        <div className="bg-card rounded-2xl shadow-xl shadow-ink/5 border border-line/30 p-8">
          <h2 className="text-lg font-semibold text-ink mb-6">Đăng nhập hệ thống</h2>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-info mb-1.5">Tên đăng nhập</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-line" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-line/50 bg-bg-main text-ink text-sm placeholder:text-line/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                  placeholder="Nhập tên đăng nhập"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-info mb-1.5">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-line" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-line/50 bg-bg-main text-ink text-sm placeholder:text-line/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                  placeholder="Nhập mật khẩu"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-line hover:text-info transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-primary/20"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-line/20">
            <p className="text-xs text-line text-center">Tài khoản mẫu: admin / manager / staff — mật khẩu: 123</p>
          </div>
        </div>

        <p className="text-center text-xs text-line mt-6">
          © 2026 OMS by Jenius. All rights reserved.
        </p>
      </div>
    </div>
  );
}
