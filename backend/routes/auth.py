from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash

from datetime import datetime
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
    decode_token,
    get_jwt
)
from database import db
from models.user import User
from models.user_session import UserSession
from models.login_activity import LoginActivity

from flask import current_app
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature
import smtplib
from email.message import EmailMessage
import pyotp



auth = Blueprint("auth", __name__)

# ---------------------------------
# Test API
# ---------------------------------
@auth.route("/test", methods=["GET"])
def test():

    return jsonify({
        "status": "success",
        "message": "Auth Route Working!"
    })


# ---------------------------------
# Register User
# ---------------------------------
@auth.route("/register", methods=["POST"])
def register():

    data = request.get_json()

    if not data:
        return jsonify({
            "status": "error",
            "message": "No data received!"
        }), 400

    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not all([username, email, password]):
        return jsonify({
            "status": "error",
            "message": "All fields are required!"
        }), 400

    existing_user = User.query.filter_by(email=email).first()

    if existing_user:
        return jsonify({
            "status": "error",
            "message": "Email already registered!"
        }), 400

    hashed_password = generate_password_hash(password)

    new_user = User(
        username=username,
        email=email,
        password=hashed_password
    )

    db.session.add(new_user)
    db.session.commit()

    # Generate JWT Token
    access_token = create_access_token(
        identity=str(new_user.id)
    )

    return jsonify({
        "status": "success",
        "message": "User registered successfully!",
        "access_token": access_token,
        "user_id": new_user.id,
        "username": new_user.username,
        "email": new_user.email
    }), 201

def get_device_info():

    user_agent = request.headers.get("User-Agent", "")

    # Browser
    if "Edg" in user_agent:
        browser = "Microsoft Edge"
    elif "Chrome" in user_agent:
        browser = "Google Chrome"
    elif "Firefox" in user_agent:
        browser = "Mozilla Firefox"
    elif "Safari" in user_agent:
        browser = "Safari"
    else:
        browser = "Unknown Browser"

    # Device
    if "Mobile" in user_agent or "Android" in user_agent:
        device_name = "Mobile Device"
    elif "Windows" in user_agent:
        device_name = "Windows PC"
    elif "Macintosh" in user_agent:
        device_name = "Mac"
    elif "Linux" in user_agent:
        device_name = "Linux PC"
    else:
        device_name = "Unknown Device"

    return device_name, browser

# ---------------------------------
# Login User
# ---------------------------------
@auth.route("/login", methods=["POST"])
def login():

    data = request.get_json()

    if not data:
        return jsonify({
            "status": "error",
            "message": "No data received!"
        }), 400

    email = data.get("email")
    password = data.get("password")
    two_factor_code = data.get("two_factor_code")

    if not email or not password:
        return jsonify({
            "status": "error",
            "message": "Email and Password are required!"
        }), 400

    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({
            "status": "error",
            "message": "User not found!"
        }), 404

    if not check_password_hash(user.password, password):
        return jsonify({
            "status": "error",
            "message": "Invalid password!"
        }), 401

    # ---------------------------------
    # Check Two-Factor Authentication
    # ---------------------------------

    if user.two_factor_enabled:

        if not two_factor_code:
            return jsonify({
                "status": "2fa_required",
                "message": "Two-Factor Authentication code is required.",
                "requires_2fa": True,
                "user_id": user.id
            }), 200

        totp = pyotp.TOTP(user.two_factor_secret)

        if not totp.verify(two_factor_code):
            return jsonify({
                "status": "error",
                "message": "Invalid Two-Factor Authentication code.",
                "requires_2fa": True
            }), 401

    # ---------------------------------
    # Update last login time
    # ---------------------------------

    user.last_login = datetime.utcnow()
    db.session.commit()

    print("LOGIN TIME UPDATE FOR USER:", user.id)

    # ---------------------------------
    # Generate JWT Token
    # ---------------------------------

    access_token = create_access_token(
        identity=str(user.id)
    )

    token_data = decode_token(access_token)
    session_id = token_data["jti"]

    device_name, browser = get_device_info()

    # Record successful login
    login_activity = LoginActivity(
        user_id=user.id,
        activity_type="SUCCESS",
        device_name=device_name,
        browser=browser,
        ip_address=request.remote_addr
    )

    db.session.add(login_activity)

    # Create device session
    new_session = UserSession(
        user_id=user.id,
        session_id=session_id,
        device_name=device_name,
        browser=browser,
        ip_address=request.remote_addr,
        created_at=datetime.utcnow(),
        last_active=datetime.utcnow(),
        is_revoked=False
    )

    db.session.add(new_session)
    db.session.commit()
    print("LOGIN ACTIVITY SAVED:", login_activity.id)

    # Login Response
    return jsonify({
        "status": "success",
        "message": "Login successful!",
        "access_token": access_token,
        "user_id": user.id,
        "username": user.username,
        "email": user.email
    }), 200

    
# ---------------------------------
# Get User Devices
# ---------------------------------

@auth.route("/devices", methods=["GET"])
@jwt_required()
def get_devices():

    user_id = get_jwt_identity()

    # Get current JWT session ID
    jwt_data = get_jwt()
    current_session_id = jwt_data["jti"]

    sessions = UserSession.query.filter_by(
        user_id=int(user_id),
        is_revoked=False
    ).order_by(
        UserSession.last_active.desc()
    ).all()

    devices = []

    for session in sessions:

        devices.append({
            "id": session.id,
            "device_name": session.device_name,
            "browser": session.browser,
            "ip_address": session.ip_address,
            "created_at": session.created_at.isoformat(),
            "last_active": session.last_active.isoformat(),
            "is_current": session.session_id == current_session_id
        })

    return jsonify({
        "status": "success",
        "devices": devices
    }), 200

# ---------------------------------
# Get Login Activity
# ---------------------------------

@auth.route("/login-activity", methods=["GET"])
@jwt_required()
def get_login_activity():

    user_id = get_jwt_identity()

    activities = LoginActivity.query.filter_by(
        user_id=int(user_id)
    ).order_by(
        LoginActivity.created_at.desc()
    ).limit(20).all()

    activity_list = []

    for activity in activities:
        activity_list.append({
            "id": activity.id,
            "activity_type": activity.activity_type,
            "device_name": activity.device_name,
            "browser": activity.browser,
            "ip_address": activity.ip_address,
            "created_at": activity.created_at.isoformat()
        })

    return jsonify({
        "status": "success",
        "activities": activity_list
    }), 200
# ---------------------------------
# Get Current User
# ---------------------------------
@auth.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    user_id = get_jwt_identity()

    user = User.query.get(int(user_id))
    if not user:
        return jsonify({"message": "User not found"}), 404

    return jsonify({
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name or "",
        "email": user.email,
        "phone": user.phone or "",
        "date_of_birth": str(user.date_of_birth) if user.date_of_birth else "",
        "gender": user.gender or "",
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "last_login": user.last_login.isoformat() if user.last_login else None,
        "profile_image": user.profile_image or ""
    }), 200

@auth.route("/me", methods=["PUT"])
@jwt_required()
def update_current_user():

    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))

    if not user:
        return jsonify({
            "status": "error",
            "message": "User not found!"
        }), 404

    data = request.get_json()

    user.username = data.get("username", user.username)
    user.full_name = data.get("full_name", user.full_name)
    user.email = data.get("email", user.email)
    user.phone = data.get("phone", user.phone)

    if data.get("date_of_birth"):
        from datetime import datetime
        user.date_of_birth = datetime.strptime(
            data["date_of_birth"], "%Y-%m-%d"
        ).date()

    user.gender = data.get("gender", user.gender)

    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Profile updated successfully!"
    }), 200

# ---------------------------------
# Get All Users
# ---------------------------------
@auth.route("/users", methods=["GET"])
def get_users():

    users = User.query.all()

    result = []

    for user in users:

        result.append({
            "id": user.id,
            "username": user.username,
            "email": user.email
        })

    return jsonify({
        "status": "success",
        "total_users": len(result),
        "users": result
    })
@auth.route("/me/photo", methods=["PUT"])
@jwt_required()
def upload_profile_photo():
    user_id = get_jwt_identity()

    user = User.query.get(int(user_id))

    if not user:
        return jsonify({"message": "User not found"}), 404

    data = request.get_json()

    profile_image = data.get("profile_image")

    if not profile_image:
        return jsonify({"message": "No image provided"}), 400

    user.profile_image = profile_image

    db.session.commit()

    return jsonify({
        "message": "Profile photo uploaded successfully"
    }), 200


@auth.route("/me/photo", methods=["DELETE"])
@jwt_required()
def remove_profile_photo():
    user_id = get_jwt_identity()

    user = User.query.get(int(user_id))

    if not user:
        return jsonify({"message": "User not found"}), 404

    user.profile_image = None

    db.session.commit()

    return jsonify({
        "message": "Profile photo removed successfully"
    }), 200
# ---------------------------------
# Change Password
# ---------------------------------
@auth.route("/me/password", methods=["PUT"])
@jwt_required()
def change_password():

    user_id = get_jwt_identity()

    user = User.query.get(int(user_id))

    if not user:
        return jsonify({
            "status": "error",
            "message": "User not found!"
        }), 404

    data = request.get_json()

    current_password = data.get("current_password")
    new_password = data.get("new_password")

    if not current_password or not new_password:
        return jsonify({
            "status": "error",
            "message": "Current password and new password are required!"
        }), 400

    # Check current password
    if not check_password_hash(user.password, current_password):
        return jsonify({
            "status": "error",
            "message": "Current password is incorrect!"
        }), 401

    # Prevent using the same password
    if check_password_hash(user.password, new_password):
        return jsonify({
            "status": "error",
            "message": "New password must be different from current password!"
        }), 400

    # Hash and save new password
    user.password = generate_password_hash(new_password)

    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Password updated successfully!"
    }), 200
@auth.route("/forgot-password", methods=["POST"])
def forgot_password():

    data = request.get_json()

    if not data:
        return jsonify({
            "status": "error",
            "message": "No data received!"
        }), 400

    email = data.get("email")

    if not email:
        return jsonify({
            "status": "error",
            "message": "Email is required!"
        }), 400

    user = User.query.filter_by(email=email).first()

    # Don't reveal whether the email exists
    if not user:
        return jsonify({
            "status": "success",
            "message": "If the email is registered, a reset link has been sent."
        }), 200

    # Create temporary reset token
    serializer = URLSafeTimedSerializer(
        current_app.config["SECRET_KEY"]
    )

    token = serializer.dumps(
        user.id,
        salt="password-reset"
    )

    # Reset page URL
    reset_link = (
        "http://127.0.0.1:5501/frontend/reset-password.html"
        "?token=" + token
    )

    # Email configuration
    smtp_email = current_app.config.get("MAIL_USERNAME")
    smtp_password = current_app.config.get("MAIL_PASSWORD")

    if not smtp_email or not smtp_password:
        print("MAIL_USERNAME or MAIL_PASSWORD is not configured.")
        print("PASSWORD RESET LINK:", reset_link)

        return jsonify({
            "status": "error",
            "message": "Email service is not configured yet."
        }), 500

    try:

        message = EmailMessage()

        message["Subject"] = "Expense Tracker - Password Reset"
        message["From"] = smtp_email
        message["To"] = user.email

        # Plain text version
        message.set_content(
            "Hello " + (user.username or "User") + ",\n\n"
            "You requested to reset your Expense Tracker password.\n\n"
            "Reset your password using this link:\n\n"
            + reset_link +
            "\n\n"
            "This link will expire in 15 minutes.\n\n"
            "If you did not request this, you can ignore this email.\n\n"
            "Expense Tracker"
        )

        # HTML version
        html_content = """
        <html>
        <body>
            <h2>Expense Tracker - Password Reset</h2>

            <p>Hello USERNAME,</p>

            <p>You requested to reset your Expense Tracker password.</p>

            <p>Click the button below to create a new password:</p>

            <p>
                <a href="RESET_LINK"
                   style="display:inline-block;
                          padding:12px 20px;
                          background:#2563eb;
                          color:white;
                          text-decoration:none;
                          border-radius:6px;">
                    Reset Password
                </a>
            </p>

            <p>This link will expire in <strong>15 minutes</strong>.</p>

            <p>If you did not request this, you can ignore this email.</p>

            <p>Expense Tracker</p>
        </body>
        </html>
        """

        html_content = html_content.replace(
            "USERNAME",
            user.username or "User"
        )

        html_content = html_content.replace(
            "RESET_LINK",
            reset_link
        )

        message.add_alternative(
            html_content,
            subtype="html"
        )

        # Send email
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(smtp_email, smtp_password)
            server.send_message(message)

        return jsonify({
            "status": "success",
            "message": "If the email is registered, a reset link has been sent."
        }), 200

    except Exception as error:

        print("=" * 60)
        print("PASSWORD RESET EMAIL ERROR:")
        print(repr(error))
        print("=" * 60)

        return jsonify({
            "status": "error",
            "message": "Unable to send password reset email."
        }), 500

# ---------------------------------
# Reset Password
# ---------------------------------
@auth.route("/reset-password", methods=["PUT"])
def reset_password():

    data = request.get_json()

    if not data:
        return jsonify({
            "status": "error",
            "message": "No data received!"
        }), 400

    token = data.get("token")
    new_password = data.get("new_password")

    if not token or not new_password:
        return jsonify({
            "status": "error",
            "message": "Reset token and new password are required!"
        }), 400

    try:

        serializer = URLSafeTimedSerializer(
            current_app.config["SECRET_KEY"]
        )

        user_id = serializer.loads(
            token,
            salt="password-reset",
            max_age=900
        )

    except SignatureExpired:

        return jsonify({
            "status": "error",
            "message": "Password reset link has expired."
        }), 400

    except BadSignature:

        return jsonify({
            "status": "error",
            "message": "Invalid password reset link."
        }), 400

    user = User.query.get(int(user_id))

    if not user:
        return jsonify({
            "status": "error",
            "message": "User not found!"
        }), 404

    # Prevent using the same password
    if check_password_hash(user.password, new_password):

        return jsonify({
            "status": "error",
            "message": "New password must be different from your previous password."
        }), 400

    # Hash new password
    user.password = generate_password_hash(new_password)

    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Password reset successfully!"
    }), 200
@auth.route("/2fa/setup", methods=["POST"])
@jwt_required()
def setup_2fa():

    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))

    if not user:
        return jsonify({
            "status": "error",
            "message": "User not found!"
        }), 404

    # Generate a new secret only if the user doesn't already have one
    if not user.two_factor_secret:
        user.two_factor_secret = pyotp.random_base32()
        db.session.commit()

    # Create TOTP object
    totp = pyotp.TOTP(user.two_factor_secret)

    # Create QR-code URL for authenticator apps
    provisioning_uri = totp.provisioning_uri(
        name=user.email,
        issuer_name="Expense Tracker"
    )

    return jsonify({
        "status": "success",
        "secret": user.two_factor_secret,
        "qr_code_url": provisioning_uri
    }), 200
@auth.route("/2fa/verify", methods=["POST"])
@jwt_required()
def verify_2fa():

    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))

    if not user:
        return jsonify({
            "status": "error",
            "message": "User not found!"
        }), 404

    if not user.two_factor_secret:
        return jsonify({
            "status": "error",
            "message": "2FA setup has not been started!"
        }), 400

    data = request.get_json()

    if not data:
        return jsonify({
            "status": "error",
            "message": "No data received!"
        }), 400

    code = data.get("code")

    if not code:
        return jsonify({
            "status": "error",
            "message": "Verification code is required!"
        }), 400

    totp = pyotp.TOTP(user.two_factor_secret)

    if not totp.verify(code):
        return jsonify({
            "status": "error",
            "message": "Invalid verification code!"
        }), 401

    user.two_factor_enabled = True
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Two-Factor Authentication enabled successfully!"
    }), 200
# ---------------------------------
# Revoke / Logout a Device
# ---------------------------------

@auth.route("/devices/<int:session_id>", methods=["DELETE"])
@jwt_required()
def revoke_device(session_id):

    user_id = get_jwt_identity()

    session = UserSession.query.filter_by(
        id=session_id,
        user_id=int(user_id),
        is_revoked=False
    ).first()

    if not session:
        return jsonify({
            "status": "error",
            "message": "Device session not found!"
        }), 404

    # Prevent logging out the current device
    current_session_id = get_jwt()["jti"]

    if session.session_id == current_session_id:
        return jsonify({
            "status": "error",
            "message": "You cannot log out the current device from here."
        }), 400

    session.is_revoked = True

    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Device logged out successfully!"
    }), 200