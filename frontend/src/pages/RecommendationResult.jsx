import { useState } from 'react'
import { bookAppointment } from '../services/api'
import './RecommendationResult.css'

const DEPT_ICONS = {
  'Cardiology': '❤️',
  'Dermatology': '🩺',
  'Orthopedics': '🦴',
  'General Medicine': '💊',
  'Neurology': '🧠',
  'Gastroenterology': '🫁',
  'ENT': '👂',
  'Ophthalmology': '👁️',
}

const SEVERITY_CONFIG = {
  High: { className: 'badge--high', dot: '#C4501A', label: 'High Risk' },
  Medium: { className: 'badge--medium', dot: '#8B6914', label: 'Moderate' },
  Low: { className: 'badge--low', dot: '#1A6B5A', label: 'Low Risk' },
}

export default function RecommendationResult({ result, formData, onBooked, onBack }) {
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [booking, setBooking] = useState(false)
  const [error, setError] = useState('')

  const sev = SEVERITY_CONFIG[result.severity] || SEVERITY_CONFIG.Low
  const deptIcon = DEPT_ICONS[result.department] || '🏥'
  const doctor = result.doctor

  const handleBook = async () => {
    if (!selectedSlot) return setError('Please select an appointment slot.')
    setError('')
    setBooking(true)
    try {
      const res = await bookAppointment({
        patient_name: formData.name,
        patient_age: formData.age,
        doctor_id: doctor.id,
        slot_id: selectedSlot.id,
        symptoms: formData.symptoms,
        severity: result.severity,
      })
      onBooked({ ...res.appointment, severity: result.severity, slot: selectedSlot })
    } catch (e) {
      setError(e.message || 'Booking failed. Please try again.')
    } finally {
      setBooking(false)
    }
  }

  return (
    <div className="rr-page">
      <div className="container">

        {/* Emergency Alert */}
        {result.emergency_warning && (
          <div className="rr-emergency fade-in">
            <div className="rr-emergency-icon">⚠️</div>
            <div>
              <strong>High Risk Detected</strong>
              <p>{result.emergency_warning}</p>
            </div>
          </div>
        )}

        {/* Triage Summary */}
        <div className="rr-summary card fade-in">
          <div className="rr-summary-top">
            <div className="rr-dept-badge">
              <span className="rr-dept-icon">{deptIcon}</span>
              <div>
                <div className="rr-dept-label">Recommended Department</div>
                <div className="rr-dept-name">{result.department}</div>
              </div>
            </div>
            <div className={`badge ${sev.className}`}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: sev.dot, display: 'inline-block' }} />
              {sev.label}
            </div>
          </div>

          <div className="rr-reason">
            <div className="rr-reason-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Reason for Recommendation
            </div>
            <p className="rr-reason-text">{result.reason}</p>
          </div>
        </div>

        {/* Doctor Card */}
        {doctor && (
          <div className="card rr-doctor fade-in">
            <div className="rr-doctor-header">
              <div className="rr-doctor-avatar">
                {doctor.photo_initials || doctor.name?.split(' ').map(p => p[0]).join('').slice(0, 2)}
              </div>
              <div>
                <div className="rr-doctor-name">Dr. {doctor.name}</div>
                <div className="rr-doctor-spec">{doctor.specialization}</div>
                <div className="rr-doctor-exp">{doctor.experience_years} years experience</div>
              </div>
              <div className="rr-doctor-dept-tag">{doctor.department}</div>
            </div>
          </div>
        )}

        {/* Appointment Slots */}
        <div className="rr-slots-section fade-in">
          <h2 className="rr-section-title">Available Appointment Slots</h2>
          <p className="rr-section-sub">Select a time that works for you</p>

          {result.available_slots?.length > 0 ? (
            <div className="rr-slots-grid">
              {result.available_slots.map(slot => (
                <button
                  key={slot.id}
                  className={`rr-slot ${selectedSlot?.id === slot.id ? 'rr-slot--selected' : ''}`}
                  onClick={() => setSelectedSlot(slot)}
                >
                  <div className="rr-slot-time">{slot.time_slot}</div>
                  <div className="rr-slot-date">{slot.date_display}</div>
                  <div className="rr-slot-wait">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    ~{slot.estimated_wait_time} min wait
                  </div>
                  {selectedSlot?.id === slot.id && (
                    <div className="rr-slot-check">✓</div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="rr-no-slots">
              <p>No available slots found. Please contact the hospital directly.</p>
            </div>
          )}
        </div>

        {error && (
          <div className="alert alert--danger" style={{ marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div className="rr-actions">
          <button className="btn btn--outline" onClick={onBack}>
            ← Back
          </button>
          <button
            className="btn btn--primary btn--lg"
            onClick={handleBook}
            disabled={!selectedSlot || booking}
          >
            {booking ? (
              <><span className="spinner" /> Booking...</>
            ) : (
              <>Confirm Appointment →</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
