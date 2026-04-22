import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateAverageFeatures, calculateStyleWeights } from '../../helpers/musicMath';
import { STYLE_CONFIG } from '../../helpers/quizConfig';
import { loadQuizQuestions } from '../../core/quizOrchestrator';

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

export default function V2Quiz() {
  const navigate = useNavigate();
  const [phase, setPhase]               = useState('loading');
  const [questions, setQuestions]       = useState([]);
  const [currentIdx, setCurrentIdx]     = useState(0);
  const [answers, setAnswers]           = useState([]);
  const [selectedLabel, setSelectedLabel] = useState(null);
  const [loadingMsg, setLoadingMsg]     = useState('AI 正在為你量身出題...');
  const [errorMsg, setErrorMsg]         = useState('');
  const initCalledRef = useRef(false);

  const initQuiz = useCallback(async () => {
    setPhase('loading');
    setCurrentIdx(0);
    setAnswers([]);
    setSelectedLabel(null);
    setLoadingMsg('AI 正在為你量身出題...');
    try {
      const { questions: qs, isAiGenerated } = await loadQuizQuestions(10);
      localStorage.setItem('v2_isAiGenerated', JSON.stringify(isAiGenerated));
      setQuestions(qs);
      setPhase('quiz');
    } catch (err) {
      setErrorMsg('題目載入失敗：' + err.message);
      setPhase('error');
    }
  }, []);

  useEffect(() => {
    if (initCalledRef.current) return;
    initCalledRef.current = true;
    initQuiz();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSelect(option) {
    if (selectedLabel !== null) return;
    setSelectedLabel(option.label);
    await delay(480);
    const newAnswers = [...answers, { features: option.features, style: option.style }];
    if (currentIdx < questions.length - 1) {
      setAnswers(newAnswers);
      setCurrentIdx(prev => prev + 1);
      setSelectedLabel(null);
    } else {
      // 完成作答 → 計算特徵 → 存 localStorage → 導向分析頁
      const avg = calculateAverageFeatures(newAnswers);
      const sw  = calculateStyleWeights(newAnswers);
      localStorage.setItem('v2_avgFeatures',  JSON.stringify(avg));
      localStorage.setItem('v2_styleWeights', JSON.stringify(sw));
      navigate('/v2/result');
    }
  }

  if (phase === 'error') {
    return (
      <div className="page">
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ color: '#e53e3e', marginBottom: 16, lineHeight: 1.7 }}>{errorMsg}</p>
          <button className="btn" onClick={initQuiz}>重新開始</button>
        </div>
      </div>
    );
  }

  if (phase === 'loading') return <LoadingScreen message={loadingMsg} />;

  if (phase === 'quiz' && questions[currentIdx]) {
    return (
      <QuizScreen
        question={questions[currentIdx]}
        currentIdx={currentIdx}
        total={questions.length}
        selectedLabel={selectedLabel}
        onSelect={handleSelect}
      />
    );
  }

  return null;
}

// ── LoadingScreen ─────────────────────────────────────────
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

// ── QuizScreen ────────────────────────────────────────────
function QuizScreen({ question, currentIdx, total, selectedLabel, onSelect }) {
  const progress = ((currentIdx + 1) / total) * 100;
  return (
    <div className="page-top">
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
          <span style={{ fontSize: 12, color: '#7a9ab0', fontWeight: 700 }}>問題 {currentIdx + 1} / {total}</span>
          <span style={{ fontSize: 12, color: '#7a9ab0' }}>{Math.round(progress)}%</span>
        </div>
        <div className="progress-wrap">
          <motion.div className="progress-bar" animate={{ width: `${progress}%` }} transition={{ duration: 0.45, ease: 'easeOut' }} />
        </div>
      </div>

      <div key={currentIdx}>
        <div className="card" style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 12, color: '#7a9ab0', fontWeight: 700, marginBottom: 8, letterSpacing: 1 }}>
            Q{String(question.id).padStart(2, '0')}
          </p>
          <h2 style={{ fontSize: 17, lineHeight: 1.7, color: '#2d3748' }}>{question.text}</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {question.options.map((opt, i) => (
            <OptionButton
              key={opt.label} option={opt}
              isSelected={selectedLabel === opt.label}
              isDisabled={selectedLabel !== null && selectedLabel !== opt.label}
              delay={i * 0.06}
              onClick={() => onSelect(opt)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function OptionButton({ option, isSelected, isDisabled, delay: d, onClick }) {
  const cfg = STYLE_CONFIG[option.style] || { emoji: '🎵', color: 'rgba(255,255,255,0.85)', accent: '#7ec8e3' };
  return (
    <motion.button onClick={onClick} disabled={isDisabled}
      whileHover={!isDisabled ? { scale: 1.02, y: -1 } : {}}
      whileTap={!isDisabled ? { scale: 0.98 } : {}}
      style={{
        background: isSelected ? cfg.color : 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(12px)',
        border: isSelected ? `2px solid ${cfg.accent}` : '1.5px solid rgba(255,255,255,0.9)',
        borderRadius: 16, padding: '13px 15px', textAlign: 'left',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: isSelected ? `0 4px 20px ${cfg.accent}33` : '0 2px 10px rgba(180,200,255,0.15)',
        opacity: isDisabled ? 0.45 : 1,
        transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s, opacity 0.2s',
        width: '100%',
      }}
    >
      <span style={{
        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
        background: isSelected ? `linear-gradient(135deg, ${cfg.accent}, #ff9ec4)` : 'rgba(126,200,227,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 800, color: isSelected ? '#fff' : '#5a8fa8',
        transition: 'background 0.2s',
      }}>{option.label}</span>
      <span style={{ fontSize: 14, color: '#2d3748', lineHeight: 1.55, flex: 1 }}>{option.text}</span>
    </motion.button>
  );
}
