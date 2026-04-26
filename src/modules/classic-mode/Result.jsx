import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { QRCodeSVG } from 'qrcode.react';
import { orchestrator } from '../../agents/orchestrator';

// ── 16 種 MBTI 聽歌人格描述 ──────────────────────────────────
const PERSONALITY_MAP = {
  INTJ: { name: '孤獨的旋律建築師',    desc: '你對音樂其實很挑剔，比起盲目跟風，更喜歡拆解編曲裡的細節。那些能撞擊靈魂的旋律，對你來說才算真正的共鳴。' },
  INTP: { name: '音符邏輯探索者',      desc: '你總在挖掘那些沒人聽過的冷門神曲，對你來說，在音符裡找到未知的寶藏，比聽什麼熱門榜單都有趣多了。' },
  ENTJ: { name: '強勢的聽覺掌控者',   desc: '你的歌單就是你的戰鬥曲，你喜歡有力量的節奏，讓音樂在你征服生活中的每個挑戰時，提供最強大的底氣。' },
  ENTP: { name: '反叛的聲音獵人',     desc: '你最愛那些古怪又挑釁的實驗性旋律。你的歌單沒人摸得透，而你最享受這種讓人意外的感覺。' },
  INFJ: { name: '靈魂共鳴的追尋者',   desc: '你把每首歌都當成靈魂的鏡子，在旋律裡尋找那些你說不出口的情緒。對你來說，音樂是懂你的知己，不只是娛樂。' },
  INFP: { name: '迷霧中的旋律漫遊者', desc: '你是個用音樂做夢的人，一首歌就能讓你在腦海裡演完一場電影。你一直在尋找那首能讓你徹底釋放情感的真命天曲。' },
  ENFJ: { name: '溫暖的音樂傳遞者',   desc: '你聽歌是為了連結彼此，只要聽到好歌，你就迫不及待想分享。因為你相信一段對的旋律，真的能溫暖某個人的心。' },
  ENFP: { name: '跳躍感性的音浪衝浪者', desc: '你的心情就是你的調音師，歌單隨時都在變。你享受每一首歌帶來的全新冒險，音樂對你來說就是活在當下的快樂。' },
  ISTJ: { name: '穩定忠實的老派聆聽者', desc: '你很念舊，有些歌聽了幾百遍還是你的首選。比起追求新鮮感，這種熟悉的旋律帶給你的安心感，是誰也替代不了的。' },
  ISFJ: { name: '懷舊溫柔的記憶守護者', desc: '每首歌都藏著你的一段回憶。你喜歡那種溫柔、安靜的旋律，像是在深夜裡陪著你的一杯熱茶，平靜且療癒。' },
  ESTJ: { name: '效率至上的節奏執行者', desc: '你把音樂當成生活的助推器，不管是工作還是運動，你都有最精準的選擇。不浪費時間猶豫，直接點開最有感的那首。' },
  ESFJ: { name: '人氣榜單的快樂跟隨者', desc: '你喜歡大家都能一起唱的流行金曲。對你來說，音樂的魅力就在於能讓每個人都參與其中，一起快樂才是最重要的。' },
  ISTP: { name: '冷靜酷感的獨立聽眾', desc: '你不需要別人指手畫腳，自己挖到的歌才夠酷。你追求的是一種不做作的質感，只要節奏對了，其餘的都不重要。' },
  ISFP: { name: '細膩敏感的美感體驗者', desc: '你用全身的感官在聽音樂，特別在意人聲的細膩與聲音的質地。對你來說，聽歌不只是聽，更像是在感受一場藝術。' },
  ESTP: { name: '當下燃燒的能量爆發者', desc: '你需要那種能讓你燃起來的節奏！Bass 要重、重拍要準，聽音樂就是要追求那種全身細胞都被點燃的快感。' },
  ESFP: { name: '派對靈魂的快樂製造機', desc: '生活就是你的演唱會，你走到哪裡音樂就響到哪裡。你喜歡那種能讓你隨時跳起舞來的旋律，快樂才是唯一的標準。' },
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
  const [shareId, setShareId]   = useState(null);
  const [copyMsg, setCopyMsg]   = useState('');
  const [previewDataUrl, setPreviewDataUrl] = useState(null);
  const shareCardRef = useRef(null);
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
      setShareId(result.shareId ?? null);
      localStorage.setItem('mbtiResult', result.mbtiType);
      setLoading(false);
    });
  }, []);

  const handleDownloadJpg = async () => {
    if (!shareCardRef.current) return;
    try {
      const overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;inset:0;background:#fff;z-index:9998;pointer-events:none;';
      document.body.appendChild(overlay);
      shareCardRef.current.style.left = '0px';
      shareCardRef.current.style.zIndex = '9999';
      const canvas = await html2canvas(shareCardRef.current, {
        backgroundColor: '#ffd6e8', scale: 2, useCORS: true, logging: false,
      });
      shareCardRef.current.style.left = '-9999px';
      shareCardRef.current.style.zIndex = '';
      document.body.removeChild(overlay);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setPreviewDataUrl(dataUrl);
      try {
        const link = document.createElement('a');
        link.download = `mbti-music-${mbti || 'result'}.jpg`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch { /* 桌面下載失敗時使用者可長按儲存 */ }
    } catch { alert('截圖失敗，請嘗試長按畫面儲存圖片'); }
  };

  const handleCopyLink = () => {
    const url = shareId
      ? `${window.location.origin}/share/${shareId}`
      : `${window.location.origin}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopyMsg('連結已複製！');
      setTimeout(() => setCopyMsg(''), 2500);
    });
  };

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

      {/* 截圖預覽 Modal（IG/LINE 等 in-app 瀏覽器長按儲存） */}
      {previewDataUrl && (
        <div onClick={() => setPreviewDataUrl(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)',
          zIndex: 10000, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 16, padding: 20,
        }}>
          <img src={previewDataUrl} alt="截圖預覽"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '100%', maxHeight: '65vh', borderRadius: 12, boxShadow: '0 4px 32px rgba(0,0,0,0.4)' }} />
          <p style={{ color: '#fff', fontSize: 13, textAlign: 'center', lineHeight: 1.6, margin: 0 }}>
            📱 <b>長按圖片</b>即可儲存到相簿<br />
            <span style={{ opacity: 0.7 }}>（IG、LINE 等 App 內需長按儲存）</span>
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <a href={previewDataUrl} download={`mbti-music-${mbti || 'result'}.jpg`}
              onClick={e => e.stopPropagation()}
              style={{ padding: '10px 22px', background: '#fff', borderRadius: 8, color: '#333', fontWeight: 700, textDecoration: 'none', fontSize: 14 }}>
              💾 下載
            </a>
            <button onClick={() => setPreviewDataUrl(null)} style={{
              padding: '10px 22px', background: 'transparent', border: '1.5px solid rgba(255,255,255,0.6)',
              borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 14,
            }}>✕ 關閉</button>
          </div>
        </div>
      )}

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

      {/* 分享卡片（用於截圖，視覺上隱藏在頁面外，截圖時捕捉） */}
      <div
        ref={shareCardRef}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          width: '360px',
          overflow: 'hidden',
          padding: '36px 24px 32px',
          background: 'linear-gradient(150deg, #ffd6e8 0%, #e8f4ff 55%, #f0eaff 100%)',
          fontFamily: '"PingFang TC", "Noto Sans TC", "Microsoft JhengHei", sans-serif',
        }}
      >
        {/* 背景光暈球 */}
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(255,158,196,0.45)', filter: 'blur(60px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '60px', left: '-70px', width: '240px', height: '240px', borderRadius: '50%', background: 'rgba(126,200,227,0.35)', filter: 'blur(70px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '45%', right: '-40px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(190,170,255,0.22)', filter: 'blur(45px)', pointerEvents: 'none' }} />

        {/* 內容層 */}
        <div style={{ position: 'relative', zIndex: 1 }}>

          {/* 標頭 */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '12px', color: 'rgba(100,130,160,0.85)', fontWeight: '600', letterSpacing: '0.5px', marginBottom: '8px' }}>
              {nickname} 的音樂人格
            </div>
            <div style={{
              fontSize: '56px', fontWeight: '900', lineHeight: 1,
              background: 'linear-gradient(120deg, #ff9ec4, #7ec8e3)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              {mbti}
            </div>
          </div>

          {/* 人格卡片 — 毛玻璃 */}
          <div style={{
            background: 'rgba(255,255,255,0.55)',
            borderRadius: '18px',
            padding: '20px',
            border: '1px solid rgba(255,255,255,0.75)',
            marginBottom: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <div style={{
                width: '22px', height: '22px', borderRadius: '50%',
                border: '1.5px solid rgba(126,200,227,0.6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: '700', color: '#7ec8e3', flexShrink: 0,
              }}>1</div>
              <span style={{ fontSize: '11px', color: 'rgba(120,150,170,0.9)', fontWeight: '700', letterSpacing: '1px' }}>
                音樂人格
              </span>
            </div>

            <div style={{
              fontSize: '17px', fontWeight: '800', marginBottom: '10px',
              background: 'linear-gradient(120deg, #ff9ec4, #7ec8e3)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              {personality.name}
            </div>
            <p style={{ fontSize: '13px', lineHeight: '1.75', color: '#4a5568', margin: '0 0 14px' }}>
              {personality.desc}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {preference.genres.map((g, i) => (
                <span key={i} style={{
                  fontSize: '11px', padding: '3px 10px', borderRadius: '999px',
                  background: i % 2 === 0 ? 'rgba(126,200,227,0.18)' : 'rgba(255,158,196,0.18)',
                  color: i % 2 === 0 ? '#7ec8e3' : '#ff9ec4',
                  border: `1px solid ${i % 2 === 0 ? 'rgba(126,200,227,0.3)' : 'rgba(255,158,196,0.3)'}`,
                  fontWeight: '600',
                }}>{g}</span>
              ))}
            </div>
          </div>

          {/* 推薦歌曲卡片 — 毛玻璃 */}
          {songs.length > 0 && (
            <div style={{
              background: 'rgba(255,255,255,0.55)',
              borderRadius: '18px',
              padding: '20px',
              border: '1px solid rgba(255,255,255,0.75)',
              marginBottom: '20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <div style={{
                  width: '22px', height: '22px', borderRadius: '50%',
                  border: '1.5px solid rgba(255,158,196,0.6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: '700', color: '#ff9ec4', flexShrink: 0,
                }}>2</div>
                <span style={{ fontSize: '11px', color: 'rgba(120,150,170,0.9)', fontWeight: '700', letterSpacing: '1px' }}>
                  為你精選的歌曲
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {songs.map((song, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                      background: 'rgba(255,255,255,0.6)',
                      border: `1.5px solid ${i === 0 ? 'rgba(255,158,196,0.5)' : i === 1 ? 'rgba(126,200,227,0.5)' : 'rgba(190,170,255,0.5)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '12px', fontWeight: '800',
                      color: i === 0 ? '#ff9ec4' : i === 1 ? '#7ec8e3' : '#b8a8e8',
                    }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#2d3748', lineHeight: 1.3 }}>{song.title}</div>
                      <div style={{ fontSize: '11px', color: 'rgba(150,170,190,0.9)', marginTop: '2px' }}>{song.artist}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <QRCodeSVG value="https://mbti-music-1.vercel.app/" size={52} bgColor="#ffffff" fgColor="#2d3748" style={{ borderRadius: 6, padding: 3 }} />
            <div>
              <div style={{ fontSize: '10px', color: 'rgba(150,170,190,0.9)', fontWeight: '700' }}>掃碼測你的音樂人格</div>
              <div style={{ fontSize: '10px', color: 'rgba(150,170,190,0.6)' }}>mbti-music-1.vercel.app</div>
            </div>
          </div>
        </div>
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
        <button className="btn-ghost" onClick={handleDownloadJpg}>
          📸 截圖下載 JPG
        </button>
        <button className="btn-ghost" onClick={handleCopyLink}>
          {copyMsg || (shareId ? '🔗 複製分享連結' : '📋 複製結果文字')}
        </button>
      </div>

    </div>
  );
}

export default Result;
