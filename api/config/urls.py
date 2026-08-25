from django.urls import path

from candidacies import views as candidacy_views
from common.views import workspace_view
from crosscheck import views as crosscheck_views
from documents import views as document_views
from findings import views as finding_views
from organizations import views as organization_views
from people import views as people_views
from placements import views as placement_views
from roles import views as role_views
from submissions import views as submission_views

urlpatterns = [
    path("api/session", organization_views.session_view),
    path("api/workspace", workspace_view),
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
    path("api/candidacies/<uuid:candidacy_id>/findings", finding_views.record_finding_view),
    path("api/people/<uuid:person_id>/documents", document_views.upload_document_view),
    path("api/signals/<uuid:signal_id>/resolve", crosscheck_views.resolve_signal_view),
    path("api/signals/<uuid:signal_id>/override", crosscheck_views.override_signal_view),
    path("api/candidacies/<uuid:candidacy_id>/submission", submission_views.create_submission_view),
    path("api/candidate/<str:token>", submission_views.candidate_view),
    path("api/candidacies/<uuid:candidacy_id>/placement", placement_views.create_placement_view),
    path("api/checkpoints/<uuid:checkpoint_id>/record", placement_views.record_checkpoint_view),
]
