'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      console.error('PWA_DIAGNOSTIC: Service Worker is not supported');
      return;
    }

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        });

        console.info('PWA_DIAGNOSTIC: Registered', registration.scope);
        document.documentElement.dataset.pwaWorker = 'registered';
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('PWA_DIAGNOSTIC: Registration failed', message);
        document.documentElement.dataset.pwaWorker = 'failed';
        document.documentElement.dataset.pwaError = message;
      }
    };

    if (document.readyState === 'complete') {
      void register();
    } else {
      window.addEventListener('load', () => void register(), { once: true });
    }
  }, []);

  return null;
}
