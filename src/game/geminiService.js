import { buildPrompt, getRandomTheme } from './prompts';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODEL = 'z-ai/glm-4.5-air:free';

// Fallback conversations if API fails
const FALLBACK_CONVERSATIONS = [
  {
    characterA: { name: 'Agent Voss', message: 'We finally reached the station.' },
    realMessage: 'But someone changed the access codes overnight.',
    characterB: { name: 'Dr. Kaine', message: "If they find out we were here, it's over." },
    theme: 'spy thriller',
  },
  {
    characterA: { name: 'Captain Zara', message: 'The ship is losing power faster than expected.' },
    realMessage: "I rerouted everything to life support, but it won't last.",
    characterB: { name: 'Engineer Bolt', message: 'Then we have twelve minutes to reach the escape pods.' },
    theme: 'sci-fi',
  },
  {
    characterA: { name: 'Shadow', message: 'The vault door is triple-reinforced titanium.' },
    realMessage: "Good thing our inside man left the service tunnel unlocked.",
    characterB: { name: 'Whisper', message: "Let's move. The guard shift changes in four minutes." },
    theme: 'heist',
  },
  {
    characterA: { name: 'Detective Noir', message: 'The victim was last seen at the harbor at midnight.' },
    realMessage: 'But the security footage shows someone erased the last 30 minutes of tape.',
    characterB: { name: 'Officer Blake', message: 'That means whoever did this had access to the control room.' },
    theme: 'mystery',
  },
  {
    characterA: { name: 'Elena', message: "Don't open that door. I heard something behind it." },
    realMessage: "It's been scratching for hours. Whatever it is, it knows we're here.",
    characterB: { name: 'Marcus', message: 'Then we take the back stairs. Now.' },
    theme: 'horror',
  },
  {
    characterA: { name: 'Commander Rex', message: 'The resistance camp was right where the map said.' },
    realMessage: 'But it was empty. Looked like they left in a hurry.',
    characterB: { name: 'Scout Lyra', message: 'That means they knew we were coming.' },
    theme: 'post-apocalyptic',
  },
  {
    characterA: { name: 'Raven', message: 'I followed the suspect to the old jazz club downtown.' },
    realMessage: "She met with a man I recognized — the mayor's lawyer.",
    characterB: { name: 'Dex', message: 'This goes deeper than we thought.' },
    theme: 'noir detective',
  },
  {
    characterA: { name: 'Oren the Wise', message: 'The crystal hums louder the closer we get to the Rift.' },
    realMessage: 'Legend says only those marked by the Rift can hear its song.',
    characterB: { name: 'Kaela Swiftblade', message: 'Then explain why my sword is glowing.' },
    theme: 'fantasy quest',
  },
];

let fallbackIndex = 0;

/**
 * Parse and validate a conversation JSON response from any LLM
 */
const parseConversationResponse = (text) => {
  const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const parsed = JSON.parse(jsonStr);

  if (!parsed.characterA?.message || !parsed.realMessage || !parsed.characterB?.message) {
    throw new Error('Invalid conversation structure');
  }

  return parsed;
};

/**
 * Try Gemini API first
 */
const tryGemini = async (prompt) => {
  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 1.0,
        maxOutputTokens: 500,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini');

  return parseConversationResponse(text);
};

/**
 * Fallback to OpenRouter (z-ai/glm-4.5-air:free)
 */
const tryOpenRouter = async (prompt) => {
  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Who Said What?',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 1.0,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty response from OpenRouter');

  return parseConversationResponse(text);
};

export const generateConversation = async () => {
  const theme = getRandomTheme();
  const prompt = buildPrompt(theme);

  // 1) Try Gemini
  try {
    const result = await tryGemini(prompt);
    console.log('Conversation generated via Gemini');
    return result;
  } catch (geminiError) {
    console.warn('Gemini failed:', geminiError.message);
  }

  // 2) Fallback to OpenRouter
  try {
    const result = await tryOpenRouter(prompt);
    console.log('Conversation generated via OpenRouter');
    return result;
  } catch (openRouterError) {
    console.warn('OpenRouter failed:', openRouterError.message);
  }

  // 3) Final fallback: static conversations
  console.warn('All APIs failed, using static fallback');
  const fallback = FALLBACK_CONVERSATIONS[fallbackIndex % FALLBACK_CONVERSATIONS.length];
  fallbackIndex++;
  return fallback;
};
