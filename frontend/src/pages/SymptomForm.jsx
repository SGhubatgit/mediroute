import { useState, useRef, useEffect } from 'react'
import { analyzeSymptoms, getSymptomSuggestions } from '../services/api'
import './SymptomForm.css'

const QUICK_SYMPTOMS = [
  'Fever', 'Cough', 'Headache', 'Chest Pain', 'Back Pain',
  'Skin Rash', 'Joint Pain', 'Nausea', 'Dizziness', 'Fatigue',
]

export default function SymptomForm({ onComplete }) {
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [symptoms, setSymptoms] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const suggTimeout = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    // Pre-fetch suggestions
    getSymptomSuggestions('').then(r => setSuggestions(r.suggestions || []))
  }, [])

  const fetchSuggestions = (val) => {
    clearTimeout(suggTimeout.current)
    suggTimeout.current = setTimeout(async () => {
      const r = await getSymptomSuggestions(val)
      setSuggestions(r.suggestions || [])
      setShowSuggestions(true)
    }, 200)
  }

  const handleSymptomsChange = (e) => {
    const val = e.target.value
    setSymptoms(val)
    if (val.length > 1) {
      fetchSuggestions(val)
    } else {
      setShowSuggestions(false)
    }
  }

  const addSuggestion = (s) => {
    const current = symptoms.trim()
    if (!current) {
      setSymptoms(s)
    } else if (!current.toLowerCase().includes(s.toLowerCase())) {
      setSymptoms(current + ', ' + s)
    }
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  const handleSubmit = async () => {
    setError('')
    if (!name.trim()) return setError('Please enter your name.')
    if (!age || isNaN(age) || age < 1 || age > 120) return setError('Please enter a valid age.')
    if (!symptoms.trim()) return setError('Please describe your symptoms.')

    setLoading(true)
    try {
      const result = await analyzeSymptoms({ name: name.trim(), age: parseInt(age), symptoms: symptoms.trim() })
      onComplete(result, { name: name.trim(), age: parseInt(age), symptoms: symptoms.trim() })
    } catch (e) {
      setError(e.message || 'Failed to connect to server. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="sf-page">
      <div className="container">
        <div className="sf-hero">
          <div className="sf-hero-badge">AI-Powered Triage</div>
          <h1 className="sf-hero-title">Find the right doctor,<br /><em>fast.</em></h1>
          <p className="sf-hero-sub">
            Describe your symptoms and our smart system will recommend the correct department,
            assign a doctor, and show you available appointment slots.
          </p>
        </div>

        <div className="card sf-form">
          <div className="sf-form-grid">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Age</label>
              <input
                className="form-input"
                type="number"
                placeholder="e.g. 34"
                min="1"
                max="120"
                value={age}
                onChange={e => setAge(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label">Describe Your Symptoms</label>
            <textarea
              ref={inputRef}
              className="form-textarea"
              placeholder="e.g. fever, chest pain, shortness of breath..."
              value={symptoms}
              onChange={handleSymptomsChange}
              onFocus={() => symptoms.length > 1 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              rows={4}
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="sf-suggestions">
                {suggestions.map(s => (
                  <button key={s} className="sf-suggestion-item" onMouseDown={() => addSuggestion(s)}>
                    <span className="sf-suggestion-icon">+</span> {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="sf-quick-label">Quick add symptoms:</div>
          <div className="sf-quick-chips">
            {QUICK_SYMPTOMS.map(s => (
              <button
                key={s}
                className={`sf-chip ${symptoms.toLowerCase().includes(s.toLowerCase()) ? 'sf-chip--active' : ''}`}
                onClick={() => addSuggestion(s)}
              >
                {s}
              </button>
            ))}
          </div>

          {error && (
            <div className="alert alert--danger" style={{ marginTop: 16 }}>
              {error}
            </div>
          )}

          <button
            className="btn btn--primary btn--lg sf-submit"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" />
                Analyzing Symptoms...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M9.5 3A6.5 6.5 0 0 1 16 9.5c0 1.61-.59 3.09-1.56 4.23l.27.27h.79l5 5-1.5 1.5-5-5v-.79l-.27-.27A6.516 6.516 0 0 1 9.5 16 6.5 6.5 0 0 1 3 9.5 6.5 6.5 0 0 1 9.5 3z" fill="currentColor"/>
                </svg>
                Analyze Symptoms
              </>
            )}
          </button>
        </div>

        <div className="sf-features">
          {[
            { icon: '🏥', label: 'Smart Triage', desc: 'AI-powered department routing' },
            { icon: '👨‍⚕️', label: 'Doctor Match', desc: 'Automatic specialist assignment' },
            { icon: '📅', label: 'Live Slots', desc: 'Real-time availability' },
            { icon: '🎫', label: 'Token System', desc: 'Instant appointment tokens' },
          ].map(f => (
            <div key={f.label} className="sf-feature">
              <span className="sf-feature-icon">{f.icon}</span>
              <div className="sf-feature-label">{f.label}</div>
              <div className="sf-feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
