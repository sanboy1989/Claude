/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import { installSerwist } from "serwist/legacy";

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (string | { url: string; revision: string | null })[];
};

installSerwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,
  runtimeCaching: [
    // Merchant browse pages — stale while revalidate
    {
      urlPattern: /^https?:\/\/.*\/merchants.*/,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "merchant-pages",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60,
        },
      },
    },
    // Available slots API — network first, short cache
    {
      urlPattern: /^https?:\/\/.*\/api\/merchants\/.*\/slots/,
      handler: "NetworkFirst",
      options: {
        cacheName: "slots-api",
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 60,
        },
      },
    },
    ...defaultCache,
  ],
  fallbacks: {
    document: "/offline.html",
  },
});
