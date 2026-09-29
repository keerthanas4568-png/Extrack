from flask import Flask, jsonify
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from config import Config
from database import db

# Import Models
from models.user import User
from models.transaction import Transaction
from models.budget import Budget
from models.user_session import UserSession

# Import Blueprints
from routes.auth import auth
from routes.transactions import transaction
from routes.dashboard import dashboard
from routes.reports import report
from routes.budget import budget

from sqlalchemy import inspect



# ==========================================
# Create Flask Application
# ==========================================

app = Flask(__name__)


# ==========================================
# Load Configuration
# ==========================================

app.config.from_object(Config)


# ==========================================
# Enable CORS
# ==========================================

CORS(
    app,
    resources={
        r"/*": {
            "origins": [
                "http://127.0.0.1:5501",
                "http://localhost:5501"
            ]
        }
    },
    supports_credentials=True
)


# ==========================================
# Initialize SQLAlchemy
# ==========================================

db.init_app(app)


# ==========================================
# Initialize JWT
# ==========================================

jwt = JWTManager(app)

@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload):

    session_id = jwt_payload["jti"]

    session = UserSession.query.filter_by(
        session_id=session_id
    ).first()

    if session:
        return session.is_revoked

    return False

@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload):

    session_id = jwt_payload["jti"]

    session = UserSession.query.filter_by(
        session_id=session_id
    ).first()

    if session:
        return session.is_revoked

    return False


# ==========================================
# JWT Error Handlers
# ==========================================

@jwt.unauthorized_loader
def unauthorized_callback(reason):

    print("JWT Unauthorized:", reason)

    return jsonify({
        "status": "error",
        "message": reason
    }), 401


@jwt.invalid_token_loader
def invalid_token_callback(reason):

    print("JWT Invalid:", reason)

    return jsonify({
        "status": "error",
        "message": reason
    }), 401


@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):

    print("JWT Expired")

    return jsonify({
        "status": "error",
        "message": "Token has expired"
    }), 401


# ==========================================
# Register Blueprints
# ==========================================

app.register_blueprint(auth)
app.register_blueprint(transaction)
app.register_blueprint(dashboard)
app.register_blueprint(report)
app.register_blueprint(budget)


# ==========================================
# Home Route
# ==========================================

@app.route("/")
def home():

    return "Expense Tracker Backend Connected to MySQL!"


# ==========================================
# Main Program
# ==========================================

if __name__ == "__main__":

    with app.app_context():

        print("=" * 50)
        print("Expense Tracker Backend Starting...")
        print("=" * 50)

        # Display database connection
        print("Database URI:", app.config["SQLALCHEMY_DATABASE_URI"])

        # Display registered models
        print("Registered Models:")
        print(db.metadata.tables.keys())

        # Create database tables
        print("Creating tables...")

        db.create_all()

        print("Tables created successfully!")

        # Show tables in database
        inspector = inspect(db.engine)

        print("Tables in Database:")
        print(inspector.get_table_names())

        print("=" * 50)

    # Print all registered routes
    print("\nRegistered Routes:")

    for rule in app.url_map.iter_rules():
        print(rule)

    print("=" * 50)

    # Start Flask server
    app.run(debug=True)