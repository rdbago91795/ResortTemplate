/// <reference types="vite/client" />

/**
 * Only these three may exist. Vite inlines every VITE_-prefixed variable into the client
 * bundle at build time — there is no such thing as a secret VITE_ variable.
 * Typing them narrowly means a secret added with this prefix fails type-checking.
 */
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_TURNSTILE_SITE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
