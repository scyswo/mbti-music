/* =========================================================
   Tool 1：MBTI 計算代理
   輸入：answers（每個維度的得分字串）
   輸出：MBTI 類型字串，例如 "INFP"
========================================================= */

export function mbtiTool(answers) {
  const EI = (answers.E || 0) >= (answers.I || 0) ? 'E' : 'I';
  const SN = (answers.S || 0) >= (answers.N || 0) ? 'S' : 'N';
  const TF = (answers.T || 0) >= (answers.F || 0) ? 'T' : 'F';
  const JP = (answers.J || 0) >= (answers.P || 0) ? 'J' : 'P';
  return EI + SN + TF + JP;
}
