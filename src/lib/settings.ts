const settings = {
  models: {
    gemini: "gemini-3.5-flash-lite",
    jev: "jev-latest",
  },
  features: {
    jevEvidenceEvaluation: false,
  },
} as const;

export default settings;
