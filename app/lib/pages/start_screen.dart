import 'package:chatgame/blocs/game_bloc/game_bloc.dart';
import 'package:chatgame/blocs/game_bloc/game_events.dart';
import 'package:chatgame/blocs/game_bloc/game_states.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

class StartScreen extends StatefulWidget {
  const StartScreen({super.key});

  @override
  State<StartScreen> createState() => _StartScreenState();
}

class _StartScreenState extends State<StartScreen> {
  final TextEditingController _nameController = TextEditingController();
  bool _isWaitingRoom = false;

  @override
  void initState() {
    super.initState();

    _nameController.addListener(() {
      setState(() {});
    });
  }

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  void _enterGame() {
    context.read<GameBloc>().add(Connect(_nameController.text));
    setState(() => _isWaitingRoom = true);
  }

  Widget _buildNameSelection() {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        children: [
          Flexible(flex: 1, child: Container()),
          const Text("Welcome to Chat Game!"),
          const SizedBox(height: 12.0),
          const Text("Please enter your name to start playing."),
          const SizedBox(height: 12.0),
          TextField(
            controller: _nameController,
            decoration: const InputDecoration(
              labelText: "Your name",
            ),
          ),
          const SizedBox(height: 12.0),
          ElevatedButton(
            onPressed: _nameController.text.isNotEmpty ? _enterGame : null,
            child: const Text("Enter Game"),
          ),
          Flexible(flex: 2, child: Container()),
        ],
      ),
    );
  }

  Widget _buildWaitingStatus(String? message) {
    return Column(
      children: [
        const Expanded(flex: 1, child: SizedBox()),
        const Center(
          child: CircularProgressIndicator(),
        ),
        const SizedBox(height: 24.0),
        if (message != null)
          Text(
            message,
            textAlign: TextAlign.center,
          ),
        const Expanded(flex: 2, child: SizedBox()),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<GameBloc, GameState>(
      listener: (context, state) {
        if (state.started) {
          context.replace("/chat");
        }
      },
      child: Scaffold(
        appBar: AppBar(
          title: const Text("Chat Game"),
        ),
        body: BlocBuilder<GameBloc, GameState>(
          builder: (context, state) {
            return Builder(builder: (ctx) {
              if (_isWaitingRoom) {
                return _buildWaitingStatus(state.connectionMessage);
              }

              return _buildNameSelection();
            });
          },
        ),
      ),
    );
  }
}
