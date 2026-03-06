import { useState } from 'react'
import Header from './components/Header'
import SymptomForm from './pages/SymptomForm'
import RecommendationResult from './pages/RecommendationResult'
import AppointmentConfirmation from './pages/AppointmentConfirmation'
import DoctorLogin from './pages/doctor/DoctorLogin'
import DoctorDashboard from './pages/doctor/DoctorDashboard'
import PatientQueryPortal from './pages/patient/PatientQueryPortal'

export default function App() {
  const [mode, setMode] = useState('home') // 'home' | 'patient-portal' | 'doctor'
  const [step, setStep] = useState('form')
  const [analysisResult, setAnalysisResult] = useState(null)
  const [formData, setFormData] = useState(null)
  const [confirmation, setConfirmation] = useState(null)
  const [activeDoctorId, setActiveDoctorId] = useState(null)

  const handleAnalysisComplete = (result, patientData) => {
    setAnalysisResult(result)
    setFormData(patientData)
    setStep('result')
  }

  const handleBookingComplete = (confirmData) => {
    setConfirmation(confirmData)
    setStep('confirmed')
  }

  const handleReset = () => {
    setStep('form')
    setAnalysisResult(null)
    setFormData(null)
    setConfirmation(null)
    setMode('home')
  }

  const handleDoctorLogin = (doctorId) => {
    setActiveDoctorId(doctorId)
    setMode('doctor-dashboard')
  }

  if (mode === 'doctor') {
    return <DoctorLogin onLogin={handleDoctorLogin} onBack={() => setMode('home')} />
  }

  if (mode === 'doctor-dashboard' && activeDoctorId) {
    return <DoctorDashboard doctorId={activeDoctorId} onLogout={() => setMode('home')} />
  }

  if (mode === 'patient-portal') {
    return <PatientQueryPortal onBack={() => setMode('home')} />
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Header
        step={step}
        onReset={handleReset}
        onDoctorLogin={() => setMode('doctor')}
        onPatientPortal={() => setMode('patient-portal')}
      />
      <main style={{ paddingBottom: 80 }}>
        {step === 'form' && <SymptomForm onComplete={handleAnalysisComplete} />}
        {step === 'result' && (
          <RecommendationResult
            result={analysisResult}
            formData={formData}
            onBooked={handleBookingComplete}
            onBack={() => setStep('form')}
          />
        )}
        {step === 'confirmed' && (
          <AppointmentConfirmation
            confirmation={confirmation}
            onReset={handleReset}
            onSendQuery={() => setMode('patient-portal')}
          />
        )}
      </main>
    </div>
  )
}
