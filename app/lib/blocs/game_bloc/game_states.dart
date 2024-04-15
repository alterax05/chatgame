import 'package:equatable/equatable.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

class GameState extends Equatable {
  final WebSocketChannel? webSocket;
  final bool connected;
  final String? playerName;
  final String? roomId;
  final List<String?> roomPlayers;
  final int? requiredPlayers;

  const GameState({
    this.webSocket,
    this.connected = false,
    this.playerName,
    this.roomId,
    this.roomPlayers = const [],
    this.requiredPlayers,
  });

  @override
  List<Object?> get props => [
        webSocket,
        connected,
        playerName,
        roomId,
        roomPlayers,
        requiredPlayers,
      ];

  GameState copyWith({
    WebSocketChannel? webSocket,
    bool? connected,
    String? playerName,
    String? roomId,
    List<String?>? roomPlayers,
    int? requiredPlayers,
  }) {
    return GameState(
      webSocket: webSocket ?? this.webSocket,
      connected: connected ?? this.connected,
      playerName: playerName ?? this.playerName,
      roomId: roomId ?? this.roomId,
      roomPlayers: roomPlayers ?? this.roomPlayers,
      requiredPlayers: requiredPlayers ?? this.requiredPlayers,
    );
  }
}
