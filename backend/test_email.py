import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv
import os

load_dotenv()

email = os.getenv("MAIL_USERNAME")
password = os.getenv("MAIL_PASSWORD")

print("Email:", email)
print("Password length:", len(password or ""))

message = EmailMessage()
message["Subject"] = "Expense Tracker Test"
message["From"] = email
message["To"] = email
message.set_content("This is a test email from Expense Tracker.")

try:
    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls()
        server.login(email, password)
        server.send_message(message)

    print("EMAIL SENT SUCCESSFULLY!")

except Exception as error:
    print("EMAIL TEST ERROR:")
    print(repr(error))