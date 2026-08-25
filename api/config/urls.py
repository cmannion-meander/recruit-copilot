from django.urls import path

from candidacies import views as candidacy_views
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
    path("api/candidacies", candidacy_views.create_candidacy_view),
    path("api/candidacies/<uuid:candidacy_id>/advance", candidacy_views.advance_stage_view),
    path("api/candidacies/<uuid:candidacy_id>/extend", candidacy_views.extend_auto_close_view),
    path("api/candidacies/<uuid:candidacy_id>/reject", candidacy_views.reject_candidacy_view),
    path("api/candidacies/<uuid:candidacy_id>/messages", candidacy_views.send_stage_message_view),
]
