import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import './index.css';
import { BRAND } from './config/brand';
import { ThemeProvider } from './context/ThemeContext';
import { queryPersister, PERSISTED_QUERY_ROOTS } from './lib/queryCache';

document.title = `${BRAND.productName} — ${BRAND.tagline}`;

const ONE_DAY = 24 * 60 * 60 * 1000;

// Data stays "fresh" for 30 seconds, and the app no longer re-downloads every
// list each time the browser tab regains focus. Saving, adding or deleting
// something still refreshes the affected lists immediately (those calls use
// invalidateQueries). gcTime must be at least as long as the saved copy's
// lifetime, otherwise the saved copy is thrown away early.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      gcTime: ONE_DAY,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: queryPersister,
        maxAge: ONE_DAY,
        buster: 'v1',
        dehydrateOptions: {
          shouldDehydrateQuery: (query) =>
            query.state.status === 'success' && PERSISTED_QUERY_ROOTS.includes(query.queryKey[0]),
        },
      }}
    >
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </PersistQueryClientProvider>
  </StrictMode>
);
