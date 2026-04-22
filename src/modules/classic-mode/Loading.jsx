import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Loading() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/result');
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="page">
      <div className="card" style={{ textAlign: 'center' }}>

        <div style={{ marginBottom: '28px' }}>
          <span style={{ fontSize: '36px', display: 'inline-block', animation: 'spin 1.5s linear infinite' }}>🎵</span>
          <span style={{ fontSize: '36px', display: 'inline-block', animation: 'spin 1.5s linear infinite 0.2s' }}>🎶</span>
          <span style={{ fontSize: '36px', display: 'inline-block', animation: 'spin 1.5s linear infinite 0.4s' }}>🎵</span>
        </div>

        <h2>正在分析你的音樂人格</h2>
        <p style={{ marginTop: '12px' }}>Agent 系統運行中...</p>

        <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { icon: '🧠', text: 'MBTI 計算代理：分析完成' },
            { icon: '📖', text: '人格描述代理：讀取中...' },
            { icon: '🎵', text: '音樂推薦代理：比對中...' },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.04)',
              borderRadius: '12px',
              fontSize: '14px',
              animation: `fadeIn 0.5s ease ${i * 0.4}s both`
            }}>
              <span>{item.icon}</span>
              <span style={{ opacity: 0.8 }}>{item.text}</span>
            </div>
          ))}
        </div>

        <style>{`
          @keyframes spin {
            0% { transform: translateY(0); opacity: 0.3; }
            50% { transform: translateY(-10px); opacity: 1; }
            100% { transform: translateY(0); opacity: 0.3; }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateX(-10px); }
            to { opacity: 1; transform: translateX(0); }
          }
        `}</style>

      </div>
    </div>
  );
}

export default Loading;