from django.contrib import admin
from django.urls import include, path

admin.site.site_header = "Philippine Jockey Admin"
admin.site.site_title = "Philippine Jockey"
admin.site.index_title = "Races, bets and results"

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include("apps.api.urls")),
]
