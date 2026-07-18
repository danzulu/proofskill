export const ECOMMERCE_SCENARIO = {
  id: "ecommerce-cart-recovery",
  version: "2026-07-17.1",
  title: "Recover growth without training customers to wait for discounts",
  category: "E-commerce",
  difficulty: "Intermediate",
  company: "Northstar Goods",
  brief:
    "Northstar Goods is a direct-to-consumer home and lifestyle retailer. Mobile traffic is growing, but checkout completion has fallen for three consecutive months. The team wants a plan that improves conversion without eroding contribution margin or customer trust.",
  context: [
    "68% of sessions are mobile.",
    "Checkout completion fell from 52% to 43% in three months.",
    "Paid acquisition CAC increased 24% quarter over quarter.",
    "Blanket discounting lifts conversion but reduces contribution margin.",
    "The team can ship one meaningful experiment in the next 14 days.",
  ],
  criticalDecision: {
    prompt:
      "The CFO will fund only one path for the next 30 days. Which trade-off do you make explicit?",
    choices: [
      {
        value: "protect_margin",
        label: "Protect margin",
        detail: "Prioritize high-intent segments and avoid broad incentives.",
      },
      {
        value: "protect_growth",
        label: "Protect growth",
        detail: "Accept a temporary margin hit to recover checkout volume quickly.",
      },
      {
        value: "balanced_experiment",
        label: "Run a bounded experiment",
        detail: "Split exposure, define a guardrail, and preserve the option to stop.",
      },
    ],
  },
} as const;

export function scenarioPrompt() {
  return [
    ECOMMERCE_SCENARIO.brief,
    ...ECOMMERCE_SCENARIO.context.map((item) => `- ${item}`),
  ].join("\n");
}

