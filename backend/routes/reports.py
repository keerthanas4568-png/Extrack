from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func, extract

from database import db
from models.transaction import Transaction
from flask import send_file
from openpyxl import Workbook
from io import BytesIO

from reportlab.platypus import SimpleDocTemplate, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.units import inch
from io import BytesIO

report = Blueprint("report", __name__)

# =====================================
# Category-wise Expense Report
# =====================================
@report.route("/reports/category", methods=["GET"])
@jwt_required()
def category_report():

    user_id = int(get_jwt_identity())

    result = (
        db.session.query(
            Transaction.category,
            func.sum(Transaction.amount).label("total")
        )
        .filter(
            Transaction.user_id == user_id,
            Transaction.transaction_type == "Expense"
        )
        .group_by(Transaction.category)
        .all()
    )

    report_data = []

    for row in result:
        report_data.append({
            "category": row.category,
            "total": float(row.total)
        })

    return jsonify({
        "status": "success",
        "report": report_data
    })


# =====================================
# Monthly Expense Report
# =====================================
@report.route("/reports/monthly", methods=["GET"])
@jwt_required()
def monthly_report():

    user_id = int(get_jwt_identity())

    result = (
        db.session.query(
            extract("year", Transaction.date).label("year"),
            extract("month", Transaction.date).label("month"),
            func.sum(Transaction.amount).label("total")
        )
        .filter(
            Transaction.user_id == user_id,
            Transaction.transaction_type == "Expense"
        )
        .group_by(
            extract("year", Transaction.date),
            extract("month", Transaction.date)
        )
        .order_by(
            extract("year", Transaction.date),
            extract("month", Transaction.date)
        )
        .all()
    )

    monthly_data = []

    for row in result:
        monthly_data.append({
            "year": int(row.year),
            "month": int(row.month),
            "total_expense": float(row.total)
        })

    return jsonify({
        "status": "success",
        "monthly_report": monthly_data
    })
@report.route("/export/excel", methods=["GET"])
@jwt_required()
def export_excel():

    user_id = int(get_jwt_identity())

    transactions = (
        Transaction.query
        .filter_by(user_id=user_id)
        .order_by(Transaction.date.desc())
        .all()
    )

    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Transactions"

    sheet.append([
        "Date",
        "Title",
        "Category",
        "Type",
        "Amount"
    ])

    for t in transactions:
        sheet.append([
            t.date.strftime("%d-%m-%Y"),
            t.title,
            t.category,
            t.transaction_type,
            t.amount
        ])

    output = BytesIO()
    workbook.save(output)
    output.seek(0)

    return send_file(
        output,
        as_attachment=True,
        download_name="transactions.xlsx",
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
@report.route("/export/pdf", methods=["GET"])
@jwt_required()
def export_pdf():

    user_id = int(get_jwt_identity())

    transactions = (
        Transaction.query
        .filter_by(user_id=user_id)
        .order_by(Transaction.date.desc())
        .all()
    )

    buffer = BytesIO()

    doc = SimpleDocTemplate(buffer)

    data = [
        ["Date", "Title", "Category", "Type", "Amount"]
    ]

    for t in transactions:
        data.append([
            t.date.strftime("%d-%m-%Y"),
            t.title,
            t.category,
            t.transaction_type,
            f"₹{t.amount}"
        ])

    table = Table(data)

    table.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), colors.darkblue),
        ("TEXTCOLOR", (0,0), (-1,0), colors.white),

        ("GRID", (0,0), (-1,-1), 1, colors.grey),

        ("BACKGROUND", (0,1), (-1,-1), colors.beige),

        ("ALIGN", (0,0), (-1,-1), "CENTER"),

        ("BOTTOMPADDING", (0,0), (-1,0), 12)
    ]))

    doc.build([table])

    buffer.seek(0)

    return send_file(
        buffer,
        as_attachment=True,
        download_name="transactions.pdf",
        mimetype="application/pdf"
    )