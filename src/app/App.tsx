import { lazy, Suspense, useEffect, type ComponentType } from 'react'
import { Redirect, Router, Route, Switch } from 'wouter'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ErrorBoundary from '../components/ErrorBoundary'
import RouteEffects from '../components/RouteEffects'
import ConnectivityBanner from '../components/ConnectivityBanner'
import AppUpdateNotice from '../components/AppUpdateNotice'
import Home from '../pages/Home'
import LearningWorlds from '../pages/LearningWorlds'
import PracticeArena from '../pages/PracticeArena'
import MasteryConstellation from '../pages/MasteryConstellation'
import FamilyBridgeDepth from '../pages/FamilyBridgeDepth'
import { ensureLearningRuntime } from '../content/learningRuntime'
import { storage } from '../utils/storage'

function withLearningRuntime(loader: () => Promise<{ default: ComponentType }>) {
  return lazy(async () => {
    await ensureLearningRuntime()
    return loader()
  })
}

const NotFound = lazy(() => import('../pages/NotFound'))
const KikiTeacher = lazy(() => import('../pages/KikiTeacher'))
const SubjectPage = withLearningRuntime(() => import('../pages/SubjectPage'))
const LessonPage = withLearningRuntime(() => import('../pages/LessonPage'))
const QuizPage = withLearningRuntime(() => import('../pages/QuizPage'))
const StudentDashboard = withLearningRuntime(() => import('../pages/StudentDashboard'))
const ParentDashboard = withLearningRuntime(() => import('../pages/ParentDashboard'))
const Leaderboards = withLearningRuntime(() => import('../pages/Leaderboards'))
const GuidedTutor = withLearningRuntime(() => import('../pages/GuidedTutor'))
const Onboarding = withLearningRuntime(() => import('../pages/Onboarding'))
const Today = withLearningRuntime(() => import('../pages/Today'))
const Achievements = withLearningRuntime(() => import('../pages/Achievements'))
const TeacherDashboard = withLearningRuntime(() => import('../pages/TeacherDashboard'))
const Search = withLearningRuntime(() => import('../pages/Search'))
const Profile = withLearningRuntime(() => import('../pages/Profile'))
const Settings = withLearningRuntime(() => import('../pages/Settings'))
const PracticeHub = withLearningRuntime(() => import('../pages/PracticeHub'))
const Bookmarks = withLearningRuntime(() => import('../pages/Bookmarks'))
const ProgressReport = withLearningRuntime(() => import('../pages/ProgressReport'))
const TeacherResources = withLearningRuntime(() => import('../pages/TeacherResources'))
const FamilyGoalsPage = withLearningRuntime(() => import('../pages/FamilyGoals'))
const WeeklyReview = withLearningRuntime(() => import('../pages/WeeklyReview'))
const Wellbeing = withLearningRuntime(() => import('../pages/Wellbeing'))
const HelpCentre = withLearningRuntime(() => import('../pages/HelpCentre'))
const PlatformHealth = withLearningRuntime(() => import('../pages/PlatformHealth'))
const MistakeReview = withLearningRuntime(() => import('../pages/MistakeReview'))
const StudyPlanner = withLearningRuntime(() => import('../pages/StudyPlanner'))
const ActivityTimeline = withLearningRuntime(() => import('../pages/ActivityTimeline'))
const LearningNotes = withLearningRuntime(() => import('../pages/LearningNotes'))

function RouteLoadingFallback() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-4.5rem)] w-full max-w-7xl items-center justify-center px-4 py-12" aria-live="polite" aria-busy="true">
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
                <Route path="/family-bridge" component={FamilyBridgeDepth} />
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
                <Route path="/kiki">
                  <Redirect to="/kiki-teacher" replace />
                </Route>
                <Route path="/kiki-teacher" component={KikiTeacher} />
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
