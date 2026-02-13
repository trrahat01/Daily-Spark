export interface Quote {
  id: string;
  text: string;
  author: string;
  category: string;
  liked: boolean;
  createdAt: string;
}

export const DEFAULT_CATEGORIES = [
  "Motivation",
  "Success",
  "Life",
  "Wisdom",
  "Courage",
  "Happiness",
  "Leadership",
  "Perseverance",
];

export const SEED_QUOTES: Omit<Quote, "id" | "liked" | "createdAt">[] = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs", category: "Motivation" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein", category: "Wisdom" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius", category: "Perseverance" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt", category: "Courage" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt", category: "Success" },
  { text: "Happiness is not something ready made. It comes from your own actions.", author: "Dalai Lama", category: "Happiness" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb", category: "Wisdom" },
  { text: "Your time is limited, so don't waste it living someone else's life.", author: "Steve Jobs", category: "Life" },
  { text: "A leader is one who knows the way, goes the way, and shows the way.", author: "John C. Maxwell", category: "Leadership" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill", category: "Courage" },
  { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins", category: "Motivation" },
  { text: "Life is what happens when you're busy making other plans.", author: "John Lennon", category: "Life" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson", category: "Perseverance" },
  { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", author: "Nelson Mandela", category: "Courage" },
  { text: "If you want to be happy, be.", author: "Leo Tolstoy", category: "Happiness" },
  { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs", category: "Leadership" },
  { text: "The mind is everything. What you think you become.", author: "Buddha", category: "Wisdom" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela", category: "Perseverance" },
  { text: "The purpose of our lives is to be happy.", author: "Dalai Lama", category: "Happiness" },
  { text: "Success usually comes to those who are too busy to be looking for it.", author: "Henry David Thoreau", category: "Success" },
  { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky", category: "Motivation" },
  { text: "Life is really simple, but we insist on making it complicated.", author: "Confucius", category: "Life" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain", category: "Motivation" },
  { text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair", category: "Courage" },
  { text: "The only person you are destined to become is the person you decide to be.", author: "Ralph Waldo Emerson", category: "Success" },
  { text: "Be the change that you wish to see in the world.", author: "Mahatma Gandhi", category: "Leadership" },
  { text: "Knowing yourself is the beginning of all wisdom.", author: "Aristotle", category: "Wisdom" },
  { text: "Fall seven times and stand up eight.", author: "Japanese Proverb", category: "Perseverance" },
  { text: "Happiness depends upon ourselves.", author: "Aristotle", category: "Happiness" },
  { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt", category: "Life" },
];

export const ADMIN_PIN = "1234";
