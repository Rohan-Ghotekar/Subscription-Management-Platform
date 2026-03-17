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
    	System.out.println("Email:"+toEmail);
    	helper.setTo(toEmail);
    	helper.setSubject("OTP Verification");
    	helper.setText("<h2>Your OTP: " + otp + "</h2>", true);

    	mailSender.send(message);
    }
}