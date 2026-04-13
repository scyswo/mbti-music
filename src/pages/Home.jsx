import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';


function Home() {
  const [nickname, setNickname] = useState('');
  const navigate = useNavigate();

  function handleStart() {
    if (!nickname.trim()) {
      alert('請輸入你的暱稱！');
      return;
    }
    localStorage.setItem('nickname', nickname.trim());
    navigate('/quiz');
  }

  return (
    <div className="page">
      <div className="card">

        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '52px', marginBottom: '12px' }}>🎧</div>
          <h1>MBTI 音樂人格測驗</h1>
          <p style={{ marginTop: '10px' }}>
            12 道題目，找出你專屬的聽歌人格<br />
            並為你推薦最適合的 3 首歌曲
          </p>
        </div>

        <div style={{ marginTop: '8px' }}>
          <label>你的暱稱</label>
          <input
            type="text"
            placeholder="輸入暱稱（例如：小美）"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleStart()}
            maxLength={10}
          />
        </div>

        <button className="btn" onClick={handleStart}>
          開始測驗 →
        </button>

        <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px' }}>
          測驗約需 2 分鐘 ✦ 共 12 題
        </p>

      </div>
    </div>
  );
}

export default Home;