import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) =>
        failureCount < 2 && !(error as { code?: string })?.code?.startsWith('not_'),
    },
    mutations: {
      // Never auto-retry money movement; the idempotency key covers manual retries.
      retry: false,
    },
  },
});
