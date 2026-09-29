from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from database import db
from models.budget import Budget

budget = Blueprint("budget", __name__)
@budget.route("/budget", methods=["POST"])
@jwt_required()
def save_budget():

    user_id = int(get_jwt_identity())

    data = request.get_json()
    print("=" * 50)
    print("Received JSON:", data)
    print("Category:", data.get("category") if data else None)
    print("Monthly Budget:", data.get("monthly_budget") if data else None)
    print("=" * 50)

    category = data.get("category")
    monthly_budget = data.get("monthly_budget")

    if not category or monthly_budget is None:
        return jsonify({
            "status": "error",
            "message": "Category and budget are required."
        }), 400

    existing = Budget.query.filter_by(
        user_id=user_id,
        category=category
    ).first()

    if existing:
        existing.monthly_budget = monthly_budget

    else:
        new_budget = Budget(
            user_id=user_id,
            category=category,
            monthly_budget=monthly_budget
        )

        db.session.add(new_budget)

    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Budget saved successfully."
    }), 200
# ----------------------------
# Get All Budgets
# ----------------------------
@budget.route("/budget", methods=["GET"])
@jwt_required()
def get_budgets():

    user_id = int(get_jwt_identity())

    budgets = Budget.query.filter_by(user_id=user_id).all()

    result = []

    for budget_item in budgets:
        result.append({
            "id": budget_item.id,
            "category": budget_item.category,
            "monthly_budget": budget_item.monthly_budget
        })

    return jsonify({
        "status": "success",
        "budgets": result
    }), 200
# ----------------------------
# Update Budget
# ----------------------------
@budget.route("/budget/<int:id>", methods=["PUT"])
@jwt_required()
def update_budget(id):

    user_id = int(get_jwt_identity())

    budget_item = Budget.query.filter_by(
        id=id,
        user_id=user_id
    ).first()

    if not budget_item:
        return jsonify({
            "status": "error",
            "message": "Budget not found."
        }), 404

    data = request.get_json()

    budget_item.category = data.get("category", budget_item.category)
    budget_item.monthly_budget = data.get(
        "monthly_budget",
        budget_item.monthly_budget
    )

    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Budget updated successfully."
    }), 200
# ----------------------------
# Delete Budget
# ----------------------------
@budget.route("/budget/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_budget(id):

    user_id = int(get_jwt_identity())

    budget_item = Budget.query.filter_by(
        id=id,
        user_id=user_id
    ).first()

    if not budget_item:
        return jsonify({
            "status": "error",
            "message": "Budget not found."
        }), 404

    db.session.delete(budget_item)
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Budget deleted successfully."
    }), 200