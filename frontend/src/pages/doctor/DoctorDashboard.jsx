import { useState, useEffect, useCallback } from 'react'
import {
  getDoctorDashboard, getDoctorQueries, getDoctorQueryDetail,
  doctorReply, updateQueryStatus, getDoctorAppointments, updateDoctorAvailability
} from '../../services/api'
import './DoctorDashboard.css'

const SEVERITY_COLOR = { High: '#C4501A', Medium: '#8B6914', Low: '#1A6B5A' }
const PRIORITY_COLOR = { high: '#C4501A', medium: '#8B6914', low: '#1A6B5A' }
const STATUS_LABELS = { pending: 'Pending', seen: 'Seen', replied: 'Replied', closed: 'Closed' }

function formatTime(dateStr) {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = (now - d) / 1000
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export default function DoctorDashboard({ doctorId, onLogout }) {
  const [tab, setTab] = useState('overview')
  const [dashData, setDashData] = useState(null)
  const [queries, setQueries] = useState([])
  const [appointments, setAppointments] = useState([])
  const [selectedQuery, setSelectedQuery] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [queryLoading, setQueryLoading] = useState(false)

  const loadDashboard = useCallback(async () => {
    try {
      const data = await getDoctorDashboard(doctorId)
      setDashData(data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [doctorId])

  const loadQueries = useCallback(async () => {
    const data = await getDoctorQueries(doctorId, filterStatus)
    setQueries(data)
  }, [doctorId, filterStatus])

  const loadAppointments = useCallback(async () => {
    const data = await getDoctorAppointments(doctorId)
    setAppointments(data)
  }, [doctorId])

  useEffect(() => { loadDashboard() }, [loadDashboard])
  useEffect(() => { if (tab === 'queries') loadQueries() }, [tab, loadQueries])
  useEffect(() => { if (tab === 'appointments') loadAppointments() }, [tab, loadAppointments])
  useEffect(() => { if (tab === 'queries') loadQueries() }, [filterStatus])

  const openQuery = async (q) => {
    setQueryLoading(true)
    const full = await getDoctorQueryDetail(doctorId, q.id)
    setSelectedQuery(full)
    setQueryLoading(false)
    // Refresh list to update unread
    loadQueries()
    loadDashboard()
  }

  const sendReply = async () => {
    if (!replyText.trim()) return
    setSending(true)
    const msg = await doctorReply(doctorId, selectedQuery.id, replyText.trim())
    setSelectedQuery(prev => ({ ...prev, messages: [...prev.messages, msg], status: 'replied' }))
    setReplyText('')
    setSending(false)
    loadQueries()
  }

  const closeQuery = async (qId) => {
    await updateQueryStatus(doctorId, qId, 'closed')
    setSelectedQuery(prev => ({ ...prev, status: 'closed' }))
    loadQueries()
  }

  const doctor = dashData?.doctor

  const toggleAvailability = async () => {
    if (!doctor) return
    const current = doctor.is_available
    // Optimistic update
    setDashData(prev => ({
      ...prev,
      doctor: { ...prev.doctor, is_available: !current }
    }))
    try {
      await updateDoctorAvailability(doctor.id, !current)
    } catch (err) {
      console.error(err)
      // Revert on error
      setDashData(prev => ({
        ...prev,
        doctor: { ...prev.doctor, is_available: current }
      }))
    }
  }

  return (
    <div className="dd-layout">
      {/* Sidebar */}
      <aside className="dd-sidebar">
        <div className="dd-sidebar-logo">
          <div className="dd-sidebar-logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L4 7v10l8 5 8-5V7L12 2z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M12 8v8M8 12h8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <span className="dd-sidebar-logo-text">MediRoute</span>
        </div>

        {doctor && (
          <div className="dd-doctor-profile">
            <div className="dd-doctor-avatar">{doctor.photo_initials || 'DR'}</div>
            <div className="dd-doctor-name">Dr. {doctor.name}</div>
            <div className="dd-doctor-dept">{doctor.department}</div>
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>Taking Appointments:</label>
              <button
                onClick={toggleAvailability}
                style={{
                  background: doctor.is_available ? '#1A6B5A' : '#C4501A',
                  color: 'white',
                  border: 'none',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.8rem'
                }}
              >
                {doctor.is_available ? 'Available' : 'Unavailable'}
              </button>
            </div>
          </div>
        )}

        <nav className="dd-nav">
          {[
            { key: 'overview', icon: HomeIcon, label: 'Overview' },
            { key: 'queries', icon: MessageIcon, label: 'Patient Queries', badge: dashData?.stats?.pending_queries },
            { key: 'appointments', icon: CalIcon, label: 'Appointments' },
            { key: 'schedule', icon: ClockIcon, label: 'Today\'s Schedule' },
          ].map(({ key, icon: Icon, label, badge }) => (
            <button
              key={key}
              className={`dd-nav-item ${tab === key ? 'dd-nav-item--active' : ''}`}
              onClick={() => { setTab(key); setSelectedQuery(null) }}
            >
              <Icon />
              <span>{label}</span>
              {badge > 0 && <span className="dd-nav-badge">{badge}</span>}
            </button>
          ))}
        </nav>

        <button className="dd-logout" onClick={onLogout}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="dd-main">
        {loading && (
          <div className="dd-loading"><div className="spinner spinner--dark" /><p>Loading dashboard…</p></div>
        )}

        {/* ── Overview ── */}
        {!loading && tab === 'overview' && dashData && (
          <div className="dd-content fade-in">
            <div className="dd-page-header">
              <h1 className="dd-page-title">Good {getGreeting()}, Dr. {doctor?.name?.split(' ')[0]}</h1>
              <p className="dd-page-sub">Here's your practice summary for today</p>
            </div>

            <div className="dd-stats-grid">
              {[
                { label: "Today's Patients", value: dashData.stats.today_appointments, color: 'var(--accent)', icon: '👤' },
                { label: 'Pending Queries', value: dashData.stats.pending_queries, color: '#C4501A', icon: '💬' },
                { label: 'Total Appointments', value: dashData.stats.total_appointments, color: '#8B6914', icon: '📅' },
                { label: 'Total Queries', value: dashData.stats.total_queries, color: '#1A6B5A', icon: '📨' },
              ].map(s => (
                <div key={s.label} className="dd-stat-card">
                  <div className="dd-stat-icon">{s.icon}</div>
                  <div className="dd-stat-value" style={{ color: s.color }}>{s.value}</div>
                  <div className="dd-stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Today's Schedule Preview */}
            <div className="dd-section">
              <div className="dd-section-header">
                <h2 className="dd-section-title">Today's Schedule</h2>
                <button className="dd-section-link" onClick={() => setTab('schedule')}>View all →</button>
              </div>
              {dashData.todays_schedule.length === 0 ? (
                <div className="dd-empty">No appointments scheduled for today</div>
              ) : (
                <div className="dd-schedule-list">
                  {dashData.todays_schedule.slice(0, 5).map(appt => (
                    <div key={appt.id} className="dd-schedule-row">
                      <div className="dd-schedule-token">{appt.token_number}</div>
                      <div className="dd-schedule-time">{appt.time_slot}</div>
                      <div className="dd-schedule-patient">
                        <div className="dd-schedule-name">{appt.patient_name}</div>
                        <div className="dd-schedule-age">Age {appt.patient_age}</div>
                      </div>
                      <div className="dd-schedule-symptoms">{appt.symptoms?.slice(0, 50) || '—'}</div>
                      <div className={`dd-sev-dot`} style={{ background: SEVERITY_COLOR[appt.severity] || '#888' }} title={appt.severity} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming */}
            {dashData.upcoming_appointments.length > 0 && (
              <div className="dd-section">
                <div className="dd-section-header">
                  <h2 className="dd-section-title">Upcoming (Next 3 Days)</h2>
                </div>
                <div className="dd-schedule-list">
                  {dashData.upcoming_appointments.map(appt => (
                    <div key={appt.id} className="dd-schedule-row">
                      <div className="dd-schedule-token">{appt.token_number}</div>
                      <div className="dd-schedule-time">
                        <div>{appt.time_slot}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {new Date(appt.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </div>
                      </div>
                      <div className="dd-schedule-patient">
                        <div className="dd-schedule-name">{appt.patient_name}</div>
                        <div className="dd-schedule-age">Age {appt.patient_age}</div>
                      </div>
                      <div className={`dd-sev-dot`} style={{ background: SEVERITY_COLOR[appt.severity] || '#888' }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Queries ── */}
        {!loading && tab === 'queries' && (
          <div className="dd-queries-layout">
            {/* Query List */}
            <div className={`dd-query-list ${selectedQuery ? 'dd-query-list--shrunk' : ''}`}>
              <div className="dd-page-header" style={{ marginBottom: 16 }}>
                <h1 className="dd-page-title">Patient Queries</h1>
                <div className="dd-filter-tabs">
                  {['', 'pending', 'replied', 'closed'].map(s => (
                    <button
                      key={s}
                      className={`dd-filter-tab ${filterStatus === s ? 'dd-filter-tab--active' : ''}`}
                      onClick={() => setFilterStatus(s)}
                    >
                      {s === '' ? 'All' : STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>

              {queries.length === 0 && (
                <div className="dd-empty">No queries found</div>
              )}

              {queries.map(q => (
                <div
                  key={q.id}
                  className={`dd-query-card ${selectedQuery?.id === q.id ? 'dd-query-card--active' : ''} ${q.status === 'pending' ? 'dd-query-card--unread' : ''}`}
                  onClick={() => openQuery(q)}
                >
                  <div className="dd-query-card-top">
                    <div className="dd-query-patient-avatar">
                      {q.patient_name[0].toUpperCase()}
                    </div>
                    <div className="dd-query-meta">
                      <div className="dd-query-patient-name">{q.patient_name}</div>
                      <div className="dd-query-time">{formatTime(q.created_at)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="dd-priority-dot" style={{ background: PRIORITY_COLOR[q.priority] }} />
                      {q.unread_count > 0 && (
                        <span className="dd-unread-badge">{q.unread_count}</span>
                      )}
                    </div>
                  </div>
                  <div className="dd-query-subject">{q.subject}</div>
                  {q.last_message && (
                    <div className="dd-query-preview">
                      {q.last_message.sender === 'doctor' ? '↩ You: ' : ''}
                      {q.last_message.content}
                    </div>
                  )}
                  <div className="dd-query-status-row">
                    {q.appointment_token && (
                      <span className="dd-appt-token">Token {q.appointment_token}</span>
                    )}
                    <span className={`dd-status-pill dd-status-pill--${q.status}`}>
                      {STATUS_LABELS[q.status]}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Thread */}
            {selectedQuery && (
              <div className="dd-chat-panel fade-in">
                <div className="dd-chat-header">
                  <button className="dd-chat-back" onClick={() => setSelectedQuery(null)}>←</button>
                  <div className="dd-chat-patient-avatar">
                    {selectedQuery.patient_name[0]}
                  </div>
                  <div className="dd-chat-patient-info">
                    <div className="dd-chat-patient-name">{selectedQuery.patient_name}</div>
                    <div className="dd-chat-patient-sub">Age {selectedQuery.patient_age} · {selectedQuery.subject}</div>
                  </div>
                  <div className="dd-chat-actions">
                    <span className={`dd-status-pill dd-status-pill--${selectedQuery.status}`}>
                      {STATUS_LABELS[selectedQuery.status]}
                    </span>
                    {selectedQuery.status !== 'closed' && (
                      <button className="dd-close-btn" onClick={() => closeQuery(selectedQuery.id)}>
                        Close
                      </button>
                    )}
                  </div>
                </div>

                {/* Symptoms banner */}
                {selectedQuery.symptoms_summary && (
                  <div className="dd-chat-symptoms">
                    <span>🩺</span> <strong>Symptoms:</strong> {selectedQuery.symptoms_summary}
                  </div>
                )}

                <div className="dd-chat-messages">
                  {queryLoading && <div className="dd-loading"><div className="spinner spinner--dark" /></div>}
                  {selectedQuery.messages?.map(msg => (
                    <div
                      key={msg.id}
                      className={`dd-msg ${msg.sender === 'doctor' ? 'dd-msg--doctor' : 'dd-msg--patient'}`}
                    >
                      <div className="dd-msg-bubble">
                        <div className="dd-msg-sender">{msg.sender_name}</div>
                        <div className="dd-msg-content">{msg.content}</div>
                        <div className="dd-msg-time">{formatTime(msg.sent_at)}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedQuery.status !== 'closed' && (
                  <div className="dd-chat-input">
                    <textarea
                      className="dd-chat-textarea"
                      placeholder="Type your reply…"
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() } }}
                      rows={3}
                    />
                    <button
                      className="btn btn--primary dd-send-btn"
                      onClick={sendReply}
                      disabled={!replyText.trim() || sending}
                    >
                      {sending ? <span className="spinner" /> : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                      Send
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Appointments ── */}
        {!loading && tab === 'appointments' && (
          <div className="dd-content fade-in">
            <div className="dd-page-header">
              <h1 className="dd-page-title">All Appointments</h1>
              <p className="dd-page-sub">{appointments.length} total appointments</p>
            </div>
            <div className="dd-appt-table-wrap">
              <table className="dd-appt-table">
                <thead>
                  <tr>
                    <th>Token</th>
                    <th>Patient</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Severity</th>
                    <th>Symptoms</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map(a => (
                    <tr key={a.id}>
                      <td><span className="dd-token-chip">{a.token_number}</span></td>
                      <td>
                        <div className="dd-appt-patient">{a.patient_name}</div>
                        <div className="dd-appt-age">Age {a.patient_age}</div>
                      </td>
                      <td>{new Date(a.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td>{a.time_slot}</td>
                      <td>
                        <span className="dd-sev-label" style={{ color: SEVERITY_COLOR[a.severity] }}>
                          ● {a.severity}
                        </span>
                      </td>
                      <td className="dd-appt-symp">{a.symptoms?.slice(0, 60) || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {appointments.length === 0 && <div className="dd-empty">No appointments yet</div>}
            </div>
          </div>
        )}

        {/* ── Today's Schedule ── */}
        {!loading && tab === 'schedule' && dashData && (
          <div className="dd-content fade-in">
            <div className="dd-page-header">
              <h1 className="dd-page-title">Today's Schedule</h1>
              <p className="dd-page-sub">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>

            {dashData.todays_schedule.length === 0 ? (
              <div className="dd-empty dd-empty--large">
                <div style={{ fontSize: 48 }}>📅</div>
                <p>No appointments scheduled for today</p>
              </div>
            ) : (
              <div className="dd-schedule-cards">
                {dashData.todays_schedule.map((appt, i) => (
                  <div key={appt.id} className="dd-schedule-card fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                    <div className="dd-sc-number">#{i + 1}</div>
                    <div className="dd-sc-token">{appt.token_number}</div>
                    <div className="dd-sc-time">{appt.time_slot}</div>
                    <div className="dd-sc-divider" />
                    <div className="dd-sc-patient">
                      <div className="dd-sc-name">{appt.patient_name}</div>
                      <div className="dd-sc-age">Age {appt.patient_age}</div>
                    </div>
                    {appt.symptoms && (
                      <div className="dd-sc-symptoms">{appt.symptoms}</div>
                    )}
                    <div
                      className="dd-sc-sev"
                      style={{
                        background: SEVERITY_COLOR[appt.severity] + '18',
                        color: SEVERITY_COLOR[appt.severity],
                        borderColor: SEVERITY_COLOR[appt.severity] + '44',
                      }}
                    >
                      {appt.severity} Risk
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

// Icons
const HomeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
)
const MessageIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const CalIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
)
const ClockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
)
