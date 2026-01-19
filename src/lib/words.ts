// Common English words for typing test
export const wordList = [
  "the", "be", "to", "of", "and", "a", "in", "that", "have", "I",
  "it", "for", "not", "on", "with", "he", "as", "you", "do", "at",
  "this", "but", "his", "by", "from", "they", "we", "say", "her", "she",
  "or", "an", "will", "my", "one", "all", "would", "there", "their", "what",
  "so", "up", "out", "if", "about", "who", "get", "which", "go", "me",
  "when", "make", "can", "like", "time", "no", "just", "him", "know", "take",
  "people", "into", "year", "your", "good", "some", "could", "them", "see", "other",
  "than", "then", "now", "look", "only", "come", "its", "over", "think", "also",
  "back", "after", "use", "two", "how", "our", "work", "first", "well", "way",
  "even", "new", "want", "because", "any", "these", "give", "day", "most", "us",
  "is", "was", "are", "been", "has", "had", "did", "does", "being", "were",
  "am", "more", "very", "much", "such", "here", "away", "before", "off", "while",
  "where", "why", "should", "must", "let", "put", "same", "still", "each", "few",
  "through", "between", "those", "both", "own", "long", "may", "down", "too", "write",
  "again", "great", "never", "old", "right", "home", "hand", "high", "small", "found",
  "world", "last", "need", "house", "life", "every", "point", "place", "made", "live",
  "school", "night", "left", "part", "word", "three", "four", "five", "head", "many",
  "move", "play", "read", "story", "far", "keep", "under", "start", "city", "turn",
  "until", "always", "next", "begin", "end", "along", "might", "close", "seem", "kind",
  "help", "line", "different", "change", "another", "around", "picture", "enough", "sure", "set",
  "carry", "book", "ask", "open", "side", "page", "watch", "country", "learn", "answer",
  "plant", "follow", "save", "cut", "water", "light", "hard", "food", "group", "run",
  "often", "early", "music", "white", "color", "warm", "eat", "today", "during", "money",
  "free", "show", "young", "talk", "idea", "anything", "stop", "face", "sound", "once"
];

export function generateWords(count: number): string[] {
  const words: string[] = [];
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * wordList.length);
    words.push(wordList[randomIndex]);
  }
  return words;
}
