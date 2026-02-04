/**
 * Run as early as possible to catch "signal is aborted" from @supabase/auth-js
 * so it doesn't show as Uncaught Error in the dev overlay.
 */
if (typeof window !== 'undefined') {
  const isAbort = (msg: string) =>
    msg && (msg.toLowerCase().includes('abort') || msg.includes('signal'));

  window.addEventListener(
    'error',
    (event: ErrorEvent) => {
      const msg = event.message ?? event.error?.message ?? '';
      if (isAbort(msg)) {
        event.preventDefault();
        event.stopPropagation();
        return true;
      }
      return false;
    },
    true
  );

  window.addEventListener(
    'unhandledrejection',
    (event: PromiseRejectionEvent) => {
      const msg = event.reason?.message ?? String(event.reason ?? '');
      if (isAbort(msg)) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    true
  );
}
