from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from common.constants import VerificationStatus

from .models import VerificationRequest


def submit_verification(dealer, document, notes=""):
    """A dealer submits documents for review."""
    if dealer.is_verified:
        raise ValidationError("Your business is already verified.")
    if dealer.verification_requests.filter(status=VerificationStatus.PENDING).exists():
        raise ValidationError("You already have a pending verification request.")
    return VerificationRequest.objects.create(dealer=dealer, document=document, notes=notes)


def _ensure_pending(verification):
    if verification.status != VerificationStatus.PENDING:
        raise ValidationError("This request has already been reviewed.")


@transaction.atomic
def approve_request(verification, admin_user, admin_notes=""):
    _ensure_pending(verification)
    now = timezone.now()

    verification.status = VerificationStatus.APPROVED
    verification.reviewed_by = admin_user
    verification.reviewed_at = now
    verification.admin_notes = admin_notes
    verification.save()

    dealer = verification.dealer
    dealer.is_verified = True
    dealer.verified_at = now
    dealer.save(update_fields=["is_verified", "verified_at"])
    return verification


@transaction.atomic
def reject_request(verification, admin_user, admin_notes=""):
    _ensure_pending(verification)

    verification.status = VerificationStatus.REJECTED
    verification.reviewed_by = admin_user
    verification.reviewed_at = timezone.now()
    verification.admin_notes = admin_notes
    verification.save()
    return verification
