from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('tripplanner', '0002_trip_commodity_trip_load_number_trip_shipper'),
    ]

    operations = [
        migrations.AddField(
            model_name='trip',
            name='schedule',
            field=models.JSONField(blank=True, default=list),
        ),
    ]
