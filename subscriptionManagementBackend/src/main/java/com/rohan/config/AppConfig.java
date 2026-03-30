package com.rohan.config;

import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.core.userdetails.UserDetailsService;

@Configuration
public class AppConfig {

	
	@Bean
    RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory factory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(factory);
        return template;
    }
	
	@Bean
	ModelMapper getModelMapper() {
		return new ModelMapper();
	}
	
//	@Bean
//	UserDetailsService userDetailsService() {
//	    return userDetailsService;
//	}
}
