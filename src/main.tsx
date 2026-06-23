import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './stores/AppStore'
import { Layout } from './components/Layout'
import { TodayPage } from './pages/TodayPage'
import { ActionPage } from './pages/ActionPage'
import { AwayPage } from './pages/AwayPage'
import { BlockedPage } from './pages/BlockedPage'
import { EndPage } from './pages/EndPage'
import { TimelinePage } from './pages/TimelinePage'
import { PartnerPage } from './pages/PartnerPage'
import { ContextPage } from './pages/ContextPage'
import { SettingsPage } from './pages/SettingsPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { AuthPage } from './pages/AuthPage'
import { LifelinePage } from './pages/LifelinePage'
import { DailyReportPage } from './pages/DailyReportPage'
import { ProfilePage } from './pages/ProfilePage'
import './index.css'

function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route element={<Layout />}>
            <Route path="/" element={<TodayPage />} />
            <Route path="/action/:id" element={<ActionPage />} />
            <Route path="/away/:id" element={<AwayPage />} />
            <Route path="/blocked/:id" element={<BlockedPage />} />
            <Route path="/end/:id" element={<EndPage />} />
            <Route path="/timeline" element={<TimelinePage />} />
            <Route path="/partner" element={<PartnerPage />} />
            <Route path="/lifeline" element={<LifelinePage />} />
            <Route path="/report" element={<DailyReportPage />} />
            <Route path="/report/:date" element={<DailyReportPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/context" element={<ContextPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </AppProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
