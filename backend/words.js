const words = [
  // Animals
  "cat", "dog", "elephant", "giraffe", "penguin", "dolphin",
  "butterfly", "crocodile", "kangaroo", "octopus",

  // Objects
  "umbrella", "telephone", "keyboard", "bicycle", "backpack",
  "scissors", "microwave", "telescope", "headphones", "suitcase",

  // Food
  "pizza", "hamburger", "spaghetti", "watermelon", "strawberry",
  "broccoli", "sandwich", "chocolate", "popcorn", "pancake",

  // Places
  "library", "volcano", "stadium", "lighthouse", "hospital",
  "airport", "castle", "waterfall", "desert", "igloo",

  // Actions
  "swimming", "dancing", "sleeping", "cooking", "painting",
  "climbing", "fishing", "running", "laughing", "jumping",

  // Things
  "rainbow", "thunder", "snowman", "campfire", "treasure",
  "rocket", "submarine", "tornado", "crown", "compass"
]

// call this to get N random words that are all different
function getRandomWords(count = 3) {
  const shuffled = [...words].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

module.exports = { words, getRandomWords }