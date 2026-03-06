from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .models import Doctor, DoctorAvailability, Patient, Appointment, PatientQuery, QueryMessage, DoctorNote
from .serializers import (
    DoctorSerializer, DoctorAvailabilitySerializer, AppointmentSerializer,
    PatientQuerySerializer, PatientQueryListSerializer, QueryMessageSerializer, DoctorNoteSerializer
)
from .symptom_analyzer import analyze_symptoms, get_symptom_suggestions


# ─── Patient-facing: Symptom Analysis ────────────────────────────────────────

@api_view(['POST'])
def analyze_symptoms_view(request):
    name = request.data.get('name', '').strip()
    age = request.data.get('age', '')
    symptoms = request.data.get('symptoms', '').strip()

    if not symptoms:
        return Response({'error': 'Symptoms are required'}, status=status.HTTP_400_BAD_REQUEST)

    analysis = analyze_symptoms(symptoms)
    department = analysis['department']

    doctors_in_dept = Doctor.objects.filter(department=department, is_available=True)
    if not doctors_in_dept.exists():
        doctors_in_dept = Doctor.objects.filter(is_available=True)

    best_doctor = None
    best_slots = []
    today = timezone.now().date()

    for doctor in doctors_in_dept:
        available = DoctorAvailability.objects.filter(
            doctor=doctor, is_booked=False, date__gte=today
        ).order_by('date', 'time_slot')[:10]
        if available.count() > len(best_slots):
            best_doctor = doctor
            best_slots = list(available)

    if not best_doctor:
        best_doctor = Doctor.objects.filter(is_available=True).first()
        if best_doctor:
            best_slots = list(
                DoctorAvailability.objects.filter(
                    doctor=best_doctor, is_booked=False, date__gte=today
                ).order_by('date', 'time_slot')[:5]
            )

    if name and age:
        try:
            Patient.objects.create(name=name, age=int(age), symptoms=symptoms)
        except Exception:
            pass

    available_slots = [
        {
            'id': slot.id,
            'date': slot.date.strftime('%Y-%m-%d'),
            'date_display': slot.date.strftime('%d %B %Y'),
            'time_slot': slot.time_slot,
            'estimated_wait_time': slot.estimated_wait_time,
        }
        for slot in best_slots
    ]

    return Response({
        'department': department,
        'doctor': DoctorSerializer(best_doctor).data if best_doctor else None,
        'severity': analysis['severity'],
        'reason': analysis['reason'],
        'emergency_warning': analysis['emergency_warning'],
        'available_slots': available_slots,
    })


@api_view(['POST'])
def book_appointment_view(request):
    patient_name = request.data.get('patient_name', '').strip()
    patient_age = request.data.get('patient_age', 0)
    doctor_id = request.data.get('doctor_id')
    slot_id = request.data.get('slot_id')
    symptoms = request.data.get('symptoms', '')
    severity = request.data.get('severity', 'Low')

    if not all([patient_name, doctor_id, slot_id]):
        return Response({'error': 'patient_name, doctor_id, and slot_id are required'}, status=400)

    try:
        doctor = Doctor.objects.get(id=doctor_id)
    except Doctor.DoesNotExist:
        return Response({'error': 'Doctor not found'}, status=404)

    try:
        slot = DoctorAvailability.objects.get(id=slot_id, is_booked=False)
    except DoctorAvailability.DoesNotExist:
        return Response({'error': 'Slot not available or already booked'}, status=400)

    last = Appointment.objects.order_by('-id').first()
    if last and last.token_number.startswith('A'):
        try:
            token_number = f'A{int(last.token_number[1:]) + 1:03d}'
        except ValueError:
            token_number = 'A001'
    else:
        token_number = 'A001'

    appointment = Appointment.objects.create(
        patient_name=patient_name,
        patient_age=int(patient_age) if patient_age else 0,
        doctor=doctor,
        department=doctor.department,
        date=slot.date,
        time_slot=slot.time_slot,
        token_number=token_number,
        symptoms=symptoms,
        severity=severity,
    )

    slot.is_booked = True
    slot.save()

    return Response({
        'message': 'Appointment booked successfully',
        'token_number': token_number,
        'appointment': {
            'id': appointment.id,
            'patient_name': appointment.patient_name,
            'doctor_name': f'Dr. {doctor.name}',
            'department': appointment.department,
            'date': appointment.date.strftime('%d %B %Y'),
            'time_slot': appointment.time_slot,
            'token_number': token_number,
            'estimated_wait_time': slot.estimated_wait_time,
        }
    }, status=201)


@api_view(['GET'])
def symptom_suggestions_view(request):
    query = request.GET.get('q', '')
    suggestions = get_symptom_suggestions(query)
    return Response({'suggestions': suggestions})


@api_view(['GET', 'POST'])
def doctors_list_view(request):
    if request.method == 'POST':
        serializer = DoctorSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    doctors = Doctor.objects.all()
    return Response(DoctorSerializer(doctors, many=True).data)

@api_view(['PATCH'])
def doctor_availability_view(request, doctor_id):
    try:
        doctor = Doctor.objects.get(id=doctor_id)
    except Doctor.DoesNotExist:
        return Response({'error': 'Doctor not found'}, status=status.HTTP_404_NOT_FOUND)
        
    is_available = request.data.get('is_available')
    if is_available is not None:
        doctor.is_available = is_available
        doctor.save()
        return Response(DoctorSerializer(doctor).data)
    return Response({'error': 'is_available required'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def appointments_list_view(request):
    appointments = Appointment.objects.all().select_related('doctor')
    return Response(AppointmentSerializer(appointments, many=True).data)


# ─── Patient Query (Submit & Track) ──────────────────────────────────────────

@api_view(['POST'])
def submit_query_view(request):
    """Patient submits a new query to a doctor."""
    patient_name = request.data.get('patient_name', '').strip()
    patient_age = request.data.get('patient_age', 0)
    patient_email = request.data.get('patient_email', '').strip()
    doctor_id = request.data.get('doctor_id')
    appointment_id = request.data.get('appointment_id')
    subject = request.data.get('subject', '').strip()
    message = request.data.get('message', '').strip()
    symptoms_summary = request.data.get('symptoms_summary', '').strip()
    priority = request.data.get('priority', 'medium')

    if not all([patient_name, doctor_id, subject, message]):
        return Response({'error': 'patient_name, doctor_id, subject, and message are required'}, status=400)

    try:
        doctor = Doctor.objects.get(id=doctor_id)
    except Doctor.DoesNotExist:
        return Response({'error': 'Doctor not found'}, status=404)

    appointment = None
    if appointment_id:
        try:
            appointment = Appointment.objects.get(id=appointment_id)
        except Appointment.DoesNotExist:
            pass

    query = PatientQuery.objects.create(
        patient_name=patient_name,
        patient_age=int(patient_age) if patient_age else 0,
        patient_email=patient_email,
        doctor=doctor,
        appointment=appointment,
        subject=subject,
        message=message,
        symptoms_summary=symptoms_summary,
        priority=priority,
        status='pending',
    )

    # Auto-create first message from patient
    QueryMessage.objects.create(
        query=query,
        sender='patient',
        sender_name=patient_name,
        content=message,
    )

    return Response({
        'message': 'Query submitted successfully',
        'query_id': query.id,
        'query': PatientQuerySerializer(query).data,
    }, status=201)


@api_view(['GET'])
def patient_query_status_view(request, query_id):
    """Patient checks status and messages for their query."""
    try:
        query = PatientQuery.objects.get(id=query_id)
    except PatientQuery.DoesNotExist:
        return Response({'error': 'Query not found'}, status=404)

    # Mark doctor messages as read
    query.messages.filter(sender='doctor', is_read=False).update(is_read=True)

    return Response(PatientQuerySerializer(query).data)


@api_view(['POST'])
def patient_reply_view(request, query_id):
    """Patient sends a follow-up message in the thread."""
    try:
        query = PatientQuery.objects.get(id=query_id)
    except PatientQuery.DoesNotExist:
        return Response({'error': 'Query not found'}, status=404)

    content = request.data.get('content', '').strip()
    if not content:
        return Response({'error': 'Message content required'}, status=400)

    msg = QueryMessage.objects.create(
        query=query,
        sender='patient',
        sender_name=query.patient_name,
        content=content,
    )

    if query.status == 'replied':
        query.status = 'pending'
        query.save()

    return Response(QueryMessageSerializer(msg).data, status=201)


# ─── Doctor Dashboard APIs ────────────────────────────────────────────────────

@api_view(['GET'])
def doctor_dashboard_view(request, doctor_id):
    """Main dashboard stats for a doctor."""
    try:
        doctor = Doctor.objects.get(id=doctor_id)
    except Doctor.DoesNotExist:
        return Response({'error': 'Doctor not found'}, status=404)

    today = timezone.now().date()

    # Stats
    total_appointments = Appointment.objects.filter(doctor=doctor).count()
    today_appointments = Appointment.objects.filter(doctor=doctor, date=today).count()
    pending_queries = PatientQuery.objects.filter(doctor=doctor, status='pending').count()
    total_queries = PatientQuery.objects.filter(doctor=doctor).count()

    # Today's schedule
    todays_schedule = Appointment.objects.filter(
        doctor=doctor, date=today
    ).order_by('time_slot').values(
        'id', 'patient_name', 'patient_age', 'time_slot', 'token_number', 'severity', 'symptoms'
    )

    # Upcoming (next 3 days)
    upcoming = Appointment.objects.filter(
        doctor=doctor, date__gt=today, date__lte=today + timezone.timedelta(days=3)
    ).order_by('date', 'time_slot').values(
        'id', 'patient_name', 'patient_age', 'date', 'time_slot', 'token_number', 'severity'
    )

    return Response({
        'doctor': DoctorSerializer(doctor).data,
        'stats': {
            'total_appointments': total_appointments,
            'today_appointments': today_appointments,
            'pending_queries': pending_queries,
            'total_queries': total_queries,
        },
        'todays_schedule': list(todays_schedule),
        'upcoming_appointments': list(upcoming),
    })


@api_view(['GET'])
def doctor_queries_view(request, doctor_id):
    """All patient queries for a doctor, filterable by status."""
    try:
        doctor = Doctor.objects.get(id=doctor_id)
    except Doctor.DoesNotExist:
        return Response({'error': 'Doctor not found'}, status=404)

    query_status = request.GET.get('status', '')
    queries = PatientQuery.objects.filter(doctor=doctor).prefetch_related('messages')

    if query_status:
        queries = queries.filter(status=query_status)

    return Response(PatientQueryListSerializer(queries, many=True).data)


@api_view(['GET', 'PATCH'])
def doctor_query_detail_view(request, doctor_id, query_id):
    """Get or update a single query (doctor marks as seen/closed)."""
    try:
        query = PatientQuery.objects.get(id=query_id, doctor_id=doctor_id)
    except PatientQuery.DoesNotExist:
        return Response({'error': 'Query not found'}, status=404)

    if request.method == 'GET':
        # Mark unread patient messages as read
        query.messages.filter(sender='patient', is_read=False).update(is_read=True)
        if query.status == 'pending':
            query.status = 'seen'
            query.save()
        return Response(PatientQuerySerializer(query).data)

    elif request.method == 'PATCH':
        new_status = request.data.get('status')
        if new_status in ['pending', 'seen', 'replied', 'closed']:
            query.status = new_status
            query.save()
        return Response(PatientQuerySerializer(query).data)


@api_view(['POST'])
def doctor_reply_view(request, doctor_id, query_id):
    """Doctor sends a reply message in the thread."""
    try:
        doctor = Doctor.objects.get(id=doctor_id)
        query = PatientQuery.objects.get(id=query_id, doctor=doctor)
    except (Doctor.DoesNotExist, PatientQuery.DoesNotExist):
        return Response({'error': 'Not found'}, status=404)

    content = request.data.get('content', '').strip()
    if not content:
        return Response({'error': 'Message content required'}, status=400)

    msg = QueryMessage.objects.create(
        query=query,
        sender='doctor',
        sender_name=f'Dr. {doctor.name}',
        content=content,
    )

    query.status = 'replied'
    query.save()

    return Response(QueryMessageSerializer(msg).data, status=201)


@api_view(['GET'])
def doctor_appointments_view(request, doctor_id):
    """All appointments for a doctor."""
    try:
        Doctor.objects.get(id=doctor_id)
    except Doctor.DoesNotExist:
        return Response({'error': 'Doctor not found'}, status=404)

    date_filter = request.GET.get('date', '')
    appts = Appointment.objects.filter(doctor_id=doctor_id).order_by('date', 'time_slot')
    if date_filter:
        appts = appts.filter(date=date_filter)

    return Response(AppointmentSerializer(appts, many=True).data)


@api_view(['POST'])
def doctor_note_view(request, doctor_id):
    """Doctor adds a note to a patient/appointment."""
    try:
        doctor = Doctor.objects.get(id=doctor_id)
    except Doctor.DoesNotExist:
        return Response({'error': 'Doctor not found'}, status=404)

    note_text = request.data.get('note', '').strip()
    patient_name = request.data.get('patient_name', '').strip()
    appointment_id = request.data.get('appointment_id')

    if not note_text or not patient_name:
        return Response({'error': 'note and patient_name required'}, status=400)

    appointment = None
    if appointment_id:
        try:
            appointment = Appointment.objects.get(id=appointment_id, doctor=doctor)
        except Appointment.DoesNotExist:
            pass

    note = DoctorNote.objects.create(
        doctor=doctor,
        appointment=appointment,
        patient_name=patient_name,
        note=note_text,
    )

    return Response(DoctorNoteSerializer(note).data, status=201)


@api_view(['GET'])
def doctor_notes_view(request, doctor_id):
    try:
        Doctor.objects.get(id=doctor_id)
    except Doctor.DoesNotExist:
        return Response({'error': 'Doctor not found'}, status=404)
    notes = DoctorNote.objects.filter(doctor_id=doctor_id)
    return Response(DoctorNoteSerializer(notes, many=True).data)
