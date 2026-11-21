# Legacy Builder

Legacy Builder helps an adult child interview an aging parent and turn those conversations into memoir chapters in the parent's own voice.

You keep a private project for each parent: background, an interview guide, recordings, transcripts, and chapter drafts with version history. A waitlist site may live somewhere else. This repository is the product app.

The sample parent in the app, Arthur Penrose, is fictional.

## What you can do

1. Create an account and a project for one parent.
2. Write down what you already know, including topics to leave alone.
3. Generate an interview guide by life chapter. It works with an empty background, and it adds questions from the details you entered. Edit, delete, reorder, or write your own.
4. Read plain instructions for recording a phone call or a visit, and for uploading the file.
5. Upload m4a, mp3, or wav audio (long calls are sent in pieces), paste a transcript, or upload a `.txt` file.
6. Draft a chapter from the transcript. The draft stays with what they said, marks uncertain names and dates with `[check]`, and suggests follow-up questions.
7. Edit the chapter, regenerate it with a note such as "make it shorter", fold in a follow-up answer, and compare or restore older versions.
8. Export the guide or a chapter to Word or PDF. You can also print and choose "Save as PDF" in the browser.

Topics you mark to avoid are left off the printed guide. Private notes are not turned into questions.

## Demo mode

With no API key, the app runs end to end:

- Questions are written by the built-in guide.
- Audio is stored, but it is not transcribed. Paste a transcript, or insert the fictional sample transcript, to try a draft.
- Chapters are shaped from the transcript on the server. Facts are not pulled in from the background form.
- Nothing is sent to an AI provider.

Set `OPENAI_API_KEY` when you want Whisper transcription and model-written chapters. If the model adds a name or place that nobody said, the app discards that draft and keeps the transcript-based one.

## Local setup

You need Node.js 22.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create an account, and start a project. "Open the sample project" loads the fictional Penrose family so you can click through a finished chapter.

```bash
npm test
npm run typecheck
npm run build
```

Accounts and projects are stored in `data/legacy.db`. Audio files are stored in `data/uploads/`. Both directories are gitignored.

## Environment variables

Copy `.env.example` to `.env.local`.

| Variable | Required | Purpose |
| --- | --- | --- |
| `AUTH_SECRET` | Production | Signs the session cookie. Use `openssl rand -base64 32`. |
| `OPENAI_API_KEY` | No | Turns on transcription and model drafting. Blank means demo mode. |
| `OPENAI_MODEL` | No | Chat model. Defaults to `gpt-4o-mini`. |
| `OPENAI_TRANSCRIBE_MODEL` | No | Transcription model. Defaults to `whisper-1`. |
| `AI_PROVIDER` | No | `mock` forces demo mode even if a key is present. `openai` uses the key. |
| `DATABASE_PATH` | No | Sqlite file path. Defaults to `data/legacy.db`. |
| `DATA_DRIVER` | No | `sqlite` or `blobs`. Netlify selects blobs on its own. |
| `SECURE_COOKIES` | No | Set to `false` if you run `next start` on plain http. |

In demo mode you do not need an OpenAI account. A production deploy should set `AUTH_SECRET`.

## Netlify

This app is a Next.js App Router project. Netlify's current Next.js runtime applies itself. Do not pin `@netlify/plugin-nextjs`.

1. Push this repository to GitHub.
2. In Netlify, add a site from that repo.
3. Build command: `npm run build`. Publish directory: `.next`. Node 22. `netlify.toml` already sets this.
4. Add `AUTH_SECRET` in the site environment. Add `OPENAI_API_KEY` only when you want live transcription and drafting.
5. Deploy.

On Netlify, accounts, projects, transcripts, drafts, and audio are stored in Netlify Blobs for the site. They persist across deploys. You do not provision a separate database. Locally, the app uses sqlite instead, so `npm run dev` needs no Netlify account.

Audio uploads are split into 4 MB pieces so a long call can get through Netlify's request size limit. Whisper still accepts about 25 MB per transcription request. Larger files can be stored, and you can paste a transcript for those.

## Privacy

Each account only sees its own projects. Recordings and transcripts stay in this app's database in demo mode. With an OpenAI key, audio you choose to transcribe, and the text used to draft a chapter, are sent to OpenAI.

## Tests

`npm test` covers the interview guide, the rule that drafts cannot invent background facts, `[check]` notes, follow-up folding, version restore, and sqlite persistence.
