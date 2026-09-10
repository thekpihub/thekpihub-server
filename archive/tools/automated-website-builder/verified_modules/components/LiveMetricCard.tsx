import React, { useEffect, useState } from 'react';

interface LiveMetricProps {
  title: string;
  dataSource: string;
}

export const LiveMetricCard: React.FC<LiveMetricProps> = ({ title, dataSource }) => {
  const [currentValue, setCurrentValue] = useState<number | null>(null);
  const [status, setStatus] = useState<'connecting' | 'live' | 'error'>('connecting');

  useEffect(() => {
    const ws = new WebSocket(`wss://${window.location.host}${dataSource}`);
    ws.onopen = () => setStatus('live');
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.metric_name === title) setCurrentValue(data.current_value);
      } catch (e) { console.error("Stream parse error", e); }
    };
    ws.onerror = () => setStatus('error');
    return () => ws.close();
  }, [dataSource, title]);

  return (
    <div style={{ padding: '24px', border: '1px solid #eee', borderRadius: '8px' }}>
      <h4>{title}</h4>
      <h2>{currentValue !== null ? currentValue.toFixed(2) : '---'}</h2>
      <span>{status === 'live' ? 'Connected Live' : 'Reconnecting...'}</span>
    </div>
  );
};
