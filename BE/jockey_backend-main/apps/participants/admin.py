from django.contrib import admin

from .models import Jockey, Owner, Trainer


@admin.register(Jockey)
class JockeyAdmin(admin.ModelAdmin):
    list_display = ("full_name", "weight_kg", "career_wins", "career_starts", "is_active")
    search_fields = ("full_name",)


@admin.register(Trainer)
class TrainerAdmin(admin.ModelAdmin):
    list_display = ("full_name", "is_active")
    search_fields = ("full_name",)


@admin.register(Owner)
class OwnerAdmin(admin.ModelAdmin):
    list_display = ("name", "stable_name")
    search_fields = ("name", "stable_name")
