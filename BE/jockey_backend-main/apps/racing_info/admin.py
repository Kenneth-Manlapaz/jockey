from django.contrib import admin
from apps.meetings.models import Meeting
from .models import (EventType, BettingEvent, EventLeg, OfficialDividend, Announcement,
                     SectionalTime, EntryChange, ResultRevision)


class LegInline(admin.TabularInline):
    model = EventLeg
    extra = 0


@admin.register(BettingEvent)
class EventAdmin(admin.ModelAdmin):
    list_display = ['label', 'meeting', 'event_type', 'status', 'is_demo']
    list_filter = ['status', 'is_demo', 'event_type']
    inlines = [LegInline]


@admin.register(OfficialDividend)
class DividendAdmin(admin.ModelAdmin):
    list_display = ['event', 'combination', 'amount', 'status', 'published_at']
    list_filter = ['status']

    def has_change_permission(self, request, obj=None):
        if obj and obj.status in ('provisional', 'official', 'corrected'):
            return False
        return super().has_change_permission(request, obj)

    def get_readonly_fields(self, request, obj=None):
        return [f.name for f in obj._meta.fields] if obj and obj.status in ('provisional', 'official', 'corrected') else []

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(EntryChange, ResultRevision)
class HistoryAdmin(admin.ModelAdmin):
    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


admin.site.register([Meeting, EventType, Announcement, SectionalTime])
