import 'package:equatable/equatable.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:flutter_chat_types/flutter_chat_types.dart' as chat;

class GameState extends Equatable {
  final WebSocketChannel? webSocket;
  final bool connected;
  final chat.User? player;
  final String? roomId;
  final List<chat.User> roomPlayers;
  final int? requiredPlayers;

  const GameState({
    this.webSocket,
    this.connected = false,
    this.player,
    this.roomId,
    this.roomPlayers = const [],
    this.requiredPlayers,
  });

  @override
  List<Object?> get props => [
        webSocket,
        connected,
        player,
        roomId,
        roomPlayers,
        requiredPlayers,
      ];

  GameState copyWith({
    WebSocketChannel? webSocket,
    bool? connected,
    chat.User? player,
    String? roomId,
    List<chat.User>? roomPlayers,
    int? requiredPlayers,
  }) {
    return GameState(
      webSocket: webSocket ?? this.webSocket,
      connected: connected ?? this.connected,
      player: player ?? this.player,
      roomId: roomId ?? this.roomId,
      roomPlayers: roomPlayers ?? this.roomPlayers,
      requiredPlayers: requiredPlayers ?? this.requiredPlayers,
    );
  }
}
