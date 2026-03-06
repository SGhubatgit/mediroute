from django.contrib import admin
from .models import Doctor, DoctorAvailability, Patient, Appointment, PatientQuery, QueryMessage, DoctorNote


@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ['name', 'department', 'specialization', 'experience_years']
    list_filter = ['department']
    search_fields = ['name', 'department']


@admin.register(DoctorAvailability)
class DoctorAvailabilityAdmin(admin.ModelAdmin):
    list_display = ['doctor', 'date', 'time_slot', 'estimated_wait_time', 'is_booked']
    list_filter = ['doctor', 'date', 'is_booked']
    list_editable = ['is_booked']


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ['name', 'age', 'symptoms', 'created_at']


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ['token_number', 'patient_name', 'doctor', 'department', 'date', 'time_slot', 'severity']
    list_filter = ['department', 'severity', 'date']
    search_fields = ['patient_name', 'token_number']
    readonly_fields = ['token_number', 'created_at']


class QueryMessageInline(admin.TabularInline):
    model = QueryMessage
    extra = 0
    readonly_fields = ['sent_at']


@admin.register(PatientQuery)
class PatientQueryAdmin(admin.ModelAdmin):
    list_display = ['patient_name', 'doctor', 'subject', 'priority', 'status', 'created_at']
    list_filter = ['status', 'priority', 'doctor']
    search_fields = ['patient_name', 'subject']
    inlines = [QueryMessageInline]


@admin.register(DoctorNote)
class DoctorNoteAdmin(admin.ModelAdmin):
    list_display = ['doctor', 'patient_name', 'note', 'created_at']
    list_filter = ['doctor']
