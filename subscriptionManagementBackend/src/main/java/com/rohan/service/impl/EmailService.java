package com.rohan.service.impl;

import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendOtp(String toEmail, String otp) throws MessagingException {
    	if (toEmail == null) {
            throw new RuntimeException("Email is NULL before sending mail!!");
        }
    	MimeMessage message = mailSender.createMimeMessage();
    	MimeMessageHelper helper = new MimeMessageHelper(message, true);
    	helper.setTo(toEmail);
    	helper.setSubject("OTP Verification");
    	helper.setText("""
    		    <!DOCTYPE html>
    		    <html>
    		    <head>
    		        <style>
    		            body {
    		                font-family: Arial, sans-serif;
    		                background-color: #f4f6f8;
    		                margin: 0;
    		                padding: 0;
    		            }
    		            .container {
    		                max-width: 600px;
    		                margin: 30px auto;
    		                background-color: #ffffff;
    		                border-radius: 10px;
    		                box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    		                overflow: hidden;
    		            }
    		            .header {
    		                background-color: #4CAF50;
    		                color: white;
    		                text-align: center;
    		                padding: 20px;
    		                font-size: 22px;
    		                font-weight: bold;
    		            }
    		            .content {
    		                padding: 30px;
    		                color: #333;
    		                line-height: 1.6;
    		                font-size: 15px;
    		            }
    		            .otp-box {
    		                margin: 20px 0;
    		                text-align: center;
    		                font-size: 28px;
    		                font-weight: bold;
    		                color: #4CAF50;
    		                letter-spacing: 4px;
    		            }
    		            .footer {
    		                background-color: #f4f6f8;
    		                padding: 15px;
    		                text-align: center;
    		                font-size: 12px;
    		                color: #777;
    		            }
    		            .button {
    		                display: inline-block;
    		                padding: 10px 20px;
    		                margin-top: 20px;
    		                background-color: #4CAF50;
    		                color: white;
    		                text-decoration: none;
    		                border-radius: 5px;
    		            }
    		        </style>
    		    </head>
    		    <body>

    		        <div class="container">
    		            <div class="header">
    		                Subscription Management Platform
    		            </div>

    		            <div class="content">
    		                <p>Hello,</p>

    		                <p>Thank you for using our Subscription Management Platform.</p>

    		                <p>To complete your verification process, please use the One-Time Password (OTP) below:</p>

    		                <div class="otp-box">
    		                    """ + otp + """
    		                </div>

    		                <p>This OTP is valid for <b>5 minutes</b>. Please do not share this code with anyone for security reasons.</p>

    		                <p>If you did not request this OTP, please ignore this email or contact our support team.</p>

    		                <p>Best regards,<br>
    		                <b>Support Team</b><br>
    		                Subscription Management Platform</p>
    		            </div>

    		            <div class="footer">
    		                © 2026 Subscription Management Platform. All rights reserved.
    		            </div>
    		        </div>

    		    </body>
    		    </html>
    		""", true);

    	mailSender.send(message);
    }
    
    @Async
    public void sendSubscriptionConfirmation(String to, String name, String planName) throws MessagingException {

        if (to == null) {
            throw new RuntimeException("Email is NULL before sending mail!!");
        }

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);

        helper.setTo(to);
        helper.setSubject("Subscription Confirmed — " + planName);

        String html = """
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f4f6f8;
                        margin: 0;
                        padding: 0;
                    }
                    .container {
                        max-width: 600px;
                        margin: 30px auto;
                        background-color: #ffffff;
                        border-radius: 10px;
                        box-shadow: 0 4px 10px rgba(0,0,0,0.1);
                        overflow: hidden;
                    }
                    .header {
                        background-color: #4CAF50;
                        color: white;
                        text-align: center;
                        padding: 20px;
                        font-size: 22px;
                        font-weight: bold;
                    }
                    .content {
                        padding: 30px;
                        color: #333;
                        line-height: 1.6;
                        font-size: 15px;
                    }
                    .plan-box {
                        margin: 20px 0;
                        text-align: center;
                        font-size: 20px;
                        font-weight: bold;
                        color: #4CAF50;
                    }
                    .button {
                        display: inline-block;
                        padding: 12px 24px;
                        margin-top: 20px;
                        background-color: #4CAF50;
                        color: white;
                        text-decoration: none;
                        border-radius: 6px;
                        font-weight: 600;
                    }
                    .footer {
                        background-color: #f4f6f8;
                        padding: 15px;
                        text-align: center;
                        font-size: 12px;
                        color: #777;
                    }
                </style>
            </head>
            <body>

                <div class="container">

                    <div class="header">
                        Subscription Management Platform
                    </div>

                    <div class="content">
                        <p>Hello %s,</p>

                        <p>We’re happy to inform you that your subscription has been successfully activated.</p>

                        <div class="plan-box">
                            %s Plan Activated
                        </div>

                        <p>You can now access all the features included in your plan.</p>

                        <p>If you have any questions, feel free to contact our support team.</p>

                        <p>Best regards,<br>
                        <b>Support Team</b><br>
                        Subscription Management Platform</p>
                    </div>

                    <div class="footer">
                        © 2026 Subscription Management Platform. All rights reserved.
                    </div>

                </div>

            </body>
            </html>
            """.formatted(name, planName);

        helper.setText(html, true);

        mailSender.send(message);
    }
    
    @Async
    public void sendRenewalReminder(String to, String name, String planName, String expiryDate) throws MessagingException {

        if (to == null) {
            throw new RuntimeException("Email is NULL before sending mail!!");
        }

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);

        helper.setTo(to);
        helper.setSubject("Your " + planName + " subscription expires on " + expiryDate);

        String html = """
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f4f6f8;
                        margin: 0;
                        padding: 0;
                    }
                    .container {
                        max-width: 600px;
                        margin: 30px auto;
                        background-color: #ffffff;
                        border-radius: 10px;
                        box-shadow: 0 4px 10px rgba(0,0,0,0.1);
                        overflow: hidden;
                    }
                    .header {
                        background-color: #FF9800;
                        color: white;
                        text-align: center;
                        padding: 20px;
                        font-size: 22px;
                        font-weight: bold;
                    }
                    .content {
                        padding: 30px;
                        color: #333;
                        line-height: 1.6;
                        font-size: 15px;
                    }
                    .plan-box {
                        margin: 20px 0;
                        text-align: center;
                        font-size: 20px;
                        font-weight: bold;
                        color: #FF9800;
                    }
                    .button {
                        display: inline-block;
                        padding: 12px 24px;
                        margin-top: 20px;
                        background-color: #FF9800;
                        color: white;
                        text-decoration: none;
                        border-radius: 6px;
                        font-weight: 600;
                    }
                    .footer {
                        background-color: #f4f6f8;
                        padding: 15px;
                        text-align: center;
                        font-size: 12px;
                        color: #777;
                    }
                </style>
            </head>
            <body>

                <div class="container">

                    <div class="header">
                        Subscription Renewal Reminder
                    </div>

                    <div class="content">
                        <p>Hello %s,</p>

                        <p>This is a reminder that your subscription is about to expire.</p>

                        <div class="plan-box">
                            %s Plan expires on %s
                        </div>

                        <p>Renew now to avoid any interruption in your services.</p>


                        <p>If you have any questions, feel free to contact our support team.</p>

                        <p>Best regards,<br>
                        <b>Support Team</b><br>
                        Subscription Management Platform</p>
                    </div>

                    <div class="footer">
                        © 2026 Subscription Management Platform. All rights reserved.
                    </div>

                </div>

            </body>
            </html>
            """.formatted(name, planName, expiryDate);

        helper.setText(html, true);

        mailSender.send(message);
    }
    
    @Async
    public void sendPlanExpiredEmail(String to, String name, String planName) throws MessagingException {

        if (to == null) {
            throw new RuntimeException("Email is NULL before sending mail!!");
        }

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);

        helper.setTo(to);
        helper.setSubject("Your " + planName + " subscription has expired");

        String html = """
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f4f6f8;
                        margin: 0;
                        padding: 0;
                    }
                    .container {
                        max-width: 600px;
                        margin: 30px auto;
                        background-color: #ffffff;
                        border-radius: 10px;
                        box-shadow: 0 4px 10px rgba(0,0,0,0.1);
                        overflow: hidden;
                    }
                    .header {
                        background-color: #F44336;
                        color: white;
                        text-align: center;
                        padding: 20px;
                        font-size: 22px;
                        font-weight: bold;
                    }
                    .content {
                        padding: 30px;
                        color: #333;
                        line-height: 1.6;
                        font-size: 15px;
                    }
                    .plan-box {
                        margin: 20px 0;
                        text-align: center;
                        font-size: 20px;
                        font-weight: bold;
                        color: #F44336;
                    }
                    .button {
                        display: inline-block;
                        padding: 12px 24px;
                        margin-top: 20px;
                        background-color: #F44336;
                        color: white;
                        text-decoration: none;
                        border-radius: 6px;
                        font-weight: 600;
                    }
                    .footer {
                        background-color: #f4f6f8;
                        padding: 15px;
                        text-align: center;
                        font-size: 12px;
                        color: #777;
                    }
                </style>
            </head>
            <body>

                <div class="container">

                    <div class="header">
                        Subscription Expired
                    </div>

                    <div class="content">
                        <p>Hello %s,</p>

                        <p>Your subscription has expired, and you no longer have access to premium features.</p>

                        <div class="plan-box">
                            %s Plan Expired
                        </div>

                        <p>To continue enjoying our services, please renew your subscription.</p>


                        <p>If you believe this is a mistake, please contact our support team.</p>

                        <p>Best regards,<br>
                        <b>Support Team</b><br>
                        Subscription Management Platform</p>
                    </div>

                    <div class="footer">
                        © 2026 Subscription Management Platform. All rights reserved.
                    </div>

                </div>

            </body>
            </html>
            """.formatted(name, planName);

        helper.setText(html, true);

        mailSender.send(message);
    }
    
    @Async
    public void sendRenewalSuccessEmail(String to, String name, String planName, String renewalDate, String nextBillingDate) throws MessagingException {

        if (to == null) {
            throw new RuntimeException("Email is NULL before sending mail!!");
        }

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);

        helper.setTo(to);
        helper.setSubject("Subscription Renewed Successfully — " + planName);

        String html = """
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f4f6f8;
                        margin: 0;
                        padding: 0;
                    }
                    .container {
                        max-width: 600px;
                        margin: 30px auto;
                        background-color: #ffffff;
                        border-radius: 10px;
                        box-shadow: 0 4px 10px rgba(0,0,0,0.1);
                        overflow: hidden;
                    }
                    .header {
                        background-color: #2196F3;
                        color: white;
                        text-align: center;
                        padding: 20px;
                        font-size: 22px;
                        font-weight: bold;
                    }
                    .content {
                        padding: 30px;
                        color: #333;
                        line-height: 1.6;
                        font-size: 15px;
                    }
                    .highlight-box {
                        margin: 20px 0;
                        text-align: center;
                        font-size: 18px;
                        font-weight: bold;
                        color: #2196F3;
                    }
                    .button {
                        display: inline-block;
                        padding: 12px 24px;
                        margin-top: 20px;
                        background-color: #2196F3;
                        color: white;
                        text-decoration: none;
                        border-radius: 6px;
                        font-weight: 600;
                    }
                    .footer {
                        background-color: #f4f6f8;
                        padding: 15px;
                        text-align: center;
                        font-size: 12px;
                        color: #777;
                    }
                </style>
            </head>
            <body>

                <div class="container">

                    <div class="header">
                        Subscription Renewed
                    </div>

                    <div class="content">
                        <p>Hello %s,</p>

                        <p>Great news! Your subscription has been successfully renewed.</p>

                        <div class="highlight-box">
                            %s Plan Renewed on %s
                        </div>

                        <p>Your access will continue without interruption.</p>

                        <p><b>Next Billing Date:</b> %s</p>

                        <p>If you have any questions or need assistance, feel free to contact our support team.</p>

                        <p>Best regards,<br>
                        <b>Support Team</b><br>
                        Subscription Management Platform</p>
                    </div>

                    <div class="footer">
                        © 2026 Subscription Management Platform. All rights reserved.
                    </div>

                </div>

            </body>
            </html>
            """.formatted(name, planName, renewalDate, nextBillingDate);

        helper.setText(html, true);

        mailSender.send(message);
    }
    
    @Async
    public void sendNewPlanLaunchedEmail(String to, String name, String planName, String planPrice, String planFeatures) throws MessagingException {

        if (to == null) {
            throw new RuntimeException("Email is NULL before sending mail!!");
        }

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);

        helper.setTo(to);
        helper.setSubject("🚀 New Plan Launched — " + planName);

        String html = """
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f4f6f8;
                        margin: 0;
                        padding: 0;
                    }
                    .container {
                        max-width: 600px;
                        margin: 30px auto;
                        background-color: #ffffff;
                        border-radius: 10px;
                        box-shadow: 0 4px 10px rgba(0,0,0,0.1);
                        overflow: hidden;
                    }
                    .header {
                        background-color: #673AB7;
                        color: white;
                        text-align: center;
                        padding: 20px;
                        font-size: 22px;
                        font-weight: bold;
                    }
                    .content {
                        padding: 30px;
                        color: #333;
                        line-height: 1.6;
                        font-size: 15px;
                    }
                    .plan-box {
                        margin: 20px 0;
                        text-align: center;
                        font-size: 20px;
                        font-weight: bold;
                        color: #673AB7;
                    }
                    .features {
                        margin-top: 15px;
                        padding-left: 20px;
                    }
                    .features li {
                        margin-bottom: 8px;
                    }
                    .button {
                        display: inline-block;
                        padding: 12px 24px;
                        margin-top: 20px;
                        background-color: #673AB7;
                        color: white;
                        text-decoration: none;
                        border-radius: 6px;
                        font-weight: 600;
                    }
                    .footer {
                        background-color: #f4f6f8;
                        padding: 15px;
                        text-align: center;
                        font-size: 12px;
                        color: #777;
                    }
                </style>
            </head>
            <body>

                <div class="container">

                    <div class="header">
                        🚀 New Plan Launched
                    </div>

                    <div class="content">
                        <p>Hello %s,</p>

                        <p>We’re excited to introduce a brand new subscription plan designed to give you even more value!</p>

                        <div class="plan-box">
                            %s Plan — %s
                        </div>

                        <p><b>Key Features:</b></p>
                        <ul class="features">
                            %s
                        </ul>

                        <p>Upgrade now and enjoy enhanced features tailored for you.</p>

                        <p>If you have any questions, feel free to contact our support team.</p>

                        <p>Best regards,<br>
                        <b>Support Team</b><br>
                        Subscription Management Platform</p>
                    </div>

                    <div class="footer">
                        © 2026 Subscription Management Platform. All rights reserved.
                    </div>

                </div>

            </body>
            </html>
            """.formatted(name, planName, planPrice, planFeatures);

        helper.setText(html, true);

        mailSender.send(message);
    }
}