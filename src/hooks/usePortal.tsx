import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { history } from '@umijs/max';
import { App, Spin } from 'antd';
import { api } from '@/services';
import { TOKEN_KEY } from '@/services/request';
import type { Session, Snapshot } from '@/types';
interface PortalContextValue {
  data: Snapshot | null;
  refresh: () => Promise<void>;
  signIn: (session: Session) => Promise<void>;
  signOut: () => Promise<void>;
}
const PortalContext = createContext<PortalContextValue | null>(null);
export function PortalProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(Boolean(sessionStorage.getItem(TOKEN_KEY)));
  const { message } = App.useApp();
  const refresh = useCallback(async () => {
    const result = await api.snapshot();
    setData(result);
  }, []);
  const signIn = useCallback(
    async (session: Session) => {
      sessionStorage.setItem(TOKEN_KEY, session.token);
      await refresh();
    },
    [refresh],
  );
  const signOut = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      sessionStorage.removeItem(TOKEN_KEY);
      setData(null);
      history.push('/login');
    }
  }, []);
  useEffect(() => {
    if (sessionStorage.getItem(TOKEN_KEY))
      refresh()
        .catch((error) => {
          sessionStorage.removeItem(TOKEN_KEY);
          message.error(error.message);
        })
        .finally(() => setLoading(false));
    const expired = () => {
      setData(null);
      history.replace('/login');
    };
    const changed = (event: StorageEvent) => {
      if (event.key === 'monitor-portal:mock:v1' && sessionStorage.getItem(TOKEN_KEY))
        refresh().catch(() => {});
    };
    window.addEventListener('portal:unauthorized', expired);
    window.addEventListener('storage', changed);
    return () => {
      window.removeEventListener('portal:unauthorized', expired);
      window.removeEventListener('storage', changed);
    };
  }, [refresh, message]);
  return (
    <PortalContext.Provider value={{ data, refresh, signIn, signOut }}>
      {loading ? (
        <div className="app-loading">
          <Spin size="large" tip="正在加载门户…">
            <div style={{ height: 80 }} />
          </Spin>
        </div>
      ) : (
        children
      )}
    </PortalContext.Provider>
  );
}
export function usePortal() {
  const context = useContext(PortalContext);
  if (!context) throw new Error('PortalProvider is required');
  return context;
}
export function useAction() {
  const [pending, setPending] = useState(false);
  const { message } = App.useApp();
  async function run<T>(operation: () => Promise<T>, success?: string): Promise<T | undefined> {
    setPending(true);
    try {
      const result = await operation();
      if (success) message.success(success);
      return result;
    } catch (error) {
      message.error(error instanceof Error ? error.message : '操作失败，请稍后重试');
      return undefined;
    } finally {
      setPending(false);
    }
  }
  return { run, pending };
}
