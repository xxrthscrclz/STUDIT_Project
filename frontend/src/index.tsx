import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { AppRouter } from '@/routes/routes';
import { useAuthStore } from '@/stores/authStore';
import { enableMocking } from '@/mocks/enableMocking';
import '@/index.css';

function App() {
  const refresh = useAuthStore((s) => s.refresh);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh, setLoading]);

  return <AppRouter />;
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
