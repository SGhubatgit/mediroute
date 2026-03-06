"""
Run this script to populate the database with sample doctors and availability slots.
Usage: python seed_data.py
"""
import os
import sys
import django
from datetime import date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from api.models import Doctor, DoctorAvailability, Appointment

def seed():
    print("🌱 Seeding database...")

    # Clear existing data
    DoctorAvailability.objects.all().delete()
    Doctor.objects.all().delete()

    doctors_data = [
        {'name': 'Rajesh Sharma', 'department': 'Cardiology', 'specialization': 'Interventional Cardiology & Heart Failure', 'experience_years': 15},
        {'name': 'Priya Mehta', 'department': 'Cardiology', 'specialization': 'Electrophysiology & Arrhythmia', 'experience_years': 12},
        {'name': 'Anita Verma', 'department': 'Dermatology', 'specialization': 'Cosmetic & Clinical Dermatology', 'experience_years': 10},
        {'name': 'Suresh Kumar', 'department': 'Dermatology', 'specialization': 'Pediatric Dermatology & Allergology', 'experience_years': 8},
        {'name': 'Vikram Singh', 'department': 'Orthopedics', 'specialization': 'Joint Replacement & Sports Medicine', 'experience_years': 18},
        {'name': 'Kavita Patel', 'department': 'Orthopedics', 'specialization': 'Spine Surgery & Trauma', 'experience_years': 14},
        {'name': 'Mohan Das', 'department': 'General Medicine', 'specialization': 'Internal Medicine & Infectious Disease', 'experience_years': 20},
        {'name': 'Sunita Rao', 'department': 'General Medicine', 'specialization': 'General Practice & Preventive Medicine', 'experience_years': 9},
        {'name': 'Arun Nair', 'department': 'Neurology', 'specialization': 'Stroke & Epilepsy Management', 'experience_years': 16},
        {'name': 'Deepa Iyer', 'department': 'Gastroenterology', 'specialization': 'Endoscopy & Liver Diseases', 'experience_years': 11},
        {'name': 'Ravi Gupta', 'department': 'ENT', 'specialization': 'Rhinology & Head Neck Surgery', 'experience_years': 13},
        {'name': 'Meena Joshi', 'department': 'Ophthalmology', 'specialization': 'Cataract & Retinal Diseases', 'experience_years': 12},
    ]

    doctors = []
    for data in doctors_data:
        doctor = Doctor.objects.create(**data)
        doctors.append(doctor)
        print(f"  ✅ Created Dr. {doctor.name} - {doctor.department}")

    # Create availability slots for next 7 days
    time_slots = [
        ('09:00 AM', 10), ('09:30 AM', 15), ('10:00 AM', 20),
        ('10:30 AM', 10), ('11:00 AM', 15), ('11:30 AM', 20),
        ('02:00 PM', 10), ('02:30 PM', 15), ('03:00 PM', 20),
        ('03:30 PM', 10), ('04:00 PM', 15), ('04:30 PM', 20),
    ]

    today = date.today()
    slot_count = 0
    for doctor in doctors:
        for day_offset in range(1, 8):  # Next 7 days
            slot_date = today + timedelta(days=day_offset)
            # Each doctor gets 6 random slots per day
            import random
            selected_slots = random.sample(time_slots, 6)
            for time_slot, wait_time in selected_slots:
                DoctorAvailability.objects.create(
                    doctor=doctor,
                    date=slot_date,
                    time_slot=time_slot,
                    estimated_wait_time=wait_time,
                    is_booked=False,
                )
                slot_count += 1

    print(f"\n  ✅ Created {slot_count} availability slots for {len(doctors)} doctors")
    print(f"\n🎉 Seeding complete! Database is ready.")
    print(f"\n📋 Departments available:")
    depts = Doctor.objects.values_list('department', flat=True).distinct()
    for dept in depts:
        count = Doctor.objects.filter(department=dept).count()
        print(f"   • {dept}: {count} doctor(s)")


if __name__ == '__main__':
    seed()


def seed_queries():
    """Seed some sample patient queries for demo."""
    print("\n🌱 Seeding sample queries...")
    try:
        from api.models import PatientQuery, QueryMessage
        doctors = list(Doctor.objects.all())
        if not doctors:
            return

        sample_queries = [
            {
                'patient_name': 'Arjun Mehta', 'patient_age': 35, 'patient_email': 'arjun@example.com',
                'doctor': doctors[0], 'subject': 'Chest pain when climbing stairs',
                'message': 'I have been experiencing mild chest pain whenever I climb stairs or do physical activity. It started 2 weeks ago. Should I be worried?',
                'symptoms_summary': 'chest pain, breathlessness on exertion', 'priority': 'high', 'status': 'replied',
            },
            {
                'patient_name': 'Priya Nair', 'patient_age': 28, 'patient_email': 'priya@example.com',
                'doctor': doctors[2] if len(doctors) > 2 else doctors[0],
                'subject': 'Skin rash on arms for 2 weeks',
                'message': 'I have a persistent rash on both arms. It is red and itchy. I tried calamine lotion but it is not helping.',
                'symptoms_summary': 'skin rash, itching, redness', 'priority': 'medium', 'status': 'pending',
            },
            {
                'patient_name': 'Ramesh Kumar', 'patient_age': 52,
                'doctor': doctors[4] if len(doctors) > 4 else doctors[0],
                'subject': 'Follow up on knee replacement recovery',
                'message': 'It has been 6 weeks since my knee replacement surgery. I am still experiencing some swelling. Is this normal?',
                'symptoms_summary': 'knee swelling post surgery', 'priority': 'medium', 'status': 'replied',
            },
        ]

        for qdata in sample_queries:
            query = PatientQuery.objects.create(**qdata)
            QueryMessage.objects.create(
                query=query, sender='patient',
                sender_name=qdata['patient_name'],
                content=qdata['message']
            )
            if qdata['status'] == 'replied':
                QueryMessage.objects.create(
                    query=query, sender='doctor',
                    sender_name=f"Dr. {qdata['doctor'].name}",
                    content='Thank you for your query. Based on your symptoms, I recommend scheduling an in-person visit as soon as possible. Please bring any recent test reports.',
                )
            print(f"  ✅ Created query: {qdata['subject'][:50]}")

        print(f"\n  ✅ Created {len(sample_queries)} sample queries")
    except Exception as e:
        print(f"  ⚠️ Could not seed queries: {e}")


if __name__ == '__main__':
    seed()
    seed_queries()
