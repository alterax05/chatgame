import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:chatgame/blocs/game_bloc/game_events.dart';
import 'package:chatgame/blocs/game_bloc/game_states.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

import 'package:flutter_chat_types/flutter_chat_types.dart' as chat;

class GameBloc extends Bloc<GameEvent, GameState> {
  GameBloc() : super(const GameState()) {
    // events sent from game UI to the bloc
    on<Connect>(_onConnectToRoom);
    on<Disconnect>(_onDisconnectFromRoom);
    on<SendMessage>(_onSendMessage);
    on<Vote>(_onVote);

    // events mapped from received server data
    on<ConnectStatusUpdate>(_onConnectStatusUpdate);
    on<GameStatusUpdate>(_onGameStatusUpdate);
    on<TurnStatusUpdate>(_onTurnStatusUpdate);
    on<NewMessageUpdate>(_onNewMessageUpdate);
  }

  FutureOr<void> _onConnectToRoom(
      Connect event, Emitter<GameState> emit) async {
    debugPrint("connecting to room");

    final serverUrl = Uri.parse(
        Platform.isAndroid ? 'ws://10.0.2.2:3000' : 'ws://localhost:3000');
    final webSocket = WebSocketChannel.connect(serverUrl);

    await webSocket.ready;

    webSocket.stream.listen((eventData) {
      debugPrint("received event: $eventData");
      final decodedData = jsonDecode(eventData) as Map<String, dynamic>;
      if (!decodedData.containsKey("event")) return;

      final event = WebSocketEvent.fromJson(decodedData);

      // map received data to the corresponding bloc event
      if (event.type == EventType.connectStatusUpdate) {
        add(ConnectStatusUpdate.fromJson(event.data));
      } else if (event.type == EventType.gameStatusUpdate) {
        add(GameStatusUpdate.fromJson(event.data));
      } else if (event.type == EventType.turnStatusUpdate) {
        add(TurnStatusUpdate.fromJson(event.data));
      } else if (event.type == EventType.newMessageUpdate) {
        add(NewMessageUpdate.fromJson(event.data));
      }
    });

    webSocket.sink.add(WebSocketEvent(EventType.connect, event).toJson());

    emit(state.copyWith(webSocket: webSocket));
  }

  FutureOr<void> _onDisconnectFromRoom(
      Disconnect event, Emitter<GameState> emit) {
    debugPrint("disconnecting from room");

    final webSocket = state.webSocket;

    if (webSocket != null) {
      webSocket.sink.close();
      emit(const GameState());
      debugPrint("disconnected from room");
    }
  }

  FutureOr<void> _onSendMessage(SendMessage event, Emitter<GameState> emit) {
    debugPrint("sending message");

    final webSocket = state.webSocket!;
    webSocket.sink.add(WebSocketEvent(EventType.sendMessage, event).toJson());

    debugPrint("sent message");
  }

  FutureOr<void> _onVote(Vote event, Emitter<GameState> emit) {
    debugPrint("voting");

    final webSocket = state.webSocket!;
    webSocket.sink.add(WebSocketEvent(EventType.vote, event).toJson());

    debugPrint("voted");
  }

  FutureOr<void> _onConnectStatusUpdate(
      ConnectStatusUpdate event, Emitter<GameState> emit) {
    debugPrint("received connect status update");

    emit(state.copyWith(
      connectionMessage: event.message,
    ));
  }

  FutureOr<void> _onGameStatusUpdate(
      GameStatusUpdate event, Emitter<GameState> emit) {
    debugPrint("received game status update");

    emit(state.copyWith(
      started: event.started,
      user: event.user,
      players: event.players,
      eliminatedPlayers: event.eliminatedPlayers,
      turnNumber: event.turnNumber,
    ));
  }

  FutureOr<void> _onTurnStatusUpdate(
      TurnStatusUpdate event, Emitter<GameState> emit) {
    debugPrint("received turn status update");

    emit(state.copyWith(votingIsOpen: event.votingIsOpen));
  }

  FutureOr<void> _onNewMessageUpdate(
      NewMessageUpdate event, Emitter<GameState> emit) {
    debugPrint("received new message update");

    bool? isVotingMessage = event.message.metadata?['voting'];

    if (isVotingMessage == true) {
      event.message.metadata?["playersToVote"] = state.players
          .where((player) =>
              state.eliminatedPlayers
                  .every((eliminated) => eliminated.id != player.id) &&
              player.id != state.user?.id)
          .toList();
    }

    emit(state.copyWith(
        messages: List.from(state.messages)..add(event.message)));
  }
}
