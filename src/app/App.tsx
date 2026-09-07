import { lazy, Suspense, useEffect } from 'react'
import { Redirect, Router, Route, Switch } from 'wouter'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ErrorBoundary from '../components/ErrorBoundary'
import RouteEffects from '../components/RouteEffects'
import ConnectivityBanner from '../components/ConnectivityBanner'
import AppUpdateNotice from '../components/AppUpdateNotice'
import Home from '../pages/Home'
import LearningWorlds from '../pages/LearningWorlds'
import { storage } from '../utils/storage'

const NotFound = lazy(() => import('../pages/NotFound'))
const SubjectPage = lazy(() => import('../pages/SubjectPage'))
const LessonPage = lazy(() => import('../pages/LessonPage'))
const QuizPage = lazy(() => import('../pages/QuizPage'))
const StudentDashboard = lazy(() => import('../pages/StudentDashboard'))
const ParentDashboard = lazy(() => import('../pages/ParentDashboard'))
const FamilyBridge = lazy(() => import('../pages/FamilyBridge'))
const Leaderboards = lazy(() => import('../pages/Leaderboards'))
const GuidedTutor = lazy(() => import('../pages/GuidedTutor'))
const Onboarding = lazy(() => import('../pages/Onboarding'))
const Today = lazy(() => import('../pages/Today'))
const Achievements = lazy(() => import('../pages/Achievements'))
const TeacherDashboard = lazy(() => import('../pages/TeacherDashboard'))
const Search = lazy(() => import('../pages/Search'))
const Profile = lazy(() => import('../pages/Profile'))
const Settings = lazy(() => import('../pages/Settings'))
const PracticeHub = lazy(() => import('../pages/PracticeHub'))
const PracticeArena = lazy(() => import('../pages/PracticeArena'))
const MasteryConstellation = lazy(() => import('../pages/MasteryConstellation'))
const Bookmarks = lazy(() => import('../pages/Bookmarks'))
const ProgressReport = lazy(() => import('../pages/ProgressReport'))
const TeacherResources = lazy(() => import('../pages/TeacherResources'))
const FamilyGoalsPage = lazy(() => import('../pages/FamilyGoals'))
const WeeklyReview = lazy(() => import('../pages/WeeklyReview'))
const Wellbeing = lazy(() => import('../pages/Wellbeing'))
const HelpCentre = lazy(() => import('../pages/HelpCentre'))
const PlatformHealth = lazy(() => import('../pages/PlatformHealth'))
const MistakeReview = lazy(() => import('../pages/MistakeReview'))
const StudyPlanner = lazy(() => import('../pages/StudyPlanner'))
const ActivityTimeline = lazy(() => import('../pages/ActivityTimeline'))
const LearningNotes = lazy(() => import('../pages/LearningNotes'))

function RouteLoadingFallback() {
  return (
    <main className="mx-auto flex min-h-[50vh] w-full max-w-7xl items-center justify-center px-4 py-12" aria-live="polite" aria-busy="true">
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-center shadow-sm">
        <p className="font-semibold text-slate-900">Loading KirthiVerse…</p>
        <p className="mt-1 text-sm text-slate-600">Preparing this learning space on your device.</p>
      </div>
    </main>
  )
}

export default function App() {
  useEffect(() => {
    const preferences = storage.getPreferences()
    document.documentElement.classList.toggle('large-text', preferences.largerText)
    document.documentElement.classList.toggle('reduce-motion', preferences.reducedMotion)
  }, [])

  return (
    <ErrorBoundary>
      <Router>
        <RouteEffects />
        <div className="min-h-screen flex flex-col bg-background text-foreground">
          <ConnectivityBanner />
          <Header />
          <div id="main-content" className="flex-1" tabIndex={-1}>
            <Suspense fallback={<RouteLoadingFallback />}>
              <Switch>
                <Route path="/index.html">
                  <Redirect to="/" replace />
                </Route>
                <Route path="/" component={Home} />
                <Route path="/onboarding" component={Onboarding} />
                <Route path="/today" component={Today} />
                <Route path="/practice" component={PracticeArena} />
                <Route path="/practice-hub" component={PracticeHub} />
                <Route path="/mastery" component={MasteryConstellation} />
                <Route path="/family-bridge" component={FamilyBridge} />
                <Route path="/mistake-review" component={MistakeReview} />
                <Route path="/study-planner" component={StudyPlanner} />
                <Route path="/activity" component={ActivityTimeline} />
                <Route path="/learning-notes" component={LearningNotes} />
                <Route path="/bookmarks" component={Bookmarks} />
                <Route path="/progress-report" component={ProgressReport} />
                <Route path="/weekly-review" component={WeeklyReview} />
                <Route path="/family-goals" component={FamilyGoalsPage} />
                <Route path="/wellbeing" component={Wellbeing} />
                <Route path="/help" component={HelpCentre} />
                <Route path="/platform-health" component={PlatformHealth} />
                <Route path="/search" component={Search} />
                <Route path="/profile" component={Profile} />
                <Route path="/settings" component={Settings} />
                <Route path="/dashboard" component={StudentDashboard} />
                <Route path="/parent-dashboard" component={ParentDashboard} />
                <Route path="/teacher-dashboard" component={TeacherDashboard} />
                <Route path="/teacher-resources" component={TeacherResources} />
                <Route path="/achievements" component={Achievements} />
                <Route path="/leaderboards" component={Leaderboards} />
                <Route path="/ai-tutor" component={GuidedTutor} />
                <Route path="/learning-worlds" component={LearningWorlds} />
                <Route path="/subject/:id" component={SubjectPage} />
                <Route path="/lesson/:id" component={LessonPage} />
                <Route path="/quiz/:id" component={QuizPage} />
                <Route component={NotFound} />
              </Switch>
            </Suspense>
          </div>
          <Footer />
          <AppUpdateNotice />
        </div>
      </Router>
    </ErrorBoundary>
  )
}
