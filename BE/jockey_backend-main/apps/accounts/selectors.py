from .models import User


def get_active_user_by_email(email):
    return User.objects.filter(email__iexact=email, is_active=True).first()
