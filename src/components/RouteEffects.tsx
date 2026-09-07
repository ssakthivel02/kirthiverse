import { useEffect, useState } from 'react'
import { useLocation } from 'wouter'

const SITE_ORIGIN = 'https://kirthiverse.omsaravanabhava.org'
const PUBLIC_ROBOTS = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
const PRIVATE_ROBOTS = 'noindex, nofollow, noarchive, nosnippet'

type RouteMetadata = {
  pattern: RegExp
  title: string
  description: string
  indexable: boolean
}

const routes: RouteMetadata[] = [
  { pattern: /^\/$/, title: 'KirthiVerse · Learn Boldly, Grow Daily', description: 'Explore Tamil-first learning worlds, quizzes and local-first progress tools for learners, families and educators.', indexable: true },
  { pattern: /^\/learning-worlds/, title: 'Learning Worlds · KirthiVerse', description: 'Explore ten original KirthiVerse subject worlds with structured lessons and quizzes.', indexable: true },
  { pattern: /^\/subject\//, title: 'Subject World · KirthiVerse', description: 'Explore sequenced lessons, quizzes and mastery progress for this KirthiVerse subject world.', indexable: true },
  { pattern: /^\/lesson\//, title: 'Lesson · KirthiVerse', description: 'Study a structured KirthiVerse lesson with objectives, examples, explanations and practice.', indexable: true },
  { pattern: /^\/quiz\//, title: 'Quiz Mission · KirthiVerse', description: 'Practise a KirthiVerse lesson with explanations, retries and local mastery evidence.', indexable: true },
  { pattern: /^\/search/, title: 'Search · KirthiVerse', description: 'Search KirthiVerse lessons and quiz questions locally without sending the query to a third party.', indexable: true },
  { pattern: /^\/ai-tutor/, title: 'Guided Tutor · KirthiVerse', description: 'Use curated, local-first guidance to continue learning safely within KirthiVerse.', indexable: true },
  { pattern: /^\/teacher-resources/, title: 'Teacher Resources · KirthiVerse', description: 'Browse the local KirthiVerse lesson and quiz inventory for classroom and tutoring preparation.', indexable: true },
  { pattern: /^\/help/, title: 'Help Centre · KirthiVerse', description: 'Find KirthiVerse guidance for learners, families and educators, including local progress and offline use.', indexable: true },
  { pattern: /^\/onboarding/, title: 'Learner Setup · KirthiVerse', description: 'Create a local learner profile and choose learning preferences on this device.', indexable: false },
  { pattern: /^\/today/, title: 'Today’s Mission · KirthiVerse', description: 'View the learner’s local daily mission, recommendations and progress on this device.', indexable: false },
  { pattern: /^\/practice/, title: 'Practice Hub · KirthiVerse', description: 'Review personalised local practice suggestions based on saved learning activity.', indexable: false },
  { pattern: /^\/mastery/, title: 'Kiki Mastery Constellation · KirthiVerse', description: 'Review explainable local mastery, prerequisite evidence and Kiki learning recommendations on this device.', indexable: false },
  { pattern: /^\/family-bridge/, title: 'Family Bridge · KirthiVerse', description: 'Review privacy-conscious local learning evidence and home-support suggestions for this device.', indexable: false },
  { pattern: /^\/mistake-review/, title: 'Mistake Review · KirthiVerse', description: 'Review and resolve locally saved quiz mistakes without public learner data.', indexable: false },
  { pattern: /^\/study-planner/, title: 'Study Planner · KirthiVerse', description: 'Plan seven days of local learning activities using family goals and current practice needs.', indexable: false },
  { pattern: /^\/activity/, title: 'Learning Activity · KirthiVerse', description: 'Review the learner’s locally stored lesson and quiz activity timeline.', indexable: false },
  { pattern: /^\/learning-notes/, title: 'Learning Notes · KirthiVerse', description: 'Keep finite local learning notes for questions, strengths, celebrations and follow-up.', indexable: false },
  { pattern: /^\/bookmarks/, title: 'Saved Lessons · KirthiVerse', description: 'Continue lessons bookmarked locally on this device.', indexable: false },
  { pattern: /^\/progress-report/, title: 'Progress Report · KirthiVerse', description: 'Review and print a local learner progress summary from this device.', indexable: false },
  { pattern: /^\/weekly-review/, title: 'Weekly Review · KirthiVerse', description: 'Review seven days of local learning activity, goals and progress evidence.', indexable: false },
  { pattern: /^\/family-goals/, title: 'Family Goals · KirthiVerse', description: 'Set local weekly lesson, quiz, learning-time and wellbeing goals.', indexable: false },
  { pattern: /^\/wellbeing/, title: 'Wellbeing Centre · KirthiVerse', description: 'Use optional local session timing, break reminders and healthy learning guidance.', indexable: false },
  { pattern: /^\/platform-health/, title: 'Platform Health · KirthiVerse', description: 'Run local browser, storage, service-worker and catalogue diagnostics.', indexable: false },
  { pattern: /^\/profile/, title: 'Learner Profile · KirthiVerse', description: 'Manage the learner nickname, avatar and preferences stored on this device.', indexable: false },
  { pattern: /^\/settings/, title: 'Settings · KirthiVerse', description: 'Manage accessibility preferences and export, import or reset local KirthiVerse data.', indexable: false },
  { pattern: /^\/dashboard/, title: 'Learner Dashboard · KirthiVerse', description: 'View locally calculated learner progress, activity, XP and mastery evidence.', indexable: false },
  { pattern: /^\/parent-dashboard/, title: 'Parent View · KirthiVerse', description: 'Review local learner progress, goals, mistakes and recent activity on this device.', indexable: false },
  { pattern: /^\/teacher-dashboard/, title: 'Teacher Workspace · KirthiVerse', description: 'Prepare a local teaching plan without remote student monitoring or school rosters.', indexable: false },
  { pattern: /^\/achievements/, title: 'Achievements · KirthiVerse', description: 'View achievements calculated from genuine activity stored on this device.', indexable: false },
  { pattern: /^\/leaderboards/, title: 'Local Progress Board · KirthiVerse', description: 'View a private local progress board without public child profiles or global ranking claims.', indexable: false },
]

function metadataFor(path: string): RouteMetadata {
  return routes.find((route) => route.pattern.test(path)) ?? {
    pattern: /.*/,
    title: 'Page not found · KirthiVerse',
    description: 'The requested KirthiVerse page could not be found.',
    indexable: false,
  }
}

function setMeta(selector: string, attribute: 'content' | 'href', value: string) {
  const element = document.head.querySelector<HTMLElement>(selector)
  element?.setAttribute(attribute, value)
}

export default function RouteEffects() {
  const [location] = useLocation()
  const [announcement, setAnnouncement] = useState('')

  useEffect(() => {
    const metadata = metadataFor(location)
    const canonicalPath = metadata.indexable ? location : '/'
    const canonicalUrl = `${SITE_ORIGIN}${canonicalPath}`
    const robots = metadata.indexable ? PUBLIC_ROBOTS : PRIVATE_ROBOTS

    document.title = metadata.title
    document.body.dataset.route = location
    setMeta('meta[name="description"]', 'content', metadata.description)
    setMeta('meta[name="robots"]', 'content', robots)
    setMeta('link[rel="canonical"]', 'href', canonicalUrl)
    setMeta('meta[property="og:title"]', 'content', metadata.title)
    setMeta('meta[property="og:description"]', 'content', metadata.description)
    setMeta('meta[property="og:url"]', 'content', canonicalUrl)
    setMeta('meta[name="twitter:title"]', 'content', metadata.title)
    setMeta('meta[name="twitter:description"]', 'content', metadata.description)

    setAnnouncement(metadata.title.replace(' · KirthiVerse', ''))
    window.scrollTo({ top: 0, behavior: 'auto' })
    window.requestAnimationFrame(() => {
      const main = document.getElementById('main-content')
      main?.setAttribute('tabindex', '-1')
      main?.focus({ preventScroll: true })
    })
  }, [location])

  return <div className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</div>
}
