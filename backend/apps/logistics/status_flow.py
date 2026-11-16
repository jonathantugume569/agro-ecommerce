from django.core.exceptions import ValidationError

STATUS_CHOICES = [
    ("Pending", "Pending"),
    ("Confirmed", "Confirmed"),
    ("Packed", "Packed"),
    ("Dispatched", "Dispatched"),
    ("In transit", "In transit"),
    ("Delivered", "Delivered"),
    ("Cancelled", "Cancelled"),
    ("Failed", "Failed"),
]

ALLOWED_TRANSITIONS = {
    "Pending": ["Confirmed", "Cancelled"],
    "Confirmed": ["Packed", "Cancelled"],
    "Packed": ["Dispatched", "Cancelled"],
    "Dispatched": ["In transit", "Failed"],
    "In transit": ["Delivered", "Failed"],
    "Delivered": [],
    "Cancelled": [],
    "Failed": ["Dispatched"],
}


def validate_transition(current_status, next_status):
    if next_status not in ALLOWED_TRANSITIONS.get(current_status, []):
        raise ValidationError(f"Cannot move from '{current_status}' to '{next_status}'.")