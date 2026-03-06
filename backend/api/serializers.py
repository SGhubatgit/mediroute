from rest_framework import serializers
from .models import Doctor, DoctorAvailability, Patient, Appointment, PatientQuery, QueryMessage, DoctorNote


class DoctorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Doctor
        fields = '__all__'


class DoctorAvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorAvailability
        fields = ['id', 'date', 'time_slot', 'estimated_wait_time', 'is_booked']


class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = '__all__'


class AppointmentSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='doctor.name', read_only=True)
    doctor_specialization = serializers.CharField(source='doctor.specialization', read_only=True)

    class Meta:
        model = Appointment
        fields = '__all__'


class QueryMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = QueryMessage
        fields = '__all__'
        read_only_fields = ['sent_at']


class PatientQuerySerializer(serializers.ModelSerializer):
    messages = QueryMessageSerializer(many=True, read_only=True)
    doctor_name = serializers.CharField(source='doctor.name', read_only=True)
    doctor_department = serializers.CharField(source='doctor.department', read_only=True)
    unread_count = serializers.SerializerMethodField()
    appointment_token = serializers.SerializerMethodField()

    class Meta:
        model = PatientQuery
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

    def get_unread_count(self, obj):
        return obj.messages.filter(is_read=False, sender='patient').count()

    def get_appointment_token(self, obj):
        if obj.appointment:
            return obj.appointment.token_number
        return None


class PatientQueryListSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='doctor.name', read_only=True)
    doctor_department = serializers.CharField(source='doctor.department', read_only=True)
    unread_count = serializers.SerializerMethodField()
    appointment_token = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = PatientQuery
        fields = [
            'id', 'patient_name', 'patient_age', 'patient_email',
            'doctor', 'doctor_name', 'doctor_department',
            'subject', 'priority', 'status',
            'created_at', 'updated_at',
            'unread_count', 'appointment_token', 'last_message',
        ]

    def get_unread_count(self, obj):
        return obj.messages.filter(is_read=False, sender='patient').count()

    def get_appointment_token(self, obj):
        if obj.appointment:
            return obj.appointment.token_number
        return None

    def get_last_message(self, obj):
        last = obj.messages.order_by('-sent_at').first()
        if last:
            return {'content': last.content[:80], 'sender': last.sender, 'sent_at': str(last.sent_at)}
        return None


class DoctorNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorNote
        fields = '__all__'
        read_only_fields = ['created_at']
