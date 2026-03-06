import './AppointmentConfirmation.css'

export default function AppointmentConfirmation({ confirmation, onReset, onSendQuery }) {
  if (!confirmation) return null

  return (
    <div className="ac-page">
      <div className="container">
        <div className="ac-wrapper fade-in">

          {/* Success Icon */}
          <div className="ac-success-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <h1 className="ac-title">Appointment Confirmed</h1>
          <p className="ac-subtitle">Your appointment has been successfully booked.</p>

          {/* Token */}
          <div className="ac-token">
            <div className="ac-token-label">Your Token Number</div>
            <div className="ac-token-value">{confirmation.token_number}</div>
            <div className="ac-token-hint">Show this token at the reception desk</div>
          </div>

          {/* Details */}
          <div className="ac-details">
            {[
              { label: 'Patient', value: confirmation.patient_name, icon: '👤' },
              { label: 'Doctor', value: confirmation.doctor_name, icon: '👨‍⚕️' },
              { label: 'Department', value: confirmation.department, icon: '🏥' },
              { label: 'Date', value: confirmation.date, icon: '📅' },
              { label: 'Time', value: confirmation.time_slot, icon: '🕐' },
              { label: 'Est. Wait Time', value: `~${confirmation.estimated_wait_time || 15} minutes`, icon: '⏱️' },
            ].map(item => (
              <div key={item.label} className="ac-detail-row">
                <div className="ac-detail-icon">{item.icon}</div>
                <div className="ac-detail-label">{item.label}</div>
                <div className="ac-detail-value">{item.value}</div>
              </div>
            ))}
          </div>

          {/* Instructions */}
          <div className="ac-instructions">
            <h3 className="ac-inst-title">Before Your Visit</h3>
            <ul className="ac-inst-list">
              <li>Arrive 10–15 minutes early to complete registration</li>
              <li>Bring a valid photo ID and insurance card (if applicable)</li>
              <li>Carry any previous medical records or test reports</li>
              <li>Bring your token number: <strong>{confirmation.token_number}</strong></li>
            </ul>
          </div>

          <div className="ac-actions" style={{display:"flex",flexDirection:"column",gap:10}}>
            {onSendQuery && (
              <button className="btn btn--outline btn--lg" onClick={onSendQuery}>
                💬 Send a Question to Your Doctor
              </button>
            )}
            <button className="btn btn--primary btn--lg" onClick={onReset}>
              Book Another Appointment
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
