import { useState, useEffect, useRef } from 'react'
import { getDoctors, submitQuery, getQueryStatus, patientReply } from '../../services/api'
import './PatientQueryPortal.css'

const STATUS_CONFIG = {
  pending: { label: 'Pending Review', color: '#C4501A', bg: '#FEF3ED' },
  seen: { label: 'Seen by Doctor', color: '#8B6914', bg: '#FDF6E4' },
  replied: { label: 'Doctor Replied', color: '#1A6B5A', bg: '#E8F3F0' },
  closed: { label: 'Closed', color: '#9C948A', bg: '#F0EDE6' },
}

function formatTime(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function PatientQueryPortal({ onBack }) {
  const [view, setView] = useState('menu') // 'menu' | 'submit' | 'track'
  const [doctors, setDoctors] = useState([])
  const [form, setForm] = useState({ patient_name: '', patient_age: '', patient_email: '', doctor_id: '', subject: '', message: '', symptoms_summary: '', priority: 'medium' })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submittedQueryId, setSubmittedQueryId] = useState(null)

  const [trackId, setTrackId] = useState('')
  const [trackQuery, setTrackQuery] = useState(null)
  const [trackError, setTrackError] = useState('')
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    getDoctors().then(setDoctors).catch(() => { })
  }, [])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [trackQuery?.messages])

  const handleSubmit = async () => {
    setSubmitError('')
    const { patient_name, doctor_id, subject, message } = form
    if (!patient_name.trim()) return setSubmitError('Name is required')
    if (!doctor_id) return setSubmitError('Please select a doctor')
    if (!subject.trim()) return setSubmitError('Subject is required')
    if (!message.trim()) return setSubmitError('Message is required')

    setSubmitting(true)
    try {
      const res = await submitQuery({ ...form, patient_age: parseInt(form.patient_age) || 0 })
      setSubmittedQueryId(res.query_id)
    } catch (e) {
      setSubmitError(e.message)
    }
    setSubmitting(false)
  }

  const handleTrack = async () => {
    setTrackError('')
    if (!trackId.trim()) return setTrackError('Enter your query ID')
    try {
      const data = await getQueryStatus(parseInt(trackId))
      setTrackQuery(data)
    } catch (e) {
      setTrackError('Query not found. Check your query ID.')
    }
  }

  const handlePatientReply = async () => {
    if (!replyText.trim()) return
    setSendingReply(true)
    try {
      const msg = await patientReply(trackQuery.id, replyText.trim())
      setTrackQuery(prev => ({ ...prev, messages: [...prev.messages, msg], status: 'pending' }))
      setReplyText('')
    } catch (e) { console.error(e) }
    setSendingReply(false)
  }

  // ── Submitted confirmation ──
  if (submittedQueryId) {
    return (
      <div className="pq-page">
        <div className="pq-container">
          <div className="pq-submitted fade-in">
            <div className="pq-submitted-icon">✓</div>
            <h2 className="pq-submitted-title">Query Submitted!</h2>
            <p className="pq-submitted-sub">Your query has been sent to the doctor.</p>
            <div className="pq-submitted-id">
              <div className="pq-id-label">Your Query ID</div>
              <div className="pq-id-value">#{submittedQueryId}</div>
              <div className="pq-id-hint">Save this ID to track your query</div>
            </div>
            <div className="pq-submitted-actions">
              <button className="btn btn--outline" onClick={() => { setSubmittedQueryId(null); setTrackId(String(submittedQueryId)); setView('track') }}>
                Track This Query
              </button>
              <button className="btn btn--primary" onClick={() => { setSubmittedQueryId(null); setView('menu'); setForm({ patient_name: '', patient_age: '', patient_email: '', doctor_id: '', subject: '', message: '', symptoms_summary: '', priority: 'medium' }) }}>
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pq-page">
      <div className="pq-container">
        <button className="pq-back" onClick={onBack}>← Back to Patient Portal</button>

        {/* ── Menu ── */}
        {view === 'menu' && (
          <div className="pq-menu fade-in">
            <div className="pq-menu-header">
              <div className="pq-menu-icon">💬</div>
              <h1 className="pq-menu-title">Patient Query Portal</h1>
              <p className="pq-menu-sub">Send questions to your doctor or track previous conversations</p>
            </div>
            <div className="pq-menu-cards">
              <button className="pq-menu-card" onClick={() => setView('submit')}>
                <div className="pq-menu-card-icon" style={{ background: '#E8F3F0', color: '#1A6B5A' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <h3>Ask a Question</h3>
                <p>Send a new query or pre-appointment question to a doctor</p>
                <span className="pq-menu-card-arrow">→</span>
              </button>
              <button className="pq-menu-card" onClick={() => setView('track')}>
                <div className="pq-menu-card-icon" style={{ background: '#FDF6E4', color: '#8B6914' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" /><path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                </div>
                <h3>Track My Query</h3>
                <p>Check the status of an existing query and see doctor replies</p>
                <span className="pq-menu-card-arrow">→</span>
              </button>
            </div>
          </div>
        )}

        {/* ── Submit Query ── */}
        {view === 'submit' && (
          <div className="pq-form-wrap fade-in">
            <button className="pq-back-link" onClick={() => setView('menu')}>← Back</button>
            <h2 className="pq-section-title">Ask a Doctor</h2>
            <p className="pq-section-sub">Your question will be sent to the doctor who will reply within 24 hours</p>

            <div className="card pq-form">
              <div className="pq-form-grid2">
                <div className="form-group">
                  <label className="form-label">Your Name *</label>
                  <input className="form-input" placeholder="Full name" value={form.patient_name}
                    onChange={e => setForm(f => ({ ...f, patient_name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Age</label>
                  <input className="form-input" type="number" placeholder="e.g. 28" value={form.patient_age}
                    onChange={e => setForm(f => ({ ...f, patient_age: e.target.value }))} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email (optional – to receive notifications)</label>
                <input className="form-input" type="email" placeholder="your@email.com" value={form.patient_email}
                  onChange={e => setForm(f => ({ ...f, patient_email: e.target.value }))} />
              </div>

              <div className="form-group">
                <label className="form-label">Select Doctor *</label>
                <select className="form-input" value={form.doctor_id}
                  onChange={e => setForm(f => ({ ...f, doctor_id: e.target.value }))}>
                  <option value="">-- Choose a doctor --</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id} disabled={!d.is_available}>
                      Dr. {d.name} – {d.department} {!d.is_available ? '(Not Available)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Subject *</label>
                <input className="form-input" placeholder="e.g. Question about my chest pain symptoms" value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
              </div>

              <div className="form-group">
                <label className="form-label">Your Symptoms (optional)</label>
                <input className="form-input" placeholder="e.g. fever, chest pain, since 3 days" value={form.symptoms_summary}
                  onChange={e => setForm(f => ({ ...f, symptoms_summary: e.target.value }))} />
              </div>

              <div className="form-group">
                <label className="form-label">Your Message *</label>
                <textarea className="form-textarea" rows={5} placeholder="Describe your question or concern in detail..."
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
              </div>

              <div className="form-group">
                <label className="form-label">Priority</label>
                <div className="pq-priority-btns">
                  {[['low', 'Low'], ['medium', 'Medium'], ['high', 'High (Urgent)']].map(([val, label]) => (
                    <button
                      key={val}
                      className={`pq-priority-btn pq-priority-btn--${val} ${form.priority === val ? 'pq-priority-btn--active' : ''}`}
                      onClick={() => setForm(f => ({ ...f, priority: val }))}
                    >{label}</button>
                  ))}
                </div>
              </div>

              {submitError && <div className="alert alert--danger">{submitError}</div>}

              <button className="btn btn--primary btn--lg" style={{ width: '100%' }} onClick={handleSubmit} disabled={submitting}>
                {submitting ? <><span className="spinner" />Sending…</> : 'Send Query to Doctor →'}
              </button>
            </div>
          </div>
        )}

        {/* ── Track Query ── */}
        {view === 'track' && (
          <div className="pq-track-wrap fade-in">
            <button className="pq-back-link" onClick={() => { setView('menu'); setTrackQuery(null); setTrackId('') }}>← Back</button>
            <h2 className="pq-section-title">Track Your Query</h2>

            {!trackQuery ? (
              <div className="card pq-track-form">
                <div className="form-group">
                  <label className="form-label">Enter Your Query ID</label>
                  <input className="form-input" type="number" placeholder="e.g. 5" value={trackId}
                    onChange={e => setTrackId(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleTrack()} />
                </div>
                {trackError && <div className="alert alert--danger">{trackError}</div>}
                <button className="btn btn--primary" onClick={handleTrack}>Find My Query</button>
              </div>
            ) : (
              <div className="pq-chat-view">
                {/* Header */}
                <div className="pq-chat-header">
                  <button className="pq-back-link" style={{ marginBottom: 0 }} onClick={() => setTrackQuery(null)}>← Search Again</button>
                  <div className="pq-chat-meta">
                    <div>
                      <div className="pq-chat-subject">{trackQuery.subject}</div>
                      <div className="pq-chat-doctor">Dr. {trackQuery.doctor_name} · {trackQuery.doctor_department}</div>
                    </div>
                    <div className="pq-status-badge" style={{ background: STATUS_CONFIG[trackQuery.status]?.bg, color: STATUS_CONFIG[trackQuery.status]?.color }}>
                      {STATUS_CONFIG[trackQuery.status]?.label}
                    </div>
                  </div>
                </div>

                {/* Status Timeline */}
                <div className="pq-timeline">
                  {['pending', 'seen', 'replied'].map((s, i) => {
                    const statuses = ['pending', 'seen', 'replied', 'closed']
                    const currIdx = statuses.indexOf(trackQuery.status)
                    const stepIdx = statuses.indexOf(s)
                    const done = currIdx >= stepIdx
                    return (
                      <div key={s} className={`pq-timeline-step ${done ? 'pq-timeline-step--done' : ''}`}>
                        <div className="pq-timeline-dot">{done ? '✓' : i + 1}</div>
                        <div className="pq-timeline-label">{STATUS_CONFIG[s]?.label}</div>
                        {i < 2 && <div className="pq-timeline-line" />}
                      </div>
                    )
                  })}
                </div>

                {/* Messages */}
                <div className="pq-messages">
                  {trackQuery.messages?.map(msg => (
                    <div key={msg.id} className={`pq-msg ${msg.sender === 'patient' ? 'pq-msg--patient' : 'pq-msg--doctor'}`}>
                      <div className="pq-msg-bubble">
                        <div className="pq-msg-sender">{msg.sender === 'doctor' ? `Dr. ${trackQuery.doctor_name}` : msg.sender_name}</div>
                        <div className="pq-msg-content">{msg.content}</div>
                        <div className="pq-msg-time">{formatTime(msg.sent_at)}</div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply */}
                {trackQuery.status !== 'closed' && (
                  <div className="pq-reply-box">
                    <textarea
                      className="form-textarea"
                      rows={3}
                      placeholder="Send a follow-up message to the doctor…"
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                    />
                    <button className="btn btn--primary" onClick={handlePatientReply} disabled={!replyText.trim() || sendingReply}>
                      {sendingReply ? <span className="spinner" /> : 'Send Reply'}
                    </button>
                  </div>
                )}

                {trackQuery.status === 'closed' && (
                  <div className="alert alert--success" style={{ margin: '16px 0' }}>
                    This query has been closed by the doctor.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
