import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import { QRCodeSVG } from 'qrcode.react';
import { runV2Analysis } from '../../core/analysisService';
import SpotifyIframe from '../../components/common/SpotifyIframe';
import { supabase } from '../../lib/supabase';
import {
  PREFERENCE_MAP, LANG_LABEL, STYLE_CONFIG,
  buildProfileSummary, buildWhyConnection, buildDimTitle,
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
  const [msgText, setMsgText]       = useState('');
  const [msgStatus, setMsgStatus]   = useState('idle'); // 'idle' | 'sending' | 'sent' | 'error'
  const [previewDataUrl, setPreviewDataUrl] = useState(null);
  const shareCardRef = useRef(null);
  const initCalledRef = useRef(false);

  const avg           = JSON.parse(localStorage.getItem('v2_avgFeatures')   || 'null');
  const styleWeights  = JSON.parse(localStorage.getItem('v2_styleWeights')  || 'null');
  const isAiGenerated = JSON.parse(localStorage.getItem('v2_isAiGenerated') || 'false');

  useEffect(() => {
    if (!avg) { navigate('/v2'); return; }
    if (initCalledRef.current) return;
    initCalledRef.current = true;

    const nickname = localStorage.getItem('nickname') || '匿名';
    runV2Analysis(avg, {
      nickname,
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
    }).catch(() => {
      navigate('/v2');
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <LoadingScreen message={loadingMsg} />;
  if (!analysis || !avg) return null;

  const mbti       = analysis.mbtiType;
  const nickname   = localStorage.getItem('nickname') || '你';
  const preference = PREFERENCE_MAP[mbti] || PREFERENCE_MAP['INFP'];
  const profileSummary = buildProfileSummary(avg);
  const handleDownloadJpg = async () => {
    if (!shareCardRef.current) return;
    try {
      const overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;inset:0;background:#fff;z-index:9998;pointer-events:none;';
      document.body.appendChild(overlay);
      shareCardRef.current.style.left = '0px';
      shareCardRef.current.style.zIndex = '9999';
      const canvas = await html2canvas(shareCardRef.current, {
        backgroundColor: '#f8f4f0', scale: 2, useCORS: true, logging: false,
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
        background: 'linear-gradient(135deg, #f0f6ff 0%, #fce4f0 50%, #e8f4ff 100%)', fontFamily: 'sans-serif',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div style={{ fontSize: '12px', color: '#a0b4c0', fontWeight: '600' }}>{profileSummary}</div>
        </div>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '13px', color: '#a0b4c0', fontWeight: '600', marginBottom: '6px' }}>{nickname} 的音樂人格</div>
          <div style={{
            fontSize: '52px', fontWeight: '900', lineHeight: 1, color: '#2d3748',
          }}>{mbti}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: '16px', padding: '18px 20px', boxShadow: '0 2px 16px rgba(126,200,227,0.12)', marginBottom: '16px' }}>
          <div style={{
            fontSize: '16px', fontWeight: '800', marginBottom: '8px', color: '#2d3748',
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '4px' }}>
          <QRCodeSVG value="https://mbti-music-1.vercel.app/" size={52} bgColor="#ffffff" fgColor="#2d3748" style={{ borderRadius: 6, padding: 3 }} />
          <div>
            <div style={{ fontSize: '10px', color: '#b0c4d0', fontWeight: '700' }}>掃碼測你的音樂人格</div>
            <div style={{ fontSize: '10px', color: '#b0c4d0', opacity: 0.7 }}>mbti-music-1.vercel.app</div>
          </div>
        </div>
      </div>

      {/* 底部三大按鈕 */}
      <motion.div {...su(0.68)} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
        <button className="btn" onClick={handleRetry}>🔄 重新測驗</button>
        <button className="btn-ghost" onClick={handleDownloadJpg}>📸 截圖下載 JPG</button>
        <button className="btn-ghost" onClick={handleCopyLink}>{copyMsg || '🔗 複製分享連結'}</button>
      </motion.div>

      {/* 留言區塊 */}
      <motion.div {...su(0.78)} className="card" style={{ marginTop: '16px' }}>
        <div style={{ fontSize: '12px', color: '#a0b4c0', fontWeight: '700', letterSpacing: '1px', marginBottom: '12px' }}>
          💬 想給開發者說的話
        </div>
        {msgStatus === 'sent' ? (
          <motion.p
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            style={{ fontSize: '14px', color: '#7ec8e3', fontWeight: '600', textAlign: 'center', padding: '12px 0' }}
          >
            謝謝你的留言，我看到了 🎵
          </motion.p>
        ) : (
          <>
            <textarea
              value={msgText}
              onChange={e => setMsgText(e.target.value)}
              maxLength={150}
              placeholder="任何想說的話都可以留下來!"
              style={{
                width: '100%', boxSizing: 'border-box',
                minHeight: '80px', resize: 'none',
                border: '1.5px solid rgba(126,200,227,0.3)',
                borderRadius: '12px', padding: '10px 12px',
                fontSize: '14px', color: '#2d3748', lineHeight: '1.6',
                background: 'rgba(248,252,255,0.8)',
                outline: 'none', fontFamily: 'inherit',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
              <span style={{ fontSize: '11px', color: '#b0c4d0' }}>{msgText.length} / 150</span>
              <button
                onClick={async () => {
                  if (!msgText.trim() || msgStatus === 'sending') return;
                  setMsgStatus('sending');
                  const { error } = await supabase.from('messages').insert([{
                    nickname: localStorage.getItem('nickname') || '匿名',
                    mbti_type: mbti,
                    content: msgText.trim(),
                    created_at: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
                  }]);
                  setMsgStatus(error ? 'error' : 'sent');
                }}
                disabled={!msgText.trim() || msgStatus === 'sending'}
                style={{
                  padding: '7px 18px', borderRadius: '20px', border: 'none',
                  background: msgText.trim() ? 'linear-gradient(120deg, #ff9ec4, #7ec8e3)' : 'rgba(180,200,220,0.3)',
                  color: msgText.trim() ? '#fff' : '#b0c4d0',
                  fontSize: '13px', fontWeight: '700', cursor: msgText.trim() ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                }}
              >
                {msgStatus === 'sending' ? '傳送中...' : '送出'}
              </button>
            </div>
            {msgStatus === 'error' && (
              <p style={{ fontSize: '12px', color: '#e53e3e', marginTop: '6px' }}>送出失敗，請稍後再試</p>
            )}
          </>
        )}
      </motion.div>

    </div>
  );
}
