// =============================================================================
// words.js — Drawing word bank for Scribbl.io
// =============================================================================

const words = [
  // Animals
  "cat", "dog", "elephant", "giraffe", "penguin", "dolphin", "butterfly",
  "snake", "rabbit", "turtle", "octopus", "parrot", "kangaroo", "jellyfish",
  "flamingo", "owl", "shark", "whale", "spider", "frog",

  // Food & Drink
  "pizza", "hamburger", "ice cream", "sushi", "taco", "donut", "watermelon",
  "banana", "cookie", "pancake", "popcorn", "cupcake", "sandwich", "hotdog",
  "chocolate", "lollipop", "cheese", "egg", "apple", "pineapple",

  // Objects
  "umbrella", "guitar", "camera", "telescope", "bicycle", "helicopter",
  "microphone", "scissors", "flashlight", "headphones", "keyboard", "lightbulb",
  "toothbrush", "backpack", "sunglasses", "pillow", "candle", "clock",
  "trophy", "balloon",

  // Nature
  "mountain", "volcano", "rainbow", "tornado", "waterfall", "snowflake",
  "cactus", "mushroom", "island", "sunset", "lightning", "ocean", "forest",
  "flower", "tree", "cloud", "moon", "star", "river", "beach",

  // Places & Buildings
  "castle", "lighthouse", "pyramid", "hospital", "church", "bridge",
  "skyscraper", "igloo", "tent", "windmill",

  // Activities & Sports
  "swimming", "skateboard", "fishing", "surfing", "bowling", "basketball",
  "baseball", "football", "tennis", "skiing",

  // Clothing & Accessories
  "crown", "boots", "necklace", "bowtie", "gloves", "hat", "scarf",
  "glasses", "ring", "belt",

  // Miscellaneous
  "rocket", "robot", "dinosaur", "pirate", "mermaid", "unicorn", "dragon",
  "ghost", "alien", "wizard", "treasure", "anchor", "compass", "map",
  "sword", "shield", "bomb", "parachute", "dice", "puzzle"
];

/**
 * Returns an array of `count` random unique words from the word bank.
 * @param {number} count - Number of words to return
 * @returns {string[]}
 */
function getRandomWords(count = 3) {
  const shuffled = [...words].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, words.length));
}

module.exports = { words, getRandomWords };
