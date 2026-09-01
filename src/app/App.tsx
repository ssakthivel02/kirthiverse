import { useEffect } from 'react'
import { Redirect, Router, Route, Switch } from 'wouter'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ErrorBoundary from '../components/ErrorBoundary'
import RouteEffects from '../components/RouteEffects'
import ConnectivityBanner from '../components/ConnectivityBanner'
import AppUpdateNotice from '../components/AppUpdateNotice'
import Home from '../pages/Home'
import NotFound from '../pages/NotFound'
import LearningWorlds from '../pages/LearningWorlds'
import SubjectPage from '../pages/SubjectPage'
import LessonPage from '../pages/LessonPage'
import QuizPage from '../pages/QuizPage'
import StudentDashboard from '../pages/StudentDashboard'
import ParentDashboard from '../pages/ParentDashboard'
import Leaderboards from '../pages/Leaderboards'
import GuidedTutor from '../pages/GuidedTutor'
import Onboarding from '../pages/Onboarding'
import Today from '../pages/Today'
import Achievements from '../pages/Achievements'
import TeacherDashboard from '../pages/TeacherDashboard'
import Search from '../pages/Search'
import Profile from '../pages/Profile'
import Settings from '../pages/Settings'
import PracticeHub from '../pages/PracticeHub'
import Bookmarks from '../pages/Bookmarks'
import ProgressReport from '../pages/ProgressReport'
import TeacherResources from '../pages/TeacherResources'
import FamilyGoalsPage from '../pages/FamilyGoals'
import WeeklyReview from '../pages/WeeklyReview'
import Wellbeing from '../pages/Wellbeing'
import HelpCentre from '../pages/HelpCentre'
import PlatformHealth from '../pages/PlatformHealth'
import MistakeReview from '../pages/MistakeReview'
import StudyPlanner from '../pages/StudyPlanner'
import ActivityTimeline from '../pages/ActivityTimeline'
import LearningNotes from '../pages/LearningNotes'
import { storage } from '../utils/storage'

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
            <Switch>
              <Route path="/index.html">
                <Redirect to="/" replace />
              </Route>
              <Route path="/" component={Home} />
              <Route path="/onboarding" component={Onboarding} />
              <Route path="/today" component={Today} />
              <Route path="/practice" component={PracticeHub} />
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
          </div>
          <Footer />
          <AppUpdateNotice />
        </div>
      </Router>
    </ErrorBoundary>
  )
}
