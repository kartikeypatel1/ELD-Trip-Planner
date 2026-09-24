from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='driverprofile',
            name='co_driver_name',
            field=models.CharField(blank=True, max_length=200),
        ),
        migrations.AddField(
            model_name='driverprofile',
            name='vehicle_number',
            field=models.CharField(blank=True, max_length=50),
        ),
        migrations.AddField(
            model_name='driverprofile',
            name='trailer_number',
            field=models.CharField(blank=True, max_length=50),
        ),
        migrations.AddField(
            model_name='driverprofile',
            name='license_plate_number',
            field=models.CharField(blank=True, max_length=50),
        ),
        migrations.AddField(
            model_name='driverprofile',
            name='license_state',
            field=models.CharField(blank=True, max_length=50),
        ),
    ]
