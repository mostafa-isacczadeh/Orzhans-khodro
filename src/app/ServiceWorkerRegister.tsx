
'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((error) => {
          console.error('Service Worker Error:', error);
        });
    }
  }, []);

  return null;
}
