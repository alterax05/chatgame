import 'package:equatable/equatable.dart';

class GameState extends Equatable {
  final bool connected;
  final String? playerName;
  final String? roomId;
  final List<String?> roomPlayers;
  final int? requiredPlayers;

  const GameState({
    this.connected = false,
    this.playerName,
    this.roomId,
    this.roomPlayers = const [],
    this.requiredPlayers,
  });

  @override
  List<Object?> get props => [
        connected,
        playerName,
        roomId,
        roomPlayers,
      ];

  GameState copyWith({
    bool? connected,
    String? playerName,
    String? roomId,
    List<String?>? roomPlayers,
    int? requiredPlayers,
  }) {
    return GameState(
      connected: connected ?? this.connected,
      playerName: playerName ?? this.playerName,
      roomId: roomId ?? this.roomId,
      roomPlayers: roomPlayers ?? this.roomPlayers,
      requiredPlayers: requiredPlayers ?? this.requiredPlayers,
    );
  }
}
