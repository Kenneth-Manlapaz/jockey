# Generated for flexible tips that can be stored before the official race card exists.
import django.db.models.deletion
from django.db import migrations, models


def copy_race_numbers(apps, schema_editor):
    RaceTip = apps.get_model("races", "RaceTip")
    for tip in RaceTip.objects.select_related("race").all():
        tip.race_number = tip.race.race_number
        tip.save(update_fields=["race_number"])


class Migration(migrations.Migration):
    dependencies = [("races", "0003_tipsheet_racetip")]

    operations = [
        migrations.RemoveConstraint(
            model_name="racetip", name="uq_race_tipster_sheet_race",
        ),
        migrations.AddField(
            model_name="racetip", name="race_number",
            field=models.PositiveSmallIntegerField(null=True),
        ),
        migrations.RunPython(copy_race_numbers, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="racetip", name="race_number",
            field=models.PositiveSmallIntegerField(),
        ),
        migrations.AlterField(
            model_name="racetip", name="race",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE,
                                    related_name="tips", to="races.race"),
        ),
        migrations.AlterModelOptions(
            name="racetip", options={"ordering": ["race_number", "tipster"]},
        ),
        migrations.AddConstraint(
            model_name="racetip",
            constraint=models.UniqueConstraint(fields=("sheet", "race_number", "tipster"),
                                               name="uq_race_tipster_sheet_race"),
        ),
    ]
