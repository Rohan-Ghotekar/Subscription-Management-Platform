package com.rohan.service;

import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
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
            throw new RuntimeException("Email is NULL before sending mail ❌");
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
}