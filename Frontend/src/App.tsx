import { BrowserRouter as Router } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import { SidebarProvider } from './contexts/SidebarContext'
import AppRoutes from './router.tsx'
import Navbar from './components/Navbar'

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <SidebarProvider>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
              <Navbar />
              <main className="pt-16">
                <AppRoutes />
              </main>
            </div>
          </SidebarProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  )
}

export default App