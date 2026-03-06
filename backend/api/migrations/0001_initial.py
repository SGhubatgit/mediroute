from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Doctor',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('department', models.CharField(max_length=100)),
                ('specialization', models.CharField(max_length=200)),
                ('experience_years', models.IntegerField(default=5)),
                ('photo_initials', models.CharField(blank=True, max_length=5)),
            ],
        ),
        migrations.CreateModel(
            name='Patient',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('age', models.IntegerField()),
                ('symptoms', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.CreateModel(
            name='DoctorAvailability',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateField()),
                ('time_slot', models.CharField(max_length=20)),
                ('estimated_wait_time', models.IntegerField(default=10, help_text='Wait time in minutes')),
                ('is_booked', models.BooleanField(default=False)),
                ('doctor', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='availability', to='api.doctor')),
            ],
            options={
                'ordering': ['date', 'time_slot'],
                'unique_together': {('doctor', 'date', 'time_slot')},
            },
        ),
        migrations.CreateModel(
            name='Appointment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('patient_name', models.CharField(max_length=100)),
                ('patient_age', models.IntegerField(default=0)),
                ('department', models.CharField(max_length=100)),
                ('date', models.DateField()),
                ('time_slot', models.CharField(max_length=20)),
                ('token_number', models.CharField(max_length=10, unique=True)),
                ('symptoms', models.TextField(blank=True)),
                ('severity', models.CharField(default='Low', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('doctor', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='api.doctor')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
