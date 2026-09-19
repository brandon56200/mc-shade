import { useEffect, useRef, useState } from 'react'
import { DemoFigure, ImageComparison } from './components/ResearchMedia.jsx'
import { assetUrl } from './assetUrl.js'
import GBufferExplorer from './components/GBufferExplorer.jsx'

const chapters = [
  ['context', 'The rendering problem'],
  ['demonstrations', 'The demonstrations'],
  ['approach', 'A learned appearance model'],
  ['promise', 'Why pursue this'],
  ['limitations', 'Where it falls short'],
  ['scope', 'Scope & next steps'],
]

function useReadingPosition() {
  const [active, setActive] = useState('context')
  const progress = useRef(null)
  useEffect(() => {
    let frame
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const height = document.documentElement.scrollHeight - window.innerHeight
        if (progress.current) progress.current.style.transform = `scaleX(${height > 0 ? window.scrollY / height : 0})`
        const current = chapters.filter(([id]) => document.getElementById(id)?.getBoundingClientRect().top < 200).at(-1)
        setActive(current?.[0] || 'context')
      })
    }
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    update()
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      cancelAnimationFrame(frame)
    }
  }, [])
  return { active, progress }
}

function ChapterHeading({ number, label, children }) {
  return <header className="chapter-heading"><p className="eyebrow">{number} / {label}</p><h2>{children}</h2></header>
}

export default function App() {
  const { active, progress } = useReadingPosition()
  return (
    <>
      <a className="skip-link" href="#context">Skip to article</a>
      <div className="reading-progress" ref={progress} aria-hidden="true" />
      <header className="site-header">
        <div className="nav-wrap">
          <a className="wordmark" href="https://www.midcentury.xyz/" aria-label="Midcentury home"><img src={assetUrl('midcentury-logo-white.svg')} width="144" height="38" alt="Midcentury" /></a>
          <a className="report-brand" href="#top">/ MC-Shade</a>
          <nav aria-label="Main navigation">
            <a href="#demonstrations">Demonstrations</a>
            <a href="#limitations">Limitations</a>
            <a className="nav-contact" href="mailto:brandon@midcentury.xyz">Get in touch <span aria-hidden="true">↗</span></a>
          </nav>
        </div>
      </header>

      <main id="top">
        <section className="hero page-width" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow"><span className="status-dot" /> MIDCENTURY / RESEARCH</p>
            <h1 id="hero-title">Neural rendering<br /><strong>for physical AI.</strong></h1>
            <p className="hero-deck">Learning the appearance of a simulated world, while keeping its structure under our control.</p>
            <div className="hero-actions">
              <a className="button button-primary" href="#demonstrations">See the demonstrations <span aria-hidden="true">↓</span></a>
              <a className="text-link" href="#scope">Read the scope</a>
            </div>
            <p className="byline">Brandon Samaroo <span aria-hidden="true">/</span> September 2026</p>
          </div>
          <figure className="hero-figure">
            <div className="figure-topline"><span>WAREHOUSE / FRAME 600</span><span className="accent">COMPARE THE IMAGE</span></div>
            <ImageComparison />
            <figcaption>Same camera. Same scene. Drag the divider to compare the reference render with MC-Shade.</figcaption>
          </figure>
        </section>

        <div className="opening-band">
          <div className="page-width opening-grid">
            <p className="eyebrow">LEARNED SIMULATION</p>
            <p>Physical behavior, useful assets, and realistic observations all matter for simulation. <strong>This work focuses on the visual part.</strong></p>
          </div>
        </div>

        <div className="page-width article-layout">
          <aside className="contents">
            <nav aria-label="Article contents">
              <p className="eyebrow">IN THIS ARTICLE</p>
              <ol>{chapters.map(([id, name], i) => <li key={id}><a href={`#${id}`} aria-current={active === id ? 'location' : undefined}><span className="contents-number">0{i + 1}</span>{name}</a></li>)}</ol>
            </nav>
            <p className="contents-note">A research demonstration.<br />An open engineering problem.</p>
          </aside>

          <article className="article-body" aria-label="Neural rendering for physical AI">
            <section id="context" className="chapter">
              <ChapterHeading number="01" label="CONTEXT">The cost of<br /><strong>what a robot sees.</strong></ChapterHeading>
              <div className="prose">
                <p>At Midcentury, we are building simulation with learned components where hand-designed systems struggle to capture the complexity of the real world. That includes physical behavior, the assets that populate a scene, and the images a robot receives from its cameras.</p>
                <p>Visual simulation has a persistent tradeoff. Rich materials, indirect lighting, reflections, and shadows can make an environment more useful, but they also consume compute. Modern renderers use sophisticated approximations, reuse, and acceleration to manage that cost. Generating large, varied datasets still requires decisions about what to compute and what to leave out.</p>
                <p>We are exploring a different allocation of that work: retain an explicit simulated scene, then learn how it should appear. A learned renderer can reuse patterns acquired from data rather than resolve every aspect of appearance through a hand-written rendering pipeline.</p>
              </div>
            </section>

            <section id="demonstrations" className="chapter">
              <ChapterHeading number="02" label="DEMONSTRATIONS">A familiar scene.<br /><strong>A learned image.</strong></ChapterHeading>
              <div className="prose">
                <p>These warehouse sequences compare an Unreal Engine reference render with MC-Shade, frame by frame. Watch the doorway, shelves, and windows as the camera moves. The model follows the scene layout and much of its lighting, while small details remain softer than the reference.</p>
              </div>
              <DemoFigure id="warehouse-1" number="01" title="Through the warehouse doorway" subtitle="Warehouse / camera 1" />
              <DemoFigure id="warehouse-2" number="02" title="Along the storage aisle" subtitle="Warehouse / camera 2" />
              <p className="scope-caption">Scene-specific demonstrations on training camera trajectories, not an unseen-scene benchmark. The first frame uses reference-image context; later frames use the model’s generated history. Playback speed is not inference speed. <a href="#scope">Evaluation notes ↓</a></p>
              <section className="earlier-studies" aria-labelledby="earlier-studies-title">
                <h3 id="earlier-studies-title">Office and kitchen studies</h3>
                <p>Separate scene-specific models from earlier experiments. These edited excerpts show an unlit BaseColor input on the left and the neural output on the right; they are not evidence of one model generalizing across environments.</p>
                <DemoFigure id="office" number="03" title="Learning the office’s appearance" subtitle="Office / earlier study"
                  source="legacy/office.mp4" poster="legacy/office-poster.jpg" leftLabel="BaseColor input" durationLabel="5-SECOND EXCERPT"
                  linkHref="legacy/office.mp4" linkLabel="Open clip"
                  caption="An earlier scene-specific study. Left: unlit BaseColor input. Right: neural appearance. This five-second edited excerpt repeats; playback speed is not inference speed." />
                <DemoFigure id="kitchen" number="04" title="Surfaces and lighting in the kitchen" subtitle="Kitchen / earlier study"
                  source="legacy/kitchen.mp4" poster="legacy/kitchen-poster.jpg" leftLabel="BaseColor input" durationLabel="5-SECOND EXCERPT"
                  linkHref="legacy/kitchen.mp4" linkLabel="Open clip"
                  caption="An earlier scene-specific study. Left: unlit BaseColor input. Right: neural appearance. This five-second edited excerpt repeats; playback speed is not inference speed." />
              </section>
            </section>

            <section id="approach" className="chapter">
              <ChapterHeading number="03" label="APPROACH">Structure from simulation.<br /><strong>Appearance from learning.</strong></ChapterHeading>
              <div className="prose">
                <p>The simulator already knows which surfaces are visible, their orientation, distance, and material properties. We use those structured render passes, often called G-buffers, to condition a generative image model.</p>
                <p>The model learns a relationship between those inputs and reference images. During a rollout, it also uses the previous generated image as temporal context. This gives it both a description of the current scene and information about how the preceding frame looked.</p>
              </div>
              <GBufferExplorer />
              <div className="method-flow" role="group" aria-label="High-level rendering pipeline">
                <div><span className="eyebrow">SCENE</span><h3>Explicit structure</h3><p>Visible surfaces, depth, orientation, and materials.</p></div>
                <span className="flow-arrow" aria-hidden="true">→</span>
                <div className="method-center"><span className="eyebrow">MC-SHADE</span><h3>Learned appearance</h3><p>Structured inputs and previous-frame context.</p></div>
                <span className="flow-arrow" aria-hidden="true">→</span>
                <div><span className="eyebrow">OBSERVATION</span><h3>A rendered frame</h3><p>A prediction of the scene’s visual appearance.</p></div>
              </div>
              <div className="prose">
                <p>The distinction matters for physical AI. We want to improve the observation model without giving up the scene’s explicit geometry, camera configuration, or simulation state. A plausible image is useful only if it stays aligned with the world the robot is supposed to act in.</p>
              </div>
            </section>

            <section id="promise" className="chapter">
              <ChapterHeading number="04" label="THE PROMISE">What changes<br /><strong>when appearance is learned.</strong></ChapterHeading>
              <div className="research-arguments">
                <div className="argument"><span className="argument-index">01</span><div><h3>A different rendering cost curve</h3><p>For a fixed model, image size, and inference schedule, the learned shading computation has a bounded budget. Its network does not grow each time the scene gains another light or a more elaborate material. Geometry processing and input generation still have a cost, and representing an unfamiliar scene correctly remains a learning problem.</p><p className="argument-note">A design opportunity, not a claim of measured end-to-end constant cost or real-time performance.</p></div></div>
                <div className="argument"><span className="argument-index">02</span><div><h3>Appearance can improve with the data</h3><p>A learned observation model gives us another way to represent appearance that is difficult to author by hand. In the longer term, suitable real-image supervision could help capture sensor characteristics and surface variation missing from a synthetic pipeline. The examples here use engine-rendered references; they do not yet establish that transfer.</p></div></div>
                <div className="argument"><span className="argument-index">03</span><div><h3>More useful variation from a controlled world</h3><p>We want to vary appearance while preserving the structure of a task: the same shelf, object, and camera, under different visual conditions. Learned generation could complement the domain randomization already available in conventional simulators. Making that variation controllable and consistent with the scene is part of the research ahead.</p></div></div>
              </div>
            </section>

            <section id="limitations" className="chapter limitation-section">
              <ChapterHeading number="05" label="A COUNTEREXAMPLE">Where the image<br /><strong>still falls short.</strong></ChapterHeading>
              <div className="prose">
                <p>A warehouse can look convincing at a glance while losing information a robot may need. In the matched detail below, the markings on a wooden crate are less distinct in the neural image than in the reference. Preserving the room’s overall appearance does not guarantee that every edge or small object remains reliable.</p>
              </div>
              <figure className="detail-figure">
                <div className="figure-topline"><span>FIGURE 05 / A CLOSER LOOK</span><span>WAREHOUSE / FRAME 600</span></div>
                <div className="detail-panels">
                  <div><div className="panel-label">UE5 reference</div><img src={assetUrl('media/detail-reference.png')} alt="UE5 reference crop: wooden crate markings and nearby barrel, camera 1, frame 600" width="160" height="160" loading="lazy" /></div>
                  <div><div className="panel-label accent">MC-Shade</div><img src={assetUrl('media/detail-neural.png')} alt="Matching MC-Shade crop with less-distinct wooden crate markings" width="160" height="160" loading="lazy" /></div>
                </div>
                <figcaption>Matching 160 × 160 crops from camera 1, frame 600, displayed at the same scale. No sharpening or restoration applied.</figcaption>
              </figure>
              <div className="prose">
                <p>Neural rendering is still early. Temporal flicker, fine detail, unfamiliar viewpoints, and changes in lighting or materials need careful evaluation. A good-looking rollout alone cannot tell us whether a policy trained on it will behave better on a real robot.</p>
                <p>The promise is worth pursuing because a learned renderer can improve through better data and better models, while remaining connected to a controllable simulated world. That is a research direction, not a claim that the remaining engineering problems are already solved.</p>
              </div>
            </section>

            <section id="scope" className="chapter">
              <ChapterHeading number="06" label="SCOPE & NEXT STEPS">A useful demonstration.<br /><strong>More to establish.</strong></ChapterHeading>
              <div className="prose">
                <p>The next question is how far this approach extends beyond familiar views. We are interested in cross-environment generalization, more faithful small-scale detail, temporal consistency, and the effect on downstream perception and control. Those tests matter more than making an individual frame look impressive.</p>
                <p>Neural rendering is one component of our simulation work. Physical behavior and asset quality remain separate problems. The aim is to make learned visuals a useful part of that stack, with evidence for where they help and where a conventional renderer is still the better choice.</p>
              </div>
              <div className="evaluation-notes">
                <h3>About these demonstrations</h3>
                <dl>
                  <div><dt>Reference</dt><dd>Unreal Engine rendered images, not real-world photographs.</dd></div>
                  <div><dt>Evaluation scope</dt><dd>Warehouse camera trajectories included in scene-specific training. These are qualitative reconstructions, not held-out generalization results.</dd></div>
                  <div><dt>Sequence context</dt><dd>The initial image uses reference-frame context. Subsequent images are generated autoregressively using the model’s own history.</dd></div>
                  <div><dt>Presentation</dt><dd>Two 12-second warehouse excerpts at 24 fps, each with a link to its full 998-frame sequence. Earlier office and kitchen studies use five-second edited clips. The warehouse excerpts remove letterboxing from both panels; full warehouse sequences retain it. No temporal smoothing or color correction is applied to the warehouse clips.</dd></div>
                  <div><dt>What is not claimed</dt><dd>Real-time inference, arbitrary-scene rendering, or demonstrated improvement in real-robot performance.</dd></div>
                </dl>
              </div>
            </section>
          </article>
        </div>

        <section className="closing">
          <div className="page-width closing-grid">
            <div><p className="eyebrow">MIDCENTURY / PHYSICAL AI</p><h2>Better simulation.<br /><strong>Built around the task.</strong></h2></div>
            <div><p>We are exploring how learned components can make simulation more useful for physical AI. If you are working on the observation gap, we would like to compare notes.</p><a className="button button-outline" href="mailto:brandon@midcentury.xyz">Talk to the research team <span aria-hidden="true">↗</span></a></div>
          </div>
        </section>
      </main>
      <footer className="page-width footer"><a href="https://www.midcentury.xyz/" aria-label="Midcentury website"><img src={assetUrl('midcentury-logo-white.svg')} width="144" height="38" alt="Midcentury" /></a><p>MC-Shade / Research note / September 2026</p><a href="#top">Back to top ↑</a></footer>
    </>
  )
}
