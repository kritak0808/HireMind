'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

interface RealtimeContextType {
  onlineUsers: Record<string, string>;
  typingUsers: Record<string, string[]>;
  lastEvent: any;
  sendTypingStatus: (roomId: string, isTyping: boolean) => void;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) throw new Error('useRealtime must be used within RealtimeProvider');
  return context;
};

export const RealtimeProvider = ({ children }: { children: React.ReactNode }) => {
  const [onlineUsers, setOnlineUsers] = useState<Record<string, string>>({});
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const [lastEvent, setLastEvent] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const reconnectAttempts = useRef(0);

  const connect = () => {
    if (socketRef.current) return;

    const token = localStorage.getItem('hiremind_token');
    if (!token) {
      setConnectionStatus('disconnected');
      return;
    }

    // Decode mock payload or generate dynamic user identity representation
    const userId = '00000000-0000-0000-0000-000000000000';
    setConnectionStatus('connecting');

    const wsUrl = `ws://localhost:8000/api/v1/realtime/ws/${userId}`;
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus('connected');
      reconnectAttempts.current = 0;
      // Send initial heartbeat ping
      ws.send(JSON.stringify({ type: 'ping' }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'presence_update') {
          setOnlineUsers(message.statuses);
        } else if (message.type === 'typing_update') {
          setTypingUsers((prev) => ({
            ...prev,
            [message.room_id]: message.typing_users
          }));
        } else if (message.type === 'event_stream') {
          setLastEvent(message);
        }
      } catch (err) {
        console.error('Error parsing WS event:', err);
      }
    };

    ws.onclose = () => {
      socketRef.current = null;
      setConnectionStatus('disconnected');
      // Retry connection with exponential backoff limits
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
      reconnectAttempts.current += 1;
      reconnectTimeoutRef.current = setTimeout(connect, delay);
    };

    ws.onerror = (err) => {
      console.warn('WS socket error:', err);
      ws.close();
    };
  };

  const sendTypingStatus = (roomId: string, isTyping: boolean) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const username = localStorage.getItem('hiremind_user_email')?.split('@')[0] || 'Recruiter';
      socketRef.current.send(
        JSON.stringify({
          type: 'typing',
          room_id: roomId,
          username,
          is_typing: isTyping
        })
      );
    }
  };

  useEffect(() => {
    connect();
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return (
    <RealtimeContext.Provider value={{ onlineUsers, typingUsers, lastEvent, sendTypingStatus, connectionStatus }}>
      {children}
    </RealtimeContext.Provider>
  );
};
