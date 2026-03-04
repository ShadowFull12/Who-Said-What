import { buildPrompt, getRandomTheme } from './prompts';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN;
const GITHUB_MODELS_URL = 'https://models.inference.ai.azure.com/chat/completions';
const GITHUB_MODEL = 'gpt-5-mini';

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
    characterA: { name: 'Jake', message: 'Did you seriously eat my leftovers?' },
    realMessage: 'They were in the back of the fridge, I thought they were old.',
    characterB: { name: 'Mia', message: 'That was my lunch for tomorrow!' },
    theme: 'roommates',
  },
  {
    characterA: { name: 'Priya', message: 'I think the WiFi is down again.' },
    realMessage: 'Yeah I already tried restarting the router.',
    characterB: { name: 'Sam', message: 'Ugh, I have a deadline in two hours.' },
    theme: 'roommates',
  },
  {
    characterA: { name: 'Nate', message: 'We should leave in ten minutes.' },
    realMessage: "Wait, I can't find my keys anywhere.",
    characterB: { name: 'Lily', message: 'Check your jacket pocket, they\'re always there.' },
    theme: 'road trip',
  },
  {
    characterA: { name: 'Omar', message: 'Did anyone do the homework for tomorrow?' },
    realMessage: 'I started it but the last question makes no sense.',
    characterB: { name: 'Sophie', message: 'Same, I just gave up and watched Netflix.' },
    theme: 'school friends',
  },
  {
    characterA: { name: 'Chris', message: 'The meeting got pushed to 4 PM.' },
    realMessage: 'Are you kidding? I skipped lunch to prepare for it.',
    characterB: { name: 'Dana', message: "Let's just grab coffee and go over it together." },
    theme: 'coworkers',
  },
  {
    characterA: { name: 'Ava', message: "I'm never cooking for this many people again." },
    realMessage: "Relax, the pasta turned out great. Nobody noticed the burnt garlic bread.",
    characterB: { name: 'Tom', message: "Grandma definitely noticed, she just didn't say anything." },
    theme: 'family dinner',
  },
  {
    characterA: { name: 'Leo', message: 'Bro did you just use my shampoo?' },
    realMessage: 'Mine ran out and I forgot to buy more, sorry.',
    characterB: { name: 'Raj', message: "That's the third time this month, just get your own." },
    theme: 'roommates',
  },
  {
    characterA: { name: 'Zoe', message: "I thought you said the trail was easy." },
    realMessage: "It looked easy on the map, I didn't know there were hills.",
    characterB: { name: 'Kai', message: 'We\'ve been walking for an hour and we\'re not even halfway.' },
    theme: 'camping trip',
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
 * Try GitHub Models API (gpt-5-mini via GitHub token)
 */
const tryGitHubModels = async (prompt) => {
  if (!GITHUB_TOKEN) {
    throw new Error('GitHub token not configured');
  }

  const response = await fetch(GITHUB_MODELS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
    },
    body: JSON.stringify({
      model: GITHUB_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a JSON-only response bot. Never wrap output in markdown code blocks. Always output raw valid JSON only, with no extra text before or after.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 1,
      max_completion_tokens: 2000, // gpt-5-mini uses ~500 tokens for internal reasoning
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`GitHub Models API error: ${response.status} - ${errorBody.slice(0, 200)}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`GitHub Models error: ${data.error.message || JSON.stringify(data.error)}`);
  }

  const text = data.choices?.[0]?.message?.content;
  if (!text || text.trim().length === 0) {
    throw new Error('Empty response from GitHub Models');
  }

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

  // 2) Fallback to GitHub Models (gpt-4.1-mini)
  try {
    const result = await tryGitHubModels(prompt);
    console.log('Conversation generated via GitHub Models (gpt-4.1-mini)');
    return result;
  } catch (githubError) {
    console.warn('GitHub Models failed:', githubError.message);
  }

  // 3) Fallback to OpenRouter (cycles through free models)
  try {
    const result = await tryOpenRouter(prompt);
    return result;
  } catch (openRouterError) {
    console.warn('OpenRouter failed:', openRouterError.message);
  }

  // 4) Final fallback: static conversations
  console.warn('All APIs failed, using static fallback');
  const fallback = FALLBACK_CONVERSATIONS[fallbackIndex % FALLBACK_CONVERSATIONS.length];
  fallbackIndex++;
  return fallback;
};
