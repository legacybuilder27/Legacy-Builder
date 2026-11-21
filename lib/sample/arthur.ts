import { emptyBackground } from "@/lib/questions/personalize";
import type { Background } from "@/lib/types";

export const SAMPLE_PARENT = "Arthur James Penrose";

export const SAMPLE_BACKGROUND: Background = emptyBackground({
  parentName: SAMPLE_PARENT,
  relationship: "Dad",
  birthYear: "1948",
  birthPlace: "Hatcher's Ferry, Ohio",
  grewUp: "On a dairy farm outside Hatcher's Ferry, Ohio",
  familyMembers: "Mother Edith, father Harold, sister June, and brother Carl",
  schooling: "Hatcher's Ferry High School, then two years at Lakefront Technical College",
  career: "Machinist at Harrow Valve Works for 34 years",
  military: "U.S. Army band, clarinet. Stationed at Fort Ellison, Alaska, from 1968 to 1970.",
  faith: "First Methodist in Hatcher's Ferry when the kids were young. Less regular after that.",
  hobbies: "woodworking, fishing on Pebble Lake, crossword puzzles",
  lifeEvents: [
    "Married Ruth Elaine Keller in 1971",
    "Lost brother Carl in 1984",
    "Retired in 2006",
    "Money troubles in the 1980s, after hours were cut at the shop",
  ].join("\n"),
  wantCovered: "the farm, the Army band, Ruth, lessons for the grandkids",
  avoidTopics: "money troubles",
  notes:
    "Fictional sample. Arthur and everyone in this project are invented. He tires after about 45 minutes. Go gently if he mentions Ruth's last years, and do not start there.",
});

export const SAMPLE_WORK_TRANSCRIPT = [
  "I started at Harrow Valve Works in September of 1972. A fellow from church, I think his name was Don Bailey, told me they were hiring on the night shift.",
  "",
  "I ran a lathe. The shop smelled like oil and the coffee was terrible. We made parts for water valves. I could still tell you the sound of a good cut.",
  "",
  "Ruth was pregnant with our first that winter. I walked home in the dark and she would have a plate left in the oven. I was proud of that work. I stayed thirty-four years, until 2006.",
  "",
  "There was a foreman. I forget his name. He was a tall man from Toledo, or maybe he was from Dayton. He taught me to measure twice and not to rush a thread.",
].join("\n");

export const SAMPLE_FOLLOW_UP = [
  "The foreman's name was Ellis Ward. He was from Toledo. I am sure about Toledo now.",
  "He kept a yellow pencil behind his ear and he never raised his voice.",
].join(" ");
