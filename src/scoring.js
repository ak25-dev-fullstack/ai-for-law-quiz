/**
 * AI Competency Diagnostic — Scoring Engine v2
 * 20-question version with role-adjusted weights and experience modifiers.
 * All scores normalised to 0–100.
 */

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function safeRound(n) {
  if (n === null || n === undefined || isNaN(n)) return 0;
  return Math.round(Math.max(0, Math.min(100, n)));
}

const LIKERT_MAP = { 1: 0, 2: 25, 3: 50, 4: 75, 5: 100 };
function scoreLikert(value, reverse = false) {
  if (value === null || value === undefined) return null;
  const base = LIKERT_MAP[value] ?? 0;
  return reverse ? 100 - base : base;
}

function sAvg(...values) {
  const valid = values.filter((v) => v !== null && v !== undefined && !isNaN(v));
  if (!valid.length) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

function wAvg(components) {
  const valid = components.filter(([s]) => s !== null && s !== undefined && !isNaN(s));
  if (!valid.length) return 0;
  const totalW = valid.reduce((acc, [, w]) => acc + w, 0);
  if (totalW === 0) return 0;
  return valid.reduce((acc, [s, w]) => acc + s * (w / totalW), 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// QUESTION-LEVEL SCORING TABLES  (new Q IDs, 20-question set)
// ─────────────────────────────────────────────────────────────────────────────

const Q_SCORES = {
  // Q1 — Tool access level (Usage)
  1: {
    "I do not use AI tools":                          0,
    "I only use publicly available AI tools":         25,
    "I use a personal subscription":                  50,
    "My organisation provides general AI tools":      70,
    "My organisation provides legal-specific AI tools": 85,
    "I use both general and legal AI tools":          100,
  },

  // Q2 — Usage frequency (Usage)
  2: {
    "Never":                0,
    "Monthly":             25,
    "Weekly":              50,
    "Several times a week": 75,
    "Daily":              100,
  },

  // Q4 — Workflow stage (Usage)
  4: {
    "I do not use AI":   0,
    "Brainstorming only": 25,
    "Research stage":    50,
    "Drafting stage":    75,
    "Multiple stages":  100,
  },

  // Q6 — Citation handling (Verification) [RED FLAG if 0]
  6: {
    "I use them without checking":              0,
    "I occasionally check them":               25,
    "I verify the citation exists":            60,
    "I verify and read the source":            85,
    "I verify source, jurisdiction, and relevance": 100,
  },

  // Q7 — Legal conclusion validation (Verification) [RED FLAG if 0]
  7: {
    "I do not validate them":                          0,
    "I only check if the matter is important":        25,
    "I cross-check with primary law":                 75,
    "I cross-check with primary and secondary sources": 100,
  },

  // Q8 — Reliance on AI as primary source (Verification, pre-reversed: Always=0)
  8: {
    "Always":    0,
    "Often":    25,
    "Sometimes": 50,
    "Rarely":   75,
    "Never":   100,
  },

  // Q9 — Scenario: unread citations (Verification)
  9: {
    "Use them if they look correct":              0,
    "Check one of them":                         30,
    "Ask a colleague if they seem correct":      20,
    "Verify all citations and read relevant sections": 100,
  },

  // Q10 — Scenario: contract clause change (Verification)
  10: {
    "Accept the revision":               25,
    "Send directly to client":            0,
    "Compare to original and client intent": 100,
  },

  // Q15 — Scenario: client document on public tool (Risk) [RED FLAG if 0]
  15: {
    "Paste it fully":                    0,
    "Remove identifying details":       60,
    "Check policy and approval before use": 100,
  },

  // Q16 — Tool selection origin (Governance)
  16: {
    "I chose them myself":              25,
    "My team selected them informally": 50,
    "IT or innovation team selected them": 75,
    "Firm leadership selected them":   100,
  },

  // Q17 — AI policy existence (Governance) [RED FLAG: 0 + large org]
  17: {
    "Yes, formal policy": 100,
    "Partial guidance":    70,
    "Informal guidance":   40,
    "No policy":           10,
    "I don't know":         0,
  },

  // Q18 — Training received (Governance)
  18: {
    "Mandatory training": 100,
    "Optional training":   75,
    "Informal guidance":   40,
    "No training":          0,
  },
};

// Likert question ids → { reverse: bool }
const LIKERT_Qs = {
  5:  { reverse: false }, // prompting comfort (Usage)
  11: { reverse: false }, // hallucination awareness (Risk)
  14: { reverse: false }, // confidentiality confidence (Risk)
  19: { reverse: false }, // escalation knowledge (Governance) [RED FLAG ≤25 + senior]
  20: { reverse: false }, // approved tool awareness (Governance) [RED FLAG ≤25]
};

// Multi-select question ids
const MULTI_Qs = new Set([3, 12, 13]);

// ─────────────────────────────────────────────────────────────────────────────
// MULTI-SELECT SCORING
// ─────────────────────────────────────────────────────────────────────────────

function scoreMulti(qId, selections) {
  if (!Array.isArray(selections) || selections.length === 0) return 0;

  if (qId === 3) {
    return Math.min(100, (selections.length / 6) * 100);
  }

  if (qId === 12) {
    return Math.min(100, (selections.length / 6) * 100);
  }

  if (qId === 13) {
    if (selections.includes("None of the above")) return 100;
    let score = 100;
    if (selections.includes("Client names"))          score -= 10;
    if (selections.includes("Fact patterns"))         score -= 10;
    if (selections.includes("Contracts"))             score -= 10;
    if (selections.includes("Internal legal advice")) score -= 15;
    if (selections.includes("Personal data"))         score -= 20;
    return Math.max(0, score);
  }

  return 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// SINGLE QUESTION ACCESSOR
// ─────────────────────────────────────────────────────────────────────────────

function getQ(qId, answers) {
  const answer = answers[qId];
  if (answer === undefined || answer === null) return null;
  if (LIKERT_Qs[qId] !== undefined) return scoreLikert(answer, LIKERT_Qs[qId].reverse);
  if (MULTI_Qs.has(qId)) return scoreMulti(qId, answer);
  if (Q_SCORES[qId]) {
    const text = answer?.text ?? answer;
    const s = Q_SCORES[qId][text];
    return s !== undefined ? s : null;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// DOMAIN FORMULAS  (20-question IDs)
// ─────────────────────────────────────────────────────────────────────────────

function computeUsage(answers) {
  return safeRound(wAvg([
    [getQ(1, answers), 0.30], // tool access level
    [getQ(2, answers), 0.30], // usage frequency
    [getQ(3, answers), 0.20], // task breadth (multi)
    [getQ(4, answers), 0.15], // workflow stage
    [getQ(5, answers), 0.05], // prompting comfort
  ]));
}

function computeVerification(answers) {
  return safeRound(wAvg([
    [getQ(6, answers),  0.35], // citation handling
    [getQ(7, answers),  0.30], // legal validation
    [getQ(8, answers),  0.10], // reliance (pre-reversed)
    [getQ(9, answers),  0.15], // scenario: unread citations
    [getQ(10, answers), 0.10], // scenario: contract revision
  ]));
}

function computeRiskAwareness(answers) {
  return safeRound(wAvg([
    [getQ(11, answers), 0.25], // hallucination awareness
    [getQ(12, answers), 0.25], // risk identification (multi)
    [getQ(13, answers), 0.25], // data sensitivity (multi, penalty model)
    [getQ(14, answers), 0.15], // confidentiality confidence
    [getQ(15, answers), 0.10], // scenario: safe prompting
  ]));
}

function computeGovernance(answers) {
  return safeRound(wAvg([
    [getQ(16, answers), 0.20], // tool selection origin
    [getQ(17, answers), 0.25], // policy existence
    [getQ(18, answers), 0.20], // training received
    [getQ(19, answers), 0.20], // escalation knowledge
    [getQ(20, answers), 0.15], // approved tool awareness
  ]));
}

// ─────────────────────────────────────────────────────────────────────────────
// ROLE-ADJUSTED DOMAIN WEIGHTS
// ─────────────────────────────────────────────────────────────────────────────

export const ROLE_WEIGHTS = {
  "Junior lawyer / paralegal": { usage: 0.30, verification: 0.30, riskAwareness: 0.25, governance: 0.15 },
  "Associate":                 { usage: 0.25, verification: 0.30, riskAwareness: 0.25, governance: 0.20 },
  "Senior lawyer":             { usage: 0.20, verification: 0.30, riskAwareness: 0.25, governance: 0.25 },
  "Partner":                   { usage: 0.15, verification: 0.25, riskAwareness: 0.25, governance: 0.35 },
  "In-house counsel":          { usage: 0.20, verification: 0.30, riskAwareness: 0.30, governance: 0.20 },
  "Other legal professional":  { usage: 0.25, verification: 0.30, riskAwareness: 0.25, governance: 0.20 },
};

const DEFAULT_WEIGHTS = { usage: 0.25, verification: 0.30, riskAwareness: 0.25, governance: 0.20 };

function getDomainWeights(role) {
  return ROLE_WEIGHTS[role] ?? DEFAULT_WEIGHTS;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPERIENCE MODIFIER  (scales behavioural red flag penalties)
// ─────────────────────────────────────────────────────────────────────────────

const EXPERIENCE_MODIFIERS = {
  "Beginner":     0.60,
  "Intermediate": 0.80,
  "Advanced":     1.00,
};

function getExpMod(experience) {
  return EXPERIENCE_MODIFIERS[experience] ?? 1.00;
}

// ─────────────────────────────────────────────────────────────────────────────
// RED FLAG DETECTION
// ─────────────────────────────────────────────────────────────────────────────

const SENIOR_ROLES = new Set(["Senior lawyer", "Partner", "In-house counsel"]);
const LARGE_ORGS   = new Set(["Large firm", "In-house legal team"]);

function detectRedFlags(answers, profile) {
  const flags  = [];
  const expMod = getExpMod(profile.experience);

  // 1. Uses AI citations without checking (Q6 = 0) — behavioural, scales with experience
  const q6 = getQ(6, answers);
  if (q6 !== null && q6 === 0) {
    flags.push({ id: "unchecked_citations", label: "Uses AI-generated citations without checking", penalty: Math.round(20 * expMod) });
  }

  // 2. Inputs sensitive/privileged data into AI (Q13) — behavioural, scales with experience
  const q13 = answers[13];
  if (Array.isArray(q13)) {
    const sensitiveItems = ["Internal legal advice", "Personal data"];
    if (sensitiveItems.some((s) => q13.includes(s))) {
      flags.push({ id: "confidential_data", label: "Inputs sensitive or privileged data into AI tools", penalty: Math.round(20 * expMod) });
    }
  }

  // 3. No validation of AI legal reasoning (Q7 = 0) — behavioural, scales with experience
  const q7 = getQ(7, answers);
  if (q7 !== null && q7 === 0) {
    flags.push({ id: "no_validation", label: "Uses AI for legal reasoning without validation", penalty: Math.round(15 * expMod) });
  }

  // 4. Unaware of approved tools (Q20 ≤ 25) — behavioural, scales with experience
  const q20 = getQ(20, answers);
  if (q20 !== null && q20 <= 25) {
    flags.push({ id: "unknown_approval", label: "Unaware of which AI tools are approved", penalty: Math.round(10 * expMod) });
  }

  // 5. No policy awareness in a large org (Q17 = 0 + large org) — structural, fixed penalty
  const q17 = getQ(17, answers);
  if (q17 !== null && q17 === 0 && LARGE_ORGS.has(profile.org)) {
    flags.push({ id: "no_policy_large_org", label: "No AI policy awareness in a large organisation", penalty: 10 });
  }

  // 6. Senior role with no escalation awareness (Q19 ≤ 25 + senior role) — structural, fixed penalty
  const q19 = getQ(19, answers);
  if (q19 !== null && q19 <= 25 && SENIOR_ROLES.has(profile.role)) {
    flags.push({ id: "senior_no_escalation", label: "Senior practitioner with no escalation awareness", penalty: 10 });
  }

  return flags;
}

// ─────────────────────────────────────────────────────────────────────────────
// AGGREGATE SCORES
// ─────────────────────────────────────────────────────────────────────────────

function computeCapabilityScore(domains, flags, role) {
  const w = getDomainWeights(role);
  const base =
    domains.usage         * w.usage +
    domains.verification  * w.verification +
    domains.riskAwareness * w.riskAwareness +
    domains.governance    * w.governance;
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

function computeContextRisk(capabilityScore, domains, profile) {
  const roleMult = ROLE_MULTIPLIERS[profile.role] ?? 1.00;
  const orgMult  = ORG_MULTIPLIERS[profile.org]  ?? 1.00;
  let risk = (100 - capabilityScore) * roleMult * orgMult;

  // Domain-specific amplifiers
  const isSeniorOrPartner = ["Senior lawyer", "Partner"].includes(profile.role);
  if (isSeniorOrPartner && domains.governance < 50) risk += 8;
  if (profile.role === "In-house counsel" && domains.riskAwareness < 50) risk += 8;
  if (domains.verification < 40) risk += 6;

  return safeRound(risk);
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
// CHARACTER ASSIGNMENT  (Priority 1→10; first match wins)
// ─────────────────────────────────────────────────────────────────────────────

function assignCharacter(domains, capability, flags, profile, prompting) {
  const totalPenalty = flags.reduce((a, f) => a + f.penalty, 0);
  const isSenior     = SENIOR_ROLES.has(profile.role);

  if ((domains.usage >= 60 && domains.verification < 45) || totalPenalty >= 20) return "overReliantOperator";
  if (domains.governance < 40 && domains.usage >= 50) return "shadowUser";
  if (domains.usage >= 70 && domains.verification >= 40 && domains.verification <= 60) return "efficiencyChaser";
  if (domains.usage < 35 && domains.verification >= 55) return "aiAvoider";
  if (domains.usage < 25 && domains.riskAwareness >= 70) return "traditionalist";
  if (domains.usage >= 25 && domains.usage <= 45 && prompting < 50) return "hesitantAdopter";
  if (domains.verification >= 75 && domains.usage < 55) return "cautiousChecker";
  const allBalanced = Object.values(domains).every((v) => v >= 50 && v <= 75);
  if (allBalanced && totalPenalty < 20) return "balancedPractitioner";
  if (domains.usage >= 75 && domains.verification >= 70 && domains.riskAwareness >= 65) return "aiPowerUser";
  if (capability >= 85 && domains.governance >= 80 && isSenior) return "strategicLeader";
  return "balancedPractitioner";
}

// ─────────────────────────────────────────────────────────────────────────────
// INSIGHT GENERATION
// ─────────────────────────────────────────────────────────────────────────────

function generateInsights(domains, capability, contextRisk, profile, flags) {
  const insights   = [];
  const isLargeOrg = LARGE_ORGS.has(profile.org);
  const isSenior   = SENIOR_ROLES.has(profile.role);

  if (isSenior && domains.governance < 50) {
    insights.push({
      type:  "alignment",
      title: "Governance gap for your seniority",
      body:  "Your role carries elevated responsibility for AI oversight. Your governance score is below 50, which means you may not be aligned with the policy, escalation, and explainability expectations that come with your position.",
    });
  }

  const controlAvg = (domains.verification + domains.riskAwareness) / 2;
  if (domains.usage >= 60 && controlAvg < 50) {
    insights.push({
      type:  "over_risk",
      title: "Usage is outpacing your controls",
      body:  "Your AI integration level is considerably higher than your verification and risk awareness scores. This gap creates elevated professional liability exposure and increases the risk of unchecked errors reaching clients.",
    });
  }

  if (isSenior && domains.usage < 40) {
    insights.push({
      type:  "under_utilisation",
      title: "AI engagement below expected for your role",
      body:  "Practitioners at your seniority are increasingly expected to understand and oversee AI-assisted work. Low usage may limit your ability to supervise junior colleagues using these tools effectively.",
    });
  }

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
  const prompting = safeRound(getQ(5, answers) ?? 0);

  const domains = {
    usage:         computeUsage(answers),
    verification:  computeVerification(answers),
    riskAwareness: computeRiskAwareness(answers),
    governance:    computeGovernance(answers),
  };

  const flags         = detectRedFlags(answers, profile);
  const capability    = computeCapabilityScore(domains, flags, profile.role);
  const sections      = computeSectionScores(domains);
  const contextRisk   = computeContextRisk(capability, domains, profile);
  const capabilityTier = getCapabilityTier(capability);
  const riskBand      = getRiskBand(contextRisk);
  const character     = assignCharacter(domains, capability, flags, profile, prompting);
  const insights      = generateInsights(domains, capability, contextRisk, profile, flags);
  const domainWeights = getDomainWeights(profile.role);

  return {
    domains,        // { usage, verification, riskAwareness, governance } — 0–100 each
    sections,       // { practicalAIUse, legalRiskAwareness } — 0–100 each
    capability,     // 0–100 (with red flag penalties)
    contextRisk,    // 0–100 (role × org × raw risk + amplifiers)
    capabilityTier, // "High Risk" | "Emerging" | "Competent" | "Advanced" | "Leader"
    riskBand,       // "Low" | "Mild" | "Moderate" | "High" | "Critical"
    flags,          // [{ id, label, penalty }]
    character,      // persona key string
    insights,       // [{ type, title, body }]
    prompting,      // 0–100 (for character assignment display)
    domainWeights,  // { usage, verification, riskAwareness, governance } — role-adjusted fractions
  };
}
