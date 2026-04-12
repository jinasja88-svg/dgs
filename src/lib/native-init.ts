import { isNative, platform } from './capacitor';

/** 네이티브 앱 초기화 — providers.tsx에서 한 번만 호출 */
export async function initNativeApp(): Promise<void> {
  if (!isNative) return;

  const [{ App }, { StatusBar, Style }, { Network }, { Browser }] = await Promise.all([
    import('@capacitor/app'),
    import('@capacitor/status-bar'),
    import('@capacitor/network'),
    import('@capacitor/browser'),
  ]);

  // ── Android 뒤로가기 버튼 ──
  if (platform === 'android') {
    App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        App.exitApp();
      }
    });
  }

  // ── StatusBar 스타일 (흰 배경 + 어두운 아이콘) ──
  try {
    await StatusBar.setStyle({ style: Style.Light });
    if (platform === 'android') {
      await StatusBar.setBackgroundColor({ color: '#ffffff' });
    }
  } catch {
    // StatusBar API가 지원되지 않는 환경 무시
  }

  // ── 네트워크 상태 감지 ──
  Network.addListener('networkStatusChange', (status) => {
    if (!status.connected) {
      // 오프라인 시 간단한 알림
      const el = document.getElementById('native-offline-toast');
      if (el) el.style.display = 'flex';
    } else {
      const el = document.getElementById('native-offline-toast');
      if (el) el.style.display = 'none';
    }
  });

  // ── 외부 링크는 시스템 브라우저로 열기 ──
  document.addEventListener('click', (e) => {
    const anchor = (e.target as HTMLElement).closest('a');
    if (!anchor) return;
    const href = anchor.getAttribute('href');
    if (!href) return;

    // 외부 URL인 경우 시스템 브라우저로 열기
    try {
      const url = new URL(href, window.location.origin);
      if (url.origin !== window.location.origin) {
        e.preventDefault();
        Browser.open({ url: href });
      }
    } catch {
      // 상대 경로 등은 무시
    }
  });
}
