import { CheckCircle } from 'lucide-react'

interface EvidenceSnippetProps {
  text: string
  relevance: number
}

export default function EvidenceSnippet({ text, relevance }: EvidenceSnippetProps) {
  const relevanceColor = relevance >= 90 ? 'text-green-600 dark:text-green-400' :
                        relevance >= 80 ? 'text-blue-600 dark:text-blue-400' :
                        'text-yellow-600 dark:text-yellow-400'

  return (
    <div className="relative bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 border-l-4 border-blue-500">
      <div className="flex items-start justify-between mb-2">
        <CheckCircle className={`h-5 w-5 ${relevanceColor} mt-0.5`} />
        <span className={`text-sm font-semibold ${relevanceColor}`}>
          {relevance}% Relevant
        </span>
      </div>
      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
        {text}
      </p>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-b-xl" />
    </div>
  )
}