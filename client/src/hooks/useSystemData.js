import { useCallback, useEffect, useState } from 'react';
import { fetchSystemStatus } from '@/lib/api';
import { SYSTEM_POLL_INTERVAL_MS } from '@/lib/constants';

export function useSystemData(intervalMs = SYSTEM_POLL_INTERVAL_MS) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const poll = useCallback(async () => {
    try {
      const status = await fetchSystemStatus();
      setData(status);
      setError(null);
    } catch (err) {
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    poll();
    const id = setInterval(poll, intervalMs);
    return () => clearInterval(id);
  }, [poll, intervalMs]);

  return { data, error, loading };
}
