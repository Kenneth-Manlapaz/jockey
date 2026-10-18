from .models import Jockey, Trainer


def jockeys_queryset(*, search=None):
    qs = Jockey.objects.filter(is_active=True)
    return qs.filter(full_name__icontains=search) if search else qs


def trainers_queryset(*, search=None):
    qs = Trainer.objects.filter(is_active=True)
    return qs.filter(full_name__icontains=search) if search else qs
