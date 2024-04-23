import 'package:equatable/equatable.dart';
import 'package:flutter_chat_ui/flutter_chat_ui.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:flutter_chat_types/flutter_chat_types.dart' as chat;

class GameState extends Equatable {
  final WebSocketChannel? webSocket;
  final bool gameStarted;
  final chat.User? user;
  final String? roomId;
  final List<chat.User> roomPlayers;
  final String? connectionMessage;
  final List<chat.TextMessage> messages;

  const GameState({
    this.webSocket,
    this.gameStarted = false,
    this.user,
    this.roomId,
    this.roomPlayers = const [],
    this.connectionMessage,
    this.messages = const [],
  });

  @override
  List<Object?> get props => [
        webSocket,
        gameStarted,
        user,
        roomId,
        roomPlayers,
        connectionMessage,
        messages,
      ];

  GameState copyWith({
    WebSocketChannel? webSocket,
    chat.User? user,
    String? roomId,
    List<chat.User>? roomPlayers,
    bool? gameStarted,
    String? connectionMessage,
    List<chat.TextMessage>? messages,
  }) {
    return GameState(
      webSocket: webSocket ?? this.webSocket,
      user: user ?? this.user,
      roomId: roomId ?? this.roomId,
      roomPlayers: roomPlayers ?? this.roomPlayers,
      gameStarted: gameStarted ?? this.gameStarted,
      connectionMessage: connectionMessage ?? this.connectionMessage,
      messages: messages ?? this.messages,
    );
  }
}
