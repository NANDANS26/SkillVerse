import { useState } from 'react'
import { BookOpen, PlayCircle, CheckCircle, Clock, Award, TrendingUp, Target, Zap } from 'lucide-react'
import Sidebar from '../../components/Sidebar'

// Mock learning path data
const learningPaths = [
  {
    id: 1,
    title: 'Frontend Mastery',
    category: 'Development',
    progress: 75,
    estimatedTime: '40 hours',
    skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS'],
    courses: [
      { id: 'c1', title: 'Advanced React Patterns', duration: '6h', completed: true },
      { id: 'c2', title: 'TypeScript Deep Dive', duration: '8h', completed: true },
      { id: 'c3', title: 'Next.js App Router', duration: '10h', completed: false },
      { id: 'c4', title: 'Performance Optimization', duration: '8h', completed: false },
      { id: 'c5', title: 'Testing with Jest', duration: '8h', completed: false }
    ]
  },
  {
    id: 2,
    title: 'Backend Development',
    category: 'Development',
    progress: 30,
    estimatedTime: '60 hours',
    skills: ['Node.js', 'PostgreSQL', 'Docker', 'AWS'],
    courses: [
      { id: 'b1', title: 'Node.js Fundamentals', duration: '10h', completed: true },
      { id: 'b2', title: 'Database Design', duration: '12h', completed: true },
      { id: 'b3', title: 'REST API Best Practices', duration: '8h', completed: false },
      { id: 'b4', title: 'Docker & Containers', duration: '10h', completed: false },
      { id: 'b5', title: 'AWS Essentials', duration: '20h', completed: false }
    ]
  },
  {
    id: 3,
    title: 'System Design',
    category: 'Architecture',
    progress: 20,
    estimatedTime: '35 hours',
    skills: ['System Architecture', 'Scalability', 'Microservices'],
    courses: [
      { id: 's1', title: 'Design Fundamentals', duration: '8h', completed: true },
      { id: 's2', title: 'Scalability Patterns', duration: '10h', completed: false },
      { id: 's3', title: 'Microservices Architecture', duration: '12h', completed: false },
      { id: 's4', title: 'Case Studies', duration: '5h', completed: false }
    ]
  },
  {
    id: 4,
    title: 'Soft Skills & Interview Prep',
    category: 'Career',
    progress: 90,
    estimatedTime: '25 hours',
    skills: ['Communication', 'Interviewing', 'Negotiation'],
    courses: [
      { id: 'p1', title: 'Technical Interview Prep', duration: '10h', completed: true },
      { id: 'p2', title: 'Communication Skills', duration: '6h', completed: true },
      { id: 'p3', title: 'Salary Negotiation', duration: '4h', completed: true },
      { id: 'p4', title: 'Leadership Basics', duration: '5h', completed: false }
    ]
  }
]

// Recommended courses
const recommendedCourses = [
  { id: 1, title: 'GraphQL Fundamentals', category: 'Development', duration: '6h', relevance: 95 },
  { id: 2, title: 'Machine Learning Basics', category: 'AI/ML', duration: '12h', relevance: 85 },
  { id: 3, title: 'DevOps CI/CD Pipeline', category: 'DevOps', duration: '8h', relevance: 78 },
  { id: 4, title: 'Agile Methodology', category: 'Process', duration: '4h', relevance: 92 }
]

export default function CandidateLearning() {
  const [activePath, setActivePath] = useState<number | null>(1)
  const [enrolledCourses, setEnrolledCourses] = useState<string[]>(['c1', 'c2', 'b1', 'b2', 's1', 'p1', 'p2', 'p3'])

  const handleEnroll = (courseId: string) => {
    if (!enrolledCourses.includes(courseId)) {
      setEnrolledCourses([...enrolledCourses, courseId])
    }
  }

  const handleComplete = (courseId: string) => {
    // In a real app, you would update the backend
    console.log(`Completed course: ${courseId}`)
  }

  const getActivePath = () => {
    return learningPaths.find(path => path.id === activePath) || learningPaths[0]
  }

  const stats = {
    totalHours: 160,
    completedHours: 85,
    enrolledPaths: 4,
    completionRate: 53,
    streakDays: 7
  }

  return (
    <div className="flex min-h-screen page-transition">
      <Sidebar />
      
      <div className="flex-1 lg:ml-64 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Learning Path
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  Personalized courses to boost your career
                </p>
              </div>
              <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl">
                <Zap className="h-5 w-5 text-yellow-500" />
                <span className="font-semibold text-gray-900 dark:text-white">{stats.streakDays} day streak</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.enrolledPaths}</span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Learning Paths</div>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <Clock className="h-8 w-8 text-green-600 dark:text-green-400" />
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completedHours}h</span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Completed Hours</div>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completionRate}%</span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Completion Rate</div>
            </div>
            <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <Target className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                <span className="text-2xl font-bold text-gray-900 dark:text-white">12</span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Skills Learned</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Learning Paths */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Your Learning Paths
              </h2>
              
              <div className="space-y-6">
                {learningPaths.map((path) => (
                  <div 
                    key={path.id}
                    className={`bg-white dark:bg-gray-800/50 rounded-2xl p-6 border cursor-pointer transition-all ${
                      activePath === path.id
                        ? 'border-blue-500 dark:border-blue-500 shadow-lg'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                    }`}
                    onClick={() => setActivePath(path.id)}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4">
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <BookOpen className="h-6 w-6 text-blue-500" />
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {path.title}
                          </h3>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                          <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                            {path.category}
                          </span>
                          <span>{path.estimatedTime} total</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 lg:mt-0">
                        <div className="flex items-center space-x-2">
                          <div className="h-2 w-32 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                              style={{ width: `${path.progress}%` }}
                            />
                          </div>
                          <span className="font-bold text-gray-900 dark:text-white">{path.progress}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Skills */}
                    <div className="mb-6">
                      <div className="flex flex-wrap gap-2">
                        {path.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Courses in this path */}
                    <div className="space-y-3">
                      {path.courses.map((course) => (
                        <div key={course.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex items-center space-x-3">
                            {enrolledCourses.includes(course.id) && course.completed ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : enrolledCourses.includes(course.id) ? (
                              <PlayCircle className="h-5 w-5 text-blue-500" />
                            ) : (
                              <div className="h-5 w-5 rounded-full border border-gray-300 dark:border-gray-600" />
                            )}
                            <div>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {course.title}
                              </span>
                              <span className="text-sm text-gray-500 dark:text-gray-400 ml-3">
                                {course.duration}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            {!enrolledCourses.includes(course.id) ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEnroll(course.id)
                                }}
                                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                              >
                                Enroll
                              </button>
                            ) : !course.completed ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleComplete(course.id)
                                }}
                                className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                              >
                                Mark Complete
                              </button>
                            ) : (
                              <span className="px-3 py-1 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg">
                                Completed
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column - Recommendations & Progress */}
            <div className="space-y-8">
              {/* Active Path Details */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Active Learning Path
                </h3>
                
                {activePath && (
                  <>
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        {getActivePath().title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                        {getActivePath().category} • {getActivePath().estimatedTime} total
                      </p>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-300">Progress</span>
                          <span className="font-bold text-gray-900 dark:text-white">{getActivePath().progress}%</span>
                        </div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                            style={{ width: `${getActivePath().progress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h5 className="font-semibold text-gray-900 dark:text-white">Skills You'll Gain:</h5>
                      <div className="flex flex-wrap gap-2">
                        {getActivePath().skills.map((skill, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Recommended Courses */}
              <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Recommended Courses
                </h3>
                
                <div className="space-y-4">
                  {recommendedCourses.map((course) => (
                    <div key={course.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {course.title}
                        </h4>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-sm text-gray-500 dark:text-gray-400">{course.category}</span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">{course.duration}</span>
                          <span className="text-sm font-bold text-green-600 dark:text-green-400">{course.relevance}% match</span>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700">
                        Explore
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Achievements */}
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 rounded-2xl p-6 border border-yellow-200 dark:border-yellow-800/50">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Recent Achievements
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                      <Award className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Quick Learner</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Completed 3 courses in 7 days</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Path Starter</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Enrolled in 4 learning paths</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}