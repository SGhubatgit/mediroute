import './Header.css'

const STEPS = [
  { key: 'form', label: 'Symptoms', num: 1 },
  { key: 'result', label: 'Recommendations', num: 2 },
  { key: 'confirmed', label: 'Confirmed', num: 3 },
]

export default function Header({ step, onReset, onDoctorLogin, onPatientPortal }) {
  const currentIndex = STEPS.findIndex(s => s.key === step)

  return (
    <header className="header">
      <div className="container--wide">
        <div className="header__inner">
          <button className="header__logo" onClick={onReset}>
            <div className="header__logo-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L4 7v10l8 5 8-5V7L12 2z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M12 8v8M8 12h8" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <div className="header__logo-name">MediRoute</div>
              <div className="header__logo-tagline">Smart Triage System</div>
            </div>
          </button>

          <nav className="header__steps">
            {STEPS.map((s, i) => (
              <div
                key={s.key}
                className={`header__step ${i < currentIndex ? 'header__step--done' : ''} ${i === currentIndex ? 'header__step--active' : ''}`}
              >
                <div className="header__step-num">
                  {i < currentIndex ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12l5 5L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : s.num}
                </div>
                <span className="header__step-label">{s.label}</span>
                {i < STEPS.length - 1 && <div className="header__step-line" />}
              </div>
            ))}
          </nav>

          <div className="header__actions">
            {onPatientPortal && (
              <button className="header__action-btn header__action-btn--outline" onClick={onPatientPortal}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                My Queries
              </button>
            )}
            {onDoctorLogin && (
              <button className="header__action-btn" onClick={onDoctorLogin}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Doctor Login
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
