/**
 * Enrich samples.json with theme/emoji/simParams so games are fully playable.
 * Also emits a JS fragment for SAMPLE_CHAPTERS alignment checks.
 */
import fs from "node:fs";
import path from "node:path";

const jsonPath = path.resolve("backend/database/seeders/data/samples.json");
const samples = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

const themes = {
  Timeline: {
    primary: "#ff5252",
    secondary: "#ffab40",
    accent: "#ff8a80",
    narrative_title: "Map the Path to Independence",
    narrative_intro:
      "Walk the milestones that forged Bangladesh — chronological mastery unlocks every challenge phase.",
    visualScene: "war",
    icon: "clock-rotate-left",
    demo_emoji: "🏛️",
  },
  Process: {
    primary: "#26c6da",
    secondary: "#4fc3f7",
    accent: "#80deea",
    narrative_title: "Trace the Water Cycle Loop",
    narrative_intro:
      "Master atmospheric intake, condensation, and groundwater return — then prove each stage under pressure.",
    visualScene: "nature",
    icon: "rotate",
    demo_emoji: "💧",
  },
  CauseEffect: {
    primary: "#8bc34a",
    secondary: "#cddc39",
    accent: "#aed581",
    narrative_title: "Follow the Ecological Cascade",
    narrative_intro:
      "Link HYV farming choices to eutrophication, aquifer stress, and soil collapse — cause by cause.",
    visualScene: "nature",
    icon: "diagram-next",
    demo_emoji: "🌱",
  },
  Comparison: {
    primary: "#69f0ae",
    secondary: "#00e676",
    accent: "#b9f6ca",
    narrative_title: "Sort Life's Twin Metabolisms",
    narrative_intro:
      "Separate photosynthesis from cellular respiration across organelles, equations, and energy logic.",
    visualScene: "body",
    icon: "arrow-right-arrow-left",
    demo_emoji: "🧪",
  },
};

const timelineEmojis = [
  "🗣️",
  "🗳️",
  "📜",
  "⚖️",
  "🏆",
  "🎤",
  "💥",
  "📢",
  "🏛️",
  "🤝",
  "🪖",
  "⚓",
  "🛡️",
  "🕯️",
  "🇧🇩",
];
const processSim = [
  { label: "Solar Heat Intensity", targetMin: 55, targetMax: 75 },
  { label: "Evaporation Rate", targetMin: 45, targetMax: 65 },
  { label: "Stomatal Opening", targetMin: 40, targetMax: 60 },
  { label: "Glacier Sublimation", targetMin: 30, targetMax: 50 },
  { label: "Wind Advection Speed", targetMin: 35, targetMax: 55 },
  { label: "Condensation Cooling", targetMin: 40, targetMax: 60 },
  { label: "Droplet Coalescence", targetMin: 50, targetMax: 70 },
  { label: "Precipitation Volume", targetMin: 45, targetMax: 65 },
  { label: "Surface Runoff Flow", targetMin: 35, targetMax: 55 },
  { label: "Aquifer Recharge", targetMin: 40, targetMax: 60 },
];
const processEmojis = ["☀️", "🌫️", "🌿", "❄️", "💨", "☁️", "💧", "🌧️", "🏞️", "⬇️"];
const comparisonEmojis = {
  Photosynthesis: "🌿",
  "Cellular Respiration": "⚡",
};

let ti = 0;
let pi = 0;

for (const sample of samples) {
  const theme = themes[sample.category];
  sample.metadata = {
    ...(sample.metadata || {}),
    theme,
    mechanic:
      sample.category === "Timeline"
        ? "Timeline Builder"
        : sample.category === "Process"
          ? "Process Loop"
          : sample.category === "CauseEffect"
            ? "Cause-Effect Chain"
            : "Comparison Sorter",
  };

  const payload = sample.payload;
  if (sample.category === "Timeline" && payload.levels) {
    for (const level of payload.levels) {
      for (const evt of level.events || []) {
        evt.emoji = evt.emoji || timelineEmojis[ti % timelineEmojis.length];
        ti += 1;
      }
    }
  }
  if (sample.category === "Process" && payload.phases) {
    for (const phase of payload.phases) {
      for (const stg of phase.stages || []) {
        stg.emoji = stg.emoji || processEmojis[pi % processEmojis.length];
        stg.simParams = stg.simParams || processSim[pi % processSim.length];
        pi += 1;
      }
    }
  }
  if (sample.category === "Comparison" && payload.cards) {
    for (const card of payload.cards) {
      card.emoji = card.emoji || comparisonEmojis[card.category] || "⚡";
    }
  }
}

fs.writeFileSync(jsonPath, JSON.stringify(samples, null, 2) + "\n");
console.log(`Enriched ${samples.length} samples in samples.json`);
for (const s of samples) {
  const count =
    s.category === "Timeline"
      ? s.payload.levels.reduce((n, l) => n + (l.events?.length || 0), 0)
      : s.category === "Process"
        ? s.payload.phases.reduce((n, p) => n + (p.stages?.length || 0), 0)
        : s.category === "CauseEffect"
          ? s.payload.levels.reduce((n, l) => n + (l.chains?.length || 0), 0)
          : s.payload.cards?.length || 0;
  console.log(`- ${s.slug}: ${s.category} items=${count}`);
}
