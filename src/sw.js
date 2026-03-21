import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate, NetworkFirst } from 'workbox-strategies';

// Precache app shell
precacheAndRoute(self.__WB_MANIFEST);

// Cache Google Fonts stylesheets (CSS) with StaleWhileRevalidate
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new StaleWhileRevalidate({
    cacheName: 'google-fonts-stylesheets',
  })
);

// Cache Google Fonts webfont files with CacheFirst (long-lived)
registerRoute(
  ({ url }) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts-webfonts',
  })
);

// Cache fetched markdown URLs with NetworkFirst
registerRoute(
  ({ request }) =>
    request.destination === '' &&
    request.url.match(/\.(md|markdown|txt)(\?|$)/i),
  new NetworkFirst({
    cacheName: 'markdown-urls',
  })
);

self.skipWaiting();
