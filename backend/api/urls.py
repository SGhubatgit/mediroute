from django.urls import path
from . import views

urlpatterns = [
    # Patient-facing
    path('analyze-symptoms/', views.analyze_symptoms_view),
    path('book-appointment/', views.book_appointment_view),
    path('symptom-suggestions/', views.symptom_suggestions_view),
    path('doctors/', views.doctors_list_view),
    path('doctor/<int:doctor_id>/availability/', views.doctor_availability_view),
    path('appointments/', views.appointments_list_view),

    # Patient queries
    path('queries/submit/', views.submit_query_view),
    path('queries/<int:query_id>/', views.patient_query_status_view),
    path('queries/<int:query_id>/reply/', views.patient_reply_view),

    # Doctor dashboard
    path('doctor/<int:doctor_id>/dashboard/', views.doctor_dashboard_view),
    path('doctor/<int:doctor_id>/queries/', views.doctor_queries_view),
    path('doctor/<int:doctor_id>/queries/<int:query_id>/', views.doctor_query_detail_view),
    path('doctor/<int:doctor_id>/queries/<int:query_id>/reply/', views.doctor_reply_view),
    path('doctor/<int:doctor_id>/appointments/', views.doctor_appointments_view),
    path('doctor/<int:doctor_id>/notes/', views.doctor_notes_view),
    path('doctor/<int:doctor_id>/notes/add/', views.doctor_note_view),
]
