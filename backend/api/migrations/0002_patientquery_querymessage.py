from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='PatientQuery',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('patient_name', models.CharField(max_length=100)),
                ('patient_age', models.IntegerField(default=0)),
                ('patient_email', models.EmailField(blank=True)),
                ('subject', models.CharField(max_length=200)),
                ('message', models.TextField()),
                ('symptoms_summary', models.TextField(blank=True)),
                ('priority', models.CharField(choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High')], default='medium', max_length=10)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('seen', 'Seen'), ('replied', 'Replied'), ('closed', 'Closed')], default='pending', max_length=10)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('doctor', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='queries', to='api.doctor')),
                ('appointment', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='queries', to='api.appointment')),
            ],
            options={'ordering': ['-created_at']},
        ),
        migrations.CreateModel(
            name='QueryMessage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('sender', models.CharField(choices=[('patient', 'Patient'), ('doctor', 'Doctor')], max_length=10)),
                ('sender_name', models.CharField(max_length=100)),
                ('content', models.TextField()),
                ('sent_at', models.DateTimeField(auto_now_add=True)),
                ('is_read', models.BooleanField(default=False)),
                ('query', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='messages', to='api.patientquery')),
            ],
            options={'ordering': ['sent_at']},
        ),
        migrations.CreateModel(
            name='DoctorNote',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('patient_name', models.CharField(max_length=100)),
                ('note', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('doctor', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notes', to='api.doctor')),
                ('appointment', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='notes', to='api.appointment')),
            ],
            options={'ordering': ['-created_at']},
        ),
    ]
