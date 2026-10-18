from django.db import migrations

def plans(apps, schema_editor):
    Plan = apps.get_model('subscriptions', 'Plan')
    for code, name, period, price in [('daily', 'Daily Access', 'daily', '50.00'), ('monthly', 'Monthly Membership', 'monthly', '499.00')]:
        Plan.objects.using(schema_editor.connection.alias).get_or_create(code=code,
            defaults={'name': name, 'period': period, 'price': price, 'currency': 'PHP'})

class Migration(migrations.Migration):
    dependencies = [('subscriptions', '0001_initial')]
    operations = [migrations.RunPython(plans, migrations.RunPython.noop)]
