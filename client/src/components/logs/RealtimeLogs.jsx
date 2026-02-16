import { useCallback, useEffect, useRef, useState } from 'react';
import { stripAnsi } from '@/lib/stripAnsi';

const MAX_LINES = 2000;
const RECONNECT_DELAY_MS = 3000;
const RECONNECT_MAX_ATTEMPTS = 5;

function getLogsWsUrl() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/api/miner/logs`;
}

export default function RealtimeLogs() {
  const [lines, setLines] = useState([]);
  const [loggingActive, setLoggingActive] = useState(false);
  const [paused, setPaused] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [status, setStatus] = useState('connecting'); // 'connecting' | 'open' | 'closed' | 'error'
  const [statusMessage, setStatusMessage] = useState('');
  const wsRef = useRef(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef(null);
  const connectRef = useRef(() => { });
  const loggingActiveRef = useRef(loggingActive);
  const pausedRef = useRef(paused);

  const appendLine = useCallback((raw) => {
    const text = typeof raw === 'string' ? raw : (raw?.toString?.() ?? '');
    const cleaned = stripAnsi(text).trimEnd();
    if (!cleaned) return;
    setLines((prev) => {
      const next = [...prev, cleaned];
      if (next.length > MAX_LINES) return next.slice(-MAX_LINES);
      return next;
    });
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === 0 || wsRef.current?.readyState === 1) return;
    const url = getLogsWsUrl();
    setStatus('connecting');
    setStatusMessage('');
    const ws = new WebSocket(url);

    ws.onopen = () => {
      reconnectAttemptRef.current = 0;
      setStatus('open');
      setStatusMessage('Connected');
    };

    ws.onmessage = (event) => {
      if (pausedRef.current) return;
      const data = event.data;
      if (typeof data === 'string') {
        appendLine(data);
      } else if (data instanceof Blob) {
        const reader = new FileReader();
        reader.onload = () => appendLine(reader.result);
        reader.readAsText(data);
      }
    };

    ws.onclose = (event) => {
      wsRef.current = null;
      const reason = event.reason || 'Connection closed';
      setStatus('closed');
      setStatusMessage(reason);
      if (reconnectAttemptRef.current < RECONNECT_MAX_ATTEMPTS && loggingActiveRef.current) {
        reconnectTimerRef.current = setTimeout(() => {
          reconnectAttemptRef.current += 1;
          connectRef.current();
        }, RECONNECT_DELAY_MS);
      }
    };

    ws.onerror = () => {
      setStatus('error');
      setStatusMessage('WebSocket error');
    };

    wsRef.current = ws;
  }, [appendLine]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => {
    loggingActiveRef.current = loggingActive;
  }, [loggingActive]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    if (!loggingActive) {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      queueMicrotask(() => {
        setStatus('closed');
      });
      return;
    }
    const id = setTimeout(() => connect(), 0);
    return () => {
      clearTimeout(id);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect, loggingActive]);

  const isConnected = status === 'open';
  const visibleLines =
    filterText.trim() === ''
      ? lines
      : lines.filter((line) => line.toLowerCase().includes(filterText.trim().toLowerCase()));

  const handleDownload = useCallback(() => {
    const content = lines.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `miner-logs-${new Date().toISOString().slice(0, 19).replace('T', '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [lines]);

  return (
    <div
      className="card"
    >
      <div className="card-header-wrapper ">
        <div className="card-header flex flex-wrap items-center justify-between gap-2">
          <h2 className="card-header-title">Realtime Logs</h2>
          <div className="flex items-center gap-2 flex-wrap flex-1 justify-between min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                className="btn-ghost-sm"
                onClick={() => {
                const next = !loggingActive;
                if (loggingActive) {
                  setPaused(false);
                  setLines([]);
                }
                setLoggingActive(next);
              }}
                aria-pressed={!loggingActive}
              >
                {loggingActive ? 'Disconnect' : 'Connect'}
              </button>
              <button
                type="button"
                className="btn-ghost-sm"
                onClick={() => setPaused((v) => !v)}
                disabled={!isConnected}
                aria-pressed={paused}
              >
                {paused ? 'Resume' : 'Pause'}
              </button>
              <span
                className={`text-xs font-medium ${isConnected ? 'text-success dark:text-success-dark' : 'text-muted dark:text-muted-dark'}`}
                aria-live="polite"
              >
                {status === 'connecting' && 'Connecting…'}
                {status === 'open' && 'Connected'}
                {status === 'closed' && (statusMessage || 'Disconnected')}
                {status === 'error' && (statusMessage || 'Error')}
              </span>
              <span className="text-xs font-medium text-muted dark:text-muted-dark">{paused ? '(Paused)' : ''}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <div className="relative flex items-center min-w-0 w-48 max-w-xs">
                <input
                  type="text"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  placeholder="Filter logs…"
                  className="input w-full pr-8 text-sm"
                  aria-label="Filter logs"
                />
                {filterText !== '' && (
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted dark:text-muted-dark hover:text-fg dark:hover:text-fg-dark focus:outline-none cursor-pointer"
                    onClick={() => setFilterText('')}
                    aria-label="Clear filter"
                  >
                    ×
                  </button>
                )}
              </div>
              <button
                type="button"
                className="btn-ghost-sm"
                onClick={handleDownload}
                disabled={lines.length === 0}
              >
                Download
              </button>
            </div>
          </div>
        </div>
      </div>
      <div
        className="max-h-[50vh] overflow-y-scroll font-mono text-xs px-3 py-2 bg-terminal-bg rounded"
        aria-label="Log output"
      >
        {!isConnected && lines.length === 0 && (
          <p className="p-2 text-terminal-text dark:text-terminal-text-dark">
            {status === 'connecting' && 'Connecting to miner…'}
            {status === 'closed' && 'Disconnected'}
            {status === 'error' && (statusMessage || 'Connection error.')}
          </p>
        )}
        {visibleLines.map((line, i) => (
          <div
            key={`${i}-${line.slice(0, 40)}`}
            className="text-terminal-text whitespace-pre-wrap break-all"
          >
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}
