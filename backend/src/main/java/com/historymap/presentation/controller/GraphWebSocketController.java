package com.historymap.presentation.controller;

import com.historymap.application.dto.WebSocketMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class GraphWebSocketController {

    @MessageMapping("/map/{mapId}")
    @SendTo("/topic/map/{mapId}")
    public WebSocketMessage handleMapMessage(@DestinationVariable String mapId,
                                             WebSocketMessage message) {
        message.setMapId(mapId);
        return message;
    }
}
