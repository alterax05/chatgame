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
    final message = {
      'event': type.value,
      'data': data?.toJsonMap(),
    };
    message.removeWhere((key, value) => value == null);
    return jsonEncode(message);
  }

  factory WebSocketEvent.fromJson(Map<String, dynamic> json) {
    return WebSocketEvent(
      EventType.values.firstWhere((e) => e.value == json['event'],
          orElse: () => EventType.unknown),
      json['data'],
    );
  }
}

class Connect extends GameEvent {}

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
  final String vote;

  Vote(this.vote);

  Map<String, dynamic> toJsonMap() {
    return {
      'vote': vote,
    };
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
  final List<chat.User>? players;
  final List<chat.User>? eliminatedPlayers;
  final bool? started;
  final chat.User? user;
  final int? turnNumber;
  final bool? finished;

  GameStatusUpdate({
    this.roomId,
    this.players,
    this.started,
    this.user,
    this.turnNumber,
    this.eliminatedPlayers,
    this.finished,
  });

  factory GameStatusUpdate.fromJson(Map<String, dynamic> json) {
    return GameStatusUpdate(
      roomId: json['roomId'],
      players: List<Map<String, dynamic>>.from(json['players'])
          .map((e) => chat.User.fromJson(e))
          .toList(),
      eliminatedPlayers:
          List<Map<String, dynamic>>.from(json['eliminatedPlayers'])
              .map((e) => chat.User.fromJson(e))
              .toList(),
      started: json['started'],
      user: chat.User.fromJson(json['user']),
      turnNumber: json['turnNumber'],
      finished: json['finished'],
    );
  }
}

class TurnStatusUpdate extends GameEvent {
  final List<chat.Message> wroteMessages;
  final List<String> votes;
  final bool votingIsOpen;
  final chat.User questioner;

  TurnStatusUpdate({
    required this.wroteMessages,
    required this.votes,
    required this.votingIsOpen,
    required this.questioner,
  });

  factory TurnStatusUpdate.fromJson(Map<String, dynamic> json) {
    return TurnStatusUpdate(
      wroteMessages: List<Map<String, dynamic>>.from(json['wroteMessages'])
          .map((e) => chat.TextMessage.fromJson(e))
          .toList(),
      votes: List<String>.from(json['votes']),
      votingIsOpen: json['votingIsOpen'],
      questioner: chat.User.fromJson(json['questioner']),
    );
  }
}

class NewMessageUpdate extends GameEvent {
  final chat.TextMessage message;

  NewMessageUpdate(this.message);

  factory NewMessageUpdate.fromJson(Map<String, dynamic> json) {
    return NewMessageUpdate(chat.TextMessage.fromJson(json['message']));
  }
}
