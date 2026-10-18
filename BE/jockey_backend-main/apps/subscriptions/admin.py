from django.contrib import admin
from .models import Plan, Checkout, Subscription

@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'period', 'price', 'currency', 'is_active']

@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ['user', 'plan', 'starts_at', 'expires_at', 'status']
    list_filter = ['status', 'plan']
    readonly_fields = ['checkout', 'created_at']

@admin.register(Checkout)
class CheckoutAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'plan', 'price', 'status', 'provider']
    def has_add_permission(self, request):
        return False
    def has_change_permission(self, request, obj=None):
        return False
    def has_delete_permission(self, request, obj=None):
        return False
