import { buildPrompt, getRandomTheme } from './prompts';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Primary model for direct call
const OPENROUTER_PRIMARY_MODEL = 'z-ai/glm-4.5-air:free';

// Free models for OpenRouter's server-side fallback routing
const OPENROUTER_FREE_MODELS = [
  'nousresearch/deephermes-3-llama-3-8b:free',
  'deepseek/deepseek-r1:free',
  'google/gemma-3-1b-it:free',
  'meta-llama/llama-3.1-8b-instruct:free',
  'mistralai/mistral-small-3.1-24b-instruct:free',
];

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
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    throw new Error('Empty or invalid text response');
  }

  // Strip markdown code fences
  let jsonStr = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  // If the response contains extra text before/after JSON, try to extract the JSON object
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonStr = jsonMatch[0];
  }

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
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

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
    const errorBody = await response.text().catch(() => '');
    throw new Error(`Gemini API error: ${response.status} - ${errorBody.slice(0, 200)}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini');

  return parseConversationResponse(text);
};

/**
 * Call OpenRouter with a specific model (or models array with fallback routing)
 */
const callOpenRouter = async (prompt, { model, models, route } = {}) => {
  const bodyPayload = {
    messages: [
      {
        role: 'system',
        content: 'You are a JSON-only response bot. Never wrap output in markdown code blocks. Always output raw valid JSON only, with no extra text before or after.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.9,
    max_tokens: 500,
  };

  // Single model or server-side fallback routing
  if (models && route) {
    bodyPayload.models = models;
    bodyPayload.route = route;
  } else {
    bodyPayload.model = model;
  }

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': window.location.origin || 'http://localhost:3000',
      'X-Title': 'Who Said What?',
    },
    body: JSON.stringify(bodyPayload),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    const err = new Error(`OpenRouter ${model || 'fallback-route'}: ${response.status} - ${errorBody.slice(0, 200)}`);
    err.status = response.status;
    throw err;
  }

  const data = await response.json();

  // Check for error in response body
  if (data.error) {
    throw new Error(`OpenRouter error: ${data.error.message || JSON.stringify(data.error)}`);
  }

  const usedModel = data.model || model || 'unknown';

  // Handle various response shapes from OpenRouter
  let text = data.choices?.[0]?.message?.content;

  // Some models put JSON in reasoning instead of content — use it as fallback
  if (!text || text.trim().length === 0) {
    const reasoning = data.choices?.[0]?.message?.reasoning;
    if (reasoning && reasoning.trim().length > 0) {
      console.log(`[OpenRouter] Content empty, extracting from reasoning field (${usedModel})`);
      text = reasoning;
    }
  }

  if (!text || text.trim().length === 0) {
    throw new Error(`Empty content from OpenRouter (${usedModel}). Full response: ${JSON.stringify(data).slice(0, 200)}`);
  }

  console.log(`[OpenRouter] Response from model: ${usedModel}`);
  return parseConversationResponse(text);
};

/**
 * Try OpenRouter:
 *   1. Direct call to primary free model (GLM 4.5)
 *   2. Server-side fallback routing across multiple free models
 */
const tryOpenRouter = async (prompt) => {
  if (!OPENROUTER_API_KEY) throw new Error('OpenRouter API key not configured');

  // Step 1: Try the primary model directly
  try {
    const result = await callOpenRouter(prompt, { model: OPENROUTER_PRIMARY_MODEL });
    console.log('Conversation generated via OpenRouter (primary)');
    return result;
  } catch (err) {
    console.warn(`OpenRouter primary (${OPENROUTER_PRIMARY_MODEL}) failed:`, err.message);
  }

  // Step 2: Use OpenRouter's server-side fallback routing across free models
  try {
    const result = await callOpenRouter(prompt, {
      models: OPENROUTER_FREE_MODELS,
      route: 'fallback',
    });
    console.log('Conversation generated via OpenRouter (free fallback route)');
    return result;
  } catch (err) {
    console.warn('OpenRouter free fallback route failed:', err.message);
  }

  throw new Error('All OpenRouter attempts failed');
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

  // 2) Fallback to OpenRouter (cycles through free models)
  try {
    const result = await tryOpenRouter(prompt);
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
