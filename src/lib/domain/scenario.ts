import type { CanvasKey } from "@/lib/domain/assessment";

type CanvasDecision = {
  label: string;
  prompt: string;
  coaching: string;
  choices: readonly {
    id: string;
    title: string;
    tradeoff: string;
    response: string;
  }[];
};

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

export const ECOMMERCE_CANVAS_DECISIONS = {
  problem: {
    label: "Problem",
    prompt: "Which problem deserves the team's single experiment?",
    coaching: "Choose the bottleneck you believe is driving the business outcome. There is no risk-free option.",
    choices: [
      {
        id: "mobile_friction",
        title: "Remove mobile friction",
        tradeoff: "Conversion focus",
        response:
          "High-intent mobile shoppers are abandoning checkout because the experience creates avoidable friction, reducing completed orders despite growing traffic.",
      },
      {
        id: "trust_gap",
        title: "Close the trust gap",
        tradeoff: "Confidence focus",
        response:
          "First-time mobile shoppers hesitate at checkout because costs, delivery expectations, and return terms are not clear enough to support a confident purchase.",
      },
      {
        id: "discount_dependency",
        title: "Break discount dependency",
        tradeoff: "Margin focus",
        response:
          "The current conversion approach trains shoppers to wait for broad discounts, creating short-term orders while weakening contribution margin and customer trust.",
      },
    ],
  },
  target_customer: {
    label: "Target customer",
    prompt: "Who should receive the experiment first?",
    coaching: "A narrow audience makes the result easier to interpret, but limits immediate reach.",
    choices: [
      {
        id: "returning_mobile",
        title: "Returning mobile shoppers",
        tradeoff: "High intent",
        response:
          "Returning mobile shoppers who viewed a product more than once and reach checkout without completing payment are the highest-intent audience for the experiment.",
      },
      {
        id: "first_time_mobile",
        title: "First-time mobile shoppers",
        tradeoff: "Trust building",
        response:
          "First-time mobile shoppers arriving on product pages from paid social need the most reassurance before committing to an unfamiliar home and lifestyle brand.",
      },
      {
        id: "paid_high_value",
        title: "High-value paid visitors",
        tradeoff: "CAC recovery",
        response:
          "Paid mobile visitors with above-average basket value and clear checkout intent are the priority because acquisition cost has risen fastest for this valuable cohort.",
      },
    ],
  },
  value_proposition: {
    label: "Value proposition",
    prompt: "What promise is strong enough to change behavior now?",
    coaching: "Pick the customer benefit you can prove without relying on a blanket discount.",
    choices: [
      {
        id: "faster_checkout",
        title: "A faster path to purchase",
        tradeoff: "Convenience",
        response:
          "Give high-intent shoppers a faster, lower-effort checkout so they can complete the purchase on mobile without repeating information or navigating unnecessary steps.",
      },
      {
        id: "confident_purchase",
        title: "A more confident purchase",
        tradeoff: "Trust",
        response:
          "Make the total cost, delivery date, and return promise explicit before payment so shoppers can commit with confidence instead of postponing the decision.",
      },
      {
        id: "relevant_incentive",
        title: "A relevant incentive",
        tradeoff: "Selective value",
        response:
          "Offer a narrowly targeted benefit only when it resolves a demonstrated barrier, giving the customer timely value without teaching every shopper to expect a discount.",
      },
    ],
  },
  solution: {
    label: "Solution",
    prompt: "What can the team ship and learn from in 14 days?",
    coaching: "Select one meaningful intervention, not a bundle of unrelated features.",
    choices: [
      {
        id: "express_checkout",
        title: "Express checkout path",
        tradeoff: "Speed",
        response:
          "Ship an express mobile checkout experiment that reduces form steps and surfaces supported wallet payment for a defined high-intent audience.",
      },
      {
        id: "trust_layer",
        title: "Checkout trust layer",
        tradeoff: "Clarity",
        response:
          "Add a compact checkout trust layer that shows total cost, delivery timing, returns, and support before the shopper reaches the final payment decision.",
      },
      {
        id: "targeted_recovery",
        title: "Targeted recovery offer",
        tradeoff: "Precision",
        response:
          "Test a targeted cart-recovery benefit for qualified abandoners, using eligibility rules and a strict margin guardrail instead of sitewide discounting.",
      },
    ],
  },
  acquisition: {
    label: "Acquisition",
    prompt: "Where should the right customer encounter the intervention?",
    coaching: "Choose the moment with the strongest signal of intent and the lowest wasted exposure.",
    choices: [
      {
        id: "checkout_trigger",
        title: "Inside checkout",
        tradeoff: "Immediate intent",
        response:
          "Expose the intervention inside mobile checkout only after the shopper demonstrates purchase intent, minimizing distraction and avoiding unnecessary incentive exposure.",
      },
      {
        id: "owned_recovery",
        title: "Owned cart recovery",
        tradeoff: "Low media cost",
        response:
          "Reach qualified cart abandoners through consented email or SMS recovery, using the abandoned basket and observed friction as the entry point.",
      },
      {
        id: "paid_message_match",
        title: "Paid-message continuity",
        tradeoff: "CAC efficiency",
        response:
          "Carry the same product promise from high-cost paid campaigns into the mobile landing and checkout journey so intent is not lost between acquisition and purchase.",
      },
    ],
  },
  retention: {
    label: "Retention",
    prompt: "How will the first conversion create durable value?",
    coaching: "Retention should come from a better experience, not a permanent coupon habit.",
    choices: [
      {
        id: "remember_preferences",
        title: "Make the next visit easier",
        tradeoff: "Convenience loop",
        response:
          "With permission, remember checkout preferences and product context so the next mobile purchase requires less effort and reinforces the value of returning directly.",
      },
      {
        id: "post_purchase_confidence",
        title: "Prove the promise after purchase",
        tradeoff: "Trust loop",
        response:
          "Use proactive delivery updates, clear support, and a reliable return experience to prove the checkout promise and earn the customer's next purchase.",
      },
      {
        id: "category_replenishment",
        title: "Create a relevant return moment",
        tradeoff: "Lifecycle relevance",
        response:
          "Trigger a category-relevant follow-up based on the purchased product and expected need, encouraging a useful return visit without a broad recurring discount.",
      },
    ],
  },
  revenue: {
    label: "Revenue logic",
    prompt: "Which economic mechanism makes the experiment worthwhile?",
    coaching: "State the upside and the cost you are deliberately controlling.",
    choices: [
      {
        id: "conversion_without_discount",
        title: "Lift conversion, hold price",
        tradeoff: "Margin protection",
        response:
          "Increase completed orders by removing friction while holding price and monitoring fulfillment cost, so incremental conversion contributes revenue without discount leakage.",
      },
      {
        id: "bounded_incentive",
        title: "Bound the incentive cost",
        tradeoff: "Controlled spend",
        response:
          "Fund a narrowly targeted recovery benefit only when its incremental gross profit exceeds the incentive and delivery cost, with a hard contribution-margin floor.",
      },
      {
        id: "cohort_value",
        title: "Grow cohort value",
        tradeoff: "Longer payback",
        response:
          "Accept a measured near-term implementation cost if the exposed cohort produces higher repeat purchase and contribution profit within a defined payback window.",
      },
    ],
  },
  success_metrics: {
    label: "Success metrics",
    prompt: "What evidence would make you scale, revise, or stop?",
    coaching: "Balance one leading signal, one business outcome, and one guardrail.",
    choices: [
      {
        id: "completion_and_margin",
        title: "Completion with margin",
        tradeoff: "Balanced scorecard",
        response:
          "Track checkout step completion as the leading signal, completed-order conversion as the outcome, and contribution margin per session as the guardrail.",
      },
      {
        id: "incremental_orders",
        title: "Prove incrementality",
        tradeoff: "Causal confidence",
        response:
          "Compare exposed and control cohorts on incremental completed orders, while guarding refund rate and contribution profit to avoid mistaking shifted demand for growth.",
      },
      {
        id: "customer_and_economics",
        title: "Trust plus economics",
        tradeoff: "Durable value",
        response:
          "Measure checkout completion and post-purchase confidence, then require stable contribution margin and no increase in cancellations before scaling the intervention.",
      },
    ],
  },
} as const satisfies Record<CanvasKey, CanvasDecision>;

export function scenarioPrompt() {
  return [
    ECOMMERCE_SCENARIO.brief,
    ...ECOMMERCE_SCENARIO.context.map((item) => `- ${item}`),
  ].join("\n");
}
