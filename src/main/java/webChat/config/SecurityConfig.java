package webChat.config;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;
import webChat.controller.ExceptionController;
import webChat.service.social.PrincipalOauth2UserService;

import java.util.List;
import java.util.stream.Collectors;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final PrincipalOauth2UserService principalOauth2UserService;

    @Value("${endpoint.allowed_subnet}")
    private List<String> allowedSubnet;

    @Value("${endpoint.allowed_ip_addresses}")
    private List<String> allowedIpAddresses;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf().disable() // CSRF 보호 비활성화
                .authorizeHttpRequests(auth -> auth
                        // /actuator/** 경로에 대한 IP 접근 제한
                        .requestMatchers("/actuator/**").access(ipAuthorizationManager())
                        // 모든 경로는 로그인 없이 접근 허용
                        .anyRequest().permitAll()
                )
                .exceptionHandling(exception -> exception
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            if (request.getRequestURI().startsWith("/actuator")) {
                                throw new ExceptionController.AccessDeniedException("access denied");
                            } else {
                                response.sendRedirect("/chatlogin");
                            }
                        })
                )
                .formLogin(form -> form
                        .loginPage("/chatlogin") // 커스텀 로그인 페이지
                        .loginProcessingUrl("/login") // 로그인 요청 처리 URL
                        .defaultSuccessUrl("/") // 로그인 성공 후 이동할 URL
                        .permitAll()
                )
                .logout(logout -> logout
                        .logoutUrl("/logout") // 로그아웃 URL
                        .logoutSuccessUrl("/") // 로그아웃 성공 후 이동할 URL
                        .permitAll()
                )
                .oauth2Login(oauth2 -> oauth2
                        .loginPage("/chatlogin") // 소셜 로그인 URL
                        .userInfoEndpoint(userInfo -> userInfo
                                .userService(principalOauth2UserService) // OAuth2 사용자 서비스
                        )
                );

        return http.build();
    }

    /**
     * IP 기반 AuthorizationManager 설정
     * @return AuthorizationManager<RequestAuthorizationContext>
     */
    private AuthorizationManager<RequestAuthorizationContext> ipAuthorizationManager() {
        return (authentication, context) -> {
            HttpServletRequest request = context.getRequest();
            String remoteAddr = request.getRemoteAddr();

            // 허용된 IP 또는 서브넷인지 확인
            boolean isAllowed = allowedIpAddresses.contains(remoteAddr) ||
                    allowedSubnet.stream().anyMatch(subnet -> isInSubnet(remoteAddr, subnet));

            return new AuthorizationDecision(isAllowed);
        };
    }

    /**
     * IP가 특정 서브넷에 속하는지 확인하는 메서드
     * @param ip 클라이언트 IP
     * @param subnet 서브넷
     * @return 서브넷에 포함 여부
     */
    private boolean isInSubnet(String ip, String subnet) {
        // Apache Commons Net의 SubnetUtils 또는 다른 라이브러리를 사용하여 서브넷 검사를 구현
        // 예시: return new SubnetUtils(subnet).getInfo().isInRange(ip);
        return true; // 실제 서브넷 검사를 구현해야 합니다.
    }
}