import 'package:bubble/bubble.dart';
import 'package:chatgame/blocs/game_bloc/game_states.dart';
import 'package:flutter/material.dart';
import 'package:chatgame/blocs/game_bloc/game_bloc.dart';
import 'package:chatgame/blocs/game_bloc/game_events.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_chat_ui/flutter_chat_ui.dart';
import 'package:flutter_chat_types/flutter_chat_types.dart' as chat;
import 'package:go_router/go_router.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final _messages = <chat.Message>[];
  chat.User? _user;
  final _votedMessagesIds = <(String, chat.User)>[];

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

  Widget _buildCustomMessage(
    Widget child, {
    required chat.Message message,
    required nextMessageInGroup,
  }) {
    bool? isVotingMessage = message.metadata?['voting'];
    List<chat.User>? playersToVote = message.metadata?['playersToVote'];
    bool? isFinished = message.metadata?['finished'];

    return Bubble(
      color: _user?.id != message.author.id
          ? const Color(0xfff5f5f7)
          : Theme.of(context).colorScheme.primary,
      margin: nextMessageInGroup
          ? const BubbleEdges.symmetric(horizontal: 6)
          : null,
      padding: const BubbleEdges.symmetric(horizontal: 4, vertical: 4),
      nip: nextMessageInGroup
          ? BubbleNip.no
          : _user?.id != message.author.id
              ? BubbleNip.leftBottom
              : BubbleNip.rightBottom,
      shadowColor: Colors.black.withOpacity(0.1),
      child: Builder(
        builder: (ctx) {
          if (isVotingMessage == true) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                child,
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8.0),
                  child: BlocBuilder<GameBloc, GameState>(
                    builder: (context, state) {
                      return Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            ...playersToVote!.map(
                              (player) => Padding(
                                padding: const EdgeInsets.only(bottom: 8.0),
                                child: ElevatedButton(
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: _votedMessagesIds
                                            .where((el) => el.$1 == message.id)
                                            .isNotEmpty
                                        ? _votedMessagesIds
                                                .where((el) =>
                                                    el.$1 == message.id &&
                                                    el.$2.id == player.id)
                                                .isNotEmpty
                                            ? Theme.of(context).primaryColorDark
                                            : Theme.of(context).disabledColor
                                        : null,
                                  ),
                                  onPressed: () {
                                    if (_votedMessagesIds
                                        .where((el) => el.$1 == message.id)
                                        .isEmpty) {
                                      setState(() {
                                        _votedMessagesIds
                                            .add((message.id, player));
                                      });
                                      context
                                          .read<GameBloc>()
                                          .add(Vote(player.id));
                                    }
                                  },
                                  child: Text(player.firstName!),
                                ),
                              ),
                            )
                          ]);
                    },
                  ),
                ),
              ],
            );
          }

          if (isFinished == true) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                child,
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      ElevatedButton(
                        onPressed: () {
                          context.replace('/');
                          context.read<GameBloc>().add(Disconnect());
                        },
                        child: const Text("Return to start"),
                      ),
                    ],
                  ),
                )
              ],
            );
          }
          return child;
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<GameBloc, GameState>(
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

        // clear voting state
        // if (state.votingIsOpen != true) {
        //   setState(() {
        //     _votedUser = null;
        //   });
        // }

        if (state.finished) {
          context.read<GameBloc>().add(Disconnect());
          debugPrint("game finished, disconnecting from room");
        }
      },
      child: Scaffold(
        appBar: AppBar(
          title: const Text("Chat Game"),
          backgroundColor: Theme.of(context).colorScheme.primary,
          foregroundColor: Theme.of(context).colorScheme.onPrimary,
        ),
        body: Builder(builder: (context) {
          return Chat(
            showUserNames: true,
            showUserAvatars: true,
            messages: _messages.reversed.toList(),
            onSendPressed: _onSendPressed,
            user: _user!,
            bubbleBuilder: _buildCustomMessage,
          );
        }),
      ),
    );
  }
}
