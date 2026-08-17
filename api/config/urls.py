from django.urls import path

from organizations import views as organization_views

urlpatterns = [
    path("api/session", organization_views.session_view),
]
