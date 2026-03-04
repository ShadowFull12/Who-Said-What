const THEMES = [
  'mystery',
  'spy thriller',
  'sci-fi',
  'heist',
  'horror',
  'post-apocalyptic',
  'noir detective',
  'fantasy quest',
];

export const getRandomTheme = () => {
  return THEMES[Math.floor(Math.random() * THEMES.length)];
};

export const buildPrompt = (theme) => {
  return `You are a creative writer for a social deduction party game called "Who Said What?"

Generate a short dramatic conversation between exactly two characters in a ${theme} setting.

The conversation has exactly 3 messages:
1. Character A says the FIRST message
2. A MIDDLE message (this is the one players will try to guess)
3. Character B says the LAST message

Requirements:
- Each message should be 1-2 sentences max
- The middle message should logically connect the first and third messages
- The conversation should be dramatic, intriguing, and fun
- Give the characters interesting names (not generic like "Character A")
- The middle message should NOT be too obvious from context — make it tricky
- Keep it PG-13

Respond ONLY with valid JSON in this exact format, no markdown:
{
  "characterA": { "name": "CharacterName", "message": "First message text" },
  "realMessage": "The middle message text",
  "characterB": { "name": "CharacterName", "message": "Last message text" },
  "theme": "${theme}"
}`;
};
