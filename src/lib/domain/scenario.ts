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

type RevisionDecision = {
  label: string;
  prompt: string;
  coaching: string;
  choices: readonly {
    id: string;
    title: string;
    tradeoff: string;
    revision: string;
    adaptation: string;
  }[];
};

export type RevisionStrategyKey = "keep" | "remove" | "measure";

type RevisionStrategyDecision = {
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
    details: {
      rationale: {
        prompt: "Why is this trade-off defensible?",
        choices: [
          {
            id: "economic_quality",
            title: "Protect economic quality",
            tradeoff: "Durability",
            response:
              "Prioritize contribution quality because growth that depends on unsustainable margin loss is not durable.",
          },
          {
            id: "recover_demand",
            title: "Recover demand quickly",
            tradeoff: "Speed",
            response:
              "Prioritize a fast recovery in qualified checkout demand while accepting a controlled and temporary economic cost.",
          },
          {
            id: "buy_evidence",
            title: "Buy evidence before scale",
            tradeoff: "Learning",
            response:
              "Use a bounded test because credible evidence is more valuable than committing the full budget under uncertainty.",
          },
        ],
      },
      first_action: {
        prompt: "What happens in the first 48 hours?",
        choices: [
          {
            id: "define_cohort",
            title: "Define the cohort",
            tradeoff: "Focus",
            response:
              "Define the eligible cohort, baseline current performance, and assign one accountable owner before launch.",
          },
          {
            id: "ship_reversible",
            title: "Ship one reversible move",
            tradeoff: "Momentum",
            response:
              "Ship one reversible treatment to the highest-intent cohort and verify its instrumentation within 48 hours.",
          },
          {
            id: "create_control",
            title: "Create the control",
            tradeoff: "Causal proof",
            response:
              "Create exposed and control cohorts, confirm event tracking, and publish the decision thresholds before launch.",
          },
        ],
      },
      guardrail: {
        prompt: "What makes you stop?",
        choices: [
          {
            id: "margin_floor",
            title: "Margin floor fails",
            tradeoff: "Economics",
            response: "Stop if contribution margin per session falls below the predefined floor.",
          },
          {
            id: "trust_signal",
            title: "Trust deteriorates",
            tradeoff: "Customer risk",
            response:
              "Stop if cancellations, refunds, or customer complaints rise beyond the agreed threshold.",
          },
          {
            id: "lift_not_reached",
            title: "Minimum lift is missed",
            tradeoff: "Decision discipline",
            response:
              "Stop at the decision date if minimum incremental lift is not reached or any guardrail fails.",
          },
        ],
      },
    },
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

export const ECOMMERCE_REVISION_DECISIONS = {
  problem: {
    label: "Problem",
    prompt: "How should the problem change under this pressure?",
    coaching: "Choose the reframing that keeps the team focused on an observable business outcome.",
    choices: [
      {
        id: "narrow_behavior",
        title: "Narrow the behavior",
        tradeoff: "Sharper focus",
        revision:
          "Under the new constraint, narrow the problem to the highest-intent behavior the team can observe and influence during this experiment.",
        adaptation:
          "The problem is narrowed to an observable high-intent behavior so the team can respond within the new constraint.",
      },
      {
        id: "protect_economics",
        title: "Protect the economics",
        tradeoff: "Business guardrail",
        revision:
          "Reframe the problem as recovering qualified conversion without creating discount leakage or weakening contribution margin.",
        adaptation:
          "The problem now makes the economic downside explicit instead of treating conversion volume as the only outcome.",
      },
      {
        id: "surface_tradeoff",
        title: "Name the trade-off",
        tradeoff: "Decision clarity",
        revision:
          "Define the problem as choosing which customer friction to remove while accepting that reach, speed, and margin cannot all be maximized at once.",
        adaptation:
          "The problem now exposes the core trade-off the constraint forces the team to manage.",
      },
    ],
  },
  target_customer: {
    label: "Target customer",
    prompt: "Which customer should remain in scope now?",
    coaching: "A tighter cohort reduces reach, but makes the revised experiment more defensible.",
    choices: [
      {
        id: "highest_intent",
        title: "Prioritize highest intent",
        tradeoff: "Fast signal",
        revision:
          "Limit the revised plan to shoppers who already demonstrate strong purchase intent, so the team spends its constrained capacity where behavior can change fastest.",
        adaptation:
          "The audience is narrowed to the highest-intent cohort to improve learning speed and reduce wasted exposure.",
      },
      {
        id: "trust_sensitive",
        title: "Prioritize trust-sensitive buyers",
        tradeoff: "Customer confidence",
        revision:
          "Focus on shoppers whose purchase decision depends most on clear cost, delivery, and return information rather than a broad incentive.",
        adaptation:
          "The target shifts toward customers whose barrier can be resolved through confidence instead of discounting.",
      },
      {
        id: "profitable_cohort",
        title: "Prioritize profitable demand",
        tradeoff: "Margin quality",
        revision:
          "Restrict eligibility to a measurable cohort with enough basket value and contribution potential to absorb the experiment cost.",
        adaptation:
          "The target now includes an explicit economic eligibility rule that protects contribution margin.",
      },
    ],
  },
  value_proposition: {
    label: "Value proposition",
    prompt: "Which promise still works without ignoring the constraint?",
    coaching: "Choose a promise the product can prove during the revised experiment.",
    choices: [
      {
        id: "clarity_over_discount",
        title: "Trade discounts for clarity",
        tradeoff: "Trust",
        revision:
          "Make confidence the revised promise: shoppers see total cost, delivery timing, and return terms before committing, without a blanket discount.",
        adaptation:
          "The value proposition moves from price relief to decision clarity that can preserve both trust and margin.",
      },
      {
        id: "remove_effort",
        title: "Remove effort",
        tradeoff: "Convenience",
        revision:
          "Promise a shorter and more predictable mobile path to purchase, concentrating value in reduced effort rather than a larger incentive.",
        adaptation:
          "The promise is adapted around convenience, which the team can deliver within the constrained scope.",
      },
      {
        id: "qualified_value",
        title: "Offer qualified value",
        tradeoff: "Selective benefit",
        revision:
          "Reserve any benefit for a clearly eligible barrier and explain why it is relevant, avoiding an expectation that every visit earns a discount.",
        adaptation:
          "The benefit becomes conditional and relevant, reducing broad exposure while retaining customer value.",
      },
    ],
  },
  solution: {
    label: "Solution",
    prompt: "What should the team change in the solution?",
    coaching: "The strongest revision is small enough to ship, measure, and reverse.",
    choices: [
      {
        id: "reduce_scope",
        title: "Reduce to one intervention",
        tradeoff: "Shipping speed",
        revision:
          "Reduce the revised solution to one customer-facing intervention that can ship inside the available window and be evaluated independently.",
        adaptation:
          "The solution is reduced to a single testable intervention so the constraint does not create an unshippable bundle.",
      },
      {
        id: "instrument_first",
        title: "Instrument before scaling",
        tradeoff: "Learning quality",
        revision:
          "Add explicit exposure, completion, and guardrail instrumentation before expanding the solution beyond the first qualified cohort.",
        adaptation:
          "The solution now prioritizes reliable measurement before broader rollout under uncertainty.",
      },
      {
        id: "reversible_path",
        title: "Make it reversible",
        tradeoff: "Risk control",
        revision:
          "Ship the solution behind a bounded treatment with a clear stop condition, preserving the ability to withdraw it if the constraint worsens.",
        adaptation:
          "The solution becomes reversible and bounded, limiting downside while the team learns.",
      },
    ],
  },
  acquisition: {
    label: "Acquisition",
    prompt: "Where should customers encounter the revised plan?",
    coaching: "Concentrate exposure where intent is strongest and wasted reach is lowest.",
    choices: [
      {
        id: "owned_channel",
        title: "Move to owned recovery",
        tradeoff: "Lower media cost",
        revision:
          "Use consented owned recovery for qualified abandoners, avoiding additional paid acquisition cost while the revised intervention is being proven.",
        adaptation:
          "Acquisition shifts to an owned channel so the team can test without adding expensive reach.",
      },
      {
        id: "intent_trigger",
        title: "Trigger at intent",
        tradeoff: "Less exposure",
        revision:
          "Expose the intervention only after a shopper reaches a high-intent mobile checkout event instead of showing it across the full journey.",
        adaptation:
          "Exposure is moved closer to purchase intent, reducing waste and limiting the constraint's downside.",
      },
      {
        id: "message_continuity",
        title: "Preserve message continuity",
        tradeoff: "CAC efficiency",
        revision:
          "Align the paid promise, landing experience, and checkout message for the selected cohort before buying any additional traffic.",
        adaptation:
          "Acquisition now improves continuity for existing traffic rather than depending on more spend.",
      },
    ],
  },
  retention: {
    label: "Retention",
    prompt: "How should the revised plan create durable value?",
    coaching: "Keep the return loop tied to a better experience, not permanent incentives.",
    choices: [
      {
        id: "prove_promise",
        title: "Prove the promise after purchase",
        tradeoff: "Trust loop",
        revision:
          "Use delivery visibility, responsive support, and clear returns to prove the revised checkout promise after the first order.",
        adaptation:
          "Retention is anchored in proving the experience rather than repeating the acquisition incentive.",
      },
      {
        id: "reduce_next_effort",
        title: "Make the next visit easier",
        tradeoff: "Convenience loop",
        revision:
          "With permission, preserve useful preferences and context so a returning shopper faces less effort on the next mobile purchase.",
        adaptation:
          "Retention shifts toward saved effort that remains valuable even after the constrained experiment ends.",
      },
      {
        id: "relevant_return",
        title: "Create one relevant return moment",
        tradeoff: "Lifecycle focus",
        revision:
          "Define one product-relevant follow-up moment for the exposed cohort and avoid broad promotional messaging during the test.",
        adaptation:
          "The retention plan is narrowed to one relevant lifecycle moment with limited promotional exposure.",
      },
    ],
  },
  revenue: {
    label: "Revenue logic",
    prompt: "Which economic rule should govern the revision?",
    coaching: "Make the cost, upside, and stopping point visible before the team ships.",
    choices: [
      {
        id: "margin_floor",
        title: "Set a hard margin floor",
        tradeoff: "Downside protection",
        revision:
          "Require the revised treatment to remain above a defined contribution-margin floor for the exposed cohort before it can scale.",
        adaptation:
          "Revenue logic now includes a hard economic boundary that directly responds to the constraint.",
      },
      {
        id: "incremental_profit",
        title: "Fund only incremental profit",
        tradeoff: "Causal economics",
        revision:
          "Count value only when incremental gross profit exceeds the intervention, incentive, and fulfillment costs relative to a control.",
        adaptation:
          "The model shifts from gross conversion to incremental profit after all treatment costs.",
      },
      {
        id: "bounded_payback",
        title: "Bound the payback window",
        tradeoff: "Time discipline",
        revision:
          "Accept near-term cost only when the selected cohort can recover it through contribution profit inside a predefined payback window.",
        adaptation:
          "Revenue logic now limits both the amount and duration of the investment under pressure.",
      },
    ],
  },
  success_metrics: {
    label: "Success metrics",
    prompt: "What evidence should control the revised decision?",
    coaching: "Choose a measurement system that can tell the team to scale, revise, or stop.",
    choices: [
      {
        id: "signal_outcome_guardrail",
        title: "Use a three-part scorecard",
        tradeoff: "Balanced evidence",
        revision:
          "Track one leading behavior, completed-order conversion, and contribution margin per session with thresholds set before launch.",
        adaptation:
          "Measurement now balances an early signal, a business outcome, and an economic guardrail.",
      },
      {
        id: "control_cohort",
        title: "Prove incrementality",
        tradeoff: "Causal confidence",
        revision:
          "Compare a bounded exposed cohort with a control on completed orders, contribution profit, cancellations, and refunds.",
        adaptation:
          "Measurement adds a control so the team can distinguish true lift from shifted or discounted demand.",
      },
      {
        id: "stop_rule",
        title: "Precommit to a stop rule",
        tradeoff: "Decision speed",
        revision:
          "Define the minimum improvement, maximum acceptable downside, decision date, and owner before the revised treatment starts.",
        adaptation:
          "Measurement now includes a precommitted stop rule that prevents the constrained test from drifting.",
      },
    ],
  },
} as const satisfies Record<CanvasKey, RevisionDecision>;

export const ECOMMERCE_REVISION_STRATEGIES = {
  keep: {
    label: "Keep",
    prompt: "What remains strong enough to preserve?",
    coaching: "Protect the part of the original strategy that still creates coherence after the pressure test.",
    choices: [
      {
        id: "core_hypothesis",
        title: "Keep the core hypothesis",
        tradeoff: "Strategic continuity",
        response:
          "Keep the original customer behavior hypothesis because the constraint changes execution, not the underlying need the experiment is testing.",
      },
      {
        id: "customer_focus",
        title: "Keep the customer focus",
        tradeoff: "Problem discipline",
        response:
          "Keep the defined customer and observable barrier because they remain the clearest basis for a focused experiment.",
      },
      {
        id: "economic_guardrail",
        title: "Keep the economic guardrail",
        tradeoff: "Business discipline",
        response:
          "Keep the commitment to contribution quality because conversion growth is not useful if the revised plan destroys sustainable margin.",
      },
    ],
  },
  remove: {
    label: "Remove",
    prompt: "What should the team deliberately remove?",
    coaching: "A credible revision gives something up instead of quietly expanding the plan.",
    choices: [
      {
        id: "broad_exposure",
        title: "Remove broad exposure",
        tradeoff: "Smaller reach",
        response:
          "Remove broad treatment exposure because it spends capacity on low-signal customers and makes the constraint harder to control.",
      },
      {
        id: "bundled_scope",
        title: "Remove bundled scope",
        tradeoff: "Fewer features",
        response:
          "Remove secondary features and parallel interventions so one meaningful change can be shipped and interpreted inside the available window.",
      },
      {
        id: "unsupported_assumption",
        title: "Remove the weakest assumption",
        tradeoff: "Less certainty",
        response:
          "Remove the assumption that conversion alone proves value; the revision must demonstrate incremental customer and economic impact.",
      },
    ],
  },
  measure: {
    label: "Measure",
    prompt: "How will the team know the revision worked?",
    coaching: "Select the evidence that will trigger a clear scale, revise, or stop decision.",
    choices: [
      {
        id: "balanced_thresholds",
        title: "Use balanced thresholds",
        tradeoff: "Outcome + guardrail",
        response:
          "The revision works only if the leading behavior and completed-order conversion improve while contribution margin remains above its predefined floor.",
      },
      {
        id: "control_comparison",
        title: "Compare with a control",
        tradeoff: "Incrementality",
        response:
          "The revision works when the exposed cohort produces a credible incremental lift over control without higher cancellations, refunds, or discount leakage.",
      },
      {
        id: "decision_rule",
        title: "Use a decision rule",
        tradeoff: "Fast action",
        response:
          "At the decision date, scale only if the minimum lift is reached, revise if learning is positive but incomplete, and stop if any guardrail fails.",
      },
    ],
  },
} as const satisfies Record<RevisionStrategyKey, RevisionStrategyDecision>;

export function scenarioPrompt() {
  return [
    ECOMMERCE_SCENARIO.brief,
    ...ECOMMERCE_SCENARIO.context.map((item) => `- ${item}`),
  ].join("\n");
}
