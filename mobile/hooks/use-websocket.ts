import { useEffect, useRef, useState } from 'react';
import { WS_BASE_URL } from '@/constants/config';

type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export function useWebSocket(path: string, token?: string) {
  const ws = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const [lastMessage, setLastMessage] = useState<unknown>(null);

  useEffect(() => {
    if (!token) return;

    const url = `${WS_BASE_URL}${path}?token=${token}`;
    ws.current = new WebSocket(url);
    setStatus('connecting');

    ws.current.onopen = () => setStatus('connected');
    ws.current.onclose = () => setStatus('disconnected');
    ws.current.onerror = () => setStatus('error');
    ws.current.onmessage = (event) => {
      try {
        setLastMessage(JSON.parse(event.data));
      } catch {
        setLastMessage(event.data);
      }
    };

    return () => ws.current?.close();
  }, [path, token]);

  const send = (data: unknown) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
    }
  };

  return { status, lastMessage, send };
}
