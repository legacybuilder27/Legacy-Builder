const SAMPLES: Record<string, string> = {
  "early-childhood": [
    "The earliest thing I can picture is the back step of a rented house in Millhaven.",
    "I think the landlady's name was Mrs. Cole.",
    "She kept a radio in the kitchen window, and I used to sit on the step and listen with my feet in the dirt.",
  ].join(" "),
  "family-and-home": [
    "My mother was Helen and my father was George.",
    "Supper was at six, and you did not start without him.",
    "I forget the name of the dog.",
    "He slept under the table and he was no good at guarding anything.",
  ].join(" "),
  "teenage-years": [
    "In high school I worked Saturdays at a hardware store on Main Street.",
    "I think the owner's name was Paulsen.",
    "My friends and I drove a car that barely started, out to the edge of town, and we talked like we were already gone.",
  ].join(" "),
  education: [
    "I liked arithmetic and I disliked standing up to read aloud.",
    "There was a teacher, I think her name was Miss Darby, who made me stay after school until the reading got easier.",
    "I finished high school and I did not go further. That was my choice.",
  ].join(" "),
  work: [
    "I started at a small machine shop in 1974.",
    "I think the owner's name was Paulsen.",
    "I ran a lathe, the coffee was terrible, and I stayed until my hands said I was done.",
  ].join(" "),
  marriage: [
    "I met Ruth at a church supper.",
    "She was cutting pie and she handed me the end piece without asking if I wanted it.",
    "I think we were married in June of 1971, or it may have been May.",
    "We lived in two rooms over a shoe repair shop the first year.",
  ].join(" "),
  "raising-kids": [
    "When the first baby came I was still on the night shift.",
    "I would come home, hold him for a while, and then sleep until noon.",
    "I think we named him after my brother.",
    "The house got loud in a way I ended up liking.",
  ].join(" "),
  "faith-and-values": [
    "We went to a little church most Sundays when the kids were small.",
    "I am not sure I believed every word, but I liked the singing.",
    "My mother used to say you can tell a person by how they act on a Tuesday. I have tried to keep that.",
  ].join(" "),
  "later-life": [
    "After I retired I built birdhouses in the garage and I fished a small lake outside town.",
    "The mornings got quieter.",
    "I think the lake is called Pebble Lake, though some people use another name.",
    "I still make the coffee too strong.",
  ].join(" "),
  "advice-and-legacy": [
    "If I could tell the grandchildren one thing, it would be to learn how to be useful with their hands.",
    "I am proud of staying at one job and coming home.",
    "I do not remember every hard year, and I do not need to.",
    "I want them to know I was glad to be their grandfather.",
  ].join(" "),
};

export function fictionalSampleTranscript(chapterKey: string): string {
  return (
    SAMPLES[chapterKey] ||
    "I have been turning this over, and I think the name of the street was Maple. We lived there long enough for the neighbors to know the car."
  );
}
