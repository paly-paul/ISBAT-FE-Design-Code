'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import katex from 'katex'

// Maths tools for RichTextEditor: a symbol palette and an equation builder.
//
// Equations are written in LaTeX and stored in the question HTML as MathML
// (KaTeX, output: 'mathml'). Browsers draw MathML natively, so a saved
// question shows its equations anywhere its HTML is rendered — no KaTeX CSS or
// script is needed on the reading side. Each equation is wrapped as
//   <span class="rte-math" contenteditable="false" data-latex="…" data-display="0|1">…</span>
// data-latex keeps the source so a click in the editor reopens it for editing.
// The MathML also carries the source in an <annotation encoding="application/x-tex">.

// ── Rendering ──────────────────────────────────────────────────────────────

export function renderMathML(latex: string, display: boolean): string {
  return katex.renderToString(latex, {
    output: 'mathml',
    displayMode: display,
    throwOnError: true,
    strict: 'ignore',
    trust: false,
  })
}

function escapeAttr(s: string) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** The stored HTML for one equation. Throws if the LaTeX doesn't parse. */
export function equationHtml(latex: string, display: boolean): string {
  return `<span class="rte-math${display ? ' rte-math-block' : ''}" contenteditable="false" data-latex="${escapeAttr(latex)}" data-display="${display ? 1 : 0}">${renderMathML(latex, display)}</span>`
}

// ── Symbol palette ─────────────────────────────────────────────────────────

type Sym = [glyph: string, name: string]

const SYMBOL_GROUPS: { id: string; label: string; symbols: Sym[] }[] = [
  {
    id: 'basic', label: 'Operators', symbols: [
      ['+', 'Plus'], ['−', 'Minus'], ['×', 'Multiply'], ['÷', 'Divide'], ['±', 'Plus or minus'], ['∓', 'Minus or plus'],
      ['·', 'Dot'], ['∗', 'Asterisk'], ['√', 'Square root'], ['∛', 'Cube root'], ['∜', 'Fourth root'], ['∞', 'Infinity'],
      ['%', 'Percent'], ['‰', 'Per mille'], ['°', 'Degree'], ['′', 'Prime'], ['″', 'Double prime'], ['!', 'Factorial'],
      ['²', 'Squared'], ['³', 'Cubed'], ['⁻¹', 'Inverse'], ['½', 'One half'], ['⅓', 'One third'], ['¼', 'One quarter'],
    ],
  },
  {
    id: 'relations', label: 'Relations', symbols: [
      ['=', 'Equals'], ['≠', 'Not equal'], ['≈', 'Approximately equal'], ['≡', 'Identical to'], ['≅', 'Congruent'], ['∼', 'Similar to'],
      ['<', 'Less than'], ['>', 'Greater than'], ['≤', 'Less than or equal'], ['≥', 'Greater than or equal'], ['≪', 'Much less than'], ['≫', 'Much greater than'],
      ['∝', 'Proportional to'], ['≜', 'Defined as'], ['⊥', 'Perpendicular'], ['∥', 'Parallel'], ['∠', 'Angle'], ['△', 'Triangle'],
    ],
  },
  {
    id: 'greek', label: 'Greek', symbols: [
      ['α', 'alpha'], ['β', 'beta'], ['γ', 'gamma'], ['δ', 'delta'], ['ε', 'epsilon'], ['ζ', 'zeta'], ['η', 'eta'], ['θ', 'theta'],
      ['ι', 'iota'], ['κ', 'kappa'], ['λ', 'lambda'], ['μ', 'mu'], ['ν', 'nu'], ['ξ', 'xi'], ['π', 'pi'], ['ρ', 'rho'],
      ['σ', 'sigma'], ['τ', 'tau'], ['υ', 'upsilon'], ['φ', 'phi'], ['χ', 'chi'], ['ψ', 'psi'], ['ω', 'omega'], ['ϑ', 'theta (variant)'],
      ['Γ', 'Gamma'], ['Δ', 'Delta'], ['Θ', 'Theta'], ['Λ', 'Lambda'], ['Ξ', 'Xi'], ['Π', 'Pi'], ['Σ', 'Sigma'], ['Φ', 'Phi'],
      ['Ψ', 'Psi'], ['Ω', 'Omega'],
    ],
  },
  {
    id: 'calculus', label: 'Calculus', symbols: [
      ['∫', 'Integral'], ['∬', 'Double integral'], ['∭', 'Triple integral'], ['∮', 'Contour integral'], ['∂', 'Partial derivative'], ['∇', 'Nabla (gradient)'],
      ['∆', 'Increment'], ['∑', 'Summation'], ['∏', 'Product'], ['∐', 'Coproduct'], ['→', 'Tends to'], ['ẋ', 'x dot (time derivative)'],
      ['′', 'Prime (derivative)'], ['ℯ', 'Euler’s number'], ['ⅈ', 'Imaginary unit'], ['∘', 'Composition'],
    ],
  },
  {
    id: 'sets', label: 'Sets & logic', symbols: [
      ['∈', 'Element of'], ['∉', 'Not an element of'], ['∋', 'Contains'], ['⊂', 'Subset'], ['⊃', 'Superset'], ['⊆', 'Subset or equal'],
      ['⊇', 'Superset or equal'], ['∪', 'Union'], ['∩', 'Intersection'], ['∖', 'Set difference'], ['∅', 'Empty set'], ['℘', 'Power set'],
      ['ℕ', 'Natural numbers'], ['ℤ', 'Integers'], ['ℚ', 'Rationals'], ['ℝ', 'Reals'], ['ℂ', 'Complex numbers'], ['∀', 'For all'],
      ['∃', 'There exists'], ['∄', 'There does not exist'], ['¬', 'Not'], ['∧', 'And'], ['∨', 'Or'], ['⊕', 'Exclusive or'],
      ['∴', 'Therefore'], ['∵', 'Because'],
    ],
  },
  {
    id: 'arrows', label: 'Arrows', symbols: [
      ['→', 'Right arrow'], ['←', 'Left arrow'], ['↔', 'Left-right arrow'], ['↑', 'Up arrow'], ['↓', 'Down arrow'], ['↦', 'Maps to'],
      ['⇒', 'Implies'], ['⇐', 'Implied by'], ['⇔', 'If and only if'], ['⟶', 'Long right arrow'], ['⇌', 'Equilibrium'], ['↺', 'Anticlockwise'],
    ],
  },
  {
    id: 'science', label: 'Science', symbols: [
      ['ℏ', 'Reduced Planck constant'], ['Å', 'Ångström'], ['µ', 'Micro'], ['Ω', 'Ohm'], ['℃', 'Degree Celsius'], ['℉', 'Degree Fahrenheit'],
      ['K', 'Kelvin'], ['λ', 'Wavelength'], ['ν', 'Frequency'], ['⊙', 'Solar'], ['†', 'Dagger'], ['‡', 'Double dagger'],
      ['₀', 'Subscript 0'], ['₁', 'Subscript 1'], ['₂', 'Subscript 2'], ['₃', 'Subscript 3'], ['⁺', 'Superscript plus'], ['⁻', 'Superscript minus'],
    ],
  },
]

/** Inline panel under the toolbar. Buttons keep the editor's caret (mousedown is prevented). */
export function SymbolPalette({ onInsert }: { onInsert: (text: string) => void }) {
  const [groupId, setGroupId] = useState(SYMBOL_GROUPS[0].id)
  const group = SYMBOL_GROUPS.find(g => g.id === groupId) ?? SYMBOL_GROUPS[0]
  return (
    <div className="rte-sym" role="region" aria-label="Maths and science symbols">
      <div className="rte-sym-tabs" role="tablist">
        {SYMBOL_GROUPS.map(g => (
          <button
            key={g.id}
            type="button"
            role="tab"
            aria-selected={g.id === groupId}
            className={`rte-sym-tab${g.id === groupId ? ' is-on' : ''}`}
            onMouseDown={e => e.preventDefault()}
            onClick={() => setGroupId(g.id)}
          >
            {g.label}
          </button>
        ))}
      </div>
      <div className="rte-sym-grid">
        {group.symbols.map(([glyph, name]) => (
          <button
            key={glyph + name}
            type="button"
            className="rte-sym-btn"
            title={name}
            aria-label={`Insert ${name}`}
            onMouseDown={e => { e.preventDefault(); onInsert(glyph) }}
          >
            {glyph}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Equation builder ───────────────────────────────────────────────────────

// `insert` is the LaTeX added at the cursor; `|` marks where the cursor lands
// and is removed. `show` is what the button draws.
type Template = { name: string; show: string; insert: string }

const TEMPLATE_GROUPS: { label: string; items: Template[] }[] = [
  {
    label: 'Structure', items: [
      { name: 'Fraction', show: '\\frac{a}{b}', insert: '\\frac{|}{}' },
      { name: 'Power', show: 'x^{n}', insert: '^{|}' },
      { name: 'Subscript', show: 'x_{n}', insert: '_{|}' },
      { name: 'Square root', show: '\\sqrt{x}', insert: '\\sqrt{|}' },
      { name: 'nth root', show: '\\sqrt[n]{x}', insert: '\\sqrt[|]{}' },
      { name: 'Brackets that grow', show: '\\left( x \\right)', insert: '\\left( | \\right)' },
      { name: 'Absolute value', show: '\\lvert x \\rvert', insert: '\\lvert | \\rvert' },
      { name: 'Text inside an equation', show: '\\text{abc}', insert: '\\text{|}' },
    ],
  },
  {
    label: 'Calculus', items: [
      { name: 'Derivative', show: '\\frac{dy}{dx}', insert: '\\frac{d|}{dx}' },
      { name: 'Second derivative', show: '\\frac{d^{2}y}{dx^{2}}', insert: '\\frac{d^{2}|}{dx^{2}}' },
      { name: 'Partial derivative', show: '\\frac{\\partial f}{\\partial x}', insert: '\\frac{\\partial |}{\\partial x}' },
      { name: 'Integral', show: '\\int f\\,dx', insert: '\\int | \\, dx' },
      { name: 'Definite integral', show: '\\int_{a}^{b}', insert: '\\int_{|}^{} \\, dx' },
      { name: 'Double integral', show: '\\iint', insert: '\\iint_{|} \\, dA' },
      { name: 'Limit', show: '\\lim_{x \\to 0}', insert: '\\lim_{x \\to |}' },
      { name: 'Summation', show: '\\sum_{i=1}^{n}', insert: '\\sum_{i=1}^{|}' },
      { name: 'Product', show: '\\prod_{i=1}^{n}', insert: '\\prod_{i=1}^{|}' },
    ],
  },
  {
    label: 'Functions', items: [
      { name: 'Sine', show: '\\sin x', insert: '\\sin |' },
      { name: 'Cosine', show: '\\cos x', insert: '\\cos |' },
      { name: 'Tangent', show: '\\tan x', insert: '\\tan |' },
      { name: 'Inverse sine', show: '\\sin^{-1}x', insert: '\\sin^{-1}(|)' },
      { name: 'Inverse cosine', show: '\\cos^{-1}x', insert: '\\cos^{-1}(|)' },
      { name: 'Inverse tangent', show: '\\tan^{-1}x', insert: '\\tan^{-1}(|)' },
      { name: 'Logarithm, base b', show: '\\log_{b}x', insert: '\\log_{|}' },
      { name: 'Natural log', show: '\\ln x', insert: '\\ln |' },
      { name: 'Exponential', show: 'e^{x}', insert: 'e^{|}' },
    ],
  },
  {
    label: 'Matrices & vectors', items: [
      { name: '2 × 2 matrix', show: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', insert: '\\begin{pmatrix} | & \\\\ & \\end{pmatrix}' },
      { name: '3 × 3 matrix', show: '\\begin{bmatrix} \\cdot & \\cdot & \\cdot \\\\ \\cdot & \\cdot & \\cdot \\\\ \\cdot & \\cdot & \\cdot \\end{bmatrix}', insert: '\\begin{bmatrix} | & & \\\\ & & \\\\ & & \\end{bmatrix}' },
      { name: 'Determinant', show: '\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}', insert: '\\begin{vmatrix} | & \\\\ & \\end{vmatrix}' },
      { name: 'Piecewise function', show: '\\begin{cases} a & x>0 \\\\ b & x\\le 0 \\end{cases}', insert: '\\begin{cases} | & x > 0 \\\\ & x \\le 0 \\end{cases}' },
      { name: 'Vector', show: '\\vec{v}', insert: '\\vec{|}' },
      { name: 'Unit vector', show: '\\hat{i}', insert: '\\hat{|}' },
      { name: 'Mean (bar)', show: '\\bar{x}', insert: '\\bar{|}' },
      { name: 'Binomial', show: '\\binom{n}{k}', insert: '\\binom{|}{}' },
    ],
  },
]

// Common LaTeX commands, for people who'd rather click than remember them.
const QUICK_SYMBOLS: Template[] = [
  ['\\pi', 'pi'], ['\\theta', 'theta'], ['\\alpha', 'alpha'], ['\\beta', 'beta'], ['\\lambda', 'lambda'], ['\\mu', 'mu'],
  ['\\sigma', 'sigma'], ['\\Delta', 'Delta'], ['\\infty', 'infinity'], ['\\pm', 'plus or minus'], ['\\times', 'times'], ['\\div', 'divide'],
  ['\\cdot', 'dot'], ['\\leq', 'less or equal'], ['\\geq', 'greater or equal'], ['\\neq', 'not equal'], ['\\approx', 'approximately'],
  ['\\to', 'tends to'], ['\\partial', 'partial'], ['\\nabla', 'nabla'], ['\\in', 'element of'], ['\\cup', 'union'], ['\\cap', 'intersection'],
].map(([cmd, name]) => ({ name, show: cmd, insert: `${cmd} |` }))

const EXAMPLE = 'y = \\frac{1 + \\cos^{-1}(3x)}{x^{2} + \\sin^{-1}(2x)}'

function TemplateButton({ t, onPick, small }: { t: Template; onPick: (t: Template) => void; small?: boolean }) {
  // Rendered once per template; the source is fixed, so this can't throw in practice.
  const html = useMemo(() => { try { return renderMathML(t.show, false) } catch { return t.show } }, [t.show])
  return (
    <button
      type="button"
      className={small ? 'rte-tpl rte-tpl-sm' : 'rte-tpl'}
      title={t.name}
      aria-label={`Insert ${t.name}`}
      onClick={() => onPick(t)}
    >
      <span aria-hidden="true" dangerouslySetInnerHTML={{ __html: html }} />
    </button>
  )
}

export interface EquationDialogProps {
  /** Set when editing an equation already in the question. */
  initial?: { latex: string; display: boolean } | null
  onSave: (latex: string, display: boolean) => void
  onRemove?: () => void
  onClose: () => void
}

export function EquationDialog({ initial, onSave, onRemove, onClose }: EquationDialogProps) {
  const [latex, setLatex] = useState(initial?.latex ?? '')
  const [display, setDisplay] = useState(initial?.display ?? false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const editing = !!initial

  useEffect(() => { inputRef.current?.focus() }, [])

  const preview = useMemo(() => {
    if (!latex.trim()) return { html: null as string | null, error: null as string | null }
    try {
      return { html: renderMathML(latex, display), error: null }
    } catch (e) {
      const msg = e instanceof Error ? e.message.replace(/^KaTeX parse error:\s*/, '') : 'This equation can’t be read.'
      return { html: null, error: msg }
    }
  }, [latex, display])

  function pick(t: Template) {
    const el = inputRef.current
    const start = el?.selectionStart ?? latex.length
    const end = el?.selectionEnd ?? latex.length
    const selected = latex.slice(start, end)
    // Selected text goes where the cursor would land, e.g. select "x" → Square root → \sqrt{x}.
    const [before, after = ''] = t.insert.split('|')
    const next = latex.slice(0, start) + before + selected + after + latex.slice(end)
    setLatex(next)
    const caret = start + before.length + selected.length
    requestAnimationFrame(() => { el?.focus(); el?.setSelectionRange(caret, caret) })
  }

  const canSave = !!preview.html

  return createPortal(
    <div className="modal-overlay open" style={{ zIndex: 650 }}>
      <div className="modal modal-lg modal-flex rte-eq" role="dialog" aria-modal="true" aria-labelledby="rte-eq-title">
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title" id="rte-eq-title"><i className="lni lni-calculator"></i> {editing ? 'Edit Equation' : 'Insert Equation'}</div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close"><i className="lni lni-close"></i></button>
        </div>

        <div className="modal-scroll rte-eq-body">
          <div className="rte-eq-groups">
            {TEMPLATE_GROUPS.map(g => (
              <section key={g.label} aria-label={g.label}>
                <h3 className="rte-eq-group-lbl">{g.label}</h3>
                <div className="rte-eq-tpls">
                  {g.items.map(t => <TemplateButton key={t.name} t={t} onPick={pick} />)}
                </div>
              </section>
            ))}
            <section aria-label="Symbols">
              <h3 className="rte-eq-group-lbl">Symbols</h3>
              <div className="rte-eq-tpls">
                {QUICK_SYMBOLS.map(t => <TemplateButton key={t.name} t={t} onPick={pick} small />)}
              </div>
            </section>
          </div>

          <div className="fg" style={{ marginBottom: 0 }}>
            <div className="rte-eq-src-hdr">
              <label className="lbl" htmlFor="rte-eq-src" style={{ marginBottom: 0 }}>Equation (LaTeX)</label>
              {!latex && (
                <button type="button" className="rte-eq-link" onClick={() => { setLatex(EXAMPLE); inputRef.current?.focus() }}>
                  Show an example
                </button>
              )}
            </div>
            <textarea
              id="rte-eq-src"
              ref={inputRef}
              className="ctrl rte-eq-src"
              rows={3}
              value={latex}
              onChange={e => setLatex(e.target.value)}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              placeholder="Pick a template above, or type LaTeX, e.g. \frac{dy}{dx} = 3x^{2}"
              aria-describedby="rte-eq-help"
            />
            <p id="rte-eq-help" className="rte-eq-help">
              Select part of the equation before picking a template to wrap it. Use <code>{'{ }'}</code> to group, <code>^</code> for powers and <code>_</code> for subscripts.
            </p>
          </div>

          <div className="rte-eq-preview-hdr">
            <span className="lbl" style={{ marginBottom: 0 }}>Preview</span>
            <label className="rte-eq-toggle">
              <input type="checkbox" checked={display} onChange={e => setDisplay(e.target.checked)} />
              Show on its own line, centred
            </label>
          </div>
          <div className={`rte-eq-preview${preview.error ? ' is-error' : ''}`} aria-live="polite">
            {preview.html
              ? <div dangerouslySetInnerHTML={{ __html: preview.html }} />
              : preview.error
                ? <span><i className="lni lni-warning" aria-hidden="true"></i> Can’t read this yet: {preview.error}</span>
                : <span className="rte-eq-empty">Your equation appears here as you build it.</span>}
          </div>
        </div>

        <div className="modal-footer">
          {editing && onRemove && (
            <button type="button" className="btn btn-neu" style={{ marginRight: 'auto', color: 'var(--red)' }} onClick={onRemove}>
              <i className="lni lni-trash-can"></i> Remove
            </button>
          )}
          <button type="button" className="btn btn-neu" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" disabled={!canSave} onClick={() => onSave(latex.trim(), display)}>
            <i className="lni lni-checkmark"></i> {editing ? 'Update Equation' : 'Insert Equation'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
