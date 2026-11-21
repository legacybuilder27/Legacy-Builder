export type ChapterDefinition = {
  key: string;
  title: string;
  description: string;
};

export const CHAPTERS: ChapterDefinition[] = [
  {
    key: "early-childhood",
    title: "Early childhood",
    description: "The first years: the house, who took care of them, and the earliest memories.",
  },
  {
    key: "family-and-home",
    title: "Family and home",
    description: "The people in the house, how the days went, and the stories that got retold.",
  },
  {
    key: "teenage-years",
    title: "Teenage years",
    description: "Friends, first jobs, the world outside, and the moment they started to feel grown.",
  },
  {
    key: "education",
    title: "Education",
    description: "Schools, teachers, and how far they went.",
  },
  {
    key: "work",
    title: "Work",
    description: "How they earned a living, including military service if they served.",
  },
  {
    key: "marriage",
    title: "Marriage",
    description: "How they met, the wedding, and the shape of the marriage.",
  },
  {
    key: "raising-kids",
    title: "Raising kids",
    description: "What the house was like once children arrived.",
  },
  {
    key: "faith-and-values",
    title: "Faith and values",
    description: "Belief, practice, and the rules they tried to live by.",
  },
  {
    key: "later-life",
    title: "Later life",
    description: "The years after full-time work, and what those days are like now.",
  },
  {
    key: "advice-and-legacy",
    title: "Advice and legacy",
    description: "What they want kept, and what they would say to the people coming after.",
  },
];

export function chapterByKey(key: string): ChapterDefinition | undefined {
  return CHAPTERS.find((chapter) => chapter.key === key);
}
