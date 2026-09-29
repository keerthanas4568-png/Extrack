from datetime import datetime
from database import db


class LoginActivity(db.Model):
    __tablename__ = "login_activity"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    activity_type = db.Column(
        db.String(50),
        nullable=False
    )

    device_name = db.Column(
        db.String(100),
        default="Unknown Device"
    )

    browser = db.Column(
        db.String(100),
        default="Unknown Browser"
    )

    ip_address = db.Column(
        db.String(45),
        nullable=True
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )