import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Briefcase, Scale, ShieldAlert, Brain,
  ArrowRight, RotateCcw, CheckCircle2,
  Check, AlertTriangle, Lightbulb, BookOpen, ExternalLink, ArrowLeft, Newspaper,
  BarChart2, Maximize2,
} from "lucide-react";
import { computeScores } from "./scoring";

// ─────────────────────────────────────────────────────────────────────────────
// CHARACTER ARCHETYPES (10)
// ─────────────────────────────────────────────────────────────────────────────

const personas = {
  overReliantOperator: {
    code: "OR",
    name: "Over-Reliant Operator",
    subtitle: "Fast, but dangerously trusting",
    summary:
      "You integrate AI actively into your workflow but your verification discipline has not kept pace. Your efficiency is strong, but professional and liability risks are elevated. Outputs may be reaching clients or decisions without adequate checking.",
    strengths: [
      "High AI fluency and productivity",
      "Comfortable integrating tools into complex workflows",
      "Proactive experimentation with new capabilities",
    ],
    weaknesses: [
      "Insufficient verification of legal outputs",
      "Elevated risk of confidentiality or privilege exposure",
      "May overlook hallucinations, jurisdictional errors, or outdated law",
    ],
    nextSteps: [
      "Implement a mandatory verification checklist for all AI-generated legal content before use.",
      "Add a red-team step to every AI task: what could be wrong, invented, or out-of-jurisdiction?",
      "Treat AI as a first-draft assistant only — never as a final authority on legal questions.",
    ],
  },

  shadowUser: {
    code: "SU",
    name: "Shadow User",
    subtitle: "Operates outside approved systems",
    summary:
      "You are actively using AI tools, but your governance awareness is low. You may be working outside your organisation's approved frameworks — using unapproved tools, without policy guidance, or without disclosure. This creates organisational, regulatory, and professional conduct risk.",
    strengths: [
      "Motivated and self-directed AI adopter",
      "Capable of independent workflow development",
      "Comfortable with technology and new tools",
    ],
    weaknesses: [
      "Low alignment with organisational AI policy",
      "Risk of regulatory or professional conduct breach",
      "May expose the organisation to liability without knowing it",
    ],
    nextSteps: [
      "Find out which AI tools are approved in your organisation before using any others.",
      "Read your organisation's AI policy — or ask whether one exists.",
      "Disclose your AI use to your supervisor and seek guidance on approved workflows.",
    ],
  },

  efficiencyChaser: {
    code: "EC",
    name: "Efficiency Chaser",
    subtitle: "Speed over certainty",
    summary:
      "You use AI extensively and drive strong efficiency gains, but your verification habits are only partial. You verify sometimes but not consistently. This creates variable quality — strong on speed, but with gaps that could matter in high-stakes matters.",
    strengths: [
      "Strong productivity through AI integration",
      "Comfortable with a wide range of AI use cases",
      "Understands the efficiency potential of AI in legal work",
    ],
    weaknesses: [
      "Inconsistent verification — strong on some tasks, weak on others",
      "Risk of missed errors on matters where speed was prioritised",
      "Verification habits not yet systematic or reliable",
    ],
    nextSteps: [
      "Create a consistent verification protocol and apply it regardless of time pressure.",
      "Identify which task types carry the highest legal risk and apply stricter checking there.",
      "Track where AI has produced errors in your work and use those cases to calibrate your checking.",
    ],
  },

  aiAvoider: {
    code: "AA",
    name: "AI Avoider",
    subtitle: "Safe but falling behind",
    summary:
      "You approach AI with significant caution, preferring traditional methods. Your verification instincts are sound — the problem is you rarely have the chance to apply them. You may be missing meaningful efficiency gains and risk falling behind peers who are using AI responsibly.",
    strengths: [
      "Strong professional caution and risk instinct",
      "Less likely to over-trust AI outputs",
      "High baseline verification discipline",
    ],
    weaknesses: [
      "Missed efficiency gains on research, drafting, and summarisation tasks",
      "Increasing gap with peers who are building AI competency",
      "Avoidance rather than informed and controlled engagement",
    ],
    nextSteps: [
      "Start with one low-risk use case — for example, summarising publicly available documents.",
      "Learn a structured prompt format: task, context, format, and limits.",
      "Verify every output manually at first to build confidence without adding risk.",
    ],
  },

  traditionalist: {
    code: "TR",
    name: "Traditionalist",
    subtitle: "Prefers established methods",
    summary:
      "You have very limited AI use but a strong awareness of why the risks exist. You understand the limitations, biases, and legal risks of AI — you are choosing established methods deliberately. The challenge is that as AI adoption accelerates, selective and controlled engagement may become a professional expectation.",
    strengths: [
      "Deep awareness of AI risk and limitation",
      "Strong preference for reliable, established legal method",
      "Unlikely to make reckless or uninformed AI decisions",
    ],
    weaknesses: [
      "Very low engagement with tools that peers are actively integrating",
      "Risk of being unable to supervise or review AI-assisted work by others",
      "Knowledge of risk not yet matched by any controlled usage experience",
    ],
    nextSteps: [
      "Apply your risk awareness to build a controlled, limited AI workflow — awareness alone is not enough.",
      "Start with one approved tool for a task where you already have strong domain expertise.",
      "Use your knowledge of risk to build verification checklists for your team.",
    ],
  },

  hesitantAdopter: {
    code: "HA",
    name: "Hesitant Adopter",
    subtitle: "Interested but unsure",
    summary:
      "You are beginning to engage with AI but your prompting capability is still limited. You know AI exists and are open to it, but you are not yet confident in how to use it effectively or safely. You are in the learning phase — the key is building structured skills rather than experimenting without guidance.",
    strengths: [
      "Open and willing to adopt AI tools",
      "Early enough in the process to build good habits from the start",
      "Not yet reliant on AI in ways that create unmanaged risk",
    ],
    weaknesses: [
      "Limited prompting ability limits output quality",
      "May not know how to structure tasks or constrain AI behaviour",
      "Risk of developing ad hoc habits that become harder to correct later",
    ],
    nextSteps: [
      "Learn a structured prompt format: role, task, context, format, and constraints.",
      "Practise with low-stakes tasks — summarising articles or drafting internal notes.",
      "Find a colleague or resource to review your prompts and outputs while you build confidence.",
    ],
  },

  cautiousChecker: {
    code: "CC",
    name: "Cautious Checker",
    subtitle: "Safe but under-optimised",
    summary:
      "Your verification habits are excellent — you check citations, validate conclusions, and approach AI outputs with healthy scepticism. But your AI usage is limited. You have the discipline to scale up safely; you are just not yet doing so. This means you are not fully realising the efficiency benefits available to you.",
    strengths: [
      "Rigorous and reliable output verification",
      "Strong professional judgement and legal risk awareness",
      "Excellent foundation for safe, responsible AI expansion",
    ],
    weaknesses: [
      "Underutilising tools that could save significant time",
      "Verification skills not yet matched by usage volume or breadth",
      "Risk of peers outpacing your productivity without sacrificing your standards",
    ],
    nextSteps: [
      "Expand your AI use into tasks where you already verify well — research and summarisation first.",
      "Build reusable prompt templates for your most common legal task types.",
      "Share your verification checklists with colleagues — your habits are worth spreading.",
    ],
  },

  balancedPractitioner: {
    code: "BP",
    name: "Balanced Practitioner",
    subtitle: "Reliable and proportionate",
    summary:
      "You demonstrate consistent capability across all four domains. You use AI regularly, verify outputs adequately, understand the key risks, and have reasonable governance awareness. You are a reliable and proportionate AI user — the baseline standard for responsible practice.",
    strengths: [
      "Consistent across usage, verification, risk, and governance",
      "No major blind spots or elevated risk areas",
      "Reliable and professional approach to AI-assisted work",
    ],
    weaknesses: [
      "May not yet have the depth to lead or influence AI strategy",
      "Room to develop more advanced prompting and verification techniques",
    ],
    nextSteps: [
      "Develop more advanced prompting techniques for complex legal tasks.",
      "Contribute to internal AI guidance or policy development in your team.",
      "Track regulatory and professional conduct updates on AI use in law.",
    ],
  },

  aiPowerUser: {
    code: "PU",
    name: "AI Power User",
    subtitle: "High performance with control",
    summary:
      "You combine advanced AI use with strong verification discipline and solid risk awareness. You are among the most capable and responsible AI practitioners in the legal sector. Your profile shows that high productivity and high rigour are not mutually exclusive.",
    strengths: [
      "High usage sophistication and workflow integration",
      "Strong and consistent verification discipline",
      "Proactive risk identification and confidentiality awareness",
    ],
    weaknesses: [
      "Governance alignment may not yet reflect the leadership responsibility your capability implies",
      "Could influence your firm's AI culture and standards more actively",
    ],
    nextSteps: [
      "Contribute to your organisation's AI policy, governance frameworks, or approved tool evaluation.",
      "Mentor colleagues and share your prompting and verification approaches formally.",
      "Stay ahead of AI regulation, professional conduct rules, and jurisdictional developments.",
    ],
  },

  strategicLeader: {
    code: "SL",
    name: "Strategic Leader",
    subtitle: "Sets the standard",
    summary:
      "You combine exceptional capability with strong governance awareness and the seniority to act on it. You are exceptionally well placed to drive responsible, structured AI adoption across your organisation. Your profile is rare — and your influence matters.",
    strengths: [
      "Outstanding capability across all four domains",
      "Strong policy, governance, and escalation awareness",
      "Seniority combined with competence — a credible AI champion",
    ],
    weaknesses: [
      "Risk of becoming too focused on governance at the expense of operational currency",
    ],
    nextSteps: [
      "Lead or sponsor AI governance initiatives and help formalise your organisation's AI policy.",
      "Represent your organisation in professional body consultations and regulatory engagement.",
      "Invest in mentoring AI Power Users and Balanced Practitioners to raise the firm-wide standard.",
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE OPTIONS
// ─────────────────────────────────────────────────────────────────────────────

const roleOptions = [
  "Junior lawyer / paralegal",
  "Associate",
  "Senior lawyer",
  "Partner",
  "In-house counsel",
  "Other legal professional",
];

const orgOptions = [
  "Solo practice",
  "Small firm",
  "Mid-sized firm",
  "Large firm",
  "In-house legal team",
  "Public institution",
];

// ─────────────────────────────────────────────────────────────────────────────
// DOMAIN METADATA (for UI labels / icons only)
// ─────────────────────────────────────────────────────────────────────────────

const domainMeta = {
  usage:         { label: "Usage Sophistication",    icon: Briefcase   },
  verification:  { label: "Verification Discipline", icon: Brain       },
  riskAwareness: { label: "Legal Risk Awareness",    icon: ShieldAlert },
  governance:    { label: "Governance Alignment",    icon: Scale       },
};

// ─────────────────────────────────────────────────────────────────────────────
// TIER / BAND / INSIGHT STYLES
// ─────────────────────────────────────────────────────────────────────────────

const TIER_STYLES = {
  "High Risk": "border-red-500/40 bg-red-500/10 text-red-400",
  "Emerging":  "border-orange-500/40 bg-orange-500/10 text-orange-400",
  "Competent": "border-yellow-500/40 bg-yellow-500/10 text-yellow-400",
  "Advanced":  "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
  "Leader":    "border-violet-500/40 bg-violet-500/10 text-violet-400",
};

const BAND_STYLES = {
  "Low":      "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
  "Mild":     "border-yellow-500/40 bg-yellow-500/10 text-yellow-400",
  "Moderate": "border-amber-500/40 bg-amber-500/10 text-amber-400",
  "High":     "border-red-500/40 bg-red-500/10 text-red-400",
  "Critical": "border-red-700/40 bg-red-700/10 text-red-500",
};

const INSIGHT_STYLES = {
  alignment:         { border: "border-blue-500/20",   bg: "bg-blue-500/5",   dot: "bg-blue-400"   },
  over_risk:         { border: "border-red-500/20",    bg: "bg-red-500/5",    dot: "bg-red-400"    },
  under_utilisation: { border: "border-amber-500/20",  bg: "bg-amber-500/5",  dot: "bg-amber-400"  },
  governance_gap:    { border: "border-purple-500/20", bg: "bg-purple-500/5", dot: "bg-purple-400" },
};

// ─────────────────────────────────────────────────────────────────────────────
// QUESTION BANK (40 questions)
// ─────────────────────────────────────────────────────────────────────────────

const questions = [
  // ══ SECTION: Practical AI Use ══════════════════════════════════════════════
  {
    id: 1, section: "Practical AI Use", domain: "Usage Sophistication", icon: Briefcase,
    title: "Which best describes your access to AI tools for legal work?",
    type: "single",
    options: [
      { text: "I do not use AI tools" },
      { text: "I only use publicly available AI tools" },
      { text: "I use a personal subscription" },
      { text: "My organisation provides general AI tools" },
      { text: "My organisation provides legal-specific AI tools" },
      { text: "I use both general and legal AI tools" },
    ],
  },
  {
    id: 2, section: "Practical AI Use", domain: "Usage Sophistication", icon: Briefcase,
    title: "How often do you use AI in your legal work?",
    type: "single",
    options: [
      { text: "Never" }, { text: "Monthly" }, { text: "Weekly" },
      { text: "Several times a week" }, { text: "Daily" },
    ],
  },
  {
    id: 3, section: "Practical AI Use", domain: "Usage Sophistication", icon: Briefcase,
    title: "Which tasks do you use AI for?",
    subtitle: "Select all that apply.",
    type: "multi",
    options: [
      { text: "Legal research" }, { text: "Document summarisation" }, { text: "Drafting documents" },
      { text: "Contract review" }, { text: "Due diligence" }, { text: "Administrative tasks" },
    ],
  },
  {
    id: 4, section: "Practical AI Use", domain: "Usage Sophistication", icon: Briefcase,
    title: "At what stage in your workflow do you use AI?",
    type: "single",
    options: [
      { text: "I do not use AI" }, { text: "Brainstorming only" }, { text: "Research stage" },
      { text: "Drafting stage" }, { text: "Multiple stages" },
    ],
  },
  {
    id: 5, section: "Practical AI Use", domain: "Usage Sophistication", icon: Briefcase,
    title: "How comfortable are you improving AI outputs through prompting?",
    type: "likert",
    likertLabels: ["Not at all comfortable", "Very comfortable"],
  },
  {
    id: 6, section: "Practical AI Use", domain: "Usage Sophistication", icon: Briefcase,
    title: "What level of output do you expect from AI?",
    type: "single",
    options: [
      { text: "Brainstorming only" }, { text: "Rough outline" },
      { text: "Draft requiring edits" }, { text: "Near-final draft" },
    ],
  },
  {
    id: 7, section: "Practical AI Use", domain: "Usage Sophistication", icon: Briefcase,
    title: "How often do you use AI to save time on repetitive tasks?",
    type: "likert",
    likertLabels: ["Never", "Very frequently"],
  },
  {
    id: 8, section: "Practical AI Use", domain: "Usage Sophistication", icon: Briefcase,
    title: "Compared to 6 months ago, your AI usage is:",
    type: "single",
    options: [
      { text: "Much lower" }, { text: "Slightly lower" }, { text: "About the same" },
      { text: "Slightly higher" }, { text: "Much higher" },
    ],
  },
  {
    id: 9, section: "Practical AI Use", domain: "Governance Alignment", icon: Scale,
    title: "Who primarily selected the AI tools you use?",
    type: "single",
    options: [
      { text: "I chose them myself" }, { text: "My team selected them informally" },
      { text: "IT or innovation team selected them" }, { text: "Firm leadership selected them" },
    ],
  },
  {
    id: 10, section: "Practical AI Use", domain: "Usage Sophistication", icon: Briefcase,
    title: "Which type of AI tool do you use most?",
    type: "single",
    options: [{ text: "General-purpose AI" }, { text: "Legal-specific AI" }, { text: "Both equally" }],
  },

  // ══ SECTION: Verification Discipline ═══════════════════════════════════════
  {
    id: 11, section: "Verification Discipline", domain: "Verification Discipline", icon: Brain,
    title: "How do you handle AI-generated citations?",
    type: "single",
    options: [
      { text: "I use them without checking" }, { text: "I occasionally check them" },
      { text: "I verify the citation exists" }, { text: "I verify and read the source" },
      { text: "I verify source, jurisdiction, and relevance" },
    ],
  },
  {
    id: 12, section: "Verification Discipline", domain: "Verification Discipline", icon: Brain,
    title: "How do you validate AI-generated legal conclusions?",
    type: "single",
    options: [
      { text: "I do not validate them" }, { text: "I only check if the matter is important" },
      { text: "I cross-check with primary law" },
      { text: "I cross-check with primary and secondary sources" },
    ],
  },
  {
    id: 13, section: "Verification Discipline", domain: "Verification Discipline", icon: Brain,
    title: "How likely are you to trust AI outputs before checking them?",
    type: "likert",
    likertLabels: ["Never trust without checking", "Always trust immediately"],
    reverse: true,
  },
  {
    id: 14, section: "Verification Discipline", domain: "Verification Discipline", icon: Brain,
    title: "How often do you verify the sources behind AI outputs?",
    type: "likert",
    likertLabels: ["Never", "Always"],
  },
  {
    id: 15, section: "Verification Discipline", domain: "Verification Discipline", icon: Brain,
    title: "How often do you check jurisdictional accuracy in AI outputs?",
    type: "likert",
    likertLabels: ["Never", "Always"],
  },
  {
    id: 16, section: "Verification Discipline", domain: "Verification Discipline", icon: Brain,
    title: "How confident are you in recognising misleading or overconfident AI outputs?",
    type: "likert",
    likertLabels: ["Not at all confident", "Very confident"],
  },
  {
    id: 17, section: "Verification Discipline", domain: "Verification Discipline", icon: Brain,
    title: "How often do you rely on AI as a primary answer source?",
    type: "single",
    options: [
      { text: "Always" }, { text: "Often" }, { text: "Sometimes" },
      { text: "Rarely" }, { text: "Never" },
    ],
  },
  {
    id: 18, section: "Verification Discipline", domain: "Verification Discipline", icon: Brain,
    title: "Scenario: AI provides case citations you have not read. What do you do?",
    type: "single",
    options: [
      { text: "Use them if they look correct" }, { text: "Check one of them" },
      { text: "Verify all citations and read relevant sections" },
      { text: "Ask a colleague if they seem correct" },
    ],
  },
  {
    id: 19, section: "Verification Discipline", domain: "Verification Discipline", icon: Brain,
    title: "Scenario: AI gives a correct-looking answer but from the wrong jurisdiction. What do you do?",
    type: "single",
    options: [
      { text: "Accept the answer" }, { text: "Check jurisdiction and adjust" },
      { text: "Re-run query specifying jurisdiction" },
    ],
  },
  {
    id: 20, section: "Verification Discipline", domain: "Verification Discipline", icon: Brain,
    title: "Scenario: AI revises a contract clause and subtly changes risk allocation. What do you do?",
    type: "single",
    options: [
      { text: "Accept the revision" }, { text: "Compare to original and client intent" },
      { text: "Send directly to client" },
    ],
  },

  // ══ SECTION: Legal Risk Awareness ══════════════════════════════════════════
  {
    id: 21, section: "Legal Risk Awareness", domain: "Legal Risk Awareness", icon: ShieldAlert,
    title: "How aware are you that AI can generate incorrect but convincing legal outputs?",
    type: "likert",
    likertLabels: ["Not at all aware", "Very aware"],
  },
  {
    id: 22, section: "Legal Risk Awareness", domain: "Legal Risk Awareness", icon: ShieldAlert,
    title: "Which risks do you associate with AI?",
    subtitle: "Select all that apply.",
    type: "multi",
    options: [
      { text: "Fabricated citations" }, { text: "Wrong jurisdiction" }, { text: "Outdated law" },
      { text: "Confidentiality breaches" }, { text: "Privilege issues" }, { text: "Bias" },
    ],
  },
  {
    id: 23, section: "Legal Risk Awareness", domain: "Legal Risk Awareness", icon: ShieldAlert,
    title: "What types of data have you entered into AI tools?",
    subtitle: "Select all that apply.",
    type: "multi",
    options: [
      { text: "Client names" }, { text: "Fact patterns" }, { text: "Contracts" },
      { text: "Internal legal advice" }, { text: "Personal data" }, { text: "None of the above" },
    ],
  },
  {
    id: 24, section: "Legal Risk Awareness", domain: "Legal Risk Awareness", icon: ShieldAlert,
    title: "How confident are you in distinguishing safe vs unsafe prompting?",
    type: "likert",
    likertLabels: ["Not at all confident", "Very confident"],
  },
  {
    id: 25, section: "Legal Risk Awareness", domain: "Legal Risk Awareness", icon: ShieldAlert,
    title: "How aware are you that legal AI tools do not eliminate hallucination risk?",
    type: "likert",
    likertLabels: ["Not at all aware", "Very aware"],
  },
  {
    id: 26, section: "Legal Risk Awareness", domain: "Legal Risk Awareness", icon: ShieldAlert,
    title: "How confident are you in identifying confidentiality risks when using AI?",
    type: "likert",
    likertLabels: ["Not at all confident", "Very confident"],
  },
  {
    id: 27, section: "Legal Risk Awareness", domain: "Governance Alignment", icon: Scale,
    title: "How prepared are you to explain AI-related risks to a client?",
    type: "likert",
    likertLabels: ["Not at all prepared", "Very prepared"],
  },
  {
    id: 28, section: "Legal Risk Awareness", domain: "Legal Risk Awareness", icon: ShieldAlert,
    title: "Scenario: You need to summarise a client document using a public AI tool. What do you do?",
    type: "single",
    options: [
      { text: "Paste it fully" }, { text: "Remove identifying details" },
      { text: "Check policy and approval before use" },
    ],
  },
  {
    id: 29, section: "Legal Risk Awareness", domain: "Verification Discipline", icon: Brain,
    title: "Scenario: AI gives a confident but incorrect answer. What is your response?",
    type: "single",
    options: [
      { text: "Accept it" }, { text: "Double-check sources" }, { text: "Re-run and validate externally" },
    ],
  },
  {
    id: 30, section: "Legal Risk Awareness", domain: "Legal Risk Awareness", icon: ShieldAlert,
    title: "How aware are you of bias risks in AI outputs?",
    type: "likert",
    likertLabels: ["Not at all aware", "Very aware"],
  },

  // ══ SECTION: Governance Alignment ══════════════════════════════════════════
  {
    id: 31, section: "Governance Alignment", domain: "Governance Alignment", icon: Scale,
    title: "Does your organisation have an AI policy?",
    type: "single",
    options: [
      { text: "Yes, formal policy" }, { text: "Partial guidance" }, { text: "Informal guidance" },
      { text: "No policy" }, { text: "I don't know" },
    ],
  },
  {
    id: 32, section: "Governance Alignment", domain: "Governance Alignment", icon: Scale,
    title: "Have you received training on AI use?",
    type: "single",
    options: [
      { text: "Mandatory training" }, { text: "Optional training" },
      { text: "Informal guidance" }, { text: "No training" },
    ],
  },
  {
    id: 33, section: "Governance Alignment", domain: "Governance Alignment", icon: Scale,
    title: "Do you know how to escalate AI-related risks in your organisation?",
    type: "likert",
    likertLabels: ["Not at all", "Completely clear"],
  },
  {
    id: 34, section: "Governance Alignment", domain: "Governance Alignment", icon: Scale,
    title: "How often do you use only approved AI tools?",
    type: "likert",
    likertLabels: ["Never", "Always"],
  },
  {
    id: 35, section: "Governance Alignment", domain: "Governance Alignment", icon: Scale,
    title: "How aware are you of which AI tools are approved by your organisation?",
    type: "likert",
    likertLabels: ["Not at all aware", "Fully aware"],
  },
  {
    id: 36, section: "Governance Alignment", domain: "Governance Alignment", icon: Scale,
    title: "What controls are expected when using AI in your organisation?",
    subtitle: "Select all that apply.",
    type: "multi",
    options: [
      { text: "Verify outputs" }, { text: "Human review" },
      { text: "Disclosure to supervisor" }, { text: "Logging / audit trail" },
    ],
  },
  {
    id: 37, section: "Governance Alignment", domain: "Governance Alignment", icon: Scale,
    title: "How confident are you explaining how AI was used in your work?",
    type: "likert",
    likertLabels: ["Not at all confident", "Very confident"],
  },
  {
    id: 38, section: "Governance Alignment", domain: "Governance Alignment", icon: Scale,
    title: "How aware are you of when AI use should be disclosed to clients?",
    type: "likert",
    likertLabels: ["Not at all aware", "Very aware"],
  },
  {
    id: 39, section: "Governance Alignment", domain: "Governance Alignment", icon: Scale,
    title: "How clear are expectations in your team around AI use?",
    type: "likert",
    likertLabels: ["Not at all clear", "Very clear"],
  },
  {
    id: 40, section: "Governance Alignment", domain: "Governance Alignment", icon: Scale,
    title: "How confident are you that your AI use complies with organisational expectations?",
    type: "likert",
    likertLabels: ["Not at all confident", "Very confident"],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SHARED COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function ScoreBar({ label, value }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-44 shrink-0 text-xs font-medium text-zinc-400">{label}</span>
      <div className="flex-1 overflow-hidden rounded-full bg-zinc-800 h-1.5">
        <div
          className="h-full bg-violet-500 transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      <span className="w-8 shrink-0 text-right text-xs tabular-nums text-zinc-500">
        {Math.round(value)}
      </span>
    </div>
  );
}

function TierBadge({ label, styleClass }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styleClass}`}>
      {label}
    </span>
  );
}

function Pill({ children }) {
  return (
    <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white/90">
      {children}
    </span>
  );
}

const selectCls =
  "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 h-10 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition cursor-pointer";

// ─────────────────────────────────────────────────────────────────────────────
// NEWS OVERLAY COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const NEWS_TABS = ["LegalTech News", "Regulations", "Conferences"];

const NEWS_CONTENT = {
  "LegalTech News": [
    { date: "Mar 2026", tag: "Funding",    title: "Harvey AI raises $300M Series D at $3B valuation", body: "The legal-specific AI firm secured a landmark round led by Sequoia, expanding into IP, tax, and cross-border M&A practice areas across the UK and EU." },
    { date: "Feb 2026", tag: "Adoption",   title: "Allen & Overy expands Harvey AI rollout to all UK associates", body: "Following a successful pilot with senior associates, A&O has mandated Harvey across its London offices for drafting and due diligence support." },
    { date: "Feb 2026", tag: "Product",    title: "Microsoft Copilot for Legal launches UK beta with Thomson Reuters", body: "The integration connects Copilot directly to Westlaw UK, enabling in-document legal research without leaving Word or Outlook." },
    { date: "Jan 2026", tag: "Risk",       title: "Law Society warns AI hallucinations contributing to client harm", body: "A new briefing paper documents 14 reported cases where solicitors relied on AI-generated legal analysis without verification, resulting in negligence claims." },
    { date: "Dec 2025", tag: "Research",   title: "Clio Legal Trends: UK AI adoption up 40% year-on-year", body: "The annual report shows that 96% of UK law firms now use some form of AI, with legal-specific tools growing fastest among mid-sized and large firms." },
    { date: "Nov 2025", tag: "Governance", title: "SRA opens first formal investigation into AI-related conduct breach", body: "The regulator confirmed it is investigating a firm where AI-generated advice was delivered to a client without adequate review or disclosure." },
  ],
  "Regulations": [
    { date: "Aug 2025", tag: "EU",         title: "EU AI Act: high-risk AI provisions enter enforcement", body: "Systems used in legal interpretation, dispute resolution, and access-to-justice contexts now fall under mandatory conformity assessment and human oversight requirements." },
    { date: "Q1 2026", tag: "SRA",         title: "SRA AI Guidance Update — draft for consultation", body: "The Solicitors Regulation Authority published updated draft guidance on AI use, including new expectations around output verification, client disclosure, and record-keeping." },
    { date: "2025",    tag: "ICO",         title: "ICO: AI and data protection — guidance for legal services", body: "The Information Commissioner's Office clarified that entering client personal data into general-purpose AI tools without a lawful basis and a data processing agreement constitutes a breach of UK GDPR." },
    { date: "2024",    tag: "BSB",         title: "Bar Standards Board publishes AI position statement", body: "Barristers are reminded that core duties — including competence, confidentiality, and candour to the court — apply fully when AI is used in any part of case preparation." },
    { date: "Ongoing", tag: "LSB",         title: "Legal Services Board: regulatory review of AI in legal practice", body: "The LSB is conducting a cross-regulator review examining whether existing frameworks are sufficient for AI oversight, with recommendations expected in late 2026." },
    { date: "2025",    tag: "UK Gov",      title: "UK AI Opportunities Action Plan — legal sector implications", body: "The government's national AI strategy includes provisions affecting regulated professions, with the Ministry of Justice expected to publish sector-specific guidance in 2026." },
  ],
  "Conferences": [
    { date: "May 2026",  tag: "London",    title: "LegalTech London 2026", body: "The UK's largest dedicated legal technology conference. Themes include AI governance, procurement frameworks, and responsible automation in legal practice." },
    { date: "Jun 2026",  tag: "London",    title: "Future of Law Summit", body: "Senior partner and GC-focused event exploring AI strategy, workforce transformation, and the evolving client relationship in an AI-enabled legal market." },
    { date: "Jul 2026",  tag: "Online",    title: "Law Society AI Webinar Series — Summer 2026", body: "Monthly practitioner-focused sessions covering the SRA guidance updates, verification best practice, and case studies from early AI adopters." },
    { date: "Sep 2026",  tag: "Oxford",    title: "AI & Law Symposium — Oxford Internet Institute", body: "Academic-practitioner conference examining algorithmic decision-making in courts, bias in legal AI, and the implications of LLMs for access to justice." },
    { date: "Oct 2026",  tag: "London",    title: "Legal Geek Annual Conference", body: "The flagship community event for legal innovation. Expected attendance 3,000+. Key tracks on AI implementation, procurement, and junior lawyer AI literacy." },
    { date: "Nov 2026",  tag: "Brussels",  title: "European Legal Innovation Forum", body: "Cross-jurisdictional focus on AI regulation, EU AI Act compliance for law firms operating across member states, and comparative governance models." },
  ],
};

const TAG_COLORS = {
  Funding:    "border-violet-500/30 bg-violet-500/10 text-violet-300",
  Adoption:   "border-blue-500/30 bg-blue-500/10 text-blue-300",
  Product:    "border-sky-500/30 bg-sky-500/10 text-sky-300",
  Risk:       "border-red-500/30 bg-red-500/10 text-red-300",
  Research:   "border-amber-500/30 bg-amber-500/10 text-amber-300",
  Governance: "border-purple-500/30 bg-purple-500/10 text-purple-300",
  EU:         "border-blue-500/30 bg-blue-500/10 text-blue-300",
  SRA:        "border-violet-500/30 bg-violet-500/10 text-violet-300",
  ICO:        "border-teal-500/30 bg-teal-500/10 text-teal-300",
  BSB:        "border-orange-500/30 bg-orange-500/10 text-orange-300",
  LSB:        "border-zinc-500/30 bg-zinc-500/10 text-zinc-300",
  "UK Gov":   "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  London:     "border-violet-500/30 bg-violet-500/10 text-violet-300",
  Online:     "border-sky-500/30 bg-sky-500/10 text-sky-300",
  Oxford:     "border-blue-500/30 bg-blue-500/10 text-blue-300",
  Brussels:   "border-amber-500/30 bg-amber-500/10 text-amber-300",
};

function NewsOverlay({ onClose }) {
  const [activeTab, setActiveTab] = useState("LegalTech News");
  const items = NEWS_CONTENT[activeTab];

  return (
    <motion.div
      key="news"
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950"
    >
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200 active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
            <Newspaper className="h-4 w-4 text-violet-400" /> News
          </div>
          <div className="w-20" />
        </div>

        {/* Tabs */}
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="flex gap-0 border-b border-zinc-800">
            {NEWS_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-xs font-semibold transition border-b-2 -mb-px ${
                  activeTab === tab
                    ? "border-violet-500 text-violet-400"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <p className="mb-6 text-xs text-zinc-600 italic">* Content is illustrative placeholder material. Dates and details are for demonstration purposes only.</p>
        <div className="space-y-3">
          {items.map(({ date, tag, title, body }) => (
            <div key={title} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${TAG_COLORS[tag] ?? "border-zinc-700 bg-zinc-800 text-zinc-400"}`}>
                  {tag}
                </span>
                <span className="text-xs text-zinc-600">{date}</span>
              </div>
              <p className="mb-1.5 text-sm font-semibold text-zinc-100">{title}</p>
              <p className="text-xs leading-5 text-zinc-400">{body}</p>
            </div>
          ))}
        </div>
      </main>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SOURCES
// ─────────────────────────────────────────────────────────────────────────────

const SOURCES = {
  lexisnexis: {
    title: "Generative AI Survey H2 2025",
    authors: "LexisNexis",
    publisher: "LexisNexis",
    year: "2025",
    description: "Survey of UK legal professionals on AI adoption, concerns, and culture.",
    url: "https://www.lexisnexis.co.uk/research-and-reports/generative-ai-survey-h2-2024.html",
  },
  magesh2025: {
    title: "Hallucination-Free? Assessing the Reliability of Leading AI Legal Research Tools",
    authors: "Magesh, V., Surani, F., Dahl, M., Suzgun, M., Manning, C.D., & Ho, D.E.",
    publisher: "Journal of Empirical Legal Studies",
    year: "2025",
    description: "First preregistered empirical study of hallucination rates in legal AI tools including Lexis+ AI and Westlaw.",
    url: "https://doi.org/10.1111/jels.12413",
  },
  dahl2024: {
    title: "Large Legal Fictions: Profiling Legal Hallucinations in Large Language Models",
    authors: "Dahl, M. et al.",
    publisher: "Journal of Empirical Legal Studies",
    year: "2024",
    description: "Foundational study establishing hallucination rates of 58–82% in general-purpose LLMs on legal queries.",
    url: null,
  },
  thomsonreuters2024: {
    title: "2024 Generative AI in Professional Services Report",
    authors: "Thomson Reuters Institute",
    publisher: "Thomson Reuters",
    year: "2024",
    description: "Industry report covering AI guideline adoption across law firms and corporate legal teams.",
    url: "https://www.thomsonreuters.com/content/dam/ewp-m/documents/thomsonreuters/en/pdf/reports/tr4322226_rgb.pdf",
  },
  lawtechuk2026: {
    title: "Lawtech UK Investment Snapshot: H2 2025",
    authors: "LawtechUK",
    publisher: "LawtechUK",
    year: "2026",
    description: "Tracks UK lawtech funding and acquisition activity across 2025; total investment £188.8m.",
    url: null,
  },
  gartner2025: {
    title: "Over 40% of agentic AI projects will be scrapped by 2027, Gartner says",
    authors: "Reuters",
    publisher: "Reuters",
    year: "2025",
    description: "Gartner prediction that over 40% of agentic AI projects will be abandoned by 2027 due to inadequate governance.",
    url: "https://www.reuters.com/business/over-40-agentic-ai-projects-will-be-scrapped-by-2027-gartner-says-2025-06-25/",
  },
  terzidou_2025: {
    title: "AI in Legal Practice: Liability, Sanctions and the Practising Certificate Gap",
    authors: "Maria Terzidou",
    publisher: "BILETA / Legal Studies",
    year: "2025",
    description: "Analysis of court sanctions against solicitors for AI-generated fake citations; professional liability framework for AI outputs; the practising certificate gap in AI accountability.",
    url: null,
  },
  aiIntegrationUK: {
    title: "AI Integration in UK Professional Services: Adoption, Risk and Governance",
    authors: "UK Professional Services AI Research Group",
    publisher: "UK Professional Services AI Research Group",
    year: "2025",
    description: "33% of legal AI users cite accidental bias as a concern; data on client consent practices and AI disclosure obligations in the UK legal sector; governance policy gaps.",
    url: null,
  },
  nielsen_2024: {
    title: "Algorithmic Fairness in Criminal Justice Risk Assessment: A Systematic Review",
    authors: "Jakob Nielsen et al.",
    publisher: "Journal of Criminal Law and Criminology",
    year: "2024",
    description: "Evidence that AI risk-assessment tools in criminal justice settings have exacerbated racial disparities; analysis of COMPAS and analogous tools; recommendations for independent bias auditing.",
    url: null,
  },
  sraSmallFirms: {
    title: "AI and Small Law Firms: Guidance on Regulatory Obligations",
    authors: "Solicitors Regulation Authority",
    publisher: "Solicitors Regulation Authority",
    year: "2025",
    description: "SRA guidance on AI use by solicitors; client confidentiality obligations when using AI tools; anticipated disclosure requirements; regulatory framework for AI-processed client data.",
    url: "https://www.sra.org.uk",
  },
  embracingInnovation: {
    title: "Embracing Innovation: AI Governance in UK Professional Services",
    authors: "UK Professional Services Forum",
    publisher: "UK Professional Services Forum",
    year: "2025",
    description: "Survey finding that nearly half of professional services firms have no formal AI policy; analysis of PI/D&O exposure from ungoverned AI use; governance framework recommendations.",
    url: null,
  },
  lawtechB2C_2025: {
    title: "LawtechUK Consumer-Facing Legal Technology: Adoption and Trust Report 2025",
    authors: "LawtechUK",
    publisher: "LawtechUK / CodeBase / Legal Geek",
    year: "2025",
    description: "Consumer attitudes to AI in legal services; transparency expectations; SRA regulatory environment for B2C lawtech; client disclosure landscape for AI-assisted legal work.",
    url: "https://lawtechuk.io",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function LegalTechAiQuiz() {
  const rootRef = useRef(null);
  const [showSources, setShowSources] = useState(false);
  const [showLearnMore, setShowLearnMore] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showNews, setShowNews] = useState(false);
  const [sourceModal, setSourceModal] = useState(null);
  const [step, setStep]       = useState("intro");
  const [profile, setProfile] = useState({ name: "", role: "", org: "", experience: "" });
  const [answers, setAnswers] = useState({});
  const [multiSelections, setMultiSelections] = useState([]);

  const answeredCount        = Object.keys(answers).length;
  const currentQuestionIndex = step === "quiz" ? answeredCount : 0;
  const currentQuestion      = questions[currentQuestionIndex];
  const progress             = (answeredCount / questions.length) * 100;

  // Reset multi-select state when question changes
  useEffect(() => {
    setMultiSelections([]);
  }, [currentQuestionIndex]);

  useEffect(() => {
    if (!sourceModal) return;
    const handler = (e) => { if (e.key === "Escape") setSourceModal(null); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [sourceModal]);

  // ── Scoring (live during quiz, final on results) ───────────────────────────
  const scores = useMemo(
    () => computeScores(answers, profile),
    [answers, profile]
  );

  const persona = personas[scores.character] ?? personas.balancedPractitioner;

  // ── Answer handlers ────────────────────────────────────────────────────────

  const handleAnswer = useCallback(
    (value) => {
      const q           = questions[currentQuestionIndex];
      const nextAnswers = { ...answers, [q.id]: value };
      setAnswers(nextAnswers);
      if (Object.keys(nextAnswers).length === questions.length) {
        setStep("results");
      }
    },
    [answers, currentQuestionIndex]
  );

  const handleMultiToggle = useCallback((text) => {
    if (text === "None of the above") {
      setMultiSelections(["None of the above"]);
      return;
    }
    setMultiSelections((prev) => {
      const withoutNone = prev.filter((t) => t !== "None of the above");
      return withoutNone.includes(text)
        ? withoutNone.filter((t) => t !== text)
        : [...withoutNone, text];
    });
  }, []);

  const handleMultiSubmit = useCallback(() => {
    if (multiSelections.length === 0) return;
    handleAnswer(multiSelections);
  }, [multiSelections, handleAnswer]);

  const restart = () => {
    setStep("intro");
    setProfile({ name: "", role: "", org: "", experience: "" });
    setAnswers({});
    setMultiSelections([]);
  };

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════

  return (
    <div ref={rootRef} className="min-h-screen overflow-y-auto bg-zinc-950">

      {/* ── Navigation bar ── */}
      <header className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 md:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600">
              <Scale className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-zinc-100 hidden sm:block">AI Competency Diagnostic</span>
            <span className="text-sm font-semibold text-zinc-100 sm:hidden">AI Diagnostic</span>
          </div>

          {step === "quiz" && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-500 tabular-nums">{answeredCount}/{questions.length}</span>
              <div className="w-24 sm:w-36 overflow-hidden rounded-full bg-zinc-800 h-1.5">
                <div className="h-full bg-violet-500 transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <div className="flex items-center gap-1">
            <div className="relative group">
              <button
                onClick={() => setShowLearnMore(true)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-300 active:scale-95"
              >
                <Brain className="h-4 w-4" />
              </button>
              <span className="pointer-events-none absolute top-full left-1/2 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-zinc-800 px-2 py-1 text-xs text-zinc-200 opacity-0 transition-opacity group-hover:opacity-100">
                Understand the quiz
              </span>
            </div>
            <div className="relative group">
              <button
                onClick={() => setShowNews(true)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-300 active:scale-95"
              >
                <Newspaper className="h-4 w-4" />
              </button>
              <span className="pointer-events-none absolute top-full left-1/2 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-zinc-800 px-2 py-1 text-xs text-zinc-200 opacity-0 transition-opacity group-hover:opacity-100">
                News
              </span>
            </div>
            <div className="relative group">
              <button
                onClick={() => setShowSources(true)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-300 active:scale-95"
              >
                <BookOpen className="h-4 w-4" />
              </button>
              <span className="pointer-events-none absolute top-full left-1/2 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-zinc-800 px-2 py-1 text-xs text-zinc-200 opacity-0 transition-opacity group-hover:opacity-100">
                Sources
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 md:px-8 md:py-12">

        {/* ── Hero Title ── */}
        <div className="mb-10 sm:mb-8">
          <h1 className="text-4xl sm:text-5xl md:text-5xl font-extrabold tracking-tight leading-[1.1]">
            <span className="text-zinc-100">AI in UK Law:</span>
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-violet-300 to-zinc-200 bg-clip-text text-transparent">
              The Gap Between Adoption and Governance
            </span>
          </h1>
        </div>

        {/* ── Context banner ── */}
        <div className="mb-10 sm:mb-12 space-y-6">

          {/* Quote */}
          <blockquote className="border-l-2 border-violet-500 pl-5">
            <p className="text-sm leading-7 text-zinc-400 italic">
              "Artificial intelligence is no longer an emerging trend — it’s a cornerstone of modern legal practice.
              96% of UK law firms now integrate AI into their operations, and 62% of solicitors plan to expand AI
              use over the next year."
            </p>
            <footer className="mt-2 flex items-center gap-3">
              <a
                href="https://www.clio.com/uk/blog/ai-technology-trends/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-400 transition-all hover:text-violet-300 hover:underline underline-offset-4"
              >
                Clio Legal Trends Report
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                </svg>
              </a>
            </footer>
          </blockquote>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { pct: "36%", label: "Drafting & automation" },
              { pct: "29%", label: "Contract review" },
              { pct: "24%", label: "Non-legal AI tools" },
              { pct: "20%", label: "E-discovery" },
              { pct: "17%", label: "Legal research" },
            ].map(({ pct, label }) => (
              <div key={label} className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-3 text-center">
                <div className="text-xl font-bold tabular-nums text-violet-400">{pct}</div>
                <div className="mt-1 text-xs leading-4 text-zinc-500">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── THE REALITY ── */}
        <div className="mb-10 sm:mb-12">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-sky-400">The reality</p>
          <h2 className="mb-2 text-lg font-semibold text-zinc-100">What AI tools are UK lawyers actually using?</h2>
          <p className="mb-6 max-w-2xl text-sm leading-6 text-zinc-400">
            Adoption is high — but the type of tool and the culture surrounding it tell a more complicated story.
          </p>

          {/* Split visualisation: Tool type + AI culture */}
          <div className="mb-6 grid gap-4 lg:grid-cols-2">

            {/* Panel 1 — Tool type split */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Tool type split</p>
              <div className="space-y-3">
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium text-violet-300">Legal-specific AI</span>
                    <span className="font-bold tabular-nums text-zinc-100">51%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                    <div className="h-full rounded-full bg-violet-500" style={{ width: "51%" }} />
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">e.g. Lexis+ AI, Westlaw Precision, Harvey</p>
                </div>
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium text-zinc-300">General AI tools</span>
                    <span className="font-bold tabular-nums text-zinc-100">49%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                    <div className="h-full rounded-full bg-zinc-500" style={{ width: "49%" }} />
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">e.g. ChatGPT, Copilot, Gemini</p>
                </div>
              </div>
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5">
                <p className="text-xs leading-5 text-amber-300">
                  <span className="font-semibold">Note:</span> General tools carry the highest hallucination risk — up to 82% error rate on legal queries (Dahl et al., 2024)
                </p>
              </div>
              <button
                onClick={() => setSourceModal(SOURCES.lexisnexis)}
                className="inline-flex items-center rounded border border-zinc-700 px-2 py-0.5 text-[10px] font-medium text-zinc-500 transition hover:border-zinc-500 hover:text-zinc-300"
              >
                Source
              </button>
            </div>

            {/* Panel 2 — AI culture */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">AI culture in UK law firms</p>
              <div className="space-y-2.5">
                {[
                  { pct: 17, label: "AI is embedded in our strategy and operations", highlight: true },
                  { pct: 39, label: "We're experimenting but progress is slow", highlight: false },
                  { pct: 19, label: "There's interest but little investment", highlight: false },
                  { pct: 9,  label: "There's resistance or fear around AI", highlight: false },
                  { pct: 9,  label: "We don't talk about AI at all", highlight: false },
                  { pct: 7,  label: "None of the above", highlight: false },
                ].map(({ pct, label, highlight }) => (
                  <div key={label}>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className={`text-xs leading-4 ${highlight ? "font-semibold text-violet-300" : "text-zinc-400"}`}>{label}</span>
                      <span className={`shrink-0 text-xs font-bold tabular-nums ${highlight ? "text-violet-300" : "text-zinc-400"}`}>{pct}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className={`h-full rounded-full ${highlight ? "bg-violet-500" : "bg-zinc-600"}`}
                        style={{ width: `${pct * 2}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-3 py-2.5">
                <p className="text-xs leading-5 text-zinc-400">
                  61% of UK lawyers use AI — yet only <span className="font-semibold text-violet-300">17%</span> have truly embedded it. Only <span className="font-semibold text-zinc-200">10%</span> of law firms had formal AI guidelines as of end-2024.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSourceModal(SOURCES.lexisnexis)}
                  className="inline-flex items-center rounded border border-zinc-700 px-2 py-0.5 text-[10px] font-medium text-zinc-500 transition hover:border-zinc-500 hover:text-zinc-300"
                >
                  Source
                </button>
                <button
                  onClick={() => setSourceModal(SOURCES.thomsonreuters2024)}
                  className="inline-flex items-center rounded border border-zinc-700 px-2 py-0.5 text-[10px] font-medium text-zinc-500 transition hover:border-zinc-500 hover:text-zinc-300"
                >
                  Source
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* ── THE UPSIDE ── */}
        <div className="mb-10 sm:mb-12">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-violet-400">The upside</p>
          <h2 className="mb-6 text-lg font-semibold text-zinc-100">What responsible AI adoption delivers</h2>

          {/* Horizontal bar chart — how lawyers use time saved */}
          <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="mb-1 text-sm font-semibold text-zinc-100">How lawyers use time saved by AI</p>
            <p className="mb-5 text-xs text-zinc-500">Private practice lawyers — current users vs. those planning to adopt</p>
            <div className="space-y-4">
              {[
                { label: "Increase billable work",          current: 56, planning: 61 },
                { label: "Better work/life balance",        current: 53, planning: 40 },
                { label: "Stronger client relationships",   current: 27, planning: 24 },
                { label: "Personal development",            current: 24, planning: 20 },
                { label: "Team development",                current: 21, planning: 18 },
                { label: "Chase new business",              current: 20, planning: 13 },
              ].map(({ label, current, planning }) => (
                <div key={label}>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="text-xs text-zinc-300">{label}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-28 shrink-0 text-right text-[10px] text-violet-400">Current users</div>
                      <div className="flex-1 overflow-hidden rounded-full bg-zinc-800 h-2">
                        <div className="h-full rounded-full bg-violet-500" style={{ width: `${current}%` }} />
                      </div>
                      <span className="w-8 text-right text-[10px] font-bold tabular-nums text-violet-300">{current}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-28 shrink-0 text-right text-[10px] text-zinc-500">Planning to adopt</div>
                      <div className="flex-1 overflow-hidden rounded-full bg-zinc-800 h-2">
                        <div className="h-full rounded-full bg-zinc-600" style={{ width: `${planning}%` }} />
                      </div>
                      <span className="w-8 text-right text-[10px] font-bold tabular-nums text-zinc-400">{planning}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setSourceModal(SOURCES.lexisnexis)}
              className="mt-4 inline-flex items-center rounded border border-zinc-700 px-2 py-0.5 text-[10px] font-medium text-zinc-500 transition hover:border-zinc-500 hover:text-zinc-300"
            >
              Source
            </button>
          </div>

          {/* Investment callout + career stakes */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2">

            {/* Investment callout */}
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-5 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-violet-400">Market signal</p>
              <div>
                <p className="text-3xl font-extrabold tabular-nums text-zinc-100">£188.8m</p>
                <p className="mt-1 text-sm text-zinc-300 font-medium">UK lawtech investment in 2025</p>
              </div>
              <p className="text-xs leading-5 text-zinc-400">
                A <span className="font-semibold text-violet-300">35% uplift</span> on 2024 — signalling "a market moving beyond early experimentation toward sustained confidence."
              </p>
              <button
                onClick={() => setSourceModal(SOURCES.lawtechuk2026)}
                className="inline-flex items-center rounded border border-zinc-700 px-2 py-0.5 text-[10px] font-medium text-zinc-500 transition hover:border-zinc-500 hover:text-zinc-300"
              >
                Source
              </button>
            </div>

            {/* Career stakes */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Career stakes</p>
              <p className="text-xs leading-5 text-zinc-400">The upside isn't just operational — it's professional.</p>
              <div className="space-y-3">
                <div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-2xl font-bold tabular-nums text-zinc-100">39%</span>
                    <span className="text-xs text-zinc-500">private practice</span>
                  </div>
                  <p className="text-xs text-zinc-500">say failing to adopt AI would negatively impact their career</p>
                </div>
                <div className="border-t border-zinc-800 pt-3">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-2xl font-bold tabular-nums text-zinc-100">49%</span>
                    <span className="text-xs text-zinc-500">in-house</span>
                  </div>
                  <p className="text-xs text-zinc-500">say the same — and 18–19% would consider leaving a firm that failed to embrace AI</p>
                </div>
              </div>
              <button
                onClick={() => setSourceModal(SOURCES.lexisnexis)}
                className="inline-flex items-center rounded border border-zinc-700 px-2 py-0.5 text-[10px] font-medium text-zinc-500 transition hover:border-zinc-500 hover:text-zinc-300"
              >
                Source
              </button>
            </div>

          </div>

        </div>

        {/* ── THE RISK ── */}
        <div className="mb-10 sm:mb-12">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-red-400">The risk</p>
          <h2 className="mb-6 text-lg font-semibold text-zinc-100">Why unchecked AI use is dangerous in law</h2>

          <div className="flex flex-col justify-between rounded-xl border border-red-500/25 bg-gradient-to-br from-red-950/60 via-zinc-900 to-zinc-900 p-6">
            <AlertTriangle className="h-7 w-7 text-red-400 mb-4 shrink-0" />
            <div>
              <p className="text-2xl sm:text-3xl font-bold leading-tight tracking-tight text-zinc-100">
                AI adoption needs to be <span className="text-red-400">conscious.</span>
              </p>
              <p className="mt-4 text-sm leading-6 text-zinc-400">
                Speed and fluency with AI tools mean nothing without the discipline to verify outputs,
                protect confidential data, and operate within your organisation's governance framework.
                The legal profession's duty of care does not pause for technology.
              </p>
            </div>
          </div>

          {/* Block 1 — Hallucination paradox */}
          <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="mb-4 text-sm font-semibold text-zinc-100">The hallucination paradox</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-zinc-700 bg-zinc-950 p-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2">What lawyers fear</p>
                <p className="text-3xl font-extrabold tabular-nums text-orange-400">76%</p>
                <p className="mt-2 text-xs leading-4 text-zinc-400">cite hallucinations as their top concern for AI legal research</p>
              </div>
              <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-widest text-violet-400 mb-2">Legal AI reality</p>
                <p className="text-3xl font-extrabold tabular-nums text-violet-300">17–33%</p>
                <p className="mt-2 text-xs leading-4 text-zinc-400">hallucination rate for dedicated tools (Lexis+ AI, Westlaw) — even with RAG</p>
              </div>
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-widest text-red-400 mb-2">General AI reality</p>
                <p className="text-3xl font-extrabold tabular-nums text-red-400">58–82%</p>
                <p className="mt-2 text-xs leading-4 text-zinc-400">hallucination rate for general-purpose LLMs on legal queries</p>
              </div>
            </div>
            <p className="mt-3 text-xs leading-5 text-zinc-500">The fear is real — but tool choice matters enormously.</p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setSourceModal(SOURCES.lexisnexis)}
                className="inline-flex items-center rounded border border-zinc-700 px-2 py-0.5 text-[10px] font-medium text-zinc-500 transition hover:border-zinc-500 hover:text-zinc-300"
              >
                Source
              </button>
              <button
                onClick={() => setSourceModal(SOURCES.magesh2025)}
                className="inline-flex items-center rounded border border-zinc-700 px-2 py-0.5 text-[10px] font-medium text-zinc-500 transition hover:border-zinc-500 hover:text-zinc-300"
              >
                Source
              </button>
              <button
                onClick={() => setSourceModal(SOURCES.dahl2024)}
                className="inline-flex items-center rounded border border-zinc-700 px-2 py-0.5 text-[10px] font-medium text-zinc-500 transition hover:border-zinc-500 hover:text-zinc-300"
              >
                Source
              </button>
            </div>
          </div>

          {/* Block 2 — Concern breakdown */}
          <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="mb-1 text-sm font-semibold text-zinc-100">What AI users actually worry about</p>
            <p className="mb-4 text-xs text-zinc-500">AI users in UK legal practice</p>
            <div className="space-y-3">
              {[
                { pct: 76, label: "Relying on inaccurate or fabricated information (hallucinations)", color: "bg-red-500" },
                { pct: 47, label: "Leaking confidential data", color: "bg-orange-500" },
                { pct: 47, label: "Becoming too reliant on AI", color: "bg-orange-400" },
                { pct: 33, label: "Accidental bias", color: "bg-amber-500" },
                { pct: 28, label: "My quality of work will decline", color: "bg-amber-400" },
                { pct: 12, label: "My clients might not like it", color: "bg-zinc-500" },
              ].map(({ pct, label, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="w-8 shrink-0 text-right text-xs font-bold tabular-nums text-zinc-300">{pct}%</span>
                  <div className="flex-1 overflow-hidden rounded-full bg-zinc-800 h-2">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-zinc-400 leading-4" style={{ minWidth: "12rem" }}>{label}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setSourceModal(SOURCES.lexisnexis)}
              className="mt-4 inline-flex items-center rounded border border-zinc-700 px-2 py-0.5 text-[10px] font-medium text-zinc-500 transition hover:border-zinc-500 hover:text-zinc-300"
            >
              Source
            </button>
          </div>

          {/* Block 3 — Governance gap */}
          <div className="mt-4 rounded-xl border border-red-500/20 bg-gradient-to-br from-red-950/40 via-zinc-900 to-zinc-900 p-5">
            <p className="mb-3 text-sm font-semibold text-zinc-100">The governance gap</p>
            <p className="text-sm leading-6 text-zinc-300">
              Only <span className="font-bold text-red-400">10%</span> of law firms had formal AI guidelines as of end-2024.
              Only <span className="font-bold text-red-400">17%</span> of lawyers say their firm has embedded AI.
              Yet <span className="font-bold text-zinc-100">40%+</span> say their career depends on it.
            </p>
            <p className="mt-3 text-xs leading-5 text-zinc-500">
              Lawyers are using tools their firms haven't governed.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setSourceModal(SOURCES.thomsonreuters2024)}
                className="inline-flex items-center rounded border border-zinc-700 px-2 py-0.5 text-[10px] font-medium text-zinc-500 transition hover:border-zinc-500 hover:text-zinc-300"
              >
                Source
              </button>
              <button
                onClick={() => setSourceModal(SOURCES.lexisnexis)}
                className="inline-flex items-center rounded border border-zinc-700 px-2 py-0.5 text-[10px] font-medium text-zinc-500 transition hover:border-zinc-500 hover:text-zinc-300"
              >
                Source
              </button>
            </div>
          </div>

          <p className="mt-4 text-xs text-zinc-600 italic">
            * Gartner (via Reuters, June 2025) predicts over 40% of agentic AI projects will be scrapped by 2027 due to inadequate governance.{" "}
            <button onClick={() => setSourceModal(SOURCES.gartner2025)} className="underline underline-offset-2 hover:text-zinc-400 transition">Source</button>
          </p>
        </div>

        {/* ── Page heading ── */}
        <div className="mb-8 sm:mb-10">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-violet-400">
            AI Competency · Legal Practice
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-100 sm:text-4xl md:text-5xl">
            What’s your LegalTech<br className="hidden sm:block" /> competency profile?
          </h1>
          <p className="mt-3 max-w-2xl text-base text-zinc-400 leading-relaxed">
            40 diagnostic questions across four domains. See where you stand — and where to improve.
          </p>
        </div>

        <AnimatePresence mode="wait">

          {/* ══════════════════════ INTRO ══════════════════════════════════════ */}
          {step === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
              {/* Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Start the assessment</CardTitle>
                  <CardDescription>
                    Profile information contextualises your scores and risk calculation. All fields are optional.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Name</label>
                      <Input
                        placeholder="Optional"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">AI experience</label>
                      <select value={profile.experience} onChange={(e) => setProfile({ ...profile, experience: e.target.value })} className={selectCls}>
                        <option value="">Select level</option>
                        <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Role</label>
                      <select value={profile.role} onChange={(e) => setProfile({ ...profile, role: e.target.value })} className={selectCls}>
                        <option value="">Select role</option>
                        {roleOptions.map((r) => <option key={r}>{r}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Organisation</label>
                      <select value={profile.org} onChange={(e) => setProfile({ ...profile, org: e.target.value })} className={selectCls}>
                        <option value="">Select type</option>
                        {orgOptions.map((o) => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      { icon: Briefcase,   title: "Usage",        desc: "Access, frequency, breadth, tool type, and prompting capability." },
                      { icon: Brain,       title: "Verification", desc: "Citations, legal validation, jurisdiction, and scenario performance." },
                      { icon: ShieldAlert, title: "Risk",         desc: "Hallucination, confidentiality, data sensitivity, and bias awareness." },
                      { icon: Scale,       title: "Governance",   desc: "Policy, approved tools, training, escalation, and explainability." },
                    ].map(({ icon: Icon, title, desc }) => (
                      <div key={title} className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-4">
                        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-200">
                          <Icon className="h-4 w-4 shrink-0 text-violet-400" /> {title}
                        </div>
                        <p className="text-xs leading-5 text-zinc-500">{desc}</p>
                      </div>
                    ))}
                  </div>

                  <Button onClick={() => setStep("quiz")} size="lg" className="w-full sm:w-auto">
                    Begin assessment <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              {/* Archetype preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Possible outcomes</CardTitle>
                  <CardDescription>Ten archetypes across usage, verification, risk, and governance.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[420px] overflow-y-auto space-y-0.5 pr-1">
                    {Object.values(personas).map((p) => (
                      <div key={p.code} className="flex items-center justify-between rounded-lg px-3 py-2.5 transition hover:bg-zinc-800">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-zinc-200">{p.name}</div>
                          <div className="text-xs text-zinc-500">{p.subtitle}</div>
                        </div>
                        <span className="ml-3 shrink-0 rounded-full border border-zinc-700 px-2 py-0.5 text-xs font-medium text-zinc-500">
                          {p.code}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              </div>

              {/* ── SDGs + Ethics ── */}
              <div className="space-y-4">
                <div>
                  <p
                    className="mb-1 text-xs font-semibold uppercase tracking-widest text-cyan-400"
                    style={{ textShadow: "0 0 12px rgb(34 211 238 / 0.8), 0 0 24px rgb(34 211 238 / 0.4)" }}
                  >The bigger picture</p>
                  <h2 className="mb-2 text-lg font-semibold text-zinc-100">What this means for you</h2>
                  <p className="max-w-2xl text-sm leading-6 text-zinc-400">
                    How lawyers use AI is not just a professional question — it has consequences for justice, access to legal services,
                    and the integrity of institutions that millions of people depend on. Getting it right matters beyond the individual.
                  </p>
                </div>

                <div className="grid gap-10 lg:grid-cols-2">

                  {/* SDGs */}
                  <div>
                    <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-emerald-400">UN Sustainable Development Goals</p>
                    <div className="space-y-3">
                      {[
                        { num: "SDG 16", title: "Peace, Justice & Strong Institutions", color: "border-blue-500/30 bg-blue-500/5 text-blue-400",    body: "AI can expand access to legal services for underserved populations — but only if outputs are accurate, unbiased, and verified. Unchecked AI risks eroding trust in legal processes." },
                        { num: "SDG 10", title: "Reduced Inequalities",                 color: "border-pink-500/30 bg-pink-500/5 text-pink-400",      body: "Legal AI could democratise access to professional advice. It could equally widen the gap — large firms with sophisticated tools pulling further ahead of under-resourced practitioners." },
                        { num: "SDG 8",  title: "Decent Work & Economic Growth",        color: "border-emerald-500/30 bg-emerald-500/5 text-emerald-400", body: "Responsible AI use raises productivity and reduces burnout from routine legal work. Irresponsible use puts client outcomes and professional livelihoods at risk." },
                        { num: "SDG 9",  title: "Industry, Innovation & Infrastructure",color: "border-orange-500/30 bg-orange-500/5 text-orange-400", body: "The legal sector is a critical institution. How it adopts AI shapes the standard for other regulated professions and the public's trust in technology-assisted services." },
                      ].map(({ num, title, color, body }) => (
                        <div key={num} className={`rounded-lg border p-4 ${color.split(" ")[0]} ${color.split(" ")[1]}`}>
                          <div className="mb-1.5 flex items-center gap-2">
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${color.split(" ")[2]}`}>{num}</span>
                            <span className="text-xs font-semibold text-zinc-300">{title}</span>
                          </div>
                          <p className="text-xs leading-5 text-zinc-400">{body}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ethics */}
                  <div>
                    <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-teal-400">Professional Ethics & Duty of Care</p>
                    <div className="space-y-3">
                      {[
                        { icon: <CheckCircle2 className="h-4 w-4 shrink-0 text-violet-400" />, title: "The lawyer remains responsible", body: "AI does not hold a practising certificate. Every output — right or wrong — carries your professional liability. Delegating to AI is not the same as delegating to a colleague.", srcs: [{ label: "AI Integration UK", key: "aiIntegrationUK" }, { label: "Terzidou, 2025", key: "terzidou_2025" }] },
                        { icon: <ShieldAlert className="h-4 w-4 shrink-0 text-violet-400" />,  title: "Transparency with clients",      body: "Regulatory bodies including the SRA are developing guidance on AI disclosure obligations. Using AI without client knowledge may already breach professional conduct rules in some contexts.", srcs: [{ label: "LawtechUK B2C, 2025", key: "lawtechB2C_2025" }, { label: "Terzidou, 2025", key: "terzidou_2025" }, { label: "SRA, 2025", key: "sraSmallFirms" }] },
                        { icon: <Brain className="h-4 w-4 shrink-0 text-violet-400" />,        title: "Bias is a legal risk",            body: "AI systems trained on historical legal data can reproduce systemic biases. In litigation, sentencing, and contract interpretation, biased outputs can cause real harm to real people.", srcs: [{ label: "Nielsen, 2024", key: "nielsen_2024" }, { label: "AI Integration UK", key: "aiIntegrationUK" }, { label: "LexisNexis Survey", key: "lexisnexis" }] },
                        { icon: <Scale className="h-4 w-4 shrink-0 text-violet-400" />,        title: "Governance is not optional",     body: "Firms that lack AI policies expose themselves to regulatory action, professional indemnity claims, and reputational risk. Governance frameworks protect practitioners as much as clients.", srcs: [{ label: "Embracing Innovation", key: "embracingInnovation" }, { label: "AI Integration UK", key: "aiIntegrationUK" }] },
                      ].map(({ icon, title, body, srcs }) => (
                        <div key={title} className="flex gap-3.5 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                          <div className="mt-0.5">{icon}</div>
                          <div>
                            <p className="mb-1 text-xs font-semibold text-zinc-200">{title}</p>
                            <p className="text-xs leading-5 text-zinc-400">{body}</p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {srcs.map(({ label, key }) => (
                                <button
                                  key={key}
                                  onClick={() => setSourceModal(SOURCES[key])}
                                  className="inline-flex items-center rounded border border-zinc-700 px-2 py-0.5 text-[10px] font-medium text-zinc-500 transition hover:border-zinc-500 hover:text-zinc-300"
                                >
                                  📄 {label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

              {/* ── UK Lawtech Reality Check teaser ── */}
              <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">

                {/* Header row */}
                <div className="flex items-start justify-between gap-4 border-b border-zinc-800 px-5 py-4">
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <BarChart2 className="h-3.5 w-3.5 shrink-0 text-[#f4845f]" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#f4845f]">UK Lawtech Reality Check</p>
                    </div>
                    <p className="text-sm font-semibold leading-snug text-zinc-100">
                      The Data Behind the Hype: Investment, Performance & Risk
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      376 companies · £1.7B raised · benchmark scores collapse up to 75% in real-world conditions
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <button
                      onClick={() => setShowDashboard(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#f4845f]/35 bg-[#f4845f]/10 px-3 py-1.5 text-xs font-semibold text-[#f4845f] transition hover:bg-[#f4845f]/20 active:scale-95"
                    >
                      <Maximize2 className="h-3 w-3" /> See in Full Screen
                    </button>
                    <p className="text-[10px] text-zinc-600">to find out more!</p>
                  </div>
                </div>

                {/* KPI strip */}
                <div className="grid grid-cols-2 divide-x divide-y divide-zinc-800 border-b border-zinc-800 sm:grid-cols-4 sm:divide-y-0">
                  {[
                    { label: "UK Lawtech Companies",  value: "376",   sub: "tracked in 2025"           },
                    { label: "Total Investment",       value: "£1.7B", sub: "UK-founded companies"       },
                    { label: "AI Projects Scrapped",   value: "40%+",  sub: "by 2027 — Gartner"          },
                    { label: "Real Task Resolution",   value: "<25%",  sub: "SWE-Bench PRO commercial"   },
                  ].map(({ label, value, sub }) => (
                    <div key={label} className="px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
                      <p className="mt-0.5 text-xl font-bold tabular-nums text-[#f4845f]">{value}</p>
                      <p className="text-[10px] text-zinc-600">{sub}</p>
                    </div>
                  ))}
                </div>

                {/* Benchmark collapse mini-chart */}
                <div className="px-5 py-4">
                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Benchmark reality collapse</p>
                  <div className="space-y-2">
                    {[
                      { label: "Vendor marketing",   pct: "70%+", width: "100%", color: "bg-red-500/80"     },
                      { label: "Verified benchmark", pct: "~70%", width: "99%",  color: "bg-emerald-500/80" },
                      { label: "PRO public tasks",   pct: "~23%", width: "33%",  color: "bg-amber-500/80"   },
                      { label: "PRO commercial",     pct: "~17%", width: "24%",  color: "bg-red-500/80"     },
                    ].map(({ label, pct, width, color }) => (
                      <div key={label} className="flex items-center gap-3">
                        <span className="w-28 shrink-0 text-right text-[11px] text-zinc-500">{label}</span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800">
                          <div className={`h-full rounded-full ${color}`} style={{ width }} />
                        </div>
                        <span className="w-9 text-[11px] font-bold tabular-nums text-zinc-400">{pct}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-[11px] italic text-zinc-600">
                    17–33% hallucination rate in dedicated legal AI tools despite RAG — Magesh et al., J. Empirical Legal Studies 2025
                  </p>
                </div>

              </div>

            </motion.div>
          )}

          {/* ══════════════════════ QUIZ ═══════════════════════════════════════ */}
          {step === "quiz" && currentQuestion && (
            <motion.div
              key={`q-${currentQuestion.id}`}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
              className="grid gap-5 lg:grid-cols-[260px_1fr]"
            >
              {/* Sidebar */}
              <Card className="order-2 lg:order-1 h-fit lg:sticky lg:top-[65px]">
                <CardHeader>
                  <CardTitle className="text-sm">Progress</CardTitle>
                  <CardDescription>{answeredCount} of {questions.length} answered</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Progress value={progress} className="h-1.5" />

                  <div className="space-y-0.5">
                    {Object.entries(domainMeta).map(([key, meta]) => {
                      const Icon = meta.icon;
                      return (
                        <div key={key} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-zinc-800">
                          <div className="flex items-center gap-2 text-xs text-zinc-400">
                            <Icon className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
                            {meta.label}
                          </div>
                          <span className="text-xs tabular-nums text-zinc-500">{scores.domains[key]}%</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="rounded-lg border border-zinc-700/50 bg-zinc-800/40 px-3 py-2.5 text-xs leading-5 text-zinc-500">
                    Section: <span className="text-zinc-300 font-medium">{currentQuestion.section}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Question card */}
              <Card className="order-1 lg:order-2">
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">Q{currentQuestionIndex + 1} / {questions.length}</Badge>
                    <Badge>{currentQuestion.section}</Badge>
                  </div>
                  <div className="mt-3 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
                    {React.createElement(currentQuestion.icon, { className: "h-5 w-5 text-violet-400" })}
                  </div>
                  <CardTitle className="mt-2 text-lg sm:text-xl leading-snug">
                    {currentQuestion.title}
                  </CardTitle>
                  {currentQuestion.subtitle ? (
                    <CardDescription>{currentQuestion.subtitle}</CardDescription>
                  ) : currentQuestion.type === "single" ? (
                    <CardDescription>Choose the option that best reflects your actual behaviour.</CardDescription>
                  ) : currentQuestion.type === "likert" ? (
                    <CardDescription>Select a number from 1 (low) to 5 (high).</CardDescription>
                  ) : null}
                </CardHeader>

                <CardContent className="space-y-2.5">

                  {/* Single choice */}
                  {currentQuestion.type === "single" && currentQuestion.options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(option)}
                      className="group w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3.5 text-left transition-all hover:border-violet-500/40 hover:bg-violet-500/5 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 min-h-[56px]"
                    >
                      <div className="flex items-start gap-3.5">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-xs font-semibold text-zinc-400 group-hover:border-violet-500/50 group-hover:bg-violet-500/10 group-hover:text-violet-400 transition-colors">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="text-sm leading-6 text-zinc-300">{option.text}</span>
                      </div>
                    </button>
                  ))}

                  {/* Multi-select */}
                  {currentQuestion.type === "multi" && (
                    <>
                      {currentQuestion.options.map((option, idx) => {
                        const selected = multiSelections.includes(option.text);
                        return (
                          <button
                            key={idx}
                            onClick={() => handleMultiToggle(option.text)}
                            className={`group w-full rounded-xl border px-4 py-3.5 text-left transition-all active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 min-h-[56px] ${
                              selected
                                ? "border-violet-500/60 bg-violet-500/10"
                                : "border-zinc-800 bg-zinc-900 hover:border-violet-500/40 hover:bg-violet-500/5"
                            }`}
                          >
                            <div className="flex items-start gap-3.5">
                              <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs transition-colors ${
                                selected
                                  ? "border-violet-500 bg-violet-500 text-white"
                                  : "border-zinc-700 bg-zinc-800 text-zinc-400"
                              }`}>
                                {selected && <Check className="h-3 w-3" />}
                              </span>
                              <span className="text-sm leading-6 text-zinc-300">{option.text}</span>
                            </div>
                          </button>
                        );
                      })}
                      <Button
                        onClick={handleMultiSubmit}
                        disabled={multiSelections.length === 0}
                        className="mt-1 w-full"
                      >
                        Continue <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </>
                  )}

                  {/* Likert */}
                  {currentQuestion.type === "likert" && (
                    <div className="space-y-4 py-2">
                      <div className="flex justify-between text-xs text-zinc-500 px-1">
                        <span>{currentQuestion.likertLabels?.[0]}</span>
                        <span>{currentQuestion.likertLabels?.[1]}</span>
                      </div>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((val) => (
                          <button
                            key={val}
                            onClick={() => handleAnswer(val)}
                            className="flex flex-col items-center justify-center gap-1 flex-1 rounded-xl border border-zinc-800 bg-zinc-900 py-5 transition-all hover:border-violet-500/40 hover:bg-violet-500/5 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                          >
                            <span className="text-lg font-semibold text-zinc-200">{val}</span>
                          </button>
                        ))}
                      </div>
                      <div className="flex justify-between text-xs text-zinc-600 px-1">
                        <span>1 — Low</span><span>5 — High</span>
                      </div>
                    </div>
                  )}

                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ══════════════════════ RESULTS ════════════════════════════════════ */}
          {step === "results" && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
              className="space-y-5"
            >

              {/* ── Hero archetype card ── */}
              <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-violet-700 via-violet-600 to-indigo-600 p-6 sm:p-8 text-white">
                <div className="grid gap-6 sm:gap-8 md:grid-cols-[1fr_1.2fr]">
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-violet-200">Your archetype</p>
                    <div className="flex flex-wrap items-baseline gap-3">
                      <h2 className="text-3xl font-bold sm:text-4xl">{persona.name}</h2>
                      <span className="rounded-full border border-white/25 px-2.5 py-0.5 text-xs font-medium text-white/80">
                        {persona.code}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-violet-200">{persona.subtitle}</p>

                    {/* Capability + Risk summary inline */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${TIER_STYLES[scores.capabilityTier] ?? ""}`}>
                        {scores.capabilityTier} · {scores.capability}/100
                      </span>
                      {(profile.role || profile.org) && (
                        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${BAND_STYLES[scores.riskBand] ?? ""}`}>
                          Context Risk: {scores.riskBand} · {scores.contextRisk}/100
                        </span>
                      )}
                    </div>

                    <p className="mt-4 text-sm leading-6 text-violet-100 sm:text-base sm:leading-7">{persona.summary}</p>

                    {(profile.role || profile.org || profile.experience) && (
                      <div className="mt-5 flex flex-wrap gap-2">
                        {profile.role       && <Pill>{profile.role}</Pill>}
                        {profile.org        && <Pill>{profile.org}</Pill>}
                        {profile.experience && <Pill>{profile.experience}</Pill>}
                      </div>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 content-start">
                    <div className="rounded-xl bg-white/10 p-4">
                      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                        <CheckCircle2 className="h-4 w-4 text-violet-200 shrink-0" /> Strengths
                      </div>
                      <ul className="space-y-1.5 text-xs leading-5 text-violet-100">
                        {persona.strengths.map((s) => <li key={s}>· {s}</li>)}
                      </ul>
                    </div>
                    <div className="rounded-xl bg-white/10 p-4">
                      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                        <ShieldAlert className="h-4 w-4 text-violet-200 shrink-0" /> Watch out for
                      </div>
                      <ul className="space-y-1.5 text-xs leading-5 text-violet-100">
                        {persona.weaknesses.map((w) => <li key={w}>· {w}</li>)}
                      </ul>
                    </div>
                    <div className="sm:col-span-2 rounded-xl bg-white/10 p-4">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-violet-200">
                        {profile.name ? `${profile.name}'s profile` : "Your profile"}
                      </p>
                      <p className="text-xs text-violet-100">
                        40 questions · 4 domains · Capability score {scores.capability}/100
                        {(profile.role || profile.org) ? ` · Context risk ${scores.contextRisk}/100` : ""}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Score overview + Domain breakdown ── */}
              <div className="grid gap-5 lg:grid-cols-2">

                {/* Score overview */}
                <Card>
                  <CardHeader>
                    <CardTitle>Score overview</CardTitle>
                    <CardDescription>
                      Capability score includes red flag penalties. Context risk adjusts for role and organisation size.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">

                    {/* Capability */}
                    <div className="rounded-xl border border-zinc-800 bg-zinc-800/40 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Overall Capability</span>
                        <TierBadge label={scores.capabilityTier} styleClass={TIER_STYLES[scores.capabilityTier] ?? ""} />
                      </div>
                      <div className="flex items-end gap-2">
                        <span className="text-4xl font-bold tabular-nums text-zinc-100">{scores.capability}</span>
                        <span className="mb-1 text-sm text-zinc-500">/100</span>
                      </div>
                      <div className="mt-2 overflow-hidden rounded-full bg-zinc-700 h-1.5">
                        <div className="h-full bg-violet-500 transition-all duration-700" style={{ width: `${scores.capability}%` }} />
                      </div>
                      {scores.flags.length > 0 && (
                        <p className="mt-2 text-xs text-zinc-500">
                          Includes {scores.flags.reduce((a, f) => a + f.penalty, 0)} point deduction from {scores.flags.length} red flag{scores.flags.length > 1 ? "s" : ""}.
                        </p>
                      )}
                    </div>

                    {/* Context risk */}
                    {(profile.role || profile.org) && (
                      <div className="rounded-xl border border-zinc-800 bg-zinc-800/40 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Context Risk</span>
                          <TierBadge label={scores.riskBand} styleClass={BAND_STYLES[scores.riskBand] ?? ""} />
                        </div>
                        <div className="flex items-end gap-2">
                          <span className="text-4xl font-bold tabular-nums text-zinc-100">{scores.contextRisk}</span>
                          <span className="mb-1 text-sm text-zinc-500">/100</span>
                        </div>
                        <p className="mt-2 text-xs text-zinc-500">
                          Adjusted for {profile.role || "your role"}{profile.org ? ` at a ${profile.org.toLowerCase()}` : ""}.
                          Context affects risk interpretation, not capability score.
                        </p>
                      </div>
                    )}

                    {/* Section composites */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Section composites</p>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: "Practical AI Use",      value: scores.sections.practicalAIUse     },
                          { label: "Legal Risk Awareness",  value: scores.sections.legalRiskAwareness },
                        ].map(({ label, value }) => (
                          <div key={label} className="rounded-lg border border-zinc-800 bg-zinc-800/40 p-3 text-center">
                            <div className="text-2xl font-bold tabular-nums text-zinc-100">{value}</div>
                            <div className="mt-1 text-xs text-zinc-500">{label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Domain breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle>Domain breakdown</CardTitle>
                    <CardDescription>
                      Four weighted domains forming the Capability Score: Usage 25% · Verification 30% · Risk 25% · Governance 20%.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <ScoreBar label="Usage Sophistication"    value={scores.domains.usage} />
                      <ScoreBar label="Verification Discipline" value={scores.domains.verification} />
                      <ScoreBar label="Legal Risk Awareness"    value={scores.domains.riskAwareness} />
                      <ScoreBar label="Governance Alignment"    value={scores.domains.governance} />
                    </div>

                    <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-3 text-xs leading-5 text-zinc-500">
                      <span className="font-medium text-zinc-400">Capability formula: </span>
                      (Usage × 0.25) + (Verification × 0.30) + (Risk × 0.25) + (Governance × 0.20) − penalties
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* ── Red flags ── */}
              {scores.flags.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                      <CardTitle>Red flags identified</CardTitle>
                    </div>
                    <CardDescription>
                      These responses indicate elevated professional risk. Penalties have been applied to your Capability Score.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {scores.flags.map((flag) => (
                        <div
                          key={flag.id}
                          className="flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3"
                        >
                          <span className="text-sm text-red-300">{flag.label}</span>
                          <span className="ml-4 shrink-0 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-400">
                            −{flag.penalty} pts
                          </span>
                        </div>
                      ))}
                      <p className="pt-1 text-xs text-zinc-500">
                        Total deduction: <span className="font-semibold text-zinc-300">{scores.flags.reduce((a, f) => a + f.penalty, 0)} points</span>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ── Insights ── */}
              {scores.insights.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-amber-400" />
                      <CardTitle>Contextual insights</CardTitle>
                    </div>
                    <CardDescription>
                      Based on your role, organisation, and score pattern.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {scores.insights.map((insight, idx) => {
                        const style = INSIGHT_STYLES[insight.type] ?? INSIGHT_STYLES.alignment;
                        return (
                          <div
                            key={idx}
                            className={`rounded-lg border p-4 ${style.border} ${style.bg}`}
                          >
                            <div className="flex items-center gap-2 mb-1.5">
                              <div className={`h-2 w-2 rounded-full shrink-0 ${style.dot}`} />
                              <span className="text-sm font-semibold text-zinc-200">{insight.title}</span>
                            </div>
                            <p className="text-xs leading-5 text-zinc-400">{insight.body}</p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ── Next steps + Retake ── */}
              <div className="grid gap-5 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Recommended next steps</CardTitle>
                    <CardDescription>Tailored to your archetype: {persona.name}.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {persona.nextSteps.map((text, idx) => (
                      <div key={idx} className="flex gap-3 rounded-lg border border-zinc-800 bg-zinc-800/50 px-4 py-3">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-xs font-semibold text-violet-400">
                          {idx + 1}
                        </span>
                        <p className="text-sm leading-6 text-zinc-400">{text}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Retake</CardTitle>
                    <CardDescription>
                      Revisit after training, policy changes, or workflow updates.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-xs text-zinc-500">
                      <p>AI competency evolves. Retake this diagnostic after:</p>
                      <ul className="space-y-1 pl-3">
                        <li>· Completing AI training</li>
                        <li>· A new firm-wide AI policy</li>
                        <li>· Significant changes to your AI workflow</li>
                        <li>· A professional conduct update on AI use</li>
                      </ul>
                    </div>
                    <Button onClick={restart} variant="outline" size="lg" className="w-full">
                      <RotateCcw className="mr-2 h-4 w-4" /> Retake assessment
                    </Button>
                  </CardContent>
                </Card>
              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* ── Source citation modal ── */}
      <AnimatePresence>
        {sourceModal && (
          <motion.div
            key="source-modal"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setSourceModal(null)}
          >
            <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="relative w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSourceModal(null)}
                className="absolute right-4 top-4 inline-flex h-6 w-6 items-center justify-center rounded text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-300 text-lg leading-none"
              >
                ×
              </button>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-violet-400">Source</p>
              <p className="mb-1 text-sm font-semibold text-zinc-100">{sourceModal.title}</p>
              <p className="mb-0.5 text-xs text-zinc-400">{sourceModal.authors}</p>
              <p className="mb-3 text-xs text-zinc-500">{sourceModal.publisher}, {sourceModal.year}</p>
              <p className="mb-4 text-xs leading-5 text-zinc-400">{sourceModal.description}</p>
              {sourceModal.url ? (
                <a
                  href={sourceModal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-400 transition hover:text-violet-300 hover:underline underline-offset-4"
                >
                  View source <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <p className="text-xs text-zinc-600 italic">No public URL — available in print/institutional access.</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── News overlay ── */}
      <AnimatePresence>
        {showNews && <NewsOverlay onClose={() => setShowNews(false)} />}
      </AnimatePresence>

      {/* ── Learn More overlay ── */}
      <AnimatePresence>
        {showLearnMore && (
          <motion.div
            key="learn-more"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950"
          >
            <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-sm">
              <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
                <button
                  onClick={() => setShowLearnMore(false)}
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200 active:scale-95"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <div className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
                  <Brain className="h-4 w-4 text-violet-400" /> Understand the Quiz
                </div>
                <div className="w-20" />
              </div>
            </header>

            <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 space-y-12">

              {/* Overview */}
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-violet-400">Overview</p>
                <h1 className="mb-3 text-2xl font-semibold text-zinc-100">How the quiz works</h1>
                <p className="mb-6 text-sm leading-6 text-zinc-400">
                  The diagnostic measures competency across four domains using 40 questions — single choice, multi-select, and Likert scale.
                  Every answer is scored 0–100 and weighted into a domain score. Domain scores combine into a single Capability Score,
                  adjusted for red flag penalties. A separate Context Risk score is calculated from your role and organisation.
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { label: "Questions", value: "40", sub: "across 4 sections" },
                    { label: "Domains",   value: "4",  sub: "each scored 0–100" },
                    { label: "Archetypes", value: "10", sub: "possible outcomes" },
                  ].map(({ label, value, sub }) => (
                    <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-center">
                      <div className="text-3xl font-bold tabular-nums text-violet-400">{value}</div>
                      <div className="mt-1 text-sm font-medium text-zinc-200">{label}</div>
                      <div className="text-xs text-zinc-500">{sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Question types */}
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-zinc-500">Question types</p>
                <h2 className="mb-4 text-lg font-semibold text-zinc-100">How answers are scored</h2>
                <div className="space-y-3">
                  {[
                    { type: "Single choice", qs: "22 questions", desc: "Each option maps to an explicit score (0–100) defined in the scoring table. Options are ordered from least to most capable behaviour." },
                    { type: "Likert scale", qs: "16 questions", desc: "Rated 1–5. Maps to 0 / 25 / 50 / 75 / 100. Some questions are reverse-scored — e.g. 'How likely are you to trust AI before checking?' where 5 (always trust) = 0 points." },
                    { type: "Multi-select", qs: "4 questions", desc: "Scored as a proportion of valid options selected (task breadth, risk identification, controls awareness) or as a penalty model (data sensitivity — starting at 100 with deductions per sensitive item selected)." },
                  ].map(({ type, qs, desc }) => (
                    <div key={type} className="flex gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                      <div className="min-w-[130px]">
                        <p className="text-sm font-semibold text-zinc-200">{type}</p>
                        <p className="text-xs text-zinc-500">{qs}</p>
                      </div>
                      <p className="text-xs leading-5 text-zinc-400">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Four domains */}
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-zinc-500">Scoring model</p>
                <h2 className="mb-4 text-lg font-semibold text-zinc-100">The four domains</h2>
                <div className="space-y-4">
                  {[
                    {
                      domain: "Usage Sophistication", weight: "25%", icon: <Briefcase className="h-4 w-4" />, color: "text-violet-400 border-violet-500/30 bg-violet-500/5",
                      subs: [
                        { name: "Frequency",             w: "20%", qs: "Q2, Q7" },
                        { name: "Task Breadth",          w: "25%", qs: "Q3" },
                        { name: "Workflow Integration",  w: "25%", qs: "Q4, Q8" },
                        { name: "Tool Type",             w: "15%", qs: "Q1, Q10" },
                        { name: "Prompting Capability",  w: "15%", qs: "Q5, Q6" },
                      ],
                    },
                    {
                      domain: "Verification Discipline", weight: "30%", icon: <Brain className="h-4 w-4" />, color: "text-blue-400 border-blue-500/30 bg-blue-500/5",
                      subs: [
                        { name: "Citation Verification",         w: "30%", qs: "Q11, Q14" },
                        { name: "Legal Validation",              w: "25%", qs: "Q12, Q29" },
                        { name: "Jurisdiction Checking",         w: "10%", qs: "Q15, Q19" },
                        { name: "Misleading Output Recognition", w: "15%", qs: "Q16" },
                        { name: "Trust Before Checking (rev.)",  w: "10%", qs: "Q13, Q17" },
                        { name: "Scenario Performance",          w: "10%", qs: "Q18, Q20" },
                      ],
                    },
                    {
                      domain: "Legal Risk Awareness", weight: "25%", icon: <ShieldAlert className="h-4 w-4" />, color: "text-red-400 border-red-500/30 bg-red-500/5",
                      subs: [
                        { name: "Hallucination Awareness",      w: "20%", qs: "Q21" },
                        { name: "Risk Identification",          w: "25%", qs: "Q22, Q30" },
                        { name: "Confidentiality Awareness",    w: "25%", qs: "Q23, Q26" },
                        { name: "Tool Limitation Awareness",    w: "10%", qs: "Q25" },
                        { name: "Safe Prompting Confidence",    w: "20%", qs: "Q24, Q28" },
                      ],
                    },
                    {
                      domain: "Governance Alignment", weight: "20%", icon: <Scale className="h-4 w-4" />, color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5",
                      subs: [
                        { name: "Policy Awareness",          w: "20%", qs: "Q31, Q39, Q40" },
                        { name: "Approved Tool Awareness",   w: "20%", qs: "Q9, Q34, Q35" },
                        { name: "Training",                  w: "15%", qs: "Q32" },
                        { name: "Escalation Knowledge",      w: "15%", qs: "Q33, Q27" },
                        { name: "Control Expectations",      w: "15%", qs: "Q36, Q38" },
                        { name: "Explainability",            w: "15%", qs: "Q37" },
                      ],
                    },
                  ].map(({ domain, weight, icon, color, subs }) => {
                    const [textCls, borderCls, bgCls] = color.split(" ");
                    return (
                      <div key={domain} className={`rounded-xl border p-5 ${borderCls} ${bgCls}`}>
                        <div className="mb-3 flex items-center justify-between">
                          <div className={`flex items-center gap-2 text-sm font-semibold ${textCls}`}>
                            {icon} {domain}
                          </div>
                          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${borderCls} ${textCls}`}>
                            {weight} of Capability Score
                          </span>
                        </div>
                        <div className="divide-y divide-zinc-800 rounded-lg overflow-hidden border border-zinc-800">
                          {subs.map(({ name, w, qs }) => (
                            <div key={name} className="grid grid-cols-[1fr_50px_80px] items-center bg-zinc-900 px-3 py-2 text-xs">
                              <span className="text-zinc-300">{name}</span>
                              <span className="text-right font-semibold tabular-nums text-zinc-400">{w}</span>
                              <span className="text-right text-zinc-600">{qs}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Capability formula */}
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-zinc-500">Capability score</p>
                <h2 className="mb-4 text-lg font-semibold text-zinc-100">Final formula & tiers</h2>
                <div className="mb-4 rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-4 font-mono text-sm text-zinc-300">
                  Capability = (Usage × 0.25) + (Verification × 0.30) + (Risk × 0.25) + (Governance × 0.20) − penalties
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { tier: "High Risk", range: "0–25",  cls: "border-red-500/30 bg-red-500/10 text-red-400" },
                    { tier: "Emerging",  range: "26–50", cls: "border-orange-500/30 bg-orange-500/10 text-orange-400" },
                    { tier: "Competent", range: "51–75", cls: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400" },
                    { tier: "Advanced",  range: "76–90", cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" },
                    { tier: "Leader",    range: "91–100",cls: "border-violet-500/30 bg-violet-500/10 text-violet-400" },
                  ].map(({ tier, range, cls }) => (
                    <div key={tier} className={`rounded-lg border p-3 text-center ${cls}`}>
                      <div className="text-xs font-bold">{tier}</div>
                      <div className="mt-0.5 text-[10px] opacity-70">{range}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Red flags */}
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-red-400">Red flags</p>
                <h2 className="mb-2 text-lg font-semibold text-zinc-100">Penalty system</h2>
                <p className="mb-4 text-sm leading-6 text-zinc-400">
                  Six behaviours trigger automatic score penalties regardless of overall performance. They represent the highest-risk practitioner behaviours identified in the research literature.
                </p>
                <div className="divide-y divide-zinc-800 overflow-hidden rounded-xl border border-zinc-800">
                  {[
                    { flag: "Uses AI citations without checking",       trigger: "Q11 = 0",             penalty: "−20 pts" },
                    { flag: "Inputs sensitive or privileged data",       trigger: "Q23 includes high-risk items", penalty: "−20 pts" },
                    { flag: "No validation of AI legal reasoning",       trigger: "Q12 = 0",             penalty: "−15 pts" },
                    { flag: "Unaware of approved tools",                 trigger: "Q35 ≤ 25",            penalty: "−10 pts" },
                    { flag: "No policy awareness in large organisation", trigger: "Q31 = 0 + large org", penalty: "−10 pts" },
                    { flag: "Senior role with no escalation awareness",  trigger: "Q33 ≤ 25 + senior role", penalty: "−10 pts" },
                  ].map(({ flag, trigger, penalty }) => (
                    <div key={flag} className="grid grid-cols-[1fr_160px_80px] items-center bg-zinc-900 px-4 py-3 text-xs">
                      <span className="text-zinc-300">{flag}</span>
                      <span className="text-zinc-500">{trigger}</span>
                      <span className="text-right font-bold text-red-400">{penalty}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Context risk */}
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-zinc-500">Context risk</p>
                <h2 className="mb-2 text-lg font-semibold text-zinc-100">Role & organisation multipliers</h2>
                <p className="mb-4 text-sm leading-6 text-zinc-400">
                  Context Risk does not affect the Capability Score. It reframes the same score through the lens of professional stakes — a Partner at a large firm operating at 60% capability carries more systemic risk than a junior at a solo practice at the same score.
                </p>
                <div className="mb-3 rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-4 font-mono text-sm text-zinc-300">
                  Context Risk = (100 − Capability) × role multiplier × org multiplier
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="mb-2 text-xs font-semibold text-zinc-500 uppercase tracking-widest">Role multipliers</p>
                    <div className="divide-y divide-zinc-800 overflow-hidden rounded-lg border border-zinc-800">
                      {[
                        ["Junior / paralegal", "0.85×"],
                        ["Associate", "1.00×"],
                        ["Senior lawyer", "1.10×"],
                        ["Partner", "1.25×"],
                        ["In-house counsel", "1.15×"],
                        ["Other", "1.00×"],
                      ].map(([role, mult]) => (
                        <div key={role} className="flex items-center justify-between bg-zinc-900 px-3 py-2 text-xs">
                          <span className="text-zinc-400">{role}</span>
                          <span className="font-bold tabular-nums text-zinc-300">{mult}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-semibold text-zinc-500 uppercase tracking-widest">Org multipliers</p>
                    <div className="divide-y divide-zinc-800 overflow-hidden rounded-lg border border-zinc-800">
                      {[
                        ["Solo practice", "0.90×"],
                        ["Small firm", "0.95×"],
                        ["Mid-sized firm", "1.00×"],
                        ["Large firm", "1.10×"],
                        ["In-house legal team", "1.20×"],
                        ["Public institution", "1.00×"],
                      ].map(([org, mult]) => (
                        <div key={org} className="flex items-center justify-between bg-zinc-900 px-3 py-2 text-xs">
                          <span className="text-zinc-400">{org}</span>
                          <span className="font-bold tabular-nums text-zinc-300">{mult}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Archetype assignment */}
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-zinc-500">Archetypes</p>
                <h2 className="mb-2 text-lg font-semibold text-zinc-100">How archetypes are assigned</h2>
                <p className="mb-4 text-sm leading-6 text-zinc-400">
                  Archetypes are assigned in priority order — the first rule that matches wins. This reflects the most diagnostically significant pattern in the score profile.
                </p>
                <div className="divide-y divide-zinc-800 overflow-hidden rounded-xl border border-zinc-800">
                  {[
                    { n: "1", name: "Over-Reliant Operator",   condition: "Usage ≥ 60 and Verification < 45, OR total penalties ≥ 20" },
                    { n: "2", name: "Shadow User",             condition: "Governance < 40 and Usage ≥ 50" },
                    { n: "3", name: "Efficiency Chaser",       condition: "Usage ≥ 70 and Verification 40–60" },
                    { n: "4", name: "AI Avoider",              condition: "Usage < 35 and Verification ≥ 55" },
                    { n: "5", name: "Traditionalist",          condition: "Usage < 25 and Risk Awareness ≥ 70" },
                    { n: "6", name: "Hesitant Adopter",        condition: "Usage 25–45 and Prompting < 50" },
                    { n: "7", name: "Cautious Checker",        condition: "Verification ≥ 75 and Usage < 55" },
                    { n: "8", name: "Balanced Practitioner",   condition: "All domains 50–75 and penalties < 20" },
                    { n: "9", name: "AI Power User",           condition: "Usage ≥ 75, Verification ≥ 70, Risk ≥ 65" },
                    { n: "10", name: "Strategic Leader",       condition: "Capability ≥ 85, Governance ≥ 80, senior role" },
                  ].map(({ n, name, condition }) => (
                    <div key={name} className="grid grid-cols-[28px_160px_1fr] items-start gap-3 bg-zinc-900 px-4 py-3 text-xs">
                      <span className="font-bold tabular-nums text-zinc-600">{n}</span>
                      <span className="font-semibold text-zinc-200">{name}</span>
                      <span className="text-zinc-500">{condition}</span>
                    </div>
                  ))}
                </div>
              </div>

            </main>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Sources overlay ── */}
      <AnimatePresence>
        {showSources && (
          <motion.div
            key="sources"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950"
          >
            {/* Sources nav */}
            <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-sm">
              <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
                <button
                  onClick={() => setShowSources(false)}
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200 active:scale-95"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <div className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
                  <BookOpen className="h-4 w-4 text-violet-400" /> Sources
                </div>
                <div className="w-20" />
              </div>
            </header>

            <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-violet-400">References</p>
              <h1 className="mb-2 text-2xl font-semibold text-zinc-100">Sources & further reading</h1>
              <p className="mb-10 text-sm leading-6 text-zinc-400">
                Statistics marked as illustrative in the tool are demo placeholders for presentation purposes.
                The sources below represent the primary research and guidance this tool draws on for framing and context.
              </p>

              {[
                {
                  category: "Industry Research",
                  color: "text-violet-400",
                  sources: [
                    {
                      title: "Clio Legal Trends Report — UK Edition",
                      author: "Clio",
                      year: "2024",
                      note: "Primary source for UK AI adoption figures: 96% of law firms integrating AI, 62% planning expansion, and task-level usage breakdown.",
                      url: "https://www.clio.com/uk/blog/ai-technology-trends/",
                    },
                    {
                      title: "Future of Professionals Report",
                      author: "Thomson Reuters Institute",
                      year: "2023",
                      note: "Research on AI adoption patterns, efficiency gains, and risk perceptions across the legal profession globally.",
                      url: null,
                    },
                    {
                      title: "Law Firms in Transition Survey",
                      author: "Altman Weil",
                      year: "2023",
                      note: "Longitudinal survey data on technology adoption, AI investment, and productivity impact in law firms.",
                      url: null,
                    },
                    {
                      title: "The State of AI in Legal — UK Focus",
                      author: "LexisNexis",
                      year: "2024",
                      note: "Tool usage, governance readiness, and verification practices among UK legal practitioners.",
                      url: null,
                    },
                  ],
                },
                {
                  category: "Regulation & Professional Conduct",
                  color: "text-sky-400",
                  sources: [
                    {
                      title: "AI and the Legal Profession: Guidance for Solicitors",
                      author: "Solicitors Regulation Authority (SRA)",
                      year: "2024",
                      note: "SRA guidance on professional obligations when using AI, including disclosure, verification, and confidentiality requirements.",
                      url: null,
                    },
                    {
                      title: "Generative AI: Initial Reflections",
                      author: "Bar Standards Board (BSB)",
                      year: "2023",
                      note: "Regulatory position on barristers' use of AI tools in practice, focusing on core duties and client care.",
                      url: null,
                    },
                    {
                      title: "Technology and the Law: A Framework for Responsible Innovation",
                      author: "Law Society of England and Wales",
                      year: "2023",
                      note: "Ethical framework and practical guidance for lawyers adopting AI and other legal technologies.",
                      url: null,
                    },
                  ],
                },
                {
                  category: "AI Risk & Hallucination",
                  color: "text-red-400",
                  sources: [
                    {
                      title: "Hallucination in Large Language Models: A Survey",
                      author: "Huang et al.",
                      year: "2023",
                      note: "Academic survey of hallucination rates and types across major LLMs, including legal and factual domains.",
                      url: null,
                    },
                    {
                      title: "ChatGPT as a Legal Research Tool: Risks and Limitations",
                      author: "Stanford CodeX — Centre for Legal Informatics",
                      year: "2023",
                      note: "Analysis of citation fabrication rates and jurisdictional error patterns in generative AI legal outputs.",
                      url: null,
                    },
                    {
                      title: "AI Bias in Legal Decision-Making",
                      author: "Harvard Law Review",
                      year: "2022",
                      note: "Review of documented bias patterns in AI systems applied to legal contexts, including criminal justice and contract analysis.",
                      url: null,
                    },
                  ],
                },
                {
                  category: "Sustainable Development Goals",
                  color: "text-emerald-400",
                  sources: [
                    {
                      title: "SDG 16 — Peace, Justice and Strong Institutions",
                      author: "United Nations",
                      year: "2015–present",
                      note: "Framework for access to justice, rule of law, and accountable institutions. Relevant to AI's role in democratising or restricting legal access.",
                      url: "https://sdgs.un.org/goals/goal16",
                    },
                    {
                      title: "SDG 10 — Reduced Inequalities",
                      author: "United Nations",
                      year: "2015–present",
                      note: "Goal addressing inequality within and between countries. Relevant to differential AI adoption across firm sizes and geographies.",
                      url: "https://sdgs.un.org/goals/goal10",
                    },
                    {
                      title: "SDG 8 — Decent Work and Economic Growth",
                      author: "United Nations",
                      year: "2015–present",
                      note: "Goal covering productivity, workforce transformation, and sustainable economic activity. Relevant to AI's impact on legal employment.",
                      url: "https://sdgs.un.org/goals/goal8",
                    },
                  ],
                },
              ].map(({ category, color, sources }) => (
                <div key={category} className="mb-10">
                  <p className={`mb-4 text-xs font-semibold uppercase tracking-widest ${color}`}>{category}</p>
                  <div className="space-y-3">
                    {sources.map(({ title, author, year, note, url }) => (
                      <div key={title} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-zinc-100 leading-snug">{title}</p>
                            <p className="mt-0.5 text-xs text-zinc-500">{author} · {year}</p>
                          </div>
                          {url ? (
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-300 transition hover:bg-violet-500/20 hover:text-violet-200"
                            >
                              Open <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="inline-flex shrink-0 items-center rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-600">
                              No link
                            </span>
                          )}
                        </div>
                        <p className="text-xs leading-5 text-zinc-400">{note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-5 text-xs leading-6 text-zinc-500">
                <span className="font-semibold text-zinc-400">Disclaimer: </span>
                Quantitative figures presented in the tool that are not attributed to a specific source are illustrative
                benchmarks compiled for demonstration purposes. They are intended to represent plausible sector-level
                patterns and should not be cited as empirical data.
              </div>
            </main>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Lawtech Dashboard overlay ── */}
      <AnimatePresence>
        {showDashboard && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex flex-col bg-zinc-950"
          >
            <header className="shrink-0 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-sm">
              <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
                <button
                  onClick={() => setShowDashboard(false)}
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200 active:scale-95"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <div className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
                  <BarChart2 className="h-4 w-4 text-[#f4845f]" /> UK Lawtech Reality Check
                </div>
                <div className="w-20" />
              </div>
            </header>
            <iframe
              src={`${import.meta.env.BASE_URL}lawtech_reality_check.html`}
              className="min-h-0 flex-1 w-full border-0"
              title="UK Lawtech Reality Check Dashboard"
            />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
