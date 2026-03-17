package com.rohan.service;

import com.rohan.dto.AuthDtos.EmailRequest;
import com.rohan.dto.AuthDtos.EmailRequestVal;

public interface OtpService {

	void sendOtp(EmailRequest emailRequest);

	boolean verifyOtp(EmailRequestVal emailRequest);

}