import 'dart:convert';

import 'package:flutter_chat_types/flutter_chat_types.dart' as chat;

sealed class GameEvent {}

enum EventType {
  connect("connect"),
  disconnect("disconnect"),
  sendMessage("sendMessage"),
  vote("vote"),
  connectStatusUpdate("connectStatusUpdate"),
  gameStatusUpdate("gameStatusUpdate"),
  turnStatusUpdate("turnStatusUpdate"),
  newMessageUpdate("newMessageUpdate");

  final String value;

  const EventType(this.value);
}

// events sent from the app to the server

class WebSocketEvent {
  final EventType type;
  final dynamic data;

  WebSocketEvent(this.type, this.data);

  String toJson() {
    return jsonEncode({
      'type': type,
      'data': data,
    });
  }

  factory WebSocketEvent.fromJson(Map<String, dynamic> json) {
    return WebSocketEvent(
      EventType.values.firstWhere((e) => e.value == json['type']),
      json['data'],
    );
  }
}

class Connect extends GameEvent {
  final String playerName;

  Connect(this.playerName);

  String toJson() {
    return jsonEncode({
      'playerName': playerName,
    });
  }
}

class Disconnect extends GameEvent {}

class SendMessage extends GameEvent {
  final String message;

  SendMessage(this.message);

  String toJson() {
    return jsonEncode({
      'message': message,
    });
  }
}

class Vote extends GameEvent {
  final String playerId;

  Vote(this.playerId);

  String toJson() {
    return jsonEncode({
      'playerId': playerId,
    });
  }
}

// events received from the server

class ConnectStatusUpdate extends GameEvent {
  ConnectStatusUpdate();

  factory ConnectStatusUpdate.fromJson(Map<String, dynamic> json) {
    return ConnectStatusUpdate();
  }
}

class GameStatusUpdate extends GameEvent {
  final String roomId;
  final List<String> roomPlayers;
  final int requiredPlayers;

  GameStatusUpdate(this.roomId, this.roomPlayers, this.requiredPlayers);

  factory GameStatusUpdate.fromJson(Map<String, dynamic> json) {
    return GameStatusUpdate(
      json['roomId'],
      List<String>.from(json['roomPlayers']),
      json['requiredPlayers'],
    );
  }
}

class TurnStatusUpdate extends GameEvent {
  final String playerId;

  TurnStatusUpdate(this.playerId);

  factory TurnStatusUpdate.fromJson(Map<String, dynamic> json) {
    return TurnStatusUpdate(json['playerId']);
  }
}

class NewMessageUpdate extends GameEvent {
  final chat.CustomMessage message;

  NewMessageUpdate(this.message);

  factory NewMessageUpdate.fromJson(Map<String, dynamic> json) {
    return NewMessageUpdate(chat.CustomMessage.fromJson(json['message']));
  }
}
