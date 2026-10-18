from django.utils import timezone

from .models import AuditLog, User


def register_user(*, first_name, last_name, email, password, mobile_number=None):
    """Create a normal player account. Terms acceptance is recorded with the current time."""
    return User.objects.create_user(
        email=email, password=password, first_name=first_name, last_name=last_name,
        mobile_number=mobile_number, terms_accepted_at=timezone.now(),
    )


def audit(actor, action, entity, entity_id, before=None, after=None):
    """Record an admin/staff action in audit_logs."""
    AuditLog.objects.create(
        actor=actor if getattr(actor, "pk", None) else None, action=action,
        entity=entity, entity_id=str(entity_id), before_data=before, after_data=after,
    )
