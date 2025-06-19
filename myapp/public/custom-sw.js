/* eslint-disable no-restricted-globals */

// WorkboxをCDNからインポート
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.3/workbox-sw.js');

if (workbox) {
  console.log('[SW-DEBUG] Workbox is loaded!');

  workbox.core.clientsClaim();
  workbox.core.skipWaiting();

  // ルール1: HTMLファイル（ページ自体）のキャッシュ
  workbox.routing.registerRoute(
    ({ request }) => request.mode === 'navigate',
    new workbox.strategies.NetworkFirst({ cacheName: 'html-cache' })
  );

  // ルール2: CSS, JS, Workerファイルのキャッシュ
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'style' || request.destination === 'script' || request.destination === 'worker',
    new workbox.strategies.StaleWhileRevalidate({ cacheName: 'static-assets-cache' })
  );

  // ルール3: 画像ファイルのキャッシュ
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'image',
    new workbox.strategies.CacheFirst({ cacheName: 'image-cache' })
  );

  // --- ▼▼▼ このAPIキャッシュのブロックを、ログ出力付きのものに置き換え ▼▼▼ ---
  
  // ルール4: APIリクエストのキャッシュ（デバッグモード）
  const apiOrigin = 'https://hackathon-backend-749322551732.uc.r.appspot.com';

  const apiMatcher = ({ url }) => {
    // Service Workerが評価するすべてのURLをログに出力
    // console.log(`[SW-DEBUG] Evaluating URL: ${url.href}`);
    
    const isApiRequest = url.href.startsWith(apiOrigin);
    if (isApiRequest) {
      // APIリクエストにマッチした場合にログを出力
      console.log(`[SW-DEBUG] >>> Matched API request for caching: ${url.href}`);
    }
    return isApiRequest;
  };

  workbox.routing.registerRoute(
    apiMatcher,
    new workbox.strategies.NetworkFirst({
      cacheName: 'api-cache',
      plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    })
  );
  // --- ▲▲▲ ここまで置き換え ▲▲▲ ---

} else {
  console.error('[SW-DEBUG] Workbox did not load.');
}