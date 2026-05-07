/**
 * AI Competency Diagnostic — Scoring Engine
 * Self-contained: no imports from App.jsx required.
 * All scores normalised to 0–100.
 */

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function safeRound(n) {
  if (n === null || n === undefined || isNaN(n)) return 0;
  return Math.round(Math.max(0, Math.min(100, n)));
}

// Likert: 1→0, 2→25, 3→50, 4→75, 5→100. Reverse-scored if flagged.
const LIKERT_MAP = { 1: 0, 2: 25, 3: 50, 4: 75, 5: 100 };
function scoreLikert(value, reverse = false) {
  if (value === null || value === undefined) return null;
  const base = LIKERT_MAP[value] ?? 0;
  return reverse ? 100 - base : base;
}

// Simple average, ignoring nulls. Returns null if ALL inputs are null.
function sAvg(...values) {
  const valid = values.filter((v) => v !== null && v !== undefined && !isNaN(v));
  if (!valid.length) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

// Weighted average of [[score, weight], ...]. Redistributes weights of null components.
function wAvg(components) {
  const valid = components.filter(
    ([s]) => s !== null && s !== undefined && !isNaN(s)
  );
  if (!valid.length) return 0;
  const totalW = valid.reduce((acc, [, w]) => acc + w, 0);
  if (totalW === 0) return 0;
  return valid.reduce((acc, [s, w]) => acc + s * (w / totalW), 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// QUESTION-LEVEL SCORING TABLES
// ─────────────────────────────────────────────────────────────────────────────

// Explicit score per answer text, keyed by question id.
// All single-choice (non-Likert, non-multi) questions must appear here.
const Q_SCORES = {
  // Q1 — Tool access level (Usage: Tool Type)
  1: {
    "I do not use AI tools":                          0,
    "I only use publicly available AI tools":         25,
    "I use a personal subscription":                  50,
    "My organisation provides general AI tools":      70,
    "My organisation provides legal-specific AI tools": 85,
    "I use both general and legal AI tools":          100,
  },

  // Q2 — Usage frequency (Usage: Frequency)
  2: {
    "Never":                0,
    "Monthly":             25,
    "Weekly":              50,
    "Several times a week": 75,
    "Daily":              100,
  },

  // Q4 — Workflow stage (Usage: Workflow Integration)
  4: {
    "I do not use AI":   0,
    "Brainstorming only": 25,
    "Research stage":    50,
    "Drafting stage":    75,
    "Multiple stages":  100,
  },

  // Q6 — Output expectation (Usage: Prompting Capability)
  6: {
    "Brainstorming only":    25,
    "Rough outline":         50,
    "Draft requiring edits": 75,
    "Near-final draft":     100,
  },

  // Q8 — Usage trend (Usage: Workflow Integration)
  8: {
    "Much lower":     0,
    "Slightly lower": 25,
    "About the same": 50,
    "Slightly higher": 75,
    "Much higher":   100,
  },

  // Q9 — Tool selection origin (Governance: Approved Tool Awareness)
  9: {
    "I chose them myself":              25,
    "My team selected them informally": 50,
    "IT or innovation team selected them": 75,
    "Firm leadership selected them":   100,
  },

  // Q10 — Tool type used most (Usage: Tool Type)
  10: {
    "General-purpose AI":  50,
    "Legal-specific AI":   75,
    "Both equally":       100,
  },

  // Q11 — Citation handling (Verification: Citation Verification) [RED FLAG if 0]
  11: {
    "I use them without checking":              0,
    "I occasionally check them":               25,
    "I verify the citation exists":            60,
    "I verify and read the source":            85,
    "I verify source, jurisdiction, and relevance": 100,
  },

  // Q12 — Legal conclusion validation (Verification: Legal Validation) [RED FLAG if 0]
  12: {
    "I do not validate them":                          0,
    "I only check if the matter is important":        25,
    "I cross-check with primary law":                 75,
    "I cross-check with primary and secondary sources": 100,
  },

  // Q17 — Reliance on AI as primary source (Verification: Trust [pre-reversed])
  17: {
    "Always":    0,
    "Often":    25,
    "Sometimes": 50,
    "Rarely":   75,
    "Never":   100,
  },

  // Q18 — Scenario: unread citations (Verification: Scenario Performance)
  18: {
    "Use them if they look correct":              0,
    "Check one of them":                         30,
    "Ask a colleague if they seem correct":      20,
    "Verify all citations and read relevant sections": 100,
  },

  // Q19 — Scenario: wrong jurisdiction (Verification: Jurisdiction Checking)
  19: {
    "Accept the answer":                    0,
    "Check jurisdiction and adjust":       60,
    "Re-run query specifying jurisdiction": 100,
  },

  // Q20 — Scenario: contract clause change (Verification: Scenario Performance)
  20: {
    "Accept the revision":               25,
    "Send directly to client":            0,
    "Compare to original and client intent": 100,
  },

  // Q28 — Scenario: client document on public tool (Risk: Safe Prompting) [RED FLAG if 0]
  28: {
    "Paste it fully":                    0,
    "Remove identifying details":       60,
    "Check policy and approval before use": 100,
  },

  // Q29 — Scenario: confident but incorrect answer (Verification: Legal Validation)
  29: {
    "Accept it":                   0,
    "Double-check sources":       60,
    "Re-run and validate externally": 100,
  },

  // Q31 — AI policy existence (Governance: Policy Awareness)
  31: {
    "Yes, formal policy": 100,
    "Partial guidance":    70,
    "Informal guidance":   40,
    "No policy":           10,
    "I don't know":         0,
  },

  // Q32 — Training received (Governance: Training)
  32: {
    "Mandatory training": 100,
    "Optional training":   75,
    "Informal guidance":   40,
    "No training":          0,
  },
};

// Likert question ids → { reverse: bool }
const LIKERT_Qs = {
  5:  { reverse: false }, // prompting comfort
  7:  { reverse: false }, // repetitive task frequency
  13: { reverse: true  }, // trust before checking — REVERSED
  14: { reverse: false }, // source verification frequency
  15: { reverse: false }, // jurisdiction checking frequency
  16: { reverse: false }, // misleading output recognition
  21: { reverse: false }, // hallucination awareness
  24: { reverse: false }, // safe vs unsafe prompting confidence
  25: { reverse: false }, // hallucination awareness (legal AI)
  26: { reverse: false }, // confidentiality risk confidence
  27: { reverse: false }, // ability to explain risks to client
  30: { reverse: false }, // bias awareness
  33: { reverse: false }, // escalation knowledge
  34: { reverse: false }, // approved tool usage frequency
  35: { reverse: false }, // tool approval awareness
  37: { reverse: false }, // explain AI use
  38: { reverse: false }, // client disclosure awareness
  39: { reverse: false }, // team expectations clarity
  40: { reverse: false }, // compliance confidence
};

// Multi-select question ids (all others are single or Likert)
const MULTI_Qs = new Set([3, 22, 23, 36]);

// ─────────────────────────────────────────────────────────────────────────────
// MULTI-SELECT SCORING
// ─────────────────────────────────────────────────────────────────────────────

function scoreMulti(qId, selections) {
  if (!Array.isArray(selections) || selections.length === 0) return 0;

  if (qId === 3) {
    // Task breadth: proportion of 6 tasks selected (all positive)
    return Math.min(100, (selections.length / 6) * 100);
  }

  if (qId === 22) {
    // Risk identification: all 6 listed risks are valid; proportion identified
    return Math.min(100, (selections.length / 6) * 100);
  }

  if (qId === 23) {
    // Data sensitivity: penalty model starting at 100
    if (selections.includes("None of the above")) return 100;
    let score = 100;
    if (selections.includes("Client names"))          score -= 10;
    if (selections.includes("Fact patterns"))         score -= 10;
    if (selections.includes("Contracts"))             score -= 10;
    if (selections.includes("Internal legal advice")) score -= 15;
    if (selections.includes("Personal data"))         score -= 20;
    return Math.max(0, score);
  }

  if (qId === 36) {
    // Control expectations: proportion of 4 controls known
    return Math.min(100, (selections.length / 4) * 100);
  }

  return 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// SINGLE QUESTION ACCESSOR
// ─────────────────────────────────────────────────────────────────────────────

// Returns 0–100 score for one answered question, or null if unanswered.
function getQ(qId, answers) {
  const answer = answers[qId];
  if (answer === undefined || answer === null) return null;

  if (LIKERT_Qs[qId] !== undefined) {
    return scoreLikert(answer, LIKERT_Qs[qId].reverse);
  }

  if (MULTI_Qs.has(qId)) {
    return scoreMulti(qId, answer);
  }

  if (Q_SCORES[qId]) {
    const text = answer?.text ?? answer;
    const s = Q_SCORES[qId][text];
    return s !== undefined ? s : null;
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// DOMAIN FORMULAS
// ─────────────────────────────────────────────────────────────────────────────

function computeUsage(answers) {
  // Frequency (0.20) — Q2 how often + Q7 repetitive tasks
  const frequency = sAvg(getQ(2, answers), getQ(7, answers));

  // Task Breadth (0.25) — Q3 multi-select tasks
  const taskBreadth = getQ(3, answers);

  // Workflow Integration (0.25) — Q4 stage + Q8 trend
  const workflowIntegration = sAvg(getQ(4, answers), getQ(8, answers));

  // Tool Type (0.15) — Q1 access level + Q10 tool type used most
  const toolType = sAvg(getQ(1, answers), getQ(10, answers));

  // Prompting Capability (0.15) — Q5 comfort + Q6 output expectation
  const prompting = sAvg(getQ(5, answers), getQ(6, answers));

  return safeRound(wAvg([
    [frequency,           0.20],
    [taskBreadth,         0.25],
    [workflowIntegration, 0.25],
    [toolType,            0.15],
    [prompting,           0.15],
  ]));
}

function computeVerification(answers) {
  // Citation Verification (0.30) — Q11 habitual + Q14 frequency
  const citationVerif = sAvg(getQ(11, answers), getQ(14, answers));

  // Legal Validation (0.25) — Q12 habitual + Q29 scenario
  const legalValidation = sAvg(getQ(12, answers), getQ(29, answers));

  // Jurisdiction Checking (0.10) — Q15 frequency + Q19 scenario
  const jurisdictionCheck = sAvg(getQ(15, answers), getQ(19, answers));

  // Misleading Output Recognition (0.15) — Q16
  const misleadingRecog = getQ(16, answers);

  // Trust Before Checking — REVERSED (0.10) — Q13 reversed + Q17 pre-reversed
  const trustReversed = sAvg(getQ(13, answers), getQ(17, answers));

  // Scenario Performance (0.10) — Q18 citations scenario + Q20 contract scenario
  const scenarioPerf = sAvg(getQ(18, answers), getQ(20, answers));

  return safeRound(wAvg([
    [citationVerif,    0.30],
    [legalValidation,  0.25],
    [jurisdictionCheck, 0.10],
    [misleadingRecog,  0.15],
    [trustReversed,    0.10],
    [scenarioPerf,     0.10],
  ]));
}

function computeRiskAwareness(answers) {
  // Hallucination Awareness (0.20) — Q21
  const hallucinationAwareness = getQ(21, answers);

  // Risk Identification (0.25) — Q22 multi-select risks + Q30 bias awareness
  const riskIdentification = sAvg(getQ(22, answers), getQ(30, answers));

  // Confidentiality Awareness (0.25) — Q23 data penalty + Q26 confidence
  const confidentialityAwareness = sAvg(getQ(23, answers), getQ(26, answers));

  // Tool Limitation Awareness (0.10) — Q25 hallucination in legal AI
  const toolLimitation = getQ(25, answers);

  // Safe Prompting Confidence (0.20) — Q24 prompting safety + Q28 scenario
  const safePrompting = sAvg(getQ(24, answers), getQ(28, answers));

  return safeRound(wAvg([
    [hallucinationAwareness,   0.20],
    [riskIdentification,       0.25],
    [confidentialityAwareness, 0.25],
    [toolLimitation,           0.10],
    [safePrompting,            0.20],
  ]));
}

function computeGovernance(answers) {
  // Policy Awareness (0.20) — Q31 policy + Q39 team expectations + Q40 compliance confidence
  const policyAwareness = sAvg(getQ(31, answers), getQ(39, answers), getQ(40, answers));

  // Approved Tool Awareness (0.20) — Q9 tool selection + Q34 usage + Q35 awareness
  const approvedToolAwareness = sAvg(getQ(9, answers), getQ(34, answers), getQ(35, answers));

  // Training (0.15) — Q32
  const training = getQ(32, answers);

  // Escalation Knowledge (0.15) — Q33 escalation + Q27 client risk explanation
  const escalation = sAvg(getQ(33, answers), getQ(27, answers));

  // Control Expectations (0.15) — Q36 multi-select + Q38 client disclosure awareness
  const controlExpectations = sAvg(getQ(36, answers), getQ(38, answers));

  // Explainability (0.15) — Q37
  const explainability = getQ(37, answers);

  return safeRound(wAvg([
    [policyAwareness,       0.20],
    [approvedToolAwareness, 0.20],
    [training,              0.15],
    [escalation,            0.15],
    [controlExpectations,   0.15],
    [explainability,        0.15],
  ]));
}

// ─────────────────────────────────────────────────────────────────────────────
// RED FLAG DETECTION
// ─────────────────────────────────────────────────────────────────────────────

const SENIOR_ROLES  = new Set(["Senior lawyer", "Partner", "In-house counsel"]);
const LARGE_ORGS    = new Set(["Large firm", "In-house legal team"]);

function detectRedFlags(answers, profile) {
  const flags = [];

  // 1. Uses AI-generated citations without checking (Q11 = 0)
  const q11 = getQ(11, answers);
  if (q11 !== null && q11 === 0) {
    flags.push({
      id: "unchecked_citations",
      label: "Uses AI-generated citations without checking",
      penalty: 20,
    });
  }

  // 2. Inputs confidential or privileged data into AI tools (Q23)
  const q23 = answers[23];
  if (Array.isArray(q23)) {
    const sensitiveItems = ["Internal legal advice", "Personal data"];
    if (sensitiveItems.some((s) => q23.includes(s))) {
      flags.push({
        id: "confidential_data",
        label: "Inputs sensitive or privileged data into AI tools",
        penalty: 20,
      });
    }
  }

  // 3. Uses AI for legal reasoning without validation (Q12 = 0)
  const q12 = getQ(12, answers);
  if (q12 !== null && q12 === 0) {
    flags.push({
      id: "no_validation",
      label: "Uses AI for legal reasoning without validation",
      penalty: 15,
    });
  }

  // 4. Unaware of which AI tools are approved (Q35 ≤ 25)
  const q35 = getQ(35, answers);
  if (q35 !== null && q35 <= 25) {
    flags.push({
      id: "unknown_approval",
      label: "Unaware of which AI tools are approved",
      penalty: 10,
    });
  }

  // 5. No policy awareness in a large organisation (Q31 = 0 + large org)
  const q31 = getQ(31, answers);
  if (q31 !== null && q31 === 0 && LARGE_ORGS.has(profile.org)) {
    flags.push({
      id: "no_policy_large_org",
      label: "No AI policy awareness in a large organisation",
      penalty: 10,
    });
  }

  // 6. Senior role without escalation awareness (Q33 ≤ 25 + senior role)
  const q33 = getQ(33, answers);
  if (q33 !== null && q33 <= 25 && SENIOR_ROLES.has(profile.role)) {
    flags.push({
      id: "senior_no_escalation",
      label: "Senior practitioner with no escalation awareness",
      penalty: 10,
    });
  }

  return flags;
}

// ─────────────────────────────────────────────────────────────────────────────
// AGGREGATE SCORES
// ─────────────────────────────────────────────────────────────────────────────

function computeCapabilityScore(domains, flags) {
  const base =
    domains.usage         * 0.25 +
    domains.verification  * 0.30 +
    domains.riskAwareness * 0.25 +
    domains.governance    * 0.20;

  const totalPenalty = flags.reduce((a, f) => a + f.penalty, 0);
  return safeRound(base - totalPenalty);
}

function computeSectionScores(domains) {
  return {
    practicalAIUse:     safeRound(domains.usage * 0.60 + domains.governance * 0.40),
    legalRiskAwareness: safeRound(domains.verification * 0.55 + domains.riskAwareness * 0.45),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXT-ADJUSTED RISK SCORE
// ─────────────────────────────────────────────────────────────────────────────

const ROLE_MULTIPLIERS = {
  "Junior lawyer / paralegal": 0.85,
  "Associate":                 1.00,
  "Senior lawyer":             1.10,
  "Partner":                   1.25,
  "In-house counsel":          1.15,
  "Other legal professional":  1.00,
};

const ORG_MULTIPLIERS = {
  "Solo practice":       0.90,
  "Small firm":          0.95,
  "Mid-sized firm":      1.00,
  "Large firm":          1.10,
  "In-house legal team": 1.20,
  "Public institution":  1.00,
};

function computeContextRisk(capabilityScore, profile) {
  const roleMult = ROLE_MULTIPLIERS[profile.role] ?? 1.00;
  const orgMult  = ORG_MULTIPLIERS[profile.org]  ?? 1.00;
  return safeRound((100 - capabilityScore) * roleMult * orgMult);
}

// ─────────────────────────────────────────────────────────────────────────────
// TIERS AND BANDS
// ─────────────────────────────────────────────────────────────────────────────

function getCapabilityTier(score) {
  if (score <= 25) return "High Risk";
  if (score <= 50) return "Emerging";
  if (score <= 75) return "Competent";
  if (score <= 90) return "Advanced";
  return "Leader";
}

function getRiskBand(score) {
  if (score <= 20) return "Low";
  if (score <= 40) return "Mild";
  if (score <= 60) return "Moderate";
  if (score <= 80) return "High";
  return "Critical";
}

// ─────────────────────────────────────────────────────────────────────────────
// CHARACTER ASSIGNMENT (Priority 1 → 10; first match wins)
// ─────────────────────────────────────────────────────────────────────────────

function assignCharacter(domains, capability, flags, profile, prompting) {
  const totalPenalty = flags.reduce((a, f) => a + f.penalty, 0);
  const isSenior     = SENIOR_ROLES.has(profile.role);

  // 1. Over-Reliant Operator
  if ((domains.usage >= 60 && domains.verification < 45) || totalPenalty >= 20) {
    return "overReliantOperator";
  }

  // 2. Shadow User
  if (domains.governance < 40 && domains.usage >= 50) {
    return "shadowUser";
  }

  // 3. Efficiency Chaser
  if (domains.usage >= 70 && domains.verification >= 40 && domains.verification <= 60) {
    return "efficiencyChaser";
  }

  // 4. AI Avoider
  if (domains.usage < 35 && domains.verification >= 55) {
    return "aiAvoider";
  }

  // 5. Traditionalist
  if (domains.usage < 25 && domains.riskAwareness >= 70) {
    return "traditionalist";
  }

  // 6. Hesitant Adopter
  if (domains.usage >= 25 && domains.usage <= 45 && prompting < 50) {
    return "hesitantAdopter";
  }

  // 7. Cautious Checker
  if (domains.verification >= 75 && domains.usage < 55) {
    return "cautiousChecker";
  }

  // 8. Balanced Practitioner
  const allBalanced = Object.values(domains).every((v) => v >= 50 && v <= 75);
  if (allBalanced && totalPenalty < 20) {
    return "balancedPractitioner";
  }

  // 9. AI Power User
  if (domains.usage >= 75 && domains.verification >= 70 && domains.riskAwareness >= 65) {
    return "aiPowerUser";
  }

  // 10. Strategic Leader
  if (capability >= 85 && domains.governance >= 80 && isSenior) {
    return "strategicLeader";
  }

  // Default
  return "balancedPractitioner";
}

// ─────────────────────────────────────────────────────────────────────────────
// INSIGHT GENERATION
// ─────────────────────────────────────────────────────────────────────────────

function generateInsights(domains, capability, contextRisk, profile, flags) {
  const insights  = [];
  const isLargeOrg = LARGE_ORGS.has(profile.org);
  const isSenior   = SENIOR_ROLES.has(profile.role);

  // Alignment insight: senior role, low governance
  if (isSenior && domains.governance < 50) {
    insights.push({
      type:  "alignment",
      title: "Governance gap for your seniority",
      body:  "Your role carries elevated responsibility for AI oversight. Your governance score is below 50, which means you may not be aligned with the policy, escalation, and explainability expectations that come with your position.",
    });
  }

  // Over-risk: usage significantly exceeds verification and risk awareness
  const controlAvg = (domains.verification + domains.riskAwareness) / 2;
  if (domains.usage >= 60 && controlAvg < 50) {
    insights.push({
      type:  "over_risk",
      title: "Usage is outpacing your controls",
      body:  "Your AI integration level is considerably higher than your verification and risk awareness scores. This gap creates elevated professional liability exposure and increases the risk of unchecked errors reaching clients.",
    });
  }

  // Under-utilisation: senior role with low usage
  if (isSenior && domains.usage < 40) {
    insights.push({
      type:  "under_utilisation",
      title: "AI engagement below expected for your role",
      body:  "Practitioners at your seniority are increasingly expected to understand and oversee AI-assisted work. Low usage may limit your ability to supervise junior colleagues using these tools effectively.",
    });
  }

  // Governance gap: large org, low governance score
  if (isLargeOrg && domains.governance < 50) {
    insights.push({
      type:  "governance_gap",
      title: "Governance expectations unmet for your organisation",
      body:  "Organisations of your size typically operate with formal AI policies, approved tool lists, and defined oversight controls. Your governance score suggests your practice may not be aligned with those expectations.",
    });
  }

  return insights;
}

// ─────────────────────────────────────────────────────────────────────────────
// MASTER EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export function computeScores(answers, profile) {
  // Prompting capability component (exposed for character assignment + display)
  const prompting = safeRound(sAvg(getQ(5, answers), getQ(6, answers)));

  // Four domain scores
  const domains = {
    usage:         computeUsage(answers),
    verification:  computeVerification(answers),
    riskAwareness: computeRiskAwareness(answers),
    governance:    computeGovernance(answers),
  };

  // Red flags (before penalty application)
  const flags = detectRedFlags(answers, profile);

  // Capability score with penalties applied
  const capability = computeCapabilityScore(domains, flags);

  // Section composite scores
  const sections = computeSectionScores(domains);

  // Context-adjusted risk score (capability not changed — risk interpretation only)
  const contextRisk = computeContextRisk(capability, profile);

  // Tiers and bands
  const capabilityTier = getCapabilityTier(capability);
  const riskBand       = getRiskBand(contextRisk);

  // Character archetype (priority-ordered)
  const character = assignCharacter(domains, capability, flags, profile, prompting);

  // Contextual insights
  const insights = generateInsights(domains, capability, contextRisk, profile, flags);

  return {
    domains,        // { usage, verification, riskAwareness, governance } — 0–100 each
    sections,       // { practicalAIUse, legalRiskAwareness } — 0–100 each
    capability,     // 0–100 (with red flag penalties)
    contextRisk,    // 0–100 (role × org × raw risk)
    capabilityTier, // "High Risk" | "Emerging" | "Competent" | "Advanced" | "Leader"
    riskBand,       // "Low" | "Mild" | "Moderate" | "High" | "Critical"
    flags,          // [{ id, label, penalty }]
    character,      // persona key string
    insights,       // [{ type, title, body }]
    prompting,      // 0–100 (for sidebar display)
  };
}
