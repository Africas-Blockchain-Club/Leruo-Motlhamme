import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    // Kill any pinned ScrollTrigger instances left over from the previous route
    ScrollTrigger.killAll()
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
