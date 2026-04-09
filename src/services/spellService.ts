/**
 * SparkCode CTO: Lexical Spell Guard
 * En robust motor för rättstavning som förstår "programmerings-språk".
 */

// Grundläggande teknisk ordlista för att undvika falska larm i kod
const TECH_DICTIONARY = new Set([
  'html', 'css', 'js', 'json', 'href', 'src', 'alt', 'flex', 'grid', 'viewport',
  'api', 'url', 'svg', 'div', 'span', 'class', 'id', 'npm', 'vite', 'sparkcode',
  'ref', 'key', 'props', 'state', 'const', 'let', 'var', 'async', 'await'
]);

// Bas-ordlista (Exempel-beta, i en riktig app skulle vi ladda en större fil)
const COMMON_WORDS = new Set([
  'hello', 'welcome', 'to', 'my', 'site', 'background', 'color', 'blue', 'red',
  'green', 'button', 'text', 'title', 'header', 'footer', 'main', 'section',
  'contact', 'about', 'home', 'page', 'description', 'font', 'size'
]);

/**
 * Kontrollera om ett ord är rätt stavat.
 * Hanterar även svenska ord om de är vanliga (utökas vid behov).
 */
export const isWordValid = (word: string): boolean => {
  const clean = word.toLowerCase().trim();
  if (clean.length <= 2) return true; // Ignorera jättekorta ord
  if (!/^[a-zåäö]+$/i.test(clean)) return true; // Ignorera ord med specialtecken/siffror
  
  return TECH_DICTIONARY.has(clean) || COMMON_WORDS.has(clean) || clean.length > 20; // Anta att jättelånga ord är hash/id
};

/**
 * Splitta ord som 'myVariableName' eller 'my-variable' till enskilda ord.
 */
export const splitCodeWord = (word: string): string[] => {
  // Dela vid camelCase, bindestreck eller underscore
  return word
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .split(/\s+/);
};

export const checkTextSpelling = (text: string): string[] => {
  const words = text.split(/\s+/);
  const typos: string[] = [];
  
  words.forEach(rawWord => {
    const cleanWord = rawWord.replace(/[.,!?;:"]/g, '');
    const subWords = splitCodeWord(cleanWord);
    
    subWords.forEach(w => {
      if (w && !isWordValid(w)) {
        typos.push(w);
      }
    });
  });
  
  return Array.from(new Set(typos)); // Unika fel
};
