package com.rohan.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.rohan.security.JwtAuthFilter;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

	private final JwtAuthFilter jwtAuthFilter;

	private final UserDetailsService userDetailsService;

	@Bean
	SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		http.csrf(AbstractHttpConfigurer::disable).cors(cors -> cors.configurationSource(corsConfigurationSource()))
				.sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.authorizeHttpRequests(
						auth -> auth
								.requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
								.requestMatchers(
										"/",
										"/api/auth/**",
										"/v3/api-docs/**",
										"/swagger-ui/**",
										"/swagger-ui.html",
										"/actuator/health",
										"/api/webhook/**",
										"/api/webhook/stripe")
								.permitAll().anyRequest().authenticated())
				.formLogin(form -> form.disable()).httpBasic(basic -> basic.disable())
				.authenticationProvider(authenticationProvider())
				.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

		return http.build();
	}

	@Bean
	AuthenticationProvider authenticationProvider() {
		DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
		provider.setPasswordEncoder(passwordEncoder());
//		provider.setPasswordEncoder(passwordEncoder());
		return provider;
	}
	

	@Bean
	AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
		return config.getAuthenticationManager();
	}

	@Bean
	PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	@Bean
	CorsConfigurationSource corsConfigurationSource() {
		CorsConfiguration config = new CorsConfiguration();
				config.setAllowedOrigins(List.of(
					    "https://subscription-management-xi.vercel.app", // deployed frontend
					    "https://subscription-management-git-main-rohan-ghotekars-projects.vercel.app",
					    "http://localhost:5173"
//					    "https://frontend-submanage-u89h-git-main-rohan-ghotekars-projects.vercel.app"
					));

//		config.setAllowedOrigins(List.of(
//                "http://192.168.1.61:5173",
//                "http://localhost:5173",
//                "https://192.168.1.61:5173"
//        ));
		config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
		config.setAllowedHeaders(List.of(
			    "Authorization",
			    "Content-Type",
			    "Accept"
			));
		config.setAllowCredentials(true);
		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", config);
		return source;
	}

//	@Bean
//	OpenAPI customOpenAPI() {
//		return new OpenAPI()
//				.addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
//				.components(new Components().addSecuritySchemes("bearerAuth", new SecurityScheme().name("bearerAuth")
//						.type(SecurityScheme.Type.HTTP).scheme("bearer").bearerFormat("JWT")));
//	}
	
	@Bean
	OpenAPI customOpenAPI() {
	    return new OpenAPI()
	            .addServersItem(new io.swagger.v3.oas.models.servers.Server()
	                    .url("https://subscriptionmanagement.duckdns.org")) // 🔥 IMPORTANT FIX
	            .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
	            .components(new Components().addSecuritySchemes("bearerAuth",
	                    new SecurityScheme()
	                            .name("bearerAuth")
	                            .type(SecurityScheme.Type.HTTP)
	                            .scheme("bearer")
	                            .bearerFormat("JWT")));
	}
}