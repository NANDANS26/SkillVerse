import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts'

interface SkillRadarProps {
  skills: Record<string, number>
}

export default function SkillRadar({ skills }: SkillRadarProps) {
  const data = Object.entries(skills).map(([skill, value]) => ({
    subject: skill,
    value,
    fullMark: 100,
  }))

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid 
            stroke="currentColor" 
            strokeOpacity={0.2} 
            className="text-gray-300 dark:text-gray-600"
          />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: 'currentColor', fontSize: 12 }}
            className="text-gray-700 dark:text-gray-300"
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 100]} 
            tick={{ fill: 'currentColor', fontSize: 10 }}
            className="text-gray-500 dark:text-gray-400"
          />
          <Radar
            name="Skills"
            dataKey="value"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.6}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}