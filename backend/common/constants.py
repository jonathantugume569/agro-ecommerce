class Roles:
    FARMER = "farmer"
    DEALER = "dealer"
    ADMIN = "admin"

    CHOICES = [
        (FARMER, "Farmer"),
        (DEALER, "Dealer"),
        (ADMIN, "Admin"),
    ]


class VerificationStatus:
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

    CHOICES = [
        (PENDING, "Pending"),
        (APPROVED, "Approved"),
        (REJECTED, "Rejected"),
    ]
