import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface RouterContextValue {
  path: string;
  navigate: (to: string) => void;
}

const RouterContext = createContext<RouterContextValue | undefined>(undefined);

const DEFAULT_PATH = '/hrm/schedule';

function getHashPath(): string {
  try {
    const hash = window.location.hash.replace(/^#/, '');
    if (!hash || hash === '/') return DEFAULT_PATH;
    return hash;
  } catch {
    return DEFAULT_PATH;
  }
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState<string>(() => {
    try {
      return getHashPath();
    } catch {
      return DEFAULT_PATH;
    }
  });

  useEffect(() => {
    const onHashChange = () => setPath(getHashPath());
    window.addEventListener('hashchange', onHashChange);
    try {
      if (!window.location.hash) {
        window.location.hash = DEFAULT_PATH;
      }
    } catch { /* ignore */ }
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = (to: string) => {
    try {
      window.location.hash = to;
    } catch { /* ignore */ }
    setPath(to);
  };

  return <RouterContext.Provider value={{ path, navigate }}>{children}</RouterContext.Provider>;
}

export function useRouter(): RouterContextValue {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used within RouterProvider');
  return ctx;
}
