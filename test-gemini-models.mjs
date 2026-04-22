import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = 'AIzaSyBlcYrg8vcqcG1JUTgydJlbpWYCLsfS0HY';
const genAI = new GoogleGenerativeAI(API_KEY);

const MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-preview-04-17',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
];

const PROMPT = 'Say "ok" in one word.';

async function testModel(modelName) {
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(PROMPT);
    const text = result.response.text();
    console.log(`✅ ${modelName}: "${text.trim()}"`);
    return true;
  } catch (err) {
    const status = err?.status ?? err?.httpErrorCode ?? '?';
    console.log(`❌ ${modelName}: [${status}] ${err.message?.split('\n')[0]}`);
    return false;
  }
}

console.log('Testing Gemini models...\n');
for (const m of MODELS) {
  await testModel(m);
}
