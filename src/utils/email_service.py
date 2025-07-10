"""
Email notification service for Starcomm Training System
"""

import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import os
from datetime import datetime
import logging

class EmailService:
    """Email notification service"""
    
    def __init__(self):
        # Email configuration (in production, use environment variables)
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.smtp_username = os.getenv('SMTP_USERNAME', 'noreply@starcomm.com')
        self.smtp_password = os.getenv('SMTP_PASSWORD', 'your_app_password')
        self.from_email = os.getenv('FROM_EMAIL', 'noreply@starcomm.com')
        self.from_name = os.getenv('FROM_NAME', 'Starcomm Training System')
        
        # Setup logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
    
    def send_email(self, to_email, subject, html_content, text_content=None, attachments=None):
        """Send email with HTML content"""
        try:
            # Create message
            message = MIMEMultipart('alternative')
            message['Subject'] = subject
            message['From'] = f"{self.from_name} <{self.from_email}>"
            message['To'] = to_email
            
            # Add text version if provided
            if text_content:
                text_part = MIMEText(text_content, 'plain')
                message.attach(text_part)
            
            # Add HTML version
            html_part = MIMEText(html_content, 'html')
            message.attach(html_part)
            
            # Add attachments if provided
            if attachments:
                for attachment in attachments:
                    self._add_attachment(message, attachment)
            
            # Send email
            context = ssl.create_default_context()
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls(context=context)
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(message)
            
            self.logger.info(f"Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False
    
    def _add_attachment(self, message, attachment_path):
        """Add attachment to email"""
        try:
            with open(attachment_path, 'rb') as attachment:
                part = MIMEBase('application', 'octet-stream')
                part.set_payload(attachment.read())
            
            encoders.encode_base64(part)
            part.add_header(
                'Content-Disposition',
                f'attachment; filename= {os.path.basename(attachment_path)}'
            )
            message.attach(part)
        except Exception as e:
            self.logger.error(f"Failed to add attachment {attachment_path}: {str(e)}")
    
    def send_welcome_email(self, employee_email, employee_name, company_name, login_url, temp_password):
        """Send welcome email to new employee"""
        subject = f"Welcome to {company_name} Training System"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: #2c5aa0; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; background: #f9f9f9; }}
                .credentials {{ background: white; padding: 15px; border-left: 4px solid #2c5aa0; margin: 20px 0; }}
                .button {{ display: inline-block; background: #2c5aa0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; }}
                .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome to Starcomm Training System</h1>
                </div>
                <div class="content">
                    <h2>Hello {employee_name},</h2>
                    <p>Welcome to the {company_name} security awareness training program!</p>
                    <p>Your account has been created and you can now access your personalized training dashboard.</p>
                    
                    <div class="credentials">
                        <h3>Your Login Credentials:</h3>
                        <p><strong>Email:</strong> {employee_email}</p>
                        <p><strong>Temporary Password:</strong> {temp_password}</p>
                        <p><em>Please change your password after your first login.</em></p>
                    </div>
                    
                    <p>Click the button below to access your training portal:</p>
                    <p style="text-align: center;">
                        <a href="{login_url}" class="button">Access Training Portal</a>
                    </p>
                    
                    <h3>What's Next?</h3>
                    <ul>
                        <li>Log in to your training portal</li>
                        <li>Complete your profile setup</li>
                        <li>Start with the assigned training modules</li>
                        <li>Take quizzes to earn certificates</li>
                    </ul>
                    
                    <p>If you have any questions or need assistance, please contact your training administrator.</p>
                </div>
                <div class="footer">
                    <p>This email was sent by Starcomm Training System</p>
                    <p>© {datetime.now().year} Starcomm. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        Welcome to Starcomm Training System
        
        Hello {employee_name},
        
        Welcome to the {company_name} security awareness training program!
        
        Your Login Credentials:
        Email: {employee_email}
        Temporary Password: {temp_password}
        
        Please change your password after your first login.
        
        Access your training portal: {login_url}
        
        What's Next?
        - Log in to your training portal
        - Complete your profile setup
        - Start with the assigned training modules
        - Take quizzes to earn certificates
        
        If you have any questions, please contact your training administrator.
        """
        
        return self.send_email(employee_email, subject, html_content, text_content)
    
    def send_training_assignment_email(self, employee_email, employee_name, module_title, due_date, training_url):
        """Send training assignment notification"""
        subject = f"New Training Assignment: {module_title}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: #2c5aa0; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; background: #f9f9f9; }}
                .assignment {{ background: white; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0; }}
                .button {{ display: inline-block; background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; }}
                .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>New Training Assignment</h1>
                </div>
                <div class="content">
                    <h2>Hello {employee_name},</h2>
                    <p>You have been assigned a new training module to complete.</p>
                    
                    <div class="assignment">
                        <h3>Training Details:</h3>
                        <p><strong>Module:</strong> {module_title}</p>
                        <p><strong>Due Date:</strong> {due_date}</p>
                    </div>
                    
                    <p>Click the button below to start your training:</p>
                    <p style="text-align: center;">
                        <a href="{training_url}" class="button">Start Training</a>
                    </p>
                    
                    <p>Please complete this training by the due date to maintain your compliance status.</p>
                </div>
                <div class="footer">
                    <p>This email was sent by Starcomm Training System</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(employee_email, subject, html_content)
    
    def send_completion_certificate_email(self, employee_email, employee_name, module_title, score, certificate_path=None):
        """Send training completion certificate"""
        subject = f"Training Completed: {module_title}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: #28a745; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; background: #f9f9f9; }}
                .achievement {{ background: white; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; text-align: center; }}
                .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Congratulations!</h1>
                </div>
                <div class="content">
                    <h2>Hello {employee_name},</h2>
                    <p>Congratulations on successfully completing your training module!</p>
                    
                    <div class="achievement">
                        <h3>Training Completed:</h3>
                        <p><strong>{module_title}</strong></p>
                        <p><strong>Score:</strong> {score}%</p>
                        <p><strong>Completed:</strong> {datetime.now().strftime('%B %d, %Y')}</p>
                    </div>
                    
                    <p>Your certificate of completion is attached to this email. Keep it for your records.</p>
                    <p>Continue your learning journey by exploring more training modules in your dashboard.</p>
                </div>
                <div class="footer">
                    <p>This email was sent by Starcomm Training System</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        attachments = [certificate_path] if certificate_path else None
        return self.send_email(employee_email, subject, html_content, attachments=attachments)
    
    def send_reminder_email(self, employee_email, employee_name, overdue_modules):
        """Send training reminder for overdue modules"""
        subject = "Training Reminder: Overdue Modules"
        
        module_list = ""
        for module in overdue_modules:
            module_list += f"<li>{module['title']} (Due: {module['due_date']})</li>"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: #dc3545; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; background: #f9f9f9; }}
                .warning {{ background: white; padding: 15px; border-left: 4px solid #dc3545; margin: 20px 0; }}
                .button {{ display: inline-block; background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; }}
                .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>⚠️ Training Reminder</h1>
                </div>
                <div class="content">
                    <h2>Hello {employee_name},</h2>
                    <p>This is a reminder that you have overdue training modules that need to be completed.</p>
                    
                    <div class="warning">
                        <h3>Overdue Modules:</h3>
                        <ul>{module_list}</ul>
                    </div>
                    
                    <p>Please complete these modules as soon as possible to maintain your compliance status.</p>
                    <p style="text-align: center;">
                        <a href="#" class="button">Complete Training</a>
                    </p>
                </div>
                <div class="footer">
                    <p>This email was sent by Starcomm Training System</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(employee_email, subject, html_content)
    
    def send_company_report_email(self, admin_email, company_name, report_data):
        """Send monthly training report to company admin"""
        subject = f"Monthly Training Report - {company_name}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: #2c5aa0; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; background: #f9f9f9; }}
                .stats {{ display: flex; justify-content: space-around; margin: 20px 0; }}
                .stat {{ background: white; padding: 15px; text-align: center; border-radius: 5px; }}
                .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Monthly Training Report</h1>
                    <p>{company_name}</p>
                </div>
                <div class="content">
                    <h2>Training Summary</h2>
                    <p>Here's your monthly training progress report:</p>
                    
                    <div class="stats">
                        <div class="stat">
                            <h3>{report_data.get('total_employees', 0)}</h3>
                            <p>Total Employees</p>
                        </div>
                        <div class="stat">
                            <h3>{report_data.get('completed_modules', 0)}</h3>
                            <p>Completed Modules</p>
                        </div>
                        <div class="stat">
                            <h3>{report_data.get('compliance_rate', 0)}%</h3>
                            <p>Compliance Rate</p>
                        </div>
                    </div>
                    
                    <p>For detailed analytics, please log in to your admin dashboard.</p>
                </div>
                <div class="footer">
                    <p>This email was sent by Starcomm Training System</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(admin_email, subject, html_content)

# Create global email service instance
email_service = EmailService()

