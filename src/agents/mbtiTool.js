/* =========================================================
   Tool 1：MBTI 計算代理
   輸入：answers（每個維度的得分字串）
   輸出：MBTI 類型字串，例如 "INFP"
========================================================= */

export function mbtiTool(answers) {
  console.log('[Agent] Tool 1 啟動：MBTI 計算中...', answers);

  const count = (str, char) =>
    (str || '').split('').filter(c => c === char).length;

  const EI = count(answers.EI, 'E') >= count(answers.EI, 'I') ? 'E' : 'I';
  const SN = count(answers.SN, 'S') >= count(answers.SN, 'N') ? 'S' : 'N';
  const TF = count(answers.TF, 'T') >= count(answers.TF, 'F') ? 'T' : 'F';
  const JP = count(answers.JP, 'J') >= count(answers.JP, 'P') ? 'J' : 'P';

  const result = EI + SN + TF + JP;

  console.log('[Agent] Tool 1 完成：', result);
  return result;
}
