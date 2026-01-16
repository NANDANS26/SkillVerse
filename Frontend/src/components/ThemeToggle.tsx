import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      aria-label="Toggle theme"
    >
      <div className="relative w-6 h-6">
        <Sun
          className={`absolute inset-0 w-6 h-6 text-yellow-500 transition-transform duration-300 ${
            theme === 'dark' ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100'
          }`}
        />
        <Moon
          className={`absolute inset-0 w-6 h-6 text-blue-400 transition-transform duration-300 ${
            theme === 'light' ? '-rotate-90 opacity-0' : 'rotate-0 opacity-100'
          }`}
        />
      </div>
    </button>
  )
}