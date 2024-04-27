import 'package:equatable/equatable.dart';
import 'package:flutter_chat_ui/flutter_chat_ui.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:flutter_chat_types/flutter_chat_types.dart' as chat;

class GameState extends Equatable {
  final WebSocketChannel? webSocket;
  final bool started;
  final chat.User? user;
  final String? roomId;
  final List<chat.User> players;
  final List<chat.User> eliminatedPlayers;
  final String? connectionMessage;
  final List<chat.TextMessage> messages;
  final int turnNumber;
  final bool? votingIsOpen;

  const GameState({
    this.webSocket,
    this.started = false,
    this.user,
    this.roomId,
    this.players = const [],
    this.eliminatedPlayers = const [],
    this.connectionMessage,
    this.messages = const [],
    this.turnNumber = 0,
    this.votingIsOpen,
  });

  @override
  List<Object?> get props => [
        webSocket,
        started,
        user,
        roomId,
        players,
        eliminatedPlayers,
        connectionMessage,
        messages,
        turnNumber,
        votingIsOpen,
      ];

  GameState copyWith({
    WebSocketChannel? webSocket,
    chat.User? user,
    String? roomId,
    List<chat.User>? players,
    List<chat.User>? eliminatedPlayers,
    bool? started,
    String? connectionMessage,
    List<chat.TextMessage>? messages,
    int? turnNumber,
    bool? votingIsOpen,
  }) {
    return GameState(
      webSocket: webSocket ?? this.webSocket,
      user: user ?? this.user,
      roomId: roomId ?? this.roomId,
      players: players ?? this.players,
      eliminatedPlayers: eliminatedPlayers ?? this.eliminatedPlayers,
      started: started ?? this.started,
      connectionMessage: connectionMessage ?? this.connectionMessage,
      messages: messages ?? this.messages,
      turnNumber: turnNumber ?? this.turnNumber,
      votingIsOpen: votingIsOpen ?? this.votingIsOpen,
    );
  }
}
