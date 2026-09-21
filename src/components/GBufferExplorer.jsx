import { useState } from 'react'
import { assetUrl } from '../assetUrl.js'
import './GBufferExplorer.css'
import ScrollStory from './ScrollStory.jsx'

const passes = [
  { name: 'BaseColor', file: 'basecolor', role: 'Surface color', title: 'Color before lighting.', description: 'The material’s base color, without the final scene lighting. It tells the model which visible surfaces have which colors.', note: 'This is an input pass, not the finished render.' },
  { name: 'Normals', file: 'normals', role: 'Surface orientation', title: 'Which way a surface faces.', description: 'Surface orientation is encoded in the image channels. It gives the model information about the shape and direction of the visible surfaces.', note: 'The colors are encoded surface information, not material colors.' },
  { name: 'Depth', file: 'depth', role: 'Camera distance', title: 'Where surfaces sit in depth.', description: 'An encoded depth pass describes distance through the scene. It helps distinguish nearby structure from the room behind it.', note: 'Shown as exported. The grayscale image is not a calibrated meter scale.' },
  { name: 'Roughness', file: 'roughness', role: 'Material response', title: 'Sharp reflections or diffuse highlights.', description: 'Material roughness describes how a surface spreads reflected light. It contributes information that surface color alone cannot provide.', note: 'A material property, rather than a rendered reflection.' },
  { name: 'Metallic', file: 'metallic', role: 'Material response', title: 'Another part of the material.', description: 'The metallic pass encodes the material’s metalness parameter. Together with color and roughness, it helps specify how the surface should respond to light.', note: 'Many visible surfaces have low values in this captured pass.' },
]

export default function GBufferExplorer() {
  return <ScrollStory id="gbuffers" distance={220}>{({ progress, playing, takeControl }) =>
    <GBufferFigure autoSelected={playing ? Math.min(4, Math.floor(progress * 5)) : undefined} onInteract={takeControl} />
  }</ScrollStory>
}

function GBufferFigure({ autoSelected, onInteract }) {
  const [manualSelected, setSelected] = useState(0)
  const selected = autoSelected ?? manualSelected
  const pass = passes[selected]
  return <figure className="gbuffer-explorer" aria-labelledby="gbuffer-title">
    <div className="figure-topline"><span id="gbuffer-title">INPUT STUDY / G-BUFFERS</span><span>WAREHOUSE / FRAME 600</span></div>
    <div className="gbuffer-layout">
      <div id="gbuffer-preview" className="gbuffer-preview" role="group" aria-label={`${pass.name} captured pass`}>
        <img src={assetUrl(`gbuffers/${pass.file}.png`)} alt={`${pass.name} G-buffer from warehouse camera 1, frame 600`} width="512" height="288" loading="lazy" />
        <div className="gbuffer-image-label"><span>{pass.name}</span><span>Captured input</span></div>
      </div>
      <div className="gbuffer-explanations" aria-live={autoSelected === undefined ? "polite" : "off"} aria-atomic="true">
        {passes.map((item, i) => <div key={item.file} className="gbuffer-explanation" aria-hidden={selected !== i}>
          <p className="eyebrow">0{i + 1} / {item.role}</p>
          <h3>{item.title}</h3>
          <p>{item.description}</p>
          <p className="gbuffer-note">{item.note}</p>
        </div>)}
      </div>
    </div>
    <div className="gbuffer-selectors" role="group" aria-label="Select a G-buffer pass">
      {passes.map((item, i) => <button type="button" key={item.file} aria-pressed={selected === i} aria-controls="gbuffer-preview" onClick={() => { setSelected(i); onInteract() }}>
        <img src={assetUrl(`gbuffers/${item.file}.png`)} width="512" height="288" loading="lazy" alt="" />
        <span>{item.name}</span>
      </button>)}
    </div>
    <figcaption>Select a pass to inspect it. These five captured inputs share the same camera and frame. Shared letterboxing removed; pixel values otherwise unchanged.</figcaption>
  </figure>
}
