import 'package:chatgame/pages/chat_screen.dart';
import 'package:chatgame/pages/start_screen.dart';
import 'package:go_router/go_router.dart';

final appRouter = GoRouter(
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => const StartScreen(),
    ),
    GoRoute(
      path: "/chat",
      builder: (context, state) => const ChatScreen(),
    ),
  ],
);
