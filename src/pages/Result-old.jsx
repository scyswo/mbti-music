
import { orchestrator } from '../agents/orchestrator';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// 16 種 MBTI 聽歌人格描述
const PERSONALITY_MAP = {
  INTJ: { name: '孤獨的旋律建築師', desc: '你用理性解構每一首歌，從編曲到歌詞都有你自己的評分標準。你不追流行，只追那些真正打動你內心深處的作品。' },
  INTP: { name: '音符邏輯探索者', desc: '你喜歡挖掘冷門神曲，享受發現別人還沒聽過的寶藏。對你來說，聽音樂是一場永無止境的知識探索之旅。' },
  ENTJ: { name: '強勢的聽覺掌控者', desc: '你的歌單像是一份精心規劃的策略清單。你喜歡有力量感的音樂，需要它在你征服每一天時為你提供燃料。' },
  ENTP: { name: '反叛的聲音獵人', desc: '你永遠在挑戰主流，喜歡那些有點奇怪、有點挑釁的音樂。你的歌單讓別人摸不透，但你就是愛這種感覺。' },
  INFJ: { name: '靈魂共鳴的追尋者', desc: '你把每首歌當成一面鏡子，尋找那些能說出你說不出口的感受的旋律。音樂對你來說是靈魂的語言，不只是娛樂。' },
  INFP: { name: '迷霧中的旋律漫遊者', desc: '你是個用音樂做夢的人。一首歌能讓你在腦海裡展開整部電影，你永遠在尋找那首能讓你淚崩的完美歌曲。' },
  ENFJ: { name: '溫暖的音樂傳遞者', desc: '你聽音樂是為了分享。你總是第一個說「你一定要聽這首！」的人，因為你相信對的音樂能改變一個人的一天。' },
  ENFP: { name: '跳躍感性的音浪衝浪者', desc: '你的心情決定你的歌單，而你的心情每小時都在變。你活在音樂的當下，每首歌都是一次全新的冒險。' },
  ISTJ: { name: '穩定忠實的老派聆聽者', desc: '你有固定的歌單，某些歌你已經聽了幾百遍還不夠。對你來說，熟悉的旋律就是最好的陪伴，可靠又安心。' },
  ISFJ: { name: '懷舊溫柔的記憶守護者', desc: '每首歌背後都有一段你珍藏的回憶。你喜歡能讓心情平靜下來的溫柔旋律，像一杯熱茶陪你度過每個普通的夜晚。' },
  ESTJ: { name: '效率至上的節奏執行者', desc: '你用音樂提升效率。工作時、運動時、通勤時，你都有對應的歌單。你不浪費時間猶豫，直接播最有效果的那首。' },
  ESFJ: { name: '人氣榜單的快樂跟隨者', desc: '你喜歡那些讓大家都能一起唱的歌。流行榜上的金曲是你的最愛，因為音樂就是要一起分享才有意義！' },
  ISTP: { name: '冷靜酷感的獨立聽眾', desc: '你不需要別人推薦，自己挖歌比任何算法都準。你偏好有質感、不做作的音樂，酷感是你選歌的唯一標準。' },
  ISFP: { name: '細膩敏感的美感體驗者', desc: '你用全身感受音樂。一首歌的聲音質地、人聲的顆粒感，都能讓你沉浸其中。你聽的不只是音樂，是一種藝術體驗。' },
  ESTP: { name: '當下燃燒的能量爆發者', desc: '你需要讓你動起來的音樂！節奏強、Bass 重、讓你忍不住點頭的那種。你聽音樂就是要感受當下最大的刺激。' },
  ESFP: { name: '派對靈魂的快樂製造機', desc: '你走到哪裡音樂就跟到哪裡。你是那個會突然在客廳開始跳舞的人，因為對你來說，生活本身就是一場演唱會。' },
};

// 每種 MBTI 的隨機推薦語（各 3 句）
const MESSAGES = {
  INTJ: ['今天適合在深夜獨自聆聽這首...', '這首歌的結構，你一定能聽懂它的邏輯之美', '當世界太吵，這首給你一個安靜的角落'],
  INTP: ['這是一首你可能還沒發現的寶藏歌曲', '挖掘這首歌的細節，你會找到驚喜', '這首歌值得你反覆研究每一個音符'],
  ENTJ: ['今天需要能量嗎？這首為你充電', '這首歌的氣場和你一樣強大', '播放它，然後去征服今天的目標'],
  ENTP: ['這首歌有點怪，但你會愛上它', '挑戰你的音樂邊界，從這首開始', '這首歌的概念，你一定有話想說'],
  INFJ: ['這首歌說出了你說不出口的話', '今晚靜下來，讓這首歌說話', '這是一首懂你的歌'],
  INFP: ['這首歌會讓你在腦海裡展開一部電影', '今天適合用這首歌做夢', '這首歌是為你這樣的靈魂而存在的'],
  ENFJ: ['這首歌，你一定要分享給你在乎的人', '用這首歌溫暖今天遇見的每一個人', '這首歌像你一樣，充滿溫度'],
  ENFP: ['跟著這首歌跳起來吧！', '今天的心情配這首剛好', '你的能量和這首歌一樣停不下來'],
  ISTJ: ['這首歌值得你加入固定歌單', '經典就是經典，這首你會聽很多遍', '穩定可靠，就像你一樣，這首歌也是'],
  ISFJ: ['這首歌會讓你想起某個珍貴的人', '今晚泡杯茶，配上這首歌', '這首歌輕輕地陪著你，就夠了'],
  ESTJ: ['這首歌讓你的效率直接翻倍', '工作時播這首，你會更專注', '這首歌的節奏就是你今天的步調'],
  ESFJ: ['這首歌大家都在聽，你也來聽聽！', '一起唱這首，今天更快樂', '這首歌讓所有人都笑起來'],
  ISTP: ['這首很酷，不解釋', '你的品味讓你找到了這首', '低調但有質感，就像你選歌的方式'],
  ISFP: ['閉上眼睛，感受這首歌的每一個細節', '這首歌的聲音質地，你會懂的', '用耳機聽這首，美感翻倍'],
  ESTP: ['這首讓你動起來的節奏停不下來', 'Bass 夠重，適合你今天的狀態', '這首歌的能量和你一樣滿出來'],
  ESFP: ['今天就是要跳舞！就這首！', '播這首，把快樂傳染給身邊的人', '你的派對能量配這首，完美'],
};

function Result() {
  const [mbti, setMbti] = useState('');
  const [nickname, setNickname] = useState('');
  const [songs, setSongs] = useState([]);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
  const savedNickname = localStorage.getItem('nickname') || '你';
  const savedAnswers = JSON.parse(localStorage.getItem('mbtiAnswers')) || {};
  setNickname(savedNickname);

  orchestrator(savedAnswers).then(result => {
    setMbti(result.mbtiType);
    setMessage(result.message);
    setSongs(result.songs);
    // 把 personality 也存起來用
    localStorage.setItem('mbtiResult', result.mbtiType);
  });
}, []);

  const personality = PERSONALITY_MAP[mbti] || PERSONALITY_MAP['INFP'];

  const langLabel = { zh: '🇹🇼 中文', ko: '🇰🇷 韓文', en: '🇺🇸 英文' };

  return (
    <div className="page" style={{ justifyContent: 'flex-start', paddingTop: '32px' }}>

      {/* 標題 */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <p style={{ fontSize: '14px', opacity: 0.6, marginBottom: '4px' }}>
          {nickname} 的音樂人格測驗結果
        </p>
        <div style={{
          display: 'inline-block',
          fontSize: '48px',
          fontWeight: '900',
          background: 'linear-gradient(120deg, #ff8ad4, #9b71ff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '4px'
        }}>
          {mbti}
        </div>
        <h2 style={{ fontSize: '18px' }}>{personality.name}</h2>
      </div>

      {/* 人格描述 */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <p style={{ fontSize: '15px', lineHeight: '1.8', opacity: 0.9 }}>
          {personality.desc}
        </p>
        <div style={{
          marginTop: '16px',
          padding: '12px 16px',
          background: 'rgba(155,113,255,0.15)',
          borderRadius: '12px',
          borderLeft: '3px solid #9b71ff',
          fontSize: '14px',
          fontStyle: 'italic',
          opacity: 0.9
        }}>
          🎵 {message}
        </div>
      </div>

      {/* 推薦歌曲 */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '17px', marginBottom: '16px' }}>
          🎧 為你推薦的 3 首歌
        </h2>

        {songs.length === 0 ? (
          <p style={{ opacity: 0.5, fontSize: '14px' }}>
            請先在 songs.json 填入 Spotify ID，歌曲才會顯示喔！
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {songs.map((song, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '15px' }}>{song.title}</div>
                    <div style={{ fontSize: '13px', opacity: 0.6 }}>{song.artist} · {langLabel[song.lang]}</div>
                  </div>
                  <span style={{
                    fontSize: '11px',
                    padding: '3px 8px',
                    background: 'rgba(255,138,212,0.2)',
                    borderRadius: '999px',
                    border: '1px solid rgba(255,138,212,0.3)'
                  }}>#{i + 1}</span>
                </div>
                {/* Spotify 嵌入播放器 */}
                <iframe
                  src={`https://open.spotify.com/embed/track/${song.spotify_id}?utm_source=generator&theme=0`}
                  width="100%"
                  height="152"
                  frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  style={{ borderRadius: '12px' }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 按鈕 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '40px' }}>
        <button className="btn" onClick={() => {
          localStorage.removeItem('mbtiResult');
          localStorage.removeItem('mbtiAnswers');
          navigate('/');
        }}>
          🔁 重新測驗
        </button>
        <button className="btn-ghost" onClick={() => {
          navigator.clipboard.writeText(`我的 MBTI 音樂人格是 ${mbti}！${personality.name} 🎵`);
          alert('已複製結果！快分享給朋友吧 🎉');
        }} style={{ width: '100%', padding: '14px' }}>
          📤 分享結果
        </button>
      </div>

    </div>
  );
}

export default Result;