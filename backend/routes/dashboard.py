from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func

from database import db
from models.transaction import Transaction

dashboard = Blueprint("dashboard", __name__)


@dashboard.route("/dashboard", methods=["GET"])
@jwt_required()
def get_dashboard():

    user_id = int(get_jwt_identity())

    total_income = db.session.query(
        func.sum(Transaction.amount)
    ).filter(
        Transaction.user_id == user_id,
        Transaction.transaction_type == "Income"
    ).scalar()

    total_expense = db.session.query(
        func.sum(Transaction.amount)
    ).filter(
        Transaction.user_id == user_id,
        Transaction.transaction_type == "Expense"
    ).scalar()

    total_income = total_income or 0
    total_expense = total_expense or 0

    balance = total_income - total_expense
    savings = balance

    return jsonify({
        "status": "success",
        "total_income": total_income,
        "total_expense": total_expense,
        "balance": balance,
        "savings": savings
    })
# ---------------------------------
# Expense Chart
# GET /expense-chart
# ---------------------------------
@dashboard.route("/expense-chart", methods=["GET"])
@jwt_required()
def expense_chart():

    user_id = int(get_jwt_identity())

    results = (
        db.session.query(
            Transaction.category,
            func.sum(Transaction.amount)
        )
        .filter(
            Transaction.user_id == user_id,
            Transaction.transaction_type == "Expense"
        )
        .group_by(Transaction.category)
        .all()
    )

    labels = []
    amounts = []

    for category, total in results:
        labels.append(category)
        amounts.append(float(total))

    return jsonify({
        "status": "success",
        "labels": labels,
        "amounts": amounts
    })
@dashboard.route("/monthly-chart", methods=["GET"])
@jwt_required()
def monthly_chart():

    user_id = int(get_jwt_identity())

    results = (
        db.session.query(
            func.month(Transaction.date).label("month"),
            func.sum(Transaction.amount)
        )
        .filter(
            Transaction.user_id == user_id,
            Transaction.transaction_type == "Expense"
        )
        .group_by("month")
        .order_by("month")
        .all()
    )

    labels = []
    amounts = []
    month_names = {
    1: "Jan",
    2: "Feb",
    3: "Mar",
    4: "Apr",
    5: "May",
    6: "Jun",
    7: "Jul",
    8: "Aug",
    9: "Sep",
    10: "Oct",
    11: "Nov",
    12: "Dec"
}

    for month, total in results:
        labels.append(month_names.get(month, month))
        amounts.append(float(total))

    return jsonify({
        "status":"success",
        "labels":labels,
        "amounts":amounts
    })