import 'dart:convert';
import 'dart:io';
import 'package:chatgame/blocs/game_bloc/game_bloc.dart';
import 'package:chatgame/blocs/game_bloc/game_events.dart';
import 'package:chatgame/blocs/game_bloc/game_states.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:http/http.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:chatgame/config/config.dart';

class StartScreen extends StatefulWidget {
  const StartScreen({super.key});

  @override
  State<StartScreen> createState() => _StartScreenState();
}

class _StartScreenState extends State<StartScreen> {
  bool _isWaitingRoom = false;

  @override
  void initState() {
    super.initState();

  }

  @override
  void dispose() {
    super.dispose();
  }

  void _enterGame() {
    context.read<GameBloc>().add(Connect());
    setState(() => _isWaitingRoom = true);
  }

  Widget _buildHomeScreen() {
    return FutureBuilder<HomeScreenInformation>(
      future: fetchData(),
      builder: (BuildContext context, AsyncSnapshot snapshot) {
        if (snapshot.hasData) {
          return Scaffold(
            body: Center(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: <Widget>[
                    Text(
                      'Hello, ${snapshot.data.username}!',
                      style: const TextStyle(fontSize: 24),
                    ),
                    const SizedBox(height: 20),
                    ElevatedButton(
                      onPressed: _enterGame,
                      child: const Text('Play'),
                    ),
                    const SizedBox(height: 40),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        border:
                            Border.all(color: Theme.of(context).primaryColor),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      constraints: const BoxConstraints(maxWidth: 550),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: <Widget>[
                          Column(
                            children: <Widget>[
                              const Text('Win', style: TextStyle(fontSize: 18)),
                              const SizedBox(height: 10),
                              Text('${snapshot.data.win}',
                                  style: const TextStyle(fontSize: 18)),
                            ],
                          ),
                          Container(
                            height: 50, // Adjust as needed
                            width: 1,
                            color: Theme.of(context).primaryColor,
                          ),
                          Column(
                            children: <Widget>[
                              const Text('Lost',
                                  style: TextStyle(fontSize: 18)),
                              const SizedBox(height: 10),
                              Text('${snapshot.data.lost}',
                                  style: const TextStyle(fontSize: 18)),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        } else if (snapshot.hasError) {
          return _buildWaitingStatus(snapshot.error.toString());
        }
        return _buildWaitingStatus(null);
      },
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
              return _buildHomeScreen();
            });
          },
        ),
      ),
    );
  }

  Future<HomeScreenInformation>? fetchData() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    String? jwt = prefs.getString('jwt');
    if (jwt == null && mounted) {
      context.go('/login');
    }

    return get(Config.getServerURL(false, path: '/results'),
            headers: {HttpHeaders.authorizationHeader: 'Bearer $jwt'})
        .then((response) {
      if (response.statusCode == 200) {
        final Map<String, dynamic> data = jsonDecode(response.body);
        return HomeScreenInformation.fromJson(data);
      }
      else if (response.statusCode == 401) {
        prefs.remove('jwt');
        if (mounted) {
          context.go('/login');
        }
        return Future.error(Exception('Unauthorized'));
      } else {
        return Future.error(Exception('Failed to load data'));
      }
    });
  }
}

class HomeScreenInformation {
  final String username;
  final int win;
  final int lost;

  HomeScreenInformation({required this.username, required this.win, required this.lost});

  Map<String, dynamic> toJson() => {
    'username': username,
    'win': win,
    'lost': lost
  };

  factory HomeScreenInformation.fromJson(Map<String, dynamic> json) => HomeScreenInformation(
      username: json['username'] ?? "unknown",
      win: json['win'] ?? 0,
      lost: json['lost'] ?? 0
  );
}
