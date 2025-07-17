package tn.ey.timesheetclient.WebSocket;


import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;

import org.springframework.http.MediaType;
import org.springframework.messaging.converter.DefaultContentTypeResolver;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.converter.MessageConverter;
import org.springframework.messaging.handler.invocation.HandlerMethodArgumentResolver;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.security.messaging.context.AuthenticationPrincipalArgumentResolver;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;


import java.util.List;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
@Order(Ordered.HIGHEST_PRECEDENCE+99)
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    // These fields aren't used directly in this class but are injected for completeness
    private  SimpMessagingTemplate messagingTemplate;
    private  ObjectMapper springObjectMapper;


    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Enable simple broker with destinations for various parts of the application
        System.out.println("WebSocket: Configuring message broker with destinations: /user, /chatroom, /topic, /queue, /logs, /program, /project");
        registry.enableSimpleBroker(
            "/user",      // For user-specific messages
            "/chatroom",  // For chat room specific messages
            "/topic",     // For general topic broadcasts
            "/queue",     // For specific user targeting
            "/logs",      // For system logs
            "/program",   // For program-related events
            "/project"    // For project-related events
        );
        
        // Set prefixes for messages bound for message handling methods
        registry.setApplicationDestinationPrefixes("/app");
        System.out.println("WebSocket: Set application destination prefix: /app");
        
        // Set the prefix for user-specific subscriptions
        registry.setUserDestinationPrefix("/user");
        System.out.println("WebSocket: Set user destination prefix: /user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Main WebSocket endpoint
        registry.addEndpoint("/ws")
                .setAllowedOrigins("http://localhost:4200", "http://127.0.0.1:4200", "http://20.19.87.209:8085", "http://20.19.87.209:4200")
                .withSockJS();
        
        // Dedicated endpoint for chat functionality
        registry.addEndpoint("/chat-socket")
                .setAllowedOrigins("http://localhost:4200", "http://127.0.0.1:4200", "http://20.19.87.209:8085", "http://20.19.87.209:4200")
                .withSockJS();
    }

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> argumentResolvers) {
        argumentResolvers.add(new AuthenticationPrincipalArgumentResolver()); // because we had Authentication algorithm
    }


    //configure the return of websocket ( in this case to json )

    @Override
    public boolean configureMessageConverters(List<MessageConverter> messageConverters) {
        DefaultContentTypeResolver resolver = new DefaultContentTypeResolver();
        resolver.setDefaultMimeType(MediaType.APPLICATION_JSON);

        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS); // Optional but recommended

        MappingJackson2MessageConverter converter = new MappingJackson2MessageConverter();
        converter.setObjectMapper(objectMapper);
        converter.setContentTypeResolver(resolver);

        messageConverters.add(converter);
        return false;

    }
    
    /**
     * Configure WebSocket transport options
     * - Increases message size limits for file sharing in chat
     * - Sets appropriate buffer sizes for chat data
     * - Sets timeout limits for message handling
     */
    @Override
    public void configureWebSocketTransport(org.springframework.web.socket.config.annotation.WebSocketTransportRegistration registry) {
        // Increase message size limits to allow for file sharing in chat
        registry.setMessageSizeLimit(2 * 1024 * 1024); // 2MB max message size
        registry.setSendBufferSizeLimit(4 * 1024 * 1024); // 4MB max buffer size
        registry.setSendTimeLimit(20 * 1000); // 20 seconds timeout
    }
    
    /**
     * Configure client inbound channel (messages from client to server)
     * - Sets thread pool size for handling incoming messages
     */
    @Override
    public void configureClientInboundChannel(org.springframework.messaging.simp.config.ChannelRegistration registration) {
        // Configure thread pool for handling incoming messages
        registration.taskExecutor().corePoolSize(4);
        registration.taskExecutor().maxPoolSize(10);
    }
    
    /**
     * Configure client outbound channel (messages from server to client)
     * - Sets thread pool size for handling outgoing messages
     */
    @Override
    public void configureClientOutboundChannel(org.springframework.messaging.simp.config.ChannelRegistration registration) {
        // Configure thread pool for handling outgoing messages
        registration.taskExecutor().corePoolSize(4);
        registration.taskExecutor().maxPoolSize(10);
    }
}


