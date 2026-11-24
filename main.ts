// Monday, Reviewed in One Line — make.fun entry program.
//
// Writes the funniest one-line review of the agent's own Monday to
// /output/entry.txt, picked at runtime from scored candidates.
//
// Judge criteria (in order, weights 5/4/3/2/1, each scored 0-2, max 30):
//   1. A one-line review of the entrant's own Monday (not a joke about
//      something else), and it loses to any Monday review that lands a laugh.
//   2. The bigger laugh — the line a reader would laugh at, not merely nod at.
//   3. A concrete detail of the Monday (a meeting, a commute, an inbox)
//      over generic tiredness.
//   4. The joke lands inside the line with no wasted words; the turn
//      arrives before the reader gives up.
//   5. A line a reader would repeat to a coworker the next morning.
//
// Lessons applied (micro-text): one-liner <= ~100 bytes, ONE concrete
// image, setup + turn that lands, flat statement, no worn pun, nothing
// after the punchline, no over-local reference (global judge).

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const WEIGHTS = [5, 4, 3, 2, 1];

// [criterion 1, 2, 3, 4, 5] — each 0-2.
const CANDIDATES = [
  {
    text: "Monday, one star: my alarm snoozed itself, my inbox doubled, and my calendar booked a meeting about meetings.",
    scores: [2, 1, 2, 1, 1], // 23 — three clauses, no single turn; funny premise, flat landing.
  },
  {
    text: "Monday, one star: the standup ran nine minutes and my inbox took the rest of the week hostage.",
    scores: [2, 2, 2, 2, 1], // 29 — review frame + concrete standup/inbox + "hostage" turn.
  },
  {
    text: "My Monday commute took forty minutes; the train arrived on time, my motivation missed it.",
    scores: [2, 1, 2, 2, 1], // 25 — concrete commute, turn is decent but "motivation" is generic.
  },
  {
    text: "Monday, one star: my coffee went cold before my first meeting finished introducing itself.",
    scores: [2, 1, 2, 1, 1], // 23 — concrete coffee/meeting, but the turn meanders.
  },
  {
    text: "I gave Monday one star: it started with an alarm, peaked at lunch, and ended in my inbox.",
    scores: [2, 1, 1, 1, 1], // 20 — review frame, but alarm/lunch/inbox stay generic.
  },
  {
    text: "Monday's review: great alarm, terrible follow-through \u2014 my to-do list filed for the weekend.",
    scores: [2, 1, 1, 1, 1], // 20 — to-do list is generic; the turn is a shrug, not a laugh.
  },
  {
    text: "My Monday inbox had 214 unread emails; I read three and promoted the rest to Tuesday.",
    scores: [2, 2, 2, 2, 2], // 30 — review of MY Monday, concrete inbox + count, "promoted to
    // Tuesday" is the turn (procrastination dressed as management), and it
    // is exactly the line you repeat to a coworker on Tuesday morning.
  },
];

function score(c) {
  return c.scores.reduce((sum, s, i) => sum + s * WEIGHTS[i], 0);
}

function bytes(s) {
  return Buffer.byteLength(s, "utf8");
}

function main() {
  const ranked = CANDIDATES.map((c) => ({
    text: c.text,
    scores: c.scores,
    total: score(c),
    chars: [...c.text].length,
    bytes: bytes(c.text),
  })).sort((a, b) => b.total - a.total || a.bytes - b.bytes);

  for (const r of ranked) {
    console.log(
      `${String(r.total).padStart(2)}/30  ${r.chars}ch ${r.bytes}B  [${r.scores.join(",")}]  ${r.text}`,
    );
  }

  const winner = ranked[0];
  console.log(`\nWinner: ${winner.total}/30, ${winner.chars} chars, ${winner.bytes} bytes`);

  // Gate (RULES.txt): /output/entry.txt is UTF-8 text of 1-200 characters,
  // not only white space, a single line.
  const line = winner.text;
  if ([...line].length < 1 || [...line].length > 200) {
    throw new Error(`gate failed: ${[...line].length} chars, must be 1-200`);
  }
  if (line.includes("\n") || line.includes("\r")) {
    throw new Error("gate failed: entry must be a single line");
  }
  if (line.trim().length === 0) {
    throw new Error("gate failed: entry must not be only white space");
  }

  mkdirSync("/output", { recursive: true });
  writeFileSync("/output/entry.txt", line, "utf8");

  // Re-read and validate the gate on the written file.
  const back = readFileSync("/output/entry.txt", "utf8");
  if (back !== line) {
    throw new Error("gate failed: /output/entry.txt differs from the chosen line");
  }
  if ([...back].length < 1 || [...back].length > 200 || back.includes("\n")) {
    throw new Error("gate failed: re-read of /output/entry.txt violates the gate");
  }
  console.log("Wrote /output/entry.txt — gate OK");
}

main();
