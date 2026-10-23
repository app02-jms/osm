import { useAuth } from '@/auth/AuthContext';
import { Logo } from '@/components/common/Logo';
import { Building2, CheckCircle2 } from 'lucide-react';

export default function HotelSelectionScreen() {
  const { hotels, selectHotel } = useAuth();

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
          {hotels.map((hotel) => (
            <button
              key={hotel.id}
              onClick={() => selectHotel(hotel.id)}
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
      </div>
    </div>
  );
}
