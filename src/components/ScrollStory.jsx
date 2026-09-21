import { useEffect, useRef, useState } from 'react'
import './ScrollStory.css'

// Native document scrolling: no wheel handlers, scroll locking, or timers.
export default function ScrollStory({ id, distance = 140, children }) {
  const root = useRef(null)
  const content = useRef(null)
  const end = useRef(null)
  const [enabled, setEnabled] = useState(false)
  const [progress, setProgress] = useState(0)
  const [manual, setManual] = useState(false)
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    const measure = () => {
      const fits = innerWidth >= 760 && innerHeight >= 650 && content.current.offsetHeight <= innerHeight - 128
      setEnabled(!media.matches && fits)
      const hero = root.current.querySelector('.hero')
      const figure = root.current.querySelector('.hero-figure')
      if (hero && figure) root.current.style.setProperty('--renderer-shift', `${hero.clientWidth / 2 - figure.offsetLeft - figure.offsetWidth / 2}px`)
    }
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const node = root.current
        const travel = node.offsetHeight - node.querySelector('.scroll-story-pin').offsetHeight
        setProgress(travel > 0 ? Math.min(1, Math.max(0, (96 - node.getBoundingClientRect().top) / travel)) : 0)
      })
    }
    const resize = () => { measure(); update() }
    const observer = new ResizeObserver(resize)
    observer.observe(content.current)
    observer.observe(root.current)
    media.addEventListener('change', resize)
    window.addEventListener('resize', resize)
    window.addEventListener('scroll', update, { passive: true })
    resize()
    return () => {
      observer.disconnect()
      media.removeEventListener('change', resize)
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', update)
      cancelAnimationFrame(frame)
    }
  }, [])
  const skip = () => {
    const target = end.current
    window.scrollTo({ top: target.getBoundingClientRect().top + scrollY - 112, behavior: 'instant' })
    target.focus({ preventScroll: true })
  }
  return <div ref={root} className="scroll-story" data-story={id} data-guided={enabled} style={{ '--story-distance': `${distance}svh` }}>
    <div className="scroll-story-pin">
      <div className="scroll-story-content" ref={content}>
        {children({ progress, enabled, playing: enabled && !manual, takeControl: () => setManual(true) })}
        <div className="story-controls">
          <p>{enabled ? manual ? 'Your turn. Explore at your own pace.' : 'Scroll to explore' : 'Explore using the controls above.'}</p>
          <div>{manual && <button type="button" onClick={() => setManual(false)}>Resume scroll tour</button>}<button type="button" onClick={skip}>Skip tour ↓</button></div>
        </div>
        <div className="story-progress" aria-hidden="true"><span style={{ transform: `scaleX(${progress})` }} /></div>
      </div>
    </div>
    <div ref={end} className="story-end" tabIndex={-1} aria-label="End of interactive tour" />
  </div>
}
