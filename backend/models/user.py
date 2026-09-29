from database import db
from datetime import datetime


class User(db.Model):
    two_factor_enabled = db.Column(db.Boolean, default=False)
    two_factor_secret = db.Column(db.String(32), nullable=True)
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)

    username = db.Column(db.String(100), nullable=False)

    full_name = db.Column(db.String(100), nullable=True)

    email = db.Column(db.String(120), unique=True, nullable=False)

    password = db.Column(db.String(255), nullable=False)

    # Profile information
    phone = db.Column(db.String(20), nullable=True)

    date_of_birth = db.Column(db.Date, nullable=True)

    gender = db.Column(db.String(30), nullable=True)

    profile_image = db.Column(db.Text, nullable=True)
    two_factor_enabled = db.Column(db.Boolean, default=False)
    two_factor_secret = db.Column(db.String(32), nullable=True)

    # Account information
    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    last_login = db.Column(
        db.DateTime,
        nullable=True
    )

    def __repr__(self):
        return f"<User {self.username}>"