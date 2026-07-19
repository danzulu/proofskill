export function areFixturesEnabled() {
  return process.env.ENABLE_AI_FIXTURES === "true";
}

export function isLiveAIConfigured() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}
