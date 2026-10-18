from django.contrib import admin

from .models import Horse


@admin.register(Horse)
class HorseAdmin(admin.ModelAdmin):
    list_display = ("name", "sex", "birth_year", "trainer", "owner", "career_wins", "career_starts", "is_active")
    list_filter = ("sex", "is_active")
    search_fields = ("name", "sire", "dam")
    autocomplete_fields = ("trainer", "owner")
