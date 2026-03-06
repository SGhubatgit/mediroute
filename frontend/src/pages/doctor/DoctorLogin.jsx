import { useState, useEffect } from 'react'
import { getDoctors, createDoctor } from '../../services/api'
import './DoctorLogin.css'

export default function DoctorLogin({ onLogin, onBack }) {
  const [doctors, setDoctors] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newDoctor, setNewDoctor] = useState({ name: '', department: 'General Medicine', specialization: '', experience_years: 5 })
  const [addingError, setAddingError] = useState('')

  useEffect(() => {
    getDoctors()
      .then(data => { setDoctors(data); setLoading(false) })
      .catch(() => { setError('Could not connect to server.'); setLoading(false) })
  }, [])

  const DEPT_ICONS = {
    'Cardiology': '❤️', 'Dermatology': '🩺', 'Orthopedics': '🦴',
    'General Medicine': '💊', 'Neurology': '🧠', 'Gastroenterology': '🫁',
    'ENT': '👂', 'Ophthalmology': '👁️',
  }

  const deptGroups = doctors.reduce((acc, d) => {
    if (!acc[d.department]) acc[d.department] = []
    acc[d.department].push(d)
    return acc
  }, {})

  const handleCreateDoctor = async (e) => {
    e.preventDefault()
    setAddingError('')
    if (!newDoctor.name || !newDoctor.specialization) {
      setAddingError('Please fill all fields')
      return
    }
    try {
      const doc = await createDoctor(newDoctor)
      setDoctors([...doctors, doc])
      setSelected(doc)
      setShowAddForm(false)
    } catch (err) {
      setAddingError(err.message || 'Failed to add doctor')
    }
  }

  return (
    <div className="dl-page">
      <div className="dl-bg" />
      <div className="dl-container">
        <button className="dl-back" onClick={onBack}>← Back to Patient Portal</button>

        <div className="dl-header">
          <div className="dl-logo">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L4 7v10l8 5 8-5V7L12 2z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M12 8v8M8 12h8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="dl-title">Doctor Portal</h1>
          <p className="dl-sub">Select your profile to access the dashboard or join as a new doctor</p>
          <button className="btn btn--secondary" onClick={() => setShowAddForm(!showAddForm)} style={{ marginTop: '1rem' }}>
            {showAddForm ? 'Cancel' : 'Join as New Doctor'}
          </button>
        </div>

        {showAddForm && (
          <form className="dl-add-form fade-in" onSubmit={handleCreateDoctor} style={{ background: 'white', padding: '2rem', borderRadius: '1rem', marginBottom: '2rem' }}>
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Add New Doctor Profile</h2>
            {addingError && <div className="alert alert--danger">{addingError}</div>}
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" className="input" placeholder="e.g. Rahul Sharma" value={newDoctor.name} onChange={e => setNewDoctor({ ...newDoctor, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Department</label>
              <select className="input" value={newDoctor.department} onChange={e => setNewDoctor({ ...newDoctor, department: e.target.value })}>
                {Object.keys(DEPT_ICONS).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Specialization</label>
              <input type="text" className="input" placeholder="e.g. Heart Surgeon" value={newDoctor.specialization} onChange={e => setNewDoctor({ ...newDoctor, specialization: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Experience (Years)</label>
              <input type="number" className="input" min="0" value={newDoctor.experience_years} onChange={e => setNewDoctor({ ...newDoctor, experience_years: parseInt(e.target.value) || 0 })} />
            </div>
            <button type="submit" className="btn btn--primary" style={{ width: '100%' }}>Create & Login</button>
          </form>
        )}

        {loading && <div className="dl-loading"><div className="spinner spinner--dark" /></div>}
        {error && <div className="alert alert--danger">{error}</div>}

        {!loading && !error && Object.entries(deptGroups).map(([dept, drs]) => (
          <div key={dept} className="dl-dept-group">
            <div className="dl-dept-label">
              <span>{DEPT_ICONS[dept] || '🏥'}</span> {dept}
            </div>
            <div className="dl-doctors-grid">
              {drs.map(doctor => (
                <button
                  key={doctor.id}
                  className={`dl-doctor-card ${selected?.id === doctor.id ? 'dl-doctor-card--selected' : ''}`}
                  onClick={() => setSelected(doctor)}
                >
                  <div className="dl-doc-avatar">
                    {doctor.photo_initials || doctor.name.split(' ').map(p => p[0]).join('').slice(0, 2)}
                  </div>
                  <div className="dl-doc-info">
                    <div className="dl-doc-name">Dr. {doctor.name}</div>
                    <div className="dl-doc-spec">{doctor.specialization.split('&')[0].trim()}</div>
                  </div>
                  {selected?.id === doctor.id && (
                    <div className="dl-doc-check">✓</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}

        {selected && (
          <div className="dl-cta">
            <div className="dl-selected-info">
              Logging in as <strong>Dr. {selected.name}</strong> · {selected.department}
            </div>
            <button className="btn btn--primary btn--lg dl-login-btn" onClick={() => onLogin(selected.id)}>
              Open Dashboard →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
