import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles, Users, Target, Zap, Shield, BarChart, Briefcase, GraduationCap } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Landing() {
  const { user } = useAuth()

  return (
    <div className="page-transition">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-500/5 dark:via-purple-500/5 dark:to-pink-500/5" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-200/50 dark:border-blue-800/50 mb-6">
              <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                AI-Powered Hiring Platform
              </span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-6">
              <span className="gradient-text">Transform</span> Your Hiring
              <br />
              with <span className="gradient-text">AI Intelligence</span>
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-10">
              SkillVerse uses advanced AI to match candidates with perfect opportunities, 
              analyze skills, and provide evidence-based hiring recommendations.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
              {user ? (
                <>
                  {user.role === 'student' && (
                    <Link
                      to="/candidate/dashboard"
                      className="group inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-2xl hover:shadow-3xl"
                    >
                      <GraduationCap className="mr-3 h-6 w-6" />
                      Go to Candidate Dashboard
                      <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-2 transition-transform" />
                    </Link>
                  )}
                  {user.role === 'recruiter' && (
                    <Link
                      to="/recruiter/dashboard"
                      className="group inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-2xl hover:shadow-3xl"
                    >
                      <Briefcase className="mr-3 h-6 w-6" />
                      Go to Recruiter Dashboard
                      <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-2 transition-transform" />
                    </Link>
                  )}
                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="group inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-2xl hover:shadow-3xl"
                    >
                      <Shield className="mr-3 h-6 w-6" />
                      Go to Admin Dashboard
                      <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-2 transition-transform" />
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link
                    to="/signup?role=student"
                    className="group inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-2xl hover:shadow-3xl"
                  >
                    <GraduationCap className="mr-3 h-6 w-6" />
                    Join as Candidate
                    <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-2 transition-transform" />
                  </Link>
                  
                  <Link
                    to="/signup?role=recruiter"
                    className="group inline-flex items-center justify-center px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-300 dark:border-gray-600 rounded-2xl font-bold text-lg hover:border-blue-500 hover:shadow-2xl transition-all duration-300"
                  >
                    <Briefcase className="mr-3 h-6 w-6" />
                    Join as Recruiter
                    <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-2 transition-transform" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-4xl font-bold text-center mb-12 gradient-text">
          Why Choose SkillVerse?
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group bg-white dark:bg-gray-800/50 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 card-hover"
            >
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.gradient} mb-6`}>
                <feature.icon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index}>
                <div className="text-5xl font-bold mb-2">{stat.value}</div>
                <div className="text-blue-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-4xl font-bold mb-6">
          Ready to Transform Your Hiring?
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
          Join thousands of companies and candidates using SkillVerse to find perfect matches.
        </p>
        {user ? (
          <Link
            to={user.role === 'student' ? '/candidate/dashboard' : user.role === 'recruiter' ? '/recruiter/dashboard' : '/admin'}
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-2xl hover:shadow-3xl"
          >
            Go to Dashboard
            <ArrowRight className="ml-3 h-5 w-5" />
          </Link>
        ) : (
          <Link
            to="/signup"
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-2xl hover:shadow-3xl"
          >
            Get Started Free
            <ArrowRight className="ml-3 h-5 w-5" />
          </Link>
        )}
      </div>
    </div>
  )
}

const features = [
  {
    icon: Target,
    title: 'Precision Matching',
    description: 'AI algorithms that match candidates with 95% accuracy based on skills, experience, and cultural fit.',
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Process thousands of applications in seconds with our scalable AI infrastructure.',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    icon: Shield,
    title: 'Bias-Free Hiring',
    description: 'Eliminate unconscious bias with our objective skill-based assessment system.',
    gradient: 'from-green-500 to-emerald-500'
  },
  {
    icon: BarChart,
    title: 'Advanced Analytics',
    description: 'Get deep insights into hiring trends, skill gaps, and candidate performance.',
    gradient: 'from-orange-500 to-red-500'
  },
  {
    icon: Users,
    title: 'Collaborative Hiring',
    description: 'Seamless team collaboration tools for reviewing candidates and making decisions.',
    gradient: 'from-indigo-500 to-blue-500'
  },
  {
    icon: Sparkles,
    title: 'Smart Automation',
    description: 'Automate repetitive tasks and focus on what matters most - finding great talent.',
    gradient: 'from-pink-500 to-rose-500'
  }
]

const stats = [
  { value: '95%', label: 'Match Accuracy' },
  { value: '10K+', label: 'Candidates' },
  { value: '500+', label: 'Companies' },
  { value: '85%', label: 'Time Saved' }
]