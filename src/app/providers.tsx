'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect, type ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  );

  // 네이티브 앱 초기화 (Capacitor)
  useEffect(() => {
    import('@/lib/native-init').then(({ initNativeApp }) => initNativeApp());
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* 오프라인 토스트 (네이티브 앱용) */}
      <div
        id="native-offline-toast"
        style={{
          display: 'none',
          position: 'fixed',
          top: 'env(safe-area-inset-top, 0px)',
          left: 0,
          right: 0,
          zIndex: 9999,
          justifyContent: 'center',
          padding: '8px 16px',
        }}
      >
        <div style={{
          background: '#ef4444',
          color: '#fff',
          fontSize: '13px',
          fontWeight: 600,
          padding: '8px 16px',
          borderRadius: '8px',
        }}>
          인터넷 연결이 끊어졌습니다
        </div>
      </div>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '10px',
            background: '#1A1A1A',
            color: '#fff',
            fontSize: '14px',
          },
        }}
      />
    </QueryClientProvider>
  );
}
