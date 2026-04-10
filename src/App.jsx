import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Briefcase, Scale, Leaf, ShieldAlert, Brain, ArrowRight, RotateCcw, CheckCircle2 } from "lucide-react";

const personas = {
  cautiousTraditionalist: {
    code: "CT",
    name: "Tech Boomer",
    subtitle: "Cautious Traditionalist",
    summary:
      "You are careful, sceptical, and unlikely to trust AI too quickly. That protects you from obvious mistakes, but it may also stop you from using useful tools efficiently.",
    strengths: ["Strong professional caution", "High instinct for risk", "Less likely to over-trust outputs"],
    weaknesses: ["Low confidence with AI tools", "Missed efficiency gains", "May avoid learning useful workflows"],
    nextSteps: [
      "Start with low-risk uses like summarising public documents.",
      "Learn a simple prompt structure: task, context, format, limits.",
      "Build confidence by verifying every output manually."
    ]
  },
  promptApprentice: {
    code: "PA",
    name: "Prompt Apprentice",
    subtitle: "Emerging AI User",
    summary:
      "You are open to using AI, but your methods are still basic. You can improve quickly by learning prompting, verification, and confidentiality boundaries.",
    strengths: ["Curious and adaptable", "Willing to experiment", "Good foundation for growth"],
    weaknesses: ["Inconsistent prompting", "May miss legal-risk red flags", "Limited awareness of sustainability impacts"],
    nextSteps: [
      "Use scenario-based prompts with clear instructions and output format.",
      "Create a checklist for verifying cases, citations, and legal reasoning.",
      "Learn when not to paste sensitive client information into tools."
    ]
  },
  pragmaticAdopter: {
    code: "LP",
    name: "LegalTech Pragmatist",
    subtitle: "Balanced Adopter",
    summary:
      "You use AI strategically and understand both the opportunities and limits. You are efficient without abandoning professional judgement.",
    strengths: ["Balanced decision-making", "Good verification habits", "Practical, workflow-focused use"],
    weaknesses: ["Could deepen technical fluency", "May underplay long-term societal effects", "Risk of staying only at operational level"],
    nextSteps: [
      "Develop reusable prompt templates for common legal tasks.",
      "Track where AI genuinely saves time versus where it adds risk.",
      "Expand your awareness of justice, labour, and environmental impacts."
    ]
  },
  overconfidentOperator: {
    code: "AO",
    name: "AI Power User",
    subtitle: "Overconfident Operator",
    summary:
      "You move fast and know how to get outputs, but your confidence may outpace your caution. Your biggest risk is over-reliance.",
    strengths: ["High efficiency", "Strong experimentation mindset", "Comfortable integrating tools into workflows"],
    weaknesses: ["May trust outputs too quickly", "Higher confidentiality risk", "May overlook bias or hallucinations"],
    nextSteps: [
      "Slow down on high-stakes tasks and verify everything critical.",
      "Add a red-team step: what could be wrong, biased, or invented?",
      "Treat AI as an assistant, not a substitute for legal judgement."
    ]
  },
  ethicalInnovator: {
    code: "EI",
    name: "Ethical Innovator",
    subtitle: "Responsible AI Leader",
    summary:
      "You combine practical AI skill with ethical judgement, professional caution, and awareness of social impact. You are well placed to guide responsible adoption.",
    strengths: ["Strong technical and ethical balance", "Excellent risk awareness", "Thinks beyond efficiency to justice and sustainability"],
    weaknesses: ["May overanalyse low-risk tasks", "Could spend too much time on governance details"],
    nextSteps: [
      "Share best-practice workflows with colleagues.",
      "Help develop internal AI-use guidelines and training.",
      "Keep reviewing new tools as regulation and professional standards evolve."
    ]
  }
};

const roleOptions = [
  "Law student / trainee",
  "Junior lawyer / associate",
  "Senior lawyer / partner",
  "In-house counsel",
  "Public sector / government / court",
  "Other legal professional"
];

const orgOptions = [
  "Solo practice",
  "Small firm",
  "Mid-sized firm",
  "Large firm",
  "In-house legal team",
  "Public institution"
];

const questions = [
  {
    id: 1,
    category: "practical",
    icon: Briefcase,
    title: "You need a first draft of a client update under time pressure. How do you use AI?",
    options: [
      { text: "I avoid AI and write it manually.", scores: { practical: 0, ethics: 2, critical: 2, societal: 0, sustainability: 0 } },
      { text: "I ask AI for a rough draft, then rewrite and verify it carefully.", scores: { practical: 3, ethics: 3, critical: 3, societal: 1, sustainability: 0 } },
      { text: "I generate a polished draft and make only light edits.", scores: { practical: 3, ethics: 0, critical: 0, societal: 0, sustainability: 0 } },
      { text: "I use a structured prompt with audience, tone, risks, and required format, then verify every substantive claim.", scores: { practical: 4, ethics: 3, critical: 4, societal: 1, sustainability: 0 } }
    ]
  },
  {
    id: 2,
    category: "ethics",
    icon: ShieldAlert,
    title: "What is your biggest concern when using AI for legal work?",
    options: [
      { text: "It feels unfamiliar, so I prefer not to use it.", scores: { practical: 0, ethics: 1, critical: 1, societal: 0, sustainability: 0 } },
      { text: "That it might produce inaccurate or invented legal information.", scores: { practical: 1, ethics: 3, critical: 4, societal: 1, sustainability: 0 } },
      { text: "That I might not get the most efficient output.", scores: { practical: 3, ethics: 0, critical: 0, societal: 0, sustainability: 0 } },
      { text: "That it could create errors, confidentiality breaches, bias, and accountability problems if used carelessly.", scores: { practical: 2, ethics: 4, critical: 3, societal: 3, sustainability: 1 } }
    ]
  },
  {
    id: 3,
    category: "critical",
    icon: Brain,
    title: "AI gives you a case citation that supports your argument. What do you do next?",
    options: [
      { text: "Use it if it sounds plausible.", scores: { practical: 2, ethics: 0, critical: 0, societal: 0, sustainability: 0 } },
      { text: "Check the citation exists and read the source directly.", scores: { practical: 2, ethics: 3, critical: 4, societal: 1, sustainability: 0 } },
      { text: "Replace it with another AI-generated citation.", scores: { practical: 1, ethics: 0, critical: 0, societal: 0, sustainability: 0 } },
      { text: "Avoid AI completely in legal research forever.", scores: { practical: 0, ethics: 1, critical: 2, societal: 0, sustainability: 0 } }
    ]
  },
  {
    id: 4,
    category: "societal",
    icon: Scale,
    title: "How do you think AI could affect access to justice?",
    options: [
      { text: "Mostly positively, because it will make legal help cheaper and faster.", scores: { practical: 1, ethics: 1, critical: 1, societal: 2, sustainability: 0 } },
      { text: "Mostly negatively, because machines should never be involved in law.", scores: { practical: 0, ethics: 1, critical: 1, societal: 1, sustainability: 0 } },
      { text: "Both: it may widen access, but also create new risks for fairness, trust, and digital exclusion.", scores: { practical: 2, ethics: 3, critical: 3, societal: 4, sustainability: 1 } },
      { text: "I have not thought about that before.", scores: { practical: 0, ethics: 0, critical: 0, societal: 0, sustainability: 0 } }
    ]
  },
  {
    id: 5,
    category: "ethics",
    icon: ShieldAlert,
    title: "A colleague pastes sensitive client information into a public AI chatbot. Your reaction?",
    options: [
      { text: "That is fine if it saves time.", scores: { practical: 2, ethics: 0, critical: 0, societal: 0, sustainability: 0 } },
      { text: "That seems risky, but I am not sure why.", scores: { practical: 1, ethics: 1, critical: 1, societal: 0, sustainability: 0 } },
      { text: "That could breach confidentiality and data protection expectations, so safer alternatives or approved tools are needed.", scores: { practical: 2, ethics: 4, critical: 3, societal: 2, sustainability: 0 } },
      { text: "I would only worry if the output looked wrong.", scores: { practical: 1, ethics: 0, critical: 1, societal: 0, sustainability: 0 } }
    ]
  },
  {
    id: 6,
    category: "sustainability",
    icon: Leaf,
    title: "What best reflects your view of AI and the environment?",
    options: [
      { text: "I do not think AI has much environmental impact.", scores: { practical: 0, ethics: 0, critical: 0, societal: 0, sustainability: 0 } },
      { text: "AI uses energy, but efficiency gains probably cancel it out in every case.", scores: { practical: 1, ethics: 0, critical: 1, societal: 1, sustainability: 1 } },
      { text: "AI systems can consume significant energy and water through data-centre infrastructure, so use should be proportionate and purposeful.", scores: { practical: 2, ethics: 2, critical: 2, societal: 2, sustainability: 4 } },
      { text: "The environmental issue matters more than accuracy or confidentiality.", scores: { practical: 0, ethics: 1, critical: 1, societal: 1, sustainability: 3 } }
    ]
  },
  {
    id: 7,
    category: "practical",
    icon: Briefcase,
    title: "Which prompt is strongest for legal work?",
    options: [
      { text: '"Write something about contract risk."', scores: { practical: 0, ethics: 0, critical: 0, societal: 0, sustainability: 0 } },
      { text: '"Summarise this contract."', scores: { practical: 1, ethics: 0, critical: 1, societal: 0, sustainability: 0 } },
      { text: '"Act as a lawyer and tell me if this is enforceable."', scores: { practical: 1, ethics: 0, critical: 1, societal: 0, sustainability: 0 } },
      { text: '"Review the clause for termination risk. Give a bullet summary, flag ambiguities, do not invent authorities, and note what needs human legal review."', scores: { practical: 4, ethics: 3, critical: 3, societal: 1, sustainability: 0 } }
    ]
  },
  {
    id: 8,
    category: "societal",
    icon: Scale,
    title: "Who is most at risk of being affected unequally by AI adoption in law?",
    options: [
      { text: "No one in particular; technology affects everyone the same way.", scores: { practical: 0, ethics: 0, critical: 0, societal: 0, sustainability: 0 } },
      { text: "Junior staff, small firms, and people with limited digital access or legal resources.", scores: { practical: 1, ethics: 2, critical: 2, societal: 4, sustainability: 0 } },
      { text: "Only senior lawyers, because strategy is hardest to automate.", scores: { practical: 0, ethics: 0, critical: 1, societal: 1, sustainability: 0 } },
      { text: "Only clients, because lawyers will adapt easily.", scores: { practical: 0, ethics: 0, critical: 1, societal: 1, sustainability: 0 } }
    ]
  },
  {
    id: 9,
    category: "critical",
    icon: Brain,
    title: "How should AI fit into legal judgement?",
    options: [
      { text: "It should replace most routine legal reasoning where possible.", scores: { practical: 2, ethics: 0, critical: 0, societal: 0, sustainability: 0 } },
      { text: "It should support human decision-making, not replace professional judgement in high-stakes contexts.", scores: { practical: 2, ethics: 4, critical: 4, societal: 3, sustainability: 1 } },
      { text: "It should never be used in any legal context.", scores: { practical: 0, ethics: 1, critical: 1, societal: 0, sustainability: 0 } },
      { text: "It depends mainly on whether the outputs sound confident.", scores: { practical: 1, ethics: 0, critical: 0, societal: 0, sustainability: 0 } }
    ]
  },
  {
    id: 10,
    category: "ethics",
    icon: ShieldAlert,
    title: "Which statement best reflects responsible AI use in law?",
    options: [
      { text: "If AI saves time, that usually justifies using it.", scores: { practical: 2, ethics: 0, critical: 1, societal: 0, sustainability: 0 } },
      { text: "Responsibility stays with the human legal professional, even when AI assists the work.", scores: { practical: 2, ethics: 4, critical: 3, societal: 2, sustainability: 0 } },
      { text: "The tool provider is responsible for any legal mistake.", scores: { practical: 0, ethics: 0, critical: 1, societal: 1, sustainability: 0 } },
      { text: "There is no need to explain AI use to clients if the output is good.", scores: { practical: 1, ethics: 0, critical: 0, societal: 0, sustainability: 0 } }
    ]
  }
];

const categoryMeta = {
  practical: { label: "Practical Use", icon: Briefcase },
  ethics: { label: "Ethics & Risk", icon: ShieldAlert },
  critical: { label: "Critical Oversight", icon: Brain },
  societal: { label: "Societal Impact", icon: Scale },
  sustainability: { label: "Sustainability", icon: Leaf }
};

function getPersona(traits) {
  const total = Object.values(traits).reduce((a, b) => a + b, 0);
  const avg = total / 5;

  if (avg >= 3.1 && traits.ethics >= 3 && traits.critical >= 3 && traits.societal >= 2.5) {
    return "ethicalInnovator";
  }
  if (traits.practical >= 3 && traits.ethics < 2 && traits.critical < 2.5) {
    return "overconfidentOperator";
  }
  if (avg < 1.5 && traits.practical < 1.5) {
    return "cautiousTraditionalist";
  }
  if (traits.practical >= 2 && traits.ethics >= 2 && traits.critical >= 2) {
    return "pragmaticAdopter";
  }
  return "promptApprentice";
}

function ScoreBar({ label, value }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-500">{value}/4</span>
      </div>
      <Progress value={(value / 4) * 100} className="h-3" />
    </div>
  );
}

function Pill({ children }) {
  return <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{children}</span>;
}

export default function LegalTechAiQuiz() {
  const [step, setStep] = useState("intro");
  const [profile, setProfile] = useState({ name: "", role: "", org: "", experience: "" });
  const [answers, setAnswers] = useState({});

  const answeredCount = Object.keys(answers).length;
  const currentQuestionIndex = step === "quiz" ? answeredCount : 0;
  const currentQuestion = questions[currentQuestionIndex];
  const progress = (answeredCount / questions.length) * 100;

  const traitScores = useMemo(() => {
    const sums = { practical: 0, ethics: 0, critical: 0, societal: 0, sustainability: 0 };
    Object.values(answers).forEach((option) => {
      Object.entries(option.scores).forEach(([k, v]) => {
        sums[k] += v;
      });
    });

    const count = Math.max(1, Object.keys(answers).length);
    return {
      practical: Number((sums.practical / Math.min(count, questions.length)).toFixed(1)),
      ethics: Number((sums.ethics / Math.min(count, questions.length)).toFixed(1)),
      critical: Number((sums.critical / Math.min(count, questions.length)).toFixed(1)),
      societal: Number((sums.societal / Math.min(count, questions.length)).toFixed(1)),
      sustainability: Number((sums.sustainability / Math.min(count, questions.length)).toFixed(1))
    };
  }, [answers]);

  const personaKey = getPersona(traitScores);
  const persona = personas[personaKey];

  const handleProfileStart = () => {
    setStep("quiz");
  };

  const handleAnswer = (option) => {
    const q = questions[currentQuestionIndex];
    const nextAnswers = { ...answers, [q.id]: option };
    setAnswers(nextAnswers);
    if (Object.keys(nextAnswers).length === questions.length) {
      setStep("results");
    }
  };

  const restart = () => {
    setStep("intro");
    setProfile({ name: "", role: "", org: "", experience: "" });
    setAnswers({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Badge className="rounded-full">AI Literacy for Lawyers</Badge>
              <Badge variant="outline" className="rounded-full">Quiz Prototype</Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-5xl">
              What’s your LegalTech personality?
            </h1>
            <p className="mt-3 max-w-3xl text-base text-slate-600 md:text-lg">
              A gamified front-end concept for assessing AI literacy, ethical awareness, and readiness for responsible AI use in legal practice.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur">
            <div className="text-sm text-slate-500">Focus areas</div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Pill>Prompting</Pill>
              <Pill>Confidentiality</Pill>
              <Pill>Bias & hallucinations</Pill>
              <Pill>Access to justice</Pill>
              <Pill>Environmental impact</Pill>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]"
            >
              <Card className="rounded-3xl border-0 shadow-lg shadow-slate-200/60">
                <CardHeader>
                  <CardTitle className="text-2xl">Take the quiz</CardTitle>
                  <CardDescription className="text-base leading-7">
                    This mock website is designed like a professional self-assessment tool. Users answer scenario-based questions and receive a persona, score breakdown, and tailored recommendations.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Name</label>
                      <Input
                        placeholder="Optional"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        className="rounded-2xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Experience with AI</label>
                      <select
                        value={profile.experience}
                        onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                      >
                        <option value="">Select one</option>
                        <option>Beginner</option>
                        <option>Intermediate</option>
                        <option>Advanced</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Role</label>
                      <select
                        value={profile.role}
                        onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                      >
                        <option value="">Select role</option>
                        {roleOptions.map((role) => (
                          <option key={role}>{role}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Organisation type</label>
                      <select
                        value={profile.org}
                        onChange={(e) => setProfile({ ...profile, org: e.target.value })}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                      >
                        <option value="">Select organisation</option>
                        {orgOptions.map((org) => (
                          <option key={org}>{org}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-3xl bg-slate-50 p-4">
                      <div className="mb-2 flex items-center gap-2 font-semibold text-slate-800"><Brain className="h-4 w-4" /> 10 scenario questions</div>
                      <p className="text-sm leading-6 text-slate-600">Focused on real legal workflows rather than generic personality prompts.</p>
                    </div>
                    <div className="rounded-3xl bg-slate-50 p-4">
                      <div className="mb-2 flex items-center gap-2 font-semibold text-slate-800"><ShieldAlert className="h-4 w-4" /> Ethics embedded</div>
                      <p className="text-sm leading-6 text-slate-600">Bias, confidentiality, hallucinations, accountability, and responsible use.</p>
                    </div>
                    <div className="rounded-3xl bg-slate-50 p-4">
                      <div className="mb-2 flex items-center gap-2 font-semibold text-slate-800"><Leaf className="h-4 w-4" /> Societal focus</div>
                      <p className="text-sm leading-6 text-slate-600">Includes sustainability, labour impacts, and access-to-justice concerns.</p>
                    </div>
                  </div>

                  <Button onClick={handleProfileStart} size="lg" className="rounded-2xl px-6">
                    Start assessment <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-0 shadow-lg shadow-slate-200/60">
                <CardHeader>
                  <CardTitle>Persona types</CardTitle>
                  <CardDescription>Inspired by personality-quiz design, but built around AI literacy and professional judgement.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.values(personas).map((p) => (
                    <div key={p.code} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold text-slate-900">{p.name}</div>
                          <div className="text-sm text-slate-500">{p.subtitle}</div>
                        </div>
                        <Badge variant="outline" className="rounded-full">{p.code}</Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === "quiz" && currentQuestion && (
            <motion.div
              key={`question-${currentQuestion.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr]"
            >
              <Card className="rounded-3xl border-0 shadow-lg shadow-slate-200/60">
                <CardHeader>
                  <CardTitle>Assessment progress</CardTitle>
                  <CardDescription>
                    {answeredCount} of {questions.length} completed
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Progress value={progress} className="h-3" />
                  <div className="grid gap-3">
                    {Object.entries(categoryMeta).map(([key, meta]) => {
                      const Icon = meta.icon;
                      return (
                        <div key={key} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
                          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                            <Icon className="h-4 w-4" /> {meta.label}
                          </div>
                          <span className="text-sm text-slate-500">{traitScores[key]}/4</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                    This quiz is designed as a coursework prototype. In a final version, each answer could also unlock short educational explainers and safer-use tips.
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-0 shadow-lg shadow-slate-200/60">
                <CardHeader>
                  <div className="mb-3 flex items-center gap-2">
                    <Badge variant="outline" className="rounded-full">Question {currentQuestionIndex + 1}</Badge>
                    <Badge className="rounded-full">{categoryMeta[currentQuestion.category].label}</Badge>
                  </div>
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                    {React.createElement(currentQuestion.icon, { className: "h-6 w-6 text-slate-700" })}
                  </div>
                  <CardTitle className="text-2xl leading-tight">{currentQuestion.title}</CardTitle>
                  <CardDescription>Select the response that best matches what you would actually do.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  {currentQuestion.options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(option)}
                      className="rounded-3xl border border-slate-200 bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                    >
                      <div className="flex items-start gap-4">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <div className="text-sm leading-7 text-slate-700 md:text-base">{option.text}</div>
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === "results" && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <Card className="rounded-3xl border-0 shadow-lg shadow-slate-200/60">
                <CardContent className="grid gap-6 p-6 md:grid-cols-[0.9fr_1.1fr] md:p-8">
                  <div className="rounded-[2rem] bg-slate-900 p-6 text-white md:p-8">
                    <div className="mb-4 flex items-center gap-2">
                      <Badge className="rounded-full bg-white/10 text-white hover:bg-white/10">Your persona</Badge>
                      <Badge variant="outline" className="rounded-full border-white/20 text-white">{persona.code}</Badge>
                    </div>
                    <h2 className="text-3xl font-bold md:text-4xl">{persona.name}</h2>
                    <p className="mt-2 text-lg text-slate-300">{persona.subtitle}</p>
                    <p className="mt-6 leading-7 text-slate-200">{persona.summary}</p>
                    <div className="mt-6 flex flex-wrap gap-2">
                      {profile.role && <Pill>{profile.role}</Pill>}
                      {profile.org && <Pill>{profile.org}</Pill>}
                      {profile.experience && <Pill>{profile.experience}</Pill>}
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <div className="text-sm font-medium uppercase tracking-[0.15em] text-slate-500">Assessment overview</div>
                      <h3 className="mt-2 text-2xl font-bold text-slate-900">
                        {profile.name ? `${profile.name}, here’s your LegalTech profile.` : "Here’s your LegalTech profile."}
                      </h3>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-3xl bg-slate-50 p-4">
                        <div className="mb-2 flex items-center gap-2 font-semibold text-slate-800"><CheckCircle2 className="h-4 w-4" /> Strengths</div>
                        <ul className="space-y-2 text-sm leading-6 text-slate-700">
                          {persona.strengths.map((item) => <li key={item}>• {item}</li>)}
                        </ul>
                      </div>
                      <div className="rounded-3xl bg-slate-50 p-4">
                        <div className="mb-2 flex items-center gap-2 font-semibold text-slate-800"><ShieldAlert className="h-4 w-4" /> Risks to watch</div>
                        <ul className="space-y-2 text-sm leading-6 text-slate-700">
                          {persona.weaknesses.map((item) => <li key={item}>• {item}</li>)}
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
                <Card className="rounded-3xl border-0 shadow-lg shadow-slate-200/60">
                  <CardHeader>
                    <CardTitle>Score breakdown</CardTitle>
                    <CardDescription>Each dimension reflects a different part of AI literacy in legal practice.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <ScoreBar label="Practical Use" value={traitScores.practical} />
                    <ScoreBar label="Ethics & Risk" value={traitScores.ethics} />
                    <ScoreBar label="Critical Oversight" value={traitScores.critical} />
                    <ScoreBar label="Societal Impact" value={traitScores.societal} />
                    <ScoreBar label="Sustainability" value={traitScores.sustainability} />
                  </CardContent>
                </Card>

                <Card className="rounded-3xl border-0 shadow-lg shadow-slate-200/60">
                  <CardHeader>
                    <CardTitle>Recommended next steps</CardTitle>
                    <CardDescription>Personalised actions to improve safe and effective AI use.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {persona.nextSteps.map((stepText, idx) => (
                      <div key={idx} className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                        <span className="font-semibold text-slate-900">{idx + 1}.</span> {stepText}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                <Card className="rounded-3xl border-0 shadow-lg shadow-slate-200/60 lg:col-span-2">
                  <CardHeader>
                    <CardTitle>What this prototype is teaching</CardTitle>
                    <CardDescription>This section helps you connect the quiz to the societal implications of AI in law.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-3xl bg-slate-50 p-4">
                      <div className="font-semibold text-slate-900">Professional responsibility</div>
                      <p className="mt-2 text-sm leading-6 text-slate-700">Lawyers remain accountable for work produced with AI assistance. Outputs must be verified, especially where rights, liability, or legal advice are involved.</p>
                    </div>
                    <div className="rounded-3xl bg-slate-50 p-4">
                      <div className="font-semibold text-slate-900">Ethics and bias</div>
                      <p className="mt-2 text-sm leading-6 text-slate-700">AI can reflect bias, invent citations, and obscure reasoning. Responsible use depends on transparency, oversight, and awareness of limitations.</p>
                    </div>
                    <div className="rounded-3xl bg-slate-50 p-4">
                      <div className="font-semibold text-slate-900">Societal inequality</div>
                      <p className="mt-2 text-sm leading-6 text-slate-700">AI adoption may benefit large firms more quickly than smaller practices, and could reshape entry-level legal work, access to justice, and public trust.</p>
                    </div>
                    <div className="rounded-3xl bg-slate-50 p-4">
                      <div className="font-semibold text-slate-900">Environmental impact</div>
                      <p className="mt-2 text-sm leading-6 text-slate-700">AI is not cost-free. Model training and inference rely on energy-intensive infrastructure, so use should be proportionate and purposeful.</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-3xl border-0 shadow-lg shadow-slate-200/60">
                  <CardHeader>
                    <CardTitle>SDG links</CardTitle>
                    <CardDescription>How this artefact connects to wider social goals.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm leading-6 text-slate-700">
                    <div className="rounded-2xl bg-slate-50 p-4"><span className="font-semibold text-slate-900">SDG 8</span> — Decent work and economic change in the legal profession.</div>
                    <div className="rounded-2xl bg-slate-50 p-4"><span className="font-semibold text-slate-900">SDG 9</span> — Innovation in legal infrastructure and LegalTech adoption.</div>
                    <div className="rounded-2xl bg-slate-50 p-4"><span className="font-semibold text-slate-900">SDG 16</span> — Access to justice, fairness, trust, and strong institutions.</div>
                    <Button onClick={restart} variant="outline" className="mt-2 w-full rounded-2xl">
                      <RotateCcw className="mr-2 h-4 w-4" /> Retake quiz
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
