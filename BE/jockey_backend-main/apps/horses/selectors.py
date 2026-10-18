from .models import Horse


def horses_queryset(*, search=None):
    qs = Horse.objects.select_related("owner", "trainer").filter(is_active=True)
    if search:
        qs = qs.filter(name__icontains=search)
    return qs.order_by("name")
