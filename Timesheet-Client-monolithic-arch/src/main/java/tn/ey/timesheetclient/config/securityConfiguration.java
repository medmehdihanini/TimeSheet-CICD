package tn.ey.timesheetclient.config;

import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@AllArgsConstructor
@EnableMethodSecurity
public class securityConfiguration {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final JwtValidationFilter jwtValidationFilter;
    private final AuthenticationProvider authenticationProvider;
    private final AuthExceptionHandler authExceptionHandler;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> {}) // Enable CORS with default configuration (will use WebMvcConfigurer)
                .csrf(AbstractHttpConfigurer::disable)
                .addFilterBefore(jwtValidationFilter, UsernamePasswordAuthenticationFilter.class)
                .exceptionHandling(handle -> handle.authenticationEntryPoint(authExceptionHandler))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/v1/auth/**", "/ws/**", "/chat-socket/**")
                        .permitAll()
                        .requestMatchers("/api/v1/logs/test-websocket")
                        .permitAll()
                        .anyRequest().authenticated()
                )
                .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authenticationProvider)
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}