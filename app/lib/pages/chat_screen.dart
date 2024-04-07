import 'package:flutter/material.dart';
import 'package:chatgame/blocs/game_bloc/game_bloc.dart';
import 'package:chatgame/blocs/game_bloc/game_events.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import 'package:flutter_chat_ui/flutter_chat_ui.dart';
import 'package:flutter_chat_types/flutter_chat_types.dart' as chat;

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  void _onSendPressed(chat.PartialText message) {
    FocusScope.of(context).unfocus();
    context.read<GameBloc>().add(SendMessage(message.text));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Chat Game"),
      ),
      body: Chat(
        messages: [],
        onSendPressed: _onSendPressed,
        user: const chat.User(
          id: '1',
        ),
      ),
    );
  }
}
