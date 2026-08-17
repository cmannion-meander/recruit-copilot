from django.urls import path

from organizations import views as organization_views
from people import views as people_views
from roles import views as role_views

urlpatterns = [
    path("api/session", organization_views.session_view),
    path("api/roles/<uuid:role_id>/criteria", role_views.add_criterion_view),
    path("api/roles/<uuid:role_id>/open", role_views.open_role_view),
    path("api/criteria/<uuid:criterion_id>/assign", role_views.assign_criterion_view),
    path("api/people", people_views.create_person_view),
    path("api/sightings/<uuid:sighting_id>/person", people_views.create_person_from_sighting_view),
]
