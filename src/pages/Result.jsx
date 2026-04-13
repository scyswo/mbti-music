import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { orchestrator } from '../agents/orchestrator';

// ── 16 種 MBTI 聽歌人格描述 ──────────────────────────────────
const PERSONALITY_MAP = {
  INTJ: { name: '孤獨的旋律建築師',    desc: '你用理性解構每一首歌，從編曲到歌詞都有你自己的評分標準。你不追流行，只追那些真正打動你內心深處的作品。' },
  INTP: { name: '音符邏輯探索者',      desc: '你喜歡挖掘冷門神曲，享受發現別人還沒聽過的寶藏。對你來說，聽音樂是一場永無止境的知識探索之旅。' },
  ENTJ: { name: '強勢的聽覺掌控者',   desc: '你的歌單像是一份精心規劃的策略清單。你喜歡有力量感的音樂，需要它在你征服每一天時為你提供燃料。' },
  ENTP: { name: '反叛的聲音獵人',     desc: '你永遠在挑戰主流，喜歡那些有點奇怪、有點挑釁的音樂。你的歌單讓別人摸不透，但你就是愛這種感覺。' },
  INFJ: { name: '靈魂共鳴的追尋者',   desc: '你把每首歌當成一面鏡子，尋找那些能說出你說不出口的感受的旋律。音樂對你來說是靈魂的語言，不只是娛樂。' },
  INFP: { name: '迷霧中的旋律漫遊者', desc: '你是個用音樂做夢的人。一首歌能讓你在腦海裡展開整部電影，你永遠在尋找那首能讓你淚崩的完美歌曲。' },
  ENFJ: { name: '溫暖的音樂傳遞者',   desc: '你聽音樂是為了分享。你總是第一個說「你一定要聽這首！」的人，因為你相信對的音樂能改變一個人的一天。' },
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

// ── 16 種 MBTI 偏好分析（喜歡 / 不偏好 / 時段 / 曲風）────────
// ⚠️ 若你有自己要填的描述，直接替換這裡的文字
const PREFERENCE_MAP = {
  INTJ: { likes: '深夜獨自沉浸、能讓大腦放空的複雜編曲', dislikes: '過於商業、重複的主流流行歌', time: '深夜 23:00 之後', genres: ['Ambient', 'Post-Rock', 'Dark Pop', 'Instrumental'] },
  INTP: { likes: '有獨特概念、耐聽的實驗性音樂', dislikes: '太過情緒化或煽情的歌曲', time: '深夜或專注工作時', genres: ['Indie Rock', 'Math Rock', 'Alternative', 'Chill'] },
  ENTJ: { likes: '節奏強勁、有力量感的音樂', dislikes: '太慢或太無聊的背景音樂', time: '早晨出門前、運動時', genres: ['Hip-Hop', 'Power Pop', 'Electronic', 'R&B'] },
  ENTP: { likes: '有點怪、有點挑釁的前衛音樂', dislikes: '過於單調或缺乏創意的歌', time: '不固定，完全看靈感', genres: ['Alternative', 'Funk', 'Indie Pop', 'Experimental'] },
  INFJ: { likes: '能說中情緒、充滿意境的歌詞', dislikes: '太吵或沒有故事感的音樂', time: '深夜或晚上 19:00 之後', genres: ['Indie Folk', 'Dream Pop', 'Acoustic', 'Soul'] },
  INFP: { likes: '夜晚、一個人時陪你發呆或整理情緒', dislikes: '太吵或沒有故事感的歌', time: '深夜或晚上 19:00 之後', genres: ['Indie Pop', 'Soft Pop', 'Dream Pop', 'Chill'] },
  ENFJ: { likes: '溫暖、讓人想分享給朋友的歌曲', dislikes: '太過壓抑或負面的音樂', time: '早晨或和朋友在一起時', genres: ['Pop', 'Soul', 'K-Pop', 'Acoustic'] },
  ENFP: { likes: '讓你跟著哼、充滿能量的快樂歌曲', dislikes: '節奏太緩慢或太沉重的音樂', time: '通勤或任何有靈感的時候', genres: ['Pop', 'Indie Pop', 'Dance', 'K-Pop'] },
  ISTJ: { likes: '固定的歌單、熟悉的老歌和經典', dislikes: '太實驗性或難以預測的音樂', time: '傍晚通勤或睡前固定時段', genres: ['Classic Pop', 'Soft Rock', 'Folk', 'Jazz'] },
  ISFJ: { likes: '溫柔旋律、能喚起美好回憶的歌', dislikes: '太刺激或太吵鬧的音樂', time: '睡前或下午安靜的時候', genres: ['Soft Pop', 'Acoustic', 'City Pop', 'Lo-Fi'] },
  ESTJ: { likes: '節奏穩定、能提升效率的音樂', dislikes: '讓人分心或太過隨性的音樂', time: '工作時或早晨', genres: ['Pop', 'Electronic', 'Dance', 'Hip-Hop'] },
  ESFJ: { likes: '大家都在聽的流行金曲、能一起唱的歌', dislikes: '太冷門或聽不懂的音樂', time: '聚會時或任何有人陪的時候', genres: ['Pop', 'K-Pop', 'Dance Pop', 'R&B'] },
  ISTP: { likes: '有質感、不做作的獨立音樂', dislikes: '太主流或太商業化的歌曲', time: '一個人時或深夜', genres: ['Indie', 'Rock', 'Electronic', 'Lo-Fi'] },
  ISFP: { likes: '聲音質地好、充滿畫面感的音樂', dislikes: '太過喧鬧或聽起來假的音樂', time: '任何想沉浸的時刻', genres: ['Indie Pop', 'Dream Pop', 'Acoustic', 'Chillhop'] },
  ESTP: { likes: '節奏強、Bass 重、讓人動起來的音樂', dislikes: '太慢或太悲傷的歌曲', time: '運動、派對或任何需要能量時', genres: ['Hip-Hop', 'EDM', 'Dance', 'Urban Pop'] },
  ESFP: { likes: '讓你忍不住跳舞的快樂音樂', dislikes: '太安靜或讓氣氛變悶的歌', time: '任何時候都能聽！', genres: ['Pop', 'Dance', 'K-Pop', 'EDM'] },
};

// ── 偏好權重計算（依據測驗分數）────────────────────────────────
function calcWeights(scores) {
  const total = Object.values(scores).reduce((a, b) => a + b, 0) || 1;

  // 對應音樂維度
  const chill   = ((scores.I || 0) + (scores.F || 0)) / total;
  const rhythm  = ((scores.E || 0) + (scores.S || 0)) / total;
  const mood    = ((scores.N || 0) + (scores.F || 0)) / total;
  const energy  = ((scores.E || 0) + (scores.T || 0)) / total;
  const kpop    = ((scores.E || 0) + (scores.J || 0)) / total;

  // 正規化到 0~100
  const normalize = (v) => Math.min(100, Math.round(v * 150));

  return [
    { label: 'Chill / Soft',       value: normalize(chill) },
    { label: 'Rhythm / Beat',      value: normalize(rhythm) },
    { label: 'Mood / Atmosphere',  value: normalize(mood) },
    { label: 'Energy',             value: normalize(energy) },
    { label: 'K-Pop / Urban',      value: normalize(kpop) },
  ];
}

// ── 語言標籤 ────────────────────────────────────────────────
const LANG_LABEL = { zh: '🇹🇼 中文', ko: '🇰🇷 韓文', en: '🇺🇸 英文' };

function Result() {
  const [mbti, setMbti]         = useState('');
  const [nickname, setNickname] = useState('');
  const [songs, setSongs]       = useState([]);
  const [message, setMessage]   = useState('');
  const [weights, setWeights]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const savedNickname = localStorage.getItem('nickname') || '你';
    const savedAnswers  = JSON.parse(localStorage.getItem('mbtiScores')) || {};
    setNickname(savedNickname);
    setWeights(calcWeights(savedAnswers));

    orchestrator(savedAnswers, savedNickname).then(result => {
      setMbti(result.mbtiType);
      setMessage(result.message);
      setSongs(result.songs);
      localStorage.setItem('mbtiResult', result.mbtiType);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="page" style={{ alignItems: 'center' }}>
        <p style={{ color: '#7ec8e3' }}>載入中...</p>
      </div>
    );
  }

  const personality = PERSONALITY_MAP[mbti] || PERSONALITY_MAP['INFP'];
  const preference  = PREFERENCE_MAP[mbti]  || PREFERENCE_MAP['INFP'];

  return (
    <div className="page-top">

      {/* 大標題 */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <p style={{ fontSize: '13px', color: '#a0b4c0', marginBottom: '8px', fontWeight: '600' }}>
          {nickname} 的音樂人格測驗結果
        </p>
        <div className="gradient-text" style={{ fontSize: '56px', fontWeight: '900', lineHeight: 1 }}>
          {mbti}
        </div>
      </div>

      {/* ① 音樂人格（第一區塊）*/}
      <div className="card">
        <div style={{ fontSize: '12px', color: '#a0b4c0', fontWeight: '700', letterSpacing: '1px', marginBottom: '10px' }}>
          ① 音樂人格 Music Personality
        </div>
        <div style={{ fontSize: '20px', fontWeight: '800', marginBottom: '10px' }} className="gradient-text">
          你是：{personality.name}
        </div>
        <p style={{ fontSize: '14px', lineHeight: '1.8', color: '#4a5568' }}>
          {personality.desc}
        </p>

        {/* 推薦語 */}
        <div style={{
          marginTop: '16px',
          padding: '12px 16px',
          background: 'linear-gradient(120deg, rgba(255,158,196,0.1), rgba(126,200,227,0.1))',
          borderRadius: '12px',
          borderLeft: '3px solid #ff9ec4',
          fontSize: '13px',
          color: '#5a8fa8',
          fontStyle: 'italic',
        }}>
          🎵 {message}
        </div>

        {/* 偏好曲風標籤 */}
        <div style={{ marginTop: '16px' }}>
          <div style={{ fontSize: '12px', color: '#a0b4c0', fontWeight: '600', marginBottom: '8px' }}>
            偏好曲風
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {preference.genres.map((g, i) => (
              <span key={i} className={i % 2 === 0 ? 'tag' : 'tag tag-pink'}>{g}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ② 偏好分析 */}
      <div className="card">
        <div style={{ fontSize: '12px', color: '#a0b4c0', fontWeight: '700', letterSpacing: '1px', marginBottom: '16px' }}>
          ② 偏好分析 Preference Analysis
        </div>

        {/* 喜歡 / 不偏好 / 時段 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px' }}>
            <span style={{ fontSize: '16px', flexShrink: 0 }}>👍</span>
            <div>
              <span style={{ color: '#a0b4c0', fontWeight: '600' }}>喜歡：</span>
              <span style={{ color: '#4a5568' }}>{preference.likes}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px' }}>
            <span style={{ fontSize: '16px', flexShrink: 0 }}>💛</span>
            <div>
              <span style={{ color: '#a0b4c0', fontWeight: '600' }}>不偏好：</span>
              <span style={{ color: '#4a5568' }}>{preference.dislikes}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px' }}>
            <span style={{ fontSize: '16px', flexShrink: 0 }}>🕐</span>
            <div>
              <span style={{ color: '#a0b4c0', fontWeight: '600' }}>時段：</span>
              <span style={{ color: '#4a5568' }}>{preference.time}</span>
            </div>
          </div>
        </div>

        <div className="divider" />

        {/* 偏好權重長條圖 */}
        <div style={{ fontSize: '12px', color: '#a0b4c0', fontWeight: '600', marginBottom: '12px' }}>
          偏好權重
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {weights.map((w, i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '12px' }}>
                <span style={{ color: '#718096', fontWeight: '500' }}>{w.label}</span>
                <span style={{ color: '#a0b4c0', fontWeight: '600' }}>{w.value}%</span>
              </div>
              <div className="progress-wrap">
                <div className="progress-bar" style={{ width: `${w.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ③ 推薦歌曲 */}
      <div className="card">
        <div style={{ fontSize: '12px', color: '#a0b4c0', fontWeight: '700', letterSpacing: '1px', marginBottom: '16px' }}>
          ③ 為你精選的 3 首最佳推薦
        </div>

        {songs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <p style={{ fontSize: '14px', color: '#b0c4d0' }}>
              請先在 songs.json 填入 Spotify ID，歌曲才會顯示 🎵
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {songs.map((song, i) => (
              <div key={i}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '10px'
                }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '15px', color: '#2d3748' }}>
                      {song.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#a0b4c0', marginTop: '2px' }}>
                      {song.artist} · {LANG_LABEL[song.lang] || song.lang}
                    </div>
                  </div>
                  <span style={{
                    fontSize: '11px',
                    padding: '3px 10px',
                    background: 'linear-gradient(120deg, rgba(255,158,196,0.15), rgba(126,200,227,0.15))',
                    borderRadius: '999px',
                    border: '1px solid rgba(126,200,227,0.3)',
                    color: '#7ec8e3',
                    fontWeight: '700',
                    flexShrink: 0,
                  }}>
                    #{i + 1}
                  </span>
                </div>
                {/* Spotify 嵌入播放器 */}
                <iframe
                  src={`https://open.spotify.com/embed/track/${song.spotify_id}?utm_source=generator&theme=0`}
                  width="100%"
                  height="80"
                  frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  style={{ borderRadius: '14px', display: 'block' }}
                  title={song.title}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 按鈕 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
        <button className="btn" onClick={() => {
          localStorage.removeItem('mbtiResult');
          localStorage.removeItem('mbtiScores');
          localStorage.removeItem('mbtiHistory');
          navigate('/');
        }}>
          🔁 重新測驗
        </button>
        <button className="btn-ghost" onClick={() => {
          navigator.clipboard.writeText(
            `我的 MBTI 音樂人格是 ${mbti}！${personality.name} 🎵`
          );
          alert('已複製結果！快分享給朋友吧 🎉');
        }}>
          📤 分享結果
        </button>
      </div>

    </div>
  );
}

export default Result;
