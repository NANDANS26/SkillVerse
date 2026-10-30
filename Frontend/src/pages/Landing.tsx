// Frontend/src/pages/Landing.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Brain, 
  GraduationCap, 
  Building2, 
  Users, 
      ChevronDown, 
    Briefcase, 
  Menu, 
  X,
  } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { CANONICAL_ROLES, ROLE_LABELS, UserRole, getRoleDashboardPath } from '../types/roles';

export default function Landing() {
  const { user, startDemoMode } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleLaunchDemo = (role: UserRole = 'student') => {
    startDemoMode(role);
    navigate(getRoleDashboardPath(role));
  };

  const steps = [
    {
      num: '01',
      title: 'Telemetry & Code Ingestion',
      desc: 'Connect GitHub repositories, Chrome browser study hours, and academic lab submissions.'
    },
    {
      num: '02',
      title: 'Skill DNA Extraction',
      desc: 'Natural language analysis parses multi-dimensional technical concepts into a standardized taxonomy.'
    },
    {
      num: '03',
      title: 'Objective Benchmarks',
      desc: 'Standardized tests and automated code execution verify real proficiency without inflated claims.'
    },
    {
      num: '04',
      title: 'Verified Competency Profiles',
      desc: 'Audited skill graphs provide explainable proof of mastery backed by Git commits and test outputs.'
    },
    {
      num: '05',
      title: 'Vector-Dense AI Matching',
      desc: 'FastAPI and FAISS rank candidate vectors against job requirements using cosine similarity.'
    },
    {
      num: '06',
      title: 'Frictionless Talent Placement',
      desc: 'Direct recruiter scheduling, institutional curriculum alerts, and continuous career growth.'
    }
  ];

  const pillars = [
    {
      icon: GraduationCap,
      role: 'student' as UserRole,
      title: 'For Students & Learners',
      subtitle: 'Career Progression Grounded in Proof',
      desc: 'Turn your GitHub repos, coding challenges, and coursework into a verified Skill DNA graph. Receive objective job matches and targeted learning roadmaps.',
      bullets: ['Automatic skill verification from code', 'AI-matched job requisitions', 'Targeted skill gap recommendations']
    },
    {
      icon: Building2,
      role: 'college_admin' as UserRole,
      title: 'For Universities & Colleges',
      subtitle: 'Institutional Placement Telemetry',
      desc: 'Empower placement cells and deans with real-time cohort readiness analytics. Identify curriculum skill gaps compared against live industry requisitions.',
      bullets: ['Accreditation-ready placement reports', 'Industry vs curriculum gap heatmaps', 'Faculty advisor assignment oversight']
    },
    {
      icon: Users,
      role: 'faculty' as UserRole,
      title: 'For Faculty & Mentors',
      subtitle: 'Academic Mentorship & Lab Grading',
      desc: 'Track mentee skill trajectories across semesters. Review code submissions, flag students at risk of falling behind, and benchmark class outcomes.',
      bullets: ['Automated code execution assessment', 'Early-warning at-risk student alerts', 'Longitudinal cohort competency tracking']
    },
    {
      icon: Briefcase,
      role: 'recruiter' as UserRole,
      title: 'For Enterprise Employers',
      subtitle: 'Vector-Matched Talent Discovery',
      desc: 'Cut time-to-hire by 60% with semantic vector search. View genuine code evidence and skill confidence scores rather than buzzword-filled resumes.',
      bullets: ['FAISS vector embeddings matching', 'Zero-resume hallucination screening', 'Collaborative hiring team pipelines']
    }
  ];

  const faqs = [
    {
      q: 'What is Skill DNA and how is it calculated?',
      a: 'Skill DNA is a multidimensional vector representation of an individual technical capability. Instead of self-reported resume bullet points, Skill DNA evaluates actual code repositories, executed test cases, coding practice hours, and benchmark tests to calculate a confidence-weighted score across programming languages, frameworks, and system design concepts.'
    },
    {
      q: 'How does the AI matching engine rank candidates?',
      a: 'SkillVerse utilizes a dedicated FastAPI microservice paired with a FAISS (Facebook AI Similarity Search) dense vector index. Job descriptions are parsed into required and nice-to-have skill vectors, which are compared against candidate embeddings using normalized L2/cosine similarity to produce explainable match scores with detailed skill overlap breakdowns.'
    },
    {
      q: 'How does the simulated Demo Mode work?',
      a: 'Demo Mode allows anyone to explore the complete six-role SkillVerse platform immediately without configuring external MySQL databases or running background Python workers. All states are maintained locally in browser session storage, allowing you to switch seamlessly between Student, College Admin, Faculty, Company Admin, Recruiter, and Super Admin personas.'
    },
    {
      q: 'Can universities integrate with existing LMS and SIS platforms?',
      a: 'Yes. SkillVerse is architected with modular REST APIs and extensible plugin connectors that support standard academic data schemas, enabling frictionless syncing of student rosters, course syllabi, and accreditation reporting.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-blue-500/20">
              SV
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight text-white leading-none">
                Skill<span className="text-blue-500">Verse</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-0.5">
                Skill Intelligence OS
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-300">
            <a href="#workflow" className="hover:text-blue-400 transition-colors">How It Works</a>
            <a href="#audiences" className="hover:text-blue-400 transition-colors">Platform Roles</a>
            <a href="#faq" className="hover:text-blue-400 transition-colors">Architecture & FAQ</a>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleLaunchDemo('student')}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-all flex items-center gap-1.5"
            >
              <Sparkles size={13} className="text-amber-400" />
              <span>Explore Demo</span>
            </button>

            {user ? (
              <Link
                to={getRoleDashboardPath(user.role)}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 transition-colors shadow-sm shadow-blue-500/30 flex items-center gap-1.5"
              >
                <span>Dashboard</span>
                <ArrowRight size={13} />
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 transition-colors shadow-sm shadow-blue-500/30"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden px-4 pt-2 pb-6 bg-slate-900 border-b border-slate-800 space-y-3 text-sm">
            <a 
              href="#workflow" 
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-slate-300 hover:text-white"
            >
              How It Works
            </a>
            <a 
              href="#audiences" 
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-slate-300 hover:text-white"
            >
              Platform Roles
            </a>
            <a 
              href="#faq" 
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-slate-300 hover:text-white"
            >
              Architecture & FAQ
            </a>
            <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLaunchDemo('student');
                }}
                className="w-full py-2.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 text-center"
              >
                Launch 6-Role Demo
              </button>
              <Link
                to="/login"
                className="w-full py-2.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 text-center"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="w-full py-2.5 rounded-lg text-xs font-bold bg-blue-600 text-white text-center"
              >
                Create Account
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 lg:pt-24 lg:pb-32">
        {/* Glow backdrop effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[300px] bg-purple-600/10 blur-[140px] rounded-full pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950/70 border border-blue-500/30 text-xs font-semibold text-blue-300 shadow-inner">
              <Sparkles size={13} className="text-blue-400" />
              <span>Skill Intelligence Operating System</span>
              <span className="text-slate-500">•</span>
              <span className="text-blue-400">Phase 4 Active</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] text-white">
              Understand Skills.
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                Develop Potential.
              </span>
              <br />
              Discover Talent.
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              SkillVerse bridges universities, students, faculty, and enterprise talent acquisition with verified technical competency graphs, objective benchmark testing, and neural vector matching.
            </p>

            {/* CTA Group */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => handleLaunchDemo('student')}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all"
              >
                <Sparkles size={16} />
                <span>Explore Live Demo (6 Roles)</span>
                <ArrowRight size={16} />
              </button>

              <Link
                to="/signup"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-semibold text-sm bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 flex items-center justify-center gap-2 transition-colors"
              >
                <span>Create Free Account</span>
              </Link>
            </div>

            {/* Quick Role Switcher Banner */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
              <span className="font-semibold text-slate-400">Jump directly into any persona:</span>
              {CANONICAL_ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleLaunchDemo(r)}
                  className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 hover:bg-slate-800/80 transition-colors"
                >
                  {ROLE_LABELS[r]}
                </button>
              ))}
            </div>
          </div>

          {/* Abstract Interactive SVG Skill Graph Visual */}
          <div className="mt-16 relative rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 p-6 sm:p-10 shadow-2xl overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80 text-xs">
              <div className="flex items-center gap-2">
                <Brain size={18} className="text-blue-400" />
                <span className="font-bold text-white text-sm">Autonomous Skill DNA Graph & Vector Affinity</span>
              </div>
              <div className="flex items-center gap-3 text-slate-400">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400"></span> Verified Evidence</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-400"></span> Neural Embedding</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-purple-400"></span> Job Affinity Vector</span>
              </div>
            </div>

            {/* SVG Visual */}
            <div className="py-8 flex items-center justify-center">
              <svg className="w-full max-w-3xl h-64 sm:h-72" viewBox="0 0 800 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Connecting Lines */}
                <line x1="150" y1="150" x2="300" y2="80" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 4" opacity="0.6" />
                <line x1="150" y1="150" x2="300" y2="220" stroke="#3b82f6" strokeWidth="2" opacity="0.4" />
                <line x1="300" y1="80" x2="500" y2="80" stroke="#8b5cf6" strokeWidth="2.5" opacity="0.8" />
                <line x1="300" y1="220" x2="500" y2="220" stroke="#10b981" strokeWidth="2" opacity="0.6" />
                <line x1="500" y1="80" x2="650" y2="150" stroke="#ec4899" strokeWidth="2" strokeDasharray="4 4" opacity="0.7" />
                <line x1="500" y1="220" x2="650" y2="150" stroke="#3b82f6" strokeWidth="2" opacity="0.5" />
                <line x1="300" y1="80" x2="500" y2="220" stroke="#6366f1" strokeWidth="1.5" opacity="0.3" />

                {/* Nodes */}
                {/* Node 1: GitHub & Ingestion */}
                <circle cx="150" cy="150" r="36" fill="#1e293b" stroke="#3b82f6" strokeWidth="2" />
                <text x="150" y="146" textAnchor="middle" fill="#93c5fd" fontSize="11" fontWeight="bold">GIT REPOS</text>
                <text x="150" y="162" textAnchor="middle" fill="#64748b" fontSize="9">Telemetry</text>

                {/* Node 2: FastAPI */}
                <circle cx="300" cy="80" r="32" fill="#1e293b" stroke="#8b5cf6" strokeWidth="2" />
                <text x="300" y="76" textAnchor="middle" fill="#c4b5fd" fontSize="10" fontWeight="bold">FASTAPI</text>
                <text x="300" y="90" textAnchor="middle" fill="#64748b" fontSize="8">DNA Parser</text>

                {/* Node 3: Benchmarks */}
                <circle cx="300" cy="220" r="32" fill="#1e293b" stroke="#10b981" strokeWidth="2" />
                <text x="300" y="216" textAnchor="middle" fill="#6ee7b7" fontSize="10" fontWeight="bold">TEST CODE</text>
                <text x="300" y="230" textAnchor="middle" fill="#64748b" fontSize="8">Evaluator</text>

                {/* Node 4: FAISS */}
                <circle cx="500" cy="80" r="38" fill="#0f172a" stroke="#6366f1" strokeWidth="3" />
                <text x="500" y="75" textAnchor="middle" fill="#818cf8" fontSize="11" fontWeight="extrabold">FAISS INDEX</text>
                <text x="500" y="90" textAnchor="middle" fill="#94a3b8" fontSize="9">128d Vectors</text>

                {/* Node 5: University Cohort */}
                <circle cx="500" cy="220" r="32" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
                <text x="500" y="216" textAnchor="middle" fill="#7dd3fc" fontSize="10" fontWeight="bold">ACADEMIC</text>
                <text x="500" y="230" textAnchor="middle" fill="#64748b" fontSize="8">Cohort KPIs</text>

                {/* Node 6: Match */}
                <circle cx="650" cy="150" r="36" fill="#1e293b" stroke="#ec4899" strokeWidth="2.5" />
                <text x="650" y="146" textAnchor="middle" fill="#f472b6" fontSize="11" fontWeight="bold">AI MATCH</text>
                <text x="650" y="162" textAnchor="middle" fill="#64748b" fontSize="9">94% Overlap</text>
              </svg>
            </div>

            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-400" />
                Sub-5ms FAISS latency verified against local dense embeddings
              </span>
              <span className="font-mono text-slate-500">
                Model: sentence-transformers/all-MiniLM-L6-v2 (128-dim mock / 384-dim target)
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 6-Step Workflow Section */}
      <section id="workflow" className="py-20 bg-slate-900/60 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs uppercase font-extrabold tracking-widest text-blue-400">
              Deterministic Methodology
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              How SkillVerse Works: End-to-End Skill Intelligence
            </h2>
            <p className="text-slate-400 text-sm">
              From raw code telemetry to verified enterprise matches, every step is transparent and backed by computational evidence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {steps.map((st) => (
              <div
                key={st.num}
                className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="font-mono text-xs font-black text-blue-500 mb-3 group-hover:text-blue-400 transition-colors">
                    {st.num} / WORKFLOW
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{st.title}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">{st.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Audience Pillars Section */}
      <section id="audiences" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs uppercase font-extrabold tracking-widest text-purple-400">
              Role Ecosystem
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Built for Every Stakeholder in the Talent Lifecycle
            </h2>
            <p className="text-slate-400 text-sm">
              Each role experiences a dedicated workspace tailored to their specific operational priorities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {pillars.map((p, i) => {
              const Icon = p.icon;
              return (
                <div
                  key={i}
                  className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-6"
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <Icon size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{p.title}</h3>
                        <div className="text-xs font-semibold text-blue-400">{p.subtitle}</div>
                      </div>
                    </div>

                    <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                      {p.desc}
                    </p>

                    <ul className="space-y-2 text-xs text-slate-300">
                      {p.bullets.map((b, bIdx) => (
                        <li key={bIdx} className="flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleLaunchDemo(p.role)}
                      className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-colors"
                    >
                      <span>Preview {ROLE_LABELS[p.role]} Workspace</span>
                      <ArrowRight size={13} />
                    </button>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                      Interactive
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section id="faq" className="py-20 bg-slate-900/60 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-2">
            <span className="text-xs uppercase font-extrabold tracking-widest text-blue-400">
              Clear & Transparent
            </span>
            <h2 className="text-3xl font-extrabold text-white">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-semibold text-sm text-white hover:text-blue-400 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={18}
                      className={`text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-blue-400' : ''}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 py-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
              SV
            </div>
            <div>
              <div className="font-bold text-white text-sm">SkillVerse Intelligence Platform</div>
              <div className="text-[11px] text-slate-500">© 2026 NANDANS26. Built with React, FastAPI, & FAISS.</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-slate-400">
            <button type="button" onClick={() => handleLaunchDemo('student')} className="hover:text-white transition-colors">
              Student Portal
            </button>
            <button type="button" onClick={() => handleLaunchDemo('college_admin')} className="hover:text-white transition-colors">
              College Admin
            </button>
            <button type="button" onClick={() => handleLaunchDemo('faculty')} className="hover:text-white transition-colors">
              Faculty Portal
            </button>
            <button type="button" onClick={() => handleLaunchDemo('company_admin')} className="hover:text-white transition-colors">
              Company Admin
            </button>
            <button type="button" onClick={() => handleLaunchDemo('recruiter')} className="hover:text-white transition-colors">
              Recruiter
            </button>
            <button type="button" onClick={() => handleLaunchDemo('super_admin')} className="hover:text-white transition-colors">
              Super Admin
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
