import 'dart:convert';

import 'package:flutter_chat_types/flutter_chat_types.dart' as chat;

sealed class GameEvent {}

enum EventType {
  connect("connect"),
  disconnect("disconnect"),
  sendMessage("sendMessage"),
  vote("vote"),
  connectStatusUpdate("connectionStatus"),
  gameStatusUpdate("gameStatus"),
  turnStatusUpdate("turnStatus"),
  newMessageUpdate("newMessage"),
  unknown("unknown");

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
      'event': type.value,
      'data': data.toJsonMap(),
    });
  }

  factory WebSocketEvent.fromJson(Map<String, dynamic> json) {
    return WebSocketEvent(
      EventType.values.firstWhere((e) => e.value == json['event'],
          orElse: () => EventType.unknown),
      json['data'],
    );
  }
}

class Connect extends GameEvent {
  final String firstName;

  Connect(this.firstName);

  Map<String, dynamic> toJsonMap() {
    return {
      'firstName': firstName,
    };
  }
}

class Disconnect extends GameEvent {}

class SendMessage extends GameEvent {
  final String text;

  SendMessage(this.text);

  Map<String, dynamic> toJsonMap() {
    return {
      'text': text,
    };
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
  final String? message;

  ConnectStatusUpdate(
    this.message,
  );

  factory ConnectStatusUpdate.fromJson(Map<String, dynamic> json) {
    return ConnectStatusUpdate(
      json['message'],
    );
  }
}

class GameStatusUpdate extends GameEvent {
  final String? roomId;
  final List<String>? players;
  final bool? started;
  final chat.User? user;
  final int? turnNumber;

  GameStatusUpdate({
    this.roomId,
    this.players,
    this.started,
    this.user,
    this.turnNumber,
  });

  factory GameStatusUpdate.fromJson(Map<String, dynamic> json) {
    return GameStatusUpdate(
      roomId: json['roomId'],
      players: List<String>.from(json['players']),
      started: json['started'],
      user: chat.User.fromJson(json['user']),
      turnNumber: json['turnNumber'],
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
  final chat.TextMessage message;

  NewMessageUpdate(this.message);

  factory NewMessageUpdate.fromJson(Map<String, dynamic> json) {
    return NewMessageUpdate(chat.TextMessage.fromJson(json['message']));
  }
}
