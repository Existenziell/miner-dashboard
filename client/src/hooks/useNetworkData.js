import { useState, useEffect, useCallback } from 'react';
import { fetchNetworkStatus } from '../lib/api';
import { POLL_NETWORK_INTERVAL_MS } from '../lib/constants';

export function useNetworkData(intervalMs = POLL_NETWORK_INTERVAL_MS) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const poll = useCallback(async () => {
    try {
      const status = await fetchNetworkStatus();
      setData(status);
      setError(null);
    } catch (err) {
      setError(err.message);
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
