import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import type { ConnectionStatus } from '@/types';

interface ConnectionContextType {
  status: ConnectionStatus;
  isOnline: boolean;
  pendingSyncs: number;
  setPendingSyncs: (count: number) => void;
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined);

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ConnectionStatus>('online');
  const [pendingSyncs, setPendingSyncs] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setStatus(pendingSyncs > 0 ? 'syncing' : 'online');
    };

    const handleOffline = () => {
      setStatus('offline');
    };

    // Initial status
    setStatus(navigator.onLine ? 'online' : 'offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [pendingSyncs]);

  useEffect(() => {
    if (navigator.onLine && pendingSyncs > 0) {
      setStatus('syncing');
    } else if (navigator.onLine && pendingSyncs === 0) {
      setStatus('online');
    }
  }, [pendingSyncs]);

  return (
    <ConnectionContext.Provider
      value={{
        status,
        isOnline: status !== 'offline',
        pendingSyncs,
        setPendingSyncs,
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnectionStatus() {
  const context = useContext(ConnectionContext);
  if (context === undefined) {
    throw new Error('useConnectionStatus must be used within a ConnectionProvider');
  }
  return context;
}
