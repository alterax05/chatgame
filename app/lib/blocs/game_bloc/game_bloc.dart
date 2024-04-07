import 'dart:async';

import 'package:chatgame/blocs/game_bloc/game_events.dart';
import 'package:chatgame/blocs/game_bloc/game_states.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class GameBloc extends Bloc<GameEvent, GameState> {
  GameBloc() : super(const GameState()) {
    on<Connect>(_onConnectToRoom);
    on<Disconnect>(_onDisconnectFromRoom);
    on<SendMessage>(_onSendMessage);
    on<Vote>(_onVote);
    on<ConnectStatusUpdate>(_onConnectStatusUpdate);
    on<GameStatusUpdate>(_onGameStatusUpdate);
    on<TurnStatusUpdate>(_onTurnStatusUpdate);
    on<NewMessageUpdate>(_onNewMessageUpdate);
  }

  FutureOr<void> _onConnectToRoom(Connect event, Emitter<GameState> emit) {}

  FutureOr<void> _onDisconnectFromRoom(
      Disconnect event, Emitter<GameState> emit) {}

  FutureOr<void> _onSendMessage(SendMessage event, Emitter<GameState> emit) {}

  FutureOr<void> _onVote(Vote event, Emitter<GameState> emit) {}

  FutureOr<void> _onConnectStatusUpdate(
      ConnectStatusUpdate event, Emitter<GameState> emit) {}

  FutureOr<void> _onGameStatusUpdate(
      GameStatusUpdate event, Emitter<GameState> emit) {}

  FutureOr<void> _onTurnStatusUpdate(
      TurnStatusUpdate event, Emitter<GameState> emit) {}

  FutureOr<void> _onNewMessageUpdate(
      NewMessageUpdate event, Emitter<GameState> emit) {}
}
