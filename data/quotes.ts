/**
 * Curated bundled quotes — the offline fallback used when there is no cache and
 * the backend/API is unreachable. Attribution is only shown when it is safe and
 * known; otherwise "Unknown" (never invented).
 */
export interface Quote {
  id: string;
  text: string;
  author: string;
  category: string;
  source?: string;
  language?: string;
  featured?: boolean;
}

const q = (
  id: string,
  text: string,
  author: string,
  category: string,
  featured?: boolean
): Quote => ({ id, text, author: author || "Unknown", category, featured });

export const BUNDLED_QUOTES: Quote[] = [
  q("m1", "Small steps every day lead to big changes.", "Unknown", "Motivation", true),
  q("m2", "Do the hard things before they become harder.", "Unknown", "Motivation"),
  q("m3", "Your effort today is the person you become tomorrow.", "Unknown", "Motivation"),
  q("m4", "Begin where you are. Use what you have. Do what you can.", "Unknown", "Motivation"),
  q("e1", "A single spark of hope can light a whole day.", "Unknown", "Positivity", true),
  q("e2", "Find joy in ordinary moments before chasing big ones.", "Unknown", "Positivity"),
  q("e3", "A grateful heart makes even a small day feel full.", "Unknown", "Positivity"),
  q("l1", "Life is what you make of the moments in between.", "Unknown", "Life", true),
  q("l2", "Grow through what you go through.", "Unknown", "Life"),
  q("l3", "The most important step is the next one.", "Unknown", "Life"),
  q("s1", "Success is built on habits, not luck.", "Unknown", "Success", true),
  q("s2", "Progress over perfection, every single day.", "Unknown", "Success"),
  q("s3", "Discipline is choosing what you want most over what you want now.", "Unknown", "Discipline"),
  q("h1", "Happiness grows when it is shared.", "Unknown", "Happiness"),
  q("h2", "You deserve the peace you keep postponing.", "Unknown", "Happiness"),
  q("lve1", "Love is shown in the small, quiet things.", "Unknown", "Love"),
  q("lve2", "A kind word can change someone's whole day.", "Unknown", "Kindness"),
  q("c1", "Confidence grows one honest action at a time.", "Unknown", "Confidence"),
  q("mn1", "A calm mind makes better decisions.", "Unknown", "Mindset"),
  q("g1", "Leaders grow others and serve the mission.", "Unknown", "Leadership"),
  q("st1", "Be consistent even when no one is watching.", "Unknown", "Focus"),
  q("f1", "True friends stay when it is not convenient.", "Unknown", "Friendship"),
  q("w1", "Wisdom begins where certainty ends.", "Unknown", "Wisdom"),
  q("cr1", "Courage is moving forward despite the fear.", "Unknown", "Courage"),
  q("dr1", "Dream boldly, then work quietly.", "Unknown", "Dreams"),
  q("hl1", "A healthy body supports a strong mind.", "Unknown", "Health"),
  q("cw1", "Creation is just an idea with courage.", "Unknown", "Creativity"),
  q("sp1", "Peace is the path, not the destination.", "Unknown", "Spirituality"),
  q("isl1", "Patience and prayer are a quiet strength.", "Unknown", "Islamic Wisdom"),
  q("fam1", "The family you build is the home you return to.", "Unknown", "Family"),
  q("gr1", "Study today to lead tomorrow.", "Unknown", "Study"),
  q("wk1", "Work well, then rest well.", "Unknown", "Work"),
];