const THEMES = [
  'roommates',
  'school friends',
  'coworkers',
  'family dinner',
  'road trip',
  'camping trip',
  'coffee shop',
  'gym buddies',
  'neighbors',
  'online gaming',
  'cooking together',
  'shopping mall',
  'movie night',
  'house party',
  'airport delay',
  'group project',
];

export const getRandomTheme = () => {
  return THEMES[Math.floor(Math.random() * THEMES.length)];
};

export const buildPrompt = (theme) => {
  return `You are writing dialogue for a party game called "Who Said What?"

Write a short, natural 3-message conversation between two people in a "${theme}" scenario.

Structure:
1. Person A says something (the opener)
2. A MIDDLE reply (this is what players will guess — it should feel natural but not super obvious)
3. Person B responds to the middle message

CRITICAL RULES:
- Write like real people talk — casual, simple, everyday language
- NO poetic, dramatic, or fancy language. No metaphors or cryptic lines.
- Each message must be SHORT: 5-15 words max
- The conversation must flow naturally — each message should clearly respond to the one before it
- Use everyday situations people actually experience (e.g. forgetting something, being late, food, plans, complaints, jokes)
- Give them normal first names (like Jake, Priya, Sam, Mia — not "Detective Noir" or "Agent Voss")
- The middle message should make sense in context but be tricky to guess exactly

GOOD EXAMPLES of the style I want:
- "Did you seriously eat my leftovers?" → "They were in the back of the fridge, I thought they were old." → "That was my lunch for tomorrow!"
- "I think the WiFi is down again." → "Yeah I already tried restarting the router." → "Ugh, I have a deadline in two hours."
- "We should leave in ten minutes." → "Wait, I can't find my keys anywhere." → "Check your jacket pocket, that's where they always are."

BAD EXAMPLES (do NOT write like this):
- "The shadows whisper secrets only the brave dare hear." ❌ too dramatic
- "I smoke only where the lamps are bright—bad habits need witnesses." ❌ too poetic
- "The code is fractured beyond the seventh seal." ❌ too cryptic

Respond ONLY with valid JSON, no markdown code blocks:
{
  "characterA": { "name": "FirstName", "message": "Short casual opener" },
  "realMessage": "Short natural middle reply",
  "characterB": { "name": "FirstName", "message": "Short casual response" },
  "theme": "${theme}"
}`;
};
