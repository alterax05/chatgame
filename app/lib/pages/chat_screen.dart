import 'package:chatgame/blocs/game_bloc/game_states.dart';
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
  final _messages = <chat.Message>[];
  chat.User? _user;

  @override
  void initState() {
    super.initState();

    _user = context.read<GameBloc>().state.user;
    _messages.addAll(context.read<GameBloc>().state.messages);
  }

  void _onSendPressed(chat.PartialText message) {
    FocusScope.of(context).unfocus();
    context.read<GameBloc>().add(SendMessage(message.text));
  }

  Widget _buildCustomMessage(chat.CustomMessage message,
      {required int messageWidth}) {
    return Text("some");
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<GameBloc, GameState>(
      listenWhen: (prev, curr) {
        return prev.messages != curr.messages;
      },
      listener: (context, state) {
        // add missing messages to the chat
        final messages = state.messages;
        final missingMessages = messages.where((message) {
          return !_messages.any((existingMessage) {
            return existingMessage.id == message.id;
          });
        }).toList();

        if (missingMessages.isNotEmpty) {
          setState(() {
            _messages.addAll(missingMessages);
          });
        }
      },
      child: Scaffold(
        appBar: AppBar(
          title: const Text("Chat Game"),
        ),
        body: Builder(builder: (context) {
          return Chat(
            showUserNames: true,
            showUserAvatars: true,
            messages: _messages.reversed.toList(),
            onSendPressed: _onSendPressed,
            user: _user!,
            customMessageBuilder: _buildCustomMessage,
          );
        }),
      ),
    );
  }
}
