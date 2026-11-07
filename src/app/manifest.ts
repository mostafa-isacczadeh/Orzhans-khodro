
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'اورژانس خودرو',
    short_name: 'اورژانس خودرو',
    description: 'سامانه هوشمند خدمات صافکاری و نقاشی خودرو',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#080808',
    theme_color: '#D4AF37',
    lang: 'fa',
    dir: 'rtl',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      }
    ]
  }
}
