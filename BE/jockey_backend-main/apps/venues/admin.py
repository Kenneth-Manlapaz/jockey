from django import forms
from django.contrib import admin

from .models import (
    Facility, RacingClub, Venue, VenueCourse, VenueFacility, VenueTrackSurface,
)


class VenueAdminForm(forms.ModelForm):
    facilities = forms.ModelMultipleChoiceField(
        queryset=Facility.objects.all(), required=False, widget=forms.CheckboxSelectMultiple)

    class Meta:
        model = Venue
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance.pk:
            self.fields["facilities"].initial = Facility.objects.filter(venue_facilities__venue=self.instance)


class SurfaceInline(admin.TabularInline):
    model = VenueTrackSurface
    extra = 0


class CourseInline(admin.TabularInline):
    model = VenueCourse
    extra = 0
    exclude = ("surface",)


@admin.register(Venue)
class VenueAdmin(admin.ModelAdmin):
    form = VenueAdminForm
    list_display = ("name", "club", "city", "is_fictional", "is_active")
    list_filter = ("is_active", "is_fictional", "club")
    search_fields = ("name", "city")
    inlines = [SurfaceInline, CourseInline]

    def save_related(self, request, form, formsets, change):
        super().save_related(request, form, formsets, change)
        chosen = form.cleaned_data.get("facilities")
        if chosen is not None:  # venue_facilities has a composite key, so it is synced by hand
            venue = form.instance
            VenueFacility.objects.filter(venue=venue).exclude(facility__in=chosen).delete()
            for facility in chosen:
                if not VenueFacility.objects.filter(venue=venue, facility=facility).exists():
                    VenueFacility.objects.create(venue=venue, facility=facility)


admin.site.register(RacingClub)
admin.site.register(Facility)
