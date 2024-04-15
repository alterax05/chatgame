import 'package:json_annotation/json_annotation.dart';

sealed class GameEvent {}

// events sent from the app to the server

class WebSocketEvent {
  final String type;
  final dynamic data;

  WebSocketEvent(this.type, this.data);
}

class Connect extends GameEvent {
  final String playerName;

  Connect(this.playerName);
}

class Disconnect extends GameEvent {}

class SendMessage extends GameEvent {
  final String message;

  SendMessage(this.message);
}

class Vote extends GameEvent {
  final String playerId;

  Vote(this.playerId);
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
  final String message;
  final String authorId;

  NewMessageUpdate(this.message, this.authorId);

  factory NewMessageUpdate.fromJson(Map<String, dynamic> json) {
    return NewMessageUpdate(json['message'], json['authorId']);
  }
}
