// Frontend/src/components/SkillRadar.tsx
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

interface SkillItem {
  name?: string;
  subject?: string;
  score?: number;
  value?: number;
  fullMark?: number;
}

interface SkillRadarProps {
  skills?: Record<string, number>;
  data?: SkillItem[];
}

export default function SkillRadar({ skills, data }: SkillRadarProps) {
  let chartData: Array<{ subject: string; value: number; fullMark: number }> = [];

  if (data && data.length > 0) {
    chartData = data.map((d) => ({
      subject: d.subject || d.name || 'Skill',
      value: d.value ?? d.score ?? 0,
      fullMark: d.fullMark || 100
    }));
  } else if (skills) {
    chartData = Object.entries(skills).map(([skill, value]) => ({
      subject: skill,
      value: Number(value),
      fullMark: 100
    }));
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={chartData}>
          <PolarGrid 
            stroke="currentColor" 
            strokeOpacity={0.2} 
            className="text-gray-300 dark:text-gray-600"
          />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: 'currentColor', fontSize: 11 }}
            className="text-gray-700 dark:text-gray-300"
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 100]} 
            stroke="currentColor" 
            strokeOpacity={0.2}
            className="text-gray-400 dark:text-gray-500"
          />
          <Radar
            name="Skills"
            dataKey="value"
            stroke="#3B82F6"
            fill="#3B82F6"
            fillOpacity={0.5}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
