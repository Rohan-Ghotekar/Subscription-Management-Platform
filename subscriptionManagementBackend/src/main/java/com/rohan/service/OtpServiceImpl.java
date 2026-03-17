package com.rohan.service;

import java.util.concurrent.TimeUnit;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import com.rohan.dto.AuthDtos.EmailRequest;
import com.rohan.dto.AuthDtos.EmailRequestVal;

import jakarta.mail.MessagingException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RequiredArgsConstructor
@Slf4j
@Service
public class OtpServiceImpl implements OtpService {
	
	private 	final RedisTemplate<String, Object> redisTemplate;
	private final EmailService emailService;
	private static final long OTP_EXPIRY = 5;
	@Override
	public void sendOtp(EmailRequest emailRequest) {
		String otp=String.valueOf((int)(Math.random()*900000)+100000);
		String key="OTP:"+emailRequest.email();
		redisTemplate.opsForValue().set(key,otp,OTP_EXPIRY,TimeUnit.MINUTES);
		
		log.info("OTP sent to "+emailRequest.email()+" :"+otp);
		try {
			emailService.sendOtp(emailRequest.email(), otp);
		} catch (MessagingException e) {
			e.printStackTrace();
		}
	}
	
	@Override
	public boolean verifyOtp(EmailRequestVal emailRequest) {
		String key="OTP"+emailRequest.email();
		Object storedOtp = redisTemplate.opsForValue().get(key);

        if (storedOtp == null) {
            throw new RuntimeException("OTP expired or not found");
        }

        if (!storedOtp.toString().equals(emailRequest.otp())) {
            return false;
        }
        
        redisTemplate.delete(key);
		return true;
	}
}
