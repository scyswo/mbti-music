import { generateQuizQuestions } from './geminiService';

async function loadStaticQuestions(n = 10) {
  const res = await fetch('/static_quiz.json');
  if (!res.ok) throw new Error('無法讀取 static_quiz.json');
  const bank = await res.json();
  return [...bank].sort(() => Math.random() - 0.5).slice(0, n).map((q, i) => ({ ...q, id: i + 1 }));
}

// 優先 AI 動態生成，失敗則 fallback 本地題庫
export async function loadQuizQuestions(n = 10) {
  try {
    const questions = await generateQuizQuestions({ fresh: true });
    return { questions: questions.slice(0, n), isAiGenerated: true };
  } catch (err) {
    const questions = await loadStaticQuestions(n);
    return { questions, isAiGenerated: false };
  }
}
