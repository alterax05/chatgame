sealed class GameEvent {}

// events sent from the app to the server

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

class ConnectStatusUpdate extends GameEvent {}

class GameStatusUpdate extends GameEvent {}

class TurnStatusUpdate extends GameEvent {}

class NewMessageUpdate extends GameEvent {
  final String message;
  final String authorId;

  NewMessageUpdate(this.message, this.authorId);
}
