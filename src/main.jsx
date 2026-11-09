import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import './index.css';
import { BRAND } from './config/brand';
import { ThemeProvider } from './context/ThemeContext';

document.title = `${BRAND.productName} — ${BRAND.tagline}`;

// Data stays "fresh" for 30 seconds, and the app no longer re-downloads every
// list each time the browser tab regains focus. Saving, adding or deleting
// something still refreshes the affected lists immediately (those calls use
// invalidateQueries). This cuts a lot of repeat requests on slow/expensive data.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
);
