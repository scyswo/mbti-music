import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import { runV2Analysis } from '../../core/analysisService';
import SpotifyIframe from '../../components/common/SpotifyIframe';
import ProgressBar from '../../components/common/ProgressBar';
import {
  PREFERENCE_MAP, LANG_LABEL, STYLE_CONFIG, DIM_CONFIG,
  getDynamicInsight, buildProfileSummary, buildWhyConnection, buildSongReason, buildDimTitle,
} from '../../helpers/quizConfig';
import { ALL_STYLES } from '../../helpers/musicMath';


// ── Loading 畫面 ─────────────────────────────────────────────
function LoadingScreen({ message }) {
  return (
    <div className="page">
      <motion.div className="card" style={{ textAlign: 'center', padding: '56px 28px' }}
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
      >
        <motion.div style={{ fontSize: 44, marginBottom: 24 }}
          animate={{ rotate: [0, 15, -15, 15, 0], scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
        >🎵</motion.div>

        <AnimatePresence mode="wait">
          <motion.p key={message} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35 }}
            style={{ color: '#5a8fa8', fontWeight: 600, fontSize: 15 }}
          >{message}</motion.p>
        </AnimatePresence>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 20 }}>
          {[0, 1, 2].map(i => (
            <motion.div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#7ec8e3' }}
              animate={{ opacity: [0.3, 1, 0.3], y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ── 主元件 ──────────────────────────────────────────────────
export default function V2Result() {
  const navigate = useNavigate();
  const [loading, setLoading]       = useState(true);
  const [loadingMsg, setLoadingMsg] = useState('AI 正在分析你的音樂靈魂...');
  const [analysis, setAnalysis]     = useState(null);
  const [topSongs, setTopSongs]     = useState([]);
  const [copyMsg, setCopyMsg]       = useState('');
  const shareCardRef = useRef(null);
  const initCalledRef = useRef(false);

  const avg           = JSON.parse(localStorage.getItem('v2_avgFeatures')   || 'null');
  const styleWeights  = JSON.parse(localStorage.getItem('v2_styleWeights')  || 'null');
  const isAiGenerated = JSON.parse(localStorage.getItem('v2_isAiGenerated') || 'false');

  useEffect(() => {
    if (!avg) { navigate('/v2'); return; }
    if (initCalledRef.current) return;
    initCalledRef.current = true;

    runV2Analysis(avg, {
      onStatus: status => {
        if (status === 'analyzing')     setLoadingMsg('AI 正在分析你的音樂靈魂...');
        if (status === 'loading_songs') setLoadingMsg('正在從音樂庫中尋找最匹配的歌曲...');
      },
    }).then(({ analysis: a, topSongs: s }) => {
      localStorage.setItem('v2_analysis', JSON.stringify(a));
      localStorage.setItem('v2_topSongs', JSON.stringify(s));
      setAnalysis(a);
      setTopSongs(s);
      setLoading(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <LoadingScreen message={loadingMsg} />;
  if (!analysis || !avg) return null;

  const mbti       = analysis.mbtiType;
  const nickname   = localStorage.getItem('nickname') || '你';
  const preference = PREFERENCE_MAP[mbti] || PREFERENCE_MAP['INFP'];
  const profileSummary = buildProfileSummary(avg);
  const whyConnection  = buildWhyConnection(mbti, avg);

  const handleDownloadJpg = async () => {
    if (!shareCardRef.current) return;
    try {
      const canvas = await html2canvas(shareCardRef.current, {
        backgroundColor: '#f8f4f0', scale: 2, useCORS: true, logging: false,
      });
      const link = document.createElement('a');
      link.download = `mbti-music-${mbti || 'result'}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.92);
      link.click();
    } catch { alert('截圖失敗，請嘗試長按畫面儲存圖片'); }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin).then(() => {
      setCopyMsg('連結已複製！');
      setTimeout(() => setCopyMsg(''), 2500);
    });
  };

  const handleRetry = () => {
    ['v2_avgFeatures', 'v2_styleWeights', 'v2_analysis', 'v2_topSongs'].forEach(k => localStorage.removeItem(k));
    navigate('/v2');
  };

  const su = (delay = 0) => ({
    initial: { opacity: 0, y: 44 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.48, delay, ease: 'easeOut' } },
  });

  return (
    <div className="page-top">

      {/* AI 生成標籤 */}
      {isAiGenerated && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          style={{ textAlign: 'center', marginBottom: '8px' }}>
          <span style={{
            fontSize: '11px', padding: '3px 12px', borderRadius: '999px',
            background: 'linear-gradient(120deg, rgba(255,158,196,0.15), rgba(126,200,227,0.15))',
            border: '1px solid rgba(126,200,227,0.35)', color: '#5a8fa8', fontWeight: '600',
          }}>✨ 由 AI 靈魂導航生成</span>
        </motion.div>
      )}

      {/* 大標題 */}
      <motion.div {...su(0.06)} style={{ textAlign: 'center', marginBottom: '20px', marginTop: '12px' }}>
        <p style={{ fontSize: '13px', color: '#a0b4c0', marginBottom: '8px', fontWeight: '600' }}>
          {nickname} 的音樂人格測驗結果
        </p>
        <div className="gradient-text" style={{ fontSize: '56px', fontWeight: '900', lineHeight: 1 }}>
          {mbti}
        </div>
        <div style={{
          marginTop: '10px', display: 'inline-block',
          padding: '4px 16px', borderRadius: '999px',
          background: 'linear-gradient(120deg, rgba(246,173,85,0.18), rgba(147,130,200,0.18))',
          border: '1px solid rgba(246,173,85,0.35)',
          fontSize: '13px', fontWeight: '700', color: '#b07d3a', letterSpacing: '0.5px',
        }}>
          ✦ {buildDimTitle(avg)}
        </div>
      </motion.div>

      {/* ① 音樂人格 */}
      <motion.div {...su(0.12)} className="card">
        <div style={{ fontSize: '12px', color: '#a0b4c0', fontWeight: '700', letterSpacing: '1px', marginBottom: '10px' }}>
          ① 音樂人格 Music Personality
        </div>
        <div style={{ fontSize: '20px', fontWeight: '800', marginBottom: '10px' }} className="gradient-text">
          你是：{analysis.musicPersona}
        </div>
        <p style={{ fontSize: '14px', lineHeight: '1.8', color: '#4a5568' }}>{analysis.summary}</p>
        <div style={{
          marginTop: '16px', padding: '12px 16px',
          background: 'linear-gradient(120deg, rgba(255,158,196,0.1), rgba(126,200,227,0.1))',
          borderRadius: '12px', borderLeft: '3px solid #ff9ec4',
          fontSize: '13px', color: '#5a8fa8', fontStyle: 'italic',
        }}>
          🎵 {analysis.likes}
        </div>
        <div style={{ marginTop: '16px' }}>
          <div style={{ fontSize: '12px', color: '#a0b4c0', fontWeight: '600', marginBottom: '8px' }}>偏好曲風</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {preference.genres.map((g, i) => (
              <span key={i} className={i % 2 === 0 ? 'tag' : 'tag tag-pink'}>{g}</span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ② 音樂風格偏好量表 */}
      <motion.div {...su(0.2)} className="card">
        <div style={{ fontSize: '12px', color: '#a0b4c0', fontWeight: '700', letterSpacing: '1px', marginBottom: '16px' }}>
          ② 音樂風格偏好量表
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {ALL_STYLES.map((style, i) => {
            const cfg = STYLE_CONFIG[style];
            const val = styleWeights ? (styleWeights[style] ?? 0) : 0;
            return (
              <motion.div key={style}
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.22 + i * 0.07 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#2d3748' }}>
                    {cfg.emoji} {cfg.zh}
                    <span style={{ fontSize: '11px', color: '#a0b4c0', fontWeight: '400', marginLeft: '6px' }}>{style}</span>
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: cfg.accent }}>{val}%</span>
                </div>
                <div className="progress-wrap">
                  <motion.div
                    className="progress-bar"
                    initial={{ width: 0 }}
                    animate={{ width: `${val}%` }}
                    transition={{ duration: 0.65, delay: 0.25 + i * 0.07, ease: 'easeOut' }}
                    style={{ background: `linear-gradient(90deg, ${cfg.accent}aa, ${cfg.accent})` }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ③ 偏好分析 */}
      <motion.div {...su(0.28)} className="card">
        <div style={{ fontSize: '12px', color: '#a0b4c0', fontWeight: '700', letterSpacing: '1px', marginBottom: '16px' }}>
          ③ 偏好分析 Preference Analysis
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          {[
            { icon: '👍', label: '喜歡：',  text: analysis.likes },
            { icon: '💛', label: '不偏好：', text: analysis.dislikes },
            { icon: '🕐', label: '時段：',  text: analysis.listenTime },
          ].map(({ icon, label, text }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px' }}>
              <span style={{ fontSize: '16px', flexShrink: 0 }}>{icon}</span>
              <div>
                <span style={{ color: '#a0b4c0', fontWeight: '600' }}>{label}</span>
                <span style={{ color: '#4a5568' }}>{text}</span>
              </div>
            </div>
          ))}
        </div>
        {/* 音樂人格五維度 暫時隱藏 */}
      </motion.div>

      {/* MBTI 理由鏈 */}
      <motion.div {...su(0.46)} className="card">
        <div style={{ fontSize: '15px', color: '#1a202c', fontWeight: '800', marginBottom: '12px' }}>
          🔗 為什麼你像 {mbti}？
        </div>
        <p style={{ fontSize: '14px', lineHeight: '1.85', color: '#4a5568' }}>
          👉 {whyConnection}
        </p>
      </motion.div>

      {/* ③ 推薦歌曲 */}
      <motion.div {...su(0.54)} className="card">
        <div style={{ fontSize: '12px', color: '#a0b4c0', fontWeight: '700', letterSpacing: '1px', marginBottom: '16px' }}>
          ④ 為你精選的 3 首最佳推薦
        </div>
        {topSongs.length === 0 ? (
          <p style={{ fontSize: '14px', color: '#b0c4d0', textAlign: 'center', padding: '20px 0' }}>
            請先在 public/songs/ 放入 CSV 檔案，歌曲才會顯示 🎵
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {topSongs.map((song, i) => {
              const trackId = song.spotify_id || '';
              const title   = song.name  || song.track_name  || '未知歌曲';
              const artist  = song.artist || song.artist_name || '未知歌手';
              const langTag = song.lang ? (LANG_LABEL[song.lang] || song.lang) : null;
              const reason  = buildSongReason(song, avg);
              return (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.58 + i * 0.1 }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '15px', color: '#2d3748' }}>{title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                        <span style={{ fontSize: '12px', color: '#a0b4c0' }}>{artist}</span>
                        {langTag && (
                          <span style={{
                            fontSize: '10px', padding: '1px 7px', borderRadius: '999px',
                            background: 'rgba(126,200,227,0.12)', color: '#5a8fa8', fontWeight: '600',
                          }}>{langTag}</span>
                        )}
                      </div>
                    </div>
                    <span style={{
                      fontSize: '11px', padding: '3px 10px', flexShrink: 0,
                      background: 'linear-gradient(120deg, rgba(255,158,196,0.15), rgba(126,200,227,0.15))',
                      borderRadius: '999px', border: '1px solid rgba(126,200,227,0.3)',
                      color: '#7ec8e3', fontWeight: '700',
                    }}>#{i + 1}</span>
                  </div>
                  <p style={{
                    fontSize: '12px', color: '#8a9ab0', lineHeight: '1.6', fontStyle: 'italic',
                    marginBottom: '8px', borderLeft: '2px solid rgba(126,200,227,0.35)', paddingLeft: '8px',
                  }}>
                    💬 {reason}
                  </p>
                  <SpotifyIframe trackId={trackId} title={title} />
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* 隱藏分享截圖卡片 */}
      <div ref={shareCardRef} style={{
        position: 'fixed', left: '-9999px', top: 0, width: '360px', padding: '32px 24px',
        background: 'linear-gradient(145deg, #fff8f5 0%, #f0f8ff 100%)', fontFamily: 'sans-serif',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div style={{ fontSize: '12px', color: '#a0b4c0', fontWeight: '600' }}>{profileSummary}</div>
        </div>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '13px', color: '#a0b4c0', fontWeight: '600', marginBottom: '6px' }}>{nickname} 的音樂人格</div>
          <div style={{
            fontSize: '52px', fontWeight: '900', lineHeight: 1,
            background: 'linear-gradient(120deg, #ff9ec4, #7ec8e3)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>{mbti}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: '16px', padding: '18px 20px', boxShadow: '0 2px 16px rgba(126,200,227,0.12)', marginBottom: '16px' }}>
          <div style={{
            fontSize: '16px', fontWeight: '800', marginBottom: '8px',
            background: 'linear-gradient(120deg, #ff9ec4, #7ec8e3)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>{analysis.musicPersona}</div>
          <p style={{ fontSize: '13px', lineHeight: '1.7', color: '#4a5568', margin: 0 }}>{analysis.summary}</p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
          {preference.genres.map((g, i) => (
            <span key={i} style={{
              fontSize: '11px', padding: '4px 10px', borderRadius: '999px',
              background: i % 2 === 0 ? 'rgba(126,200,227,0.15)' : 'rgba(255,158,196,0.15)',
              color: i % 2 === 0 ? '#7ec8e3' : '#ff9ec4', fontWeight: '600',
            }}>{g}</span>
          ))}
        </div>
        {topSongs.length > 0 && (
          <div style={{ background: '#fff', borderRadius: '16px', padding: '16px 20px', boxShadow: '0 2px 16px rgba(126,200,227,0.12)', marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', color: '#a0b4c0', fontWeight: '700', letterSpacing: '1px', marginBottom: '12px' }}>🎵 為你精選的歌曲</div>
            {topSongs.map((song, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{
                  width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(120deg, #ff9ec4, #7ec8e3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: '800', color: '#fff',
                }}>{i + 1}</div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#2d3748' }}>{song.name || '未知歌曲'}</div>
                  <div style={{ fontSize: '11px', color: '#a0b4c0', marginTop: '1px' }}>
                    {song.artist || ''}{song.lang ? ` · ${LANG_LABEL[song.lang] || song.lang}` : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{ textAlign: 'center', fontSize: '11px', color: '#b0c4d0' }}>mbti-music.vercel.app</div>
      </div>

      {/* 底部三大按鈕 */}
      <motion.div {...su(0.68)} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
        <button className="btn" onClick={handleRetry}>🔄 重新測驗</button>
        <button className="btn-ghost" onClick={handleDownloadJpg}>📸 截圖下載 JPG</button>
        <button className="btn-ghost" onClick={handleCopyLink}>{copyMsg || '🔗 複製分享連結'}</button>
      </motion.div>

    </div>
  );
}
