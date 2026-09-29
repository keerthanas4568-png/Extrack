from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from database import db
from models.transaction import Transaction

transaction = Blueprint("transaction", __name__)


# ---------------------------------
# Add Transaction
# POST /transactions
# ---------------------------------
@transaction.route("/transactions", methods=["POST"])
@jwt_required()
def add_transaction():

    data = request.get_json()

    if not data:
        return jsonify({
            "status": "error",
            "message": "No data received!"
        }), 400

    title = data.get("title")
    amount = data.get("amount")
    category = data.get("category")
    transaction_type = data.get("transaction_type")

    user_id = int(get_jwt_identity())

    if not all([title, amount, category, transaction_type]):
        return jsonify({
            "status": "error",
            "message": "All fields are required!"
        }), 400

    new_transaction = Transaction(
        title=title,
        amount=amount,
        category=category,
        transaction_type=transaction_type,
        user_id=user_id
    )

    db.session.add(new_transaction)
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Transaction added successfully!"
    }), 201


# ---------------------------------
# Get All Transactions
# GET /transactions
# ---------------------------------
@transaction.route("/transactions", methods=["GET"])
@jwt_required()
def get_transactions():

    user_id = int(get_jwt_identity())

    transactions = (
        Transaction.query
        .filter_by(user_id=user_id)
        .order_by(Transaction.date.desc())
        .all()
    )

    result = []

    for t in transactions:
        result.append({
            "id": t.id,
            "title": t.title,
            "amount": t.amount,
            "category": t.category,
            "transaction_type": t.transaction_type,
            "date": t.date
        })

    return jsonify({
        "status": "success",
        "total_transactions": len(result),
        "transactions": result
    })
# ---------------------------------
# Get Single Transaction
# GET /transactions/<id>
# ---------------------------------
@transaction.route("/transactions/<int:id>", methods=["PUT"])
@jwt_required()
def update_transaction(id):

    user_id = int(get_jwt_identity())

    transaction = Transaction.query.filter_by(
        id=id,
        user_id=user_id
    ).first()

    if not transaction:
        return jsonify({
            "status": "error",
            "message": "Transaction not found!"
        }), 404

    data = request.get_json()

    # Update only the fields that were sent
    if "title" in data:
        transaction.title = data["title"]

    if "amount" in data:
        transaction.amount = data["amount"]

    if "category" in data:
        transaction.category = data["category"]

    if "transaction_type" in data:
        transaction.transaction_type = data["transaction_type"]

    if "date" in data:
        transaction.date = data["date"]

    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Transaction updated successfully!",
        "transaction": {
            "id": transaction.id,
            "title": transaction.title,
            "amount": transaction.amount,
            "category": transaction.category,
            "transaction_type": transaction.transaction_type,
            "date": transaction.date
        }
    }), 200

# ---------------------------------
# Delete Transaction
# DELETE /transactions/<id>
# ---------------------------------
@transaction.route("/transactions/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_transaction(id):

    user_id = int(get_jwt_identity())

    transaction = Transaction.query.filter_by(
        id=id,
        user_id=user_id
    ).first()

    if not transaction:
        return jsonify({
            "status": "error",
            "message": "Transaction not found!"
        }), 404

    db.session.delete(transaction)
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Transaction deleted successfully!"
    })