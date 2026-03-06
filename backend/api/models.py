from django.db import models


class Doctor(models.Model):
    name = models.CharField(max_length=100)
    department = models.CharField(max_length=100)
    specialization = models.CharField(max_length=200)
    experience_years = models.IntegerField(default=5)
    photo_initials = models.CharField(max_length=5, blank=True)
    is_available = models.BooleanField(default=True)

    def __str__(self):
        return f"Dr. {self.name} - {self.department}"

    def save(self, *args, **kwargs):
        if not self.photo_initials:
            parts = self.name.split()
            self.photo_initials = ''.join(p[0].upper() for p in parts[:2])
        super().save(*args, **kwargs)


class DoctorAvailability(models.Model):
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='availability')
    date = models.DateField()
    time_slot = models.CharField(max_length=20)
    estimated_wait_time = models.IntegerField(default=10, help_text="Wait time in minutes")
    is_booked = models.BooleanField(default=False)

    class Meta:
        unique_together = ('doctor', 'date', 'time_slot')
        ordering = ['date', 'time_slot']

    def __str__(self):
        return f"{self.doctor.name} - {self.date} {self.time_slot}"


class Patient(models.Model):
    name = models.CharField(max_length=100)
    age = models.IntegerField()
    symptoms = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} (Age: {self.age})"


class Appointment(models.Model):
    patient_name = models.CharField(max_length=100)
    patient_age = models.IntegerField(default=0)
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE)
    department = models.CharField(max_length=100)
    date = models.DateField()
    time_slot = models.CharField(max_length=20)
    token_number = models.CharField(max_length=10, unique=True)
    symptoms = models.TextField(blank=True)
    severity = models.CharField(max_length=20, default='Low')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.patient_name} - {self.doctor.name} - Token: {self.token_number}"


class PatientQuery(models.Model):
    """A patient sends a query/question to a doctor before/after appointment."""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('seen', 'Seen'),
        ('replied', 'Replied'),
        ('closed', 'Closed'),
    ]
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]

    patient_name = models.CharField(max_length=100)
    patient_age = models.IntegerField(default=0)
    patient_email = models.EmailField(blank=True)
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='queries')
    appointment = models.ForeignKey(
        Appointment, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='queries'
    )
    subject = models.CharField(max_length=200)
    message = models.TextField()
    symptoms_summary = models.TextField(blank=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Query from {self.patient_name} → Dr. {self.doctor.name}: {self.subject}"


class QueryMessage(models.Model):
    """Individual messages in a query thread (patient ↔ doctor conversation)."""
    SENDER_CHOICES = [
        ('patient', 'Patient'),
        ('doctor', 'Doctor'),
    ]

    query = models.ForeignKey(PatientQuery, on_delete=models.CASCADE, related_name='messages')
    sender = models.CharField(max_length=10, choices=SENDER_CHOICES)
    sender_name = models.CharField(max_length=100)
    content = models.TextField()
    sent_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['sent_at']

    def __str__(self):
        return f"{self.sender_name} ({self.sender}) - {self.sent_at.strftime('%Y-%m-%d %H:%M')}"


class DoctorNote(models.Model):
    """Doctor's private notes on an appointment/patient."""
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='notes')
    appointment = models.ForeignKey(
        Appointment, on_delete=models.CASCADE, related_name='notes', null=True, blank=True
    )
    patient_name = models.CharField(max_length=100)
    note = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Note by Dr. {self.doctor.name} for {self.patient_name}"
