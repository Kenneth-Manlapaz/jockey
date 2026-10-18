from django.contrib import admin

from .models import Favorite, Notification, PushDevice


@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ("user", "target_type", "horse", "jockey", "trainer", "race", "venue", "created_at")
    list_filter = ("target_type",)
    search_fields = ("user__email",)


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("user", "type", "title", "is_read", "created_at")
    list_filter = ("type", "is_read")
    search_fields = ("user__email", "title")


admin.site.register(PushDevice)
