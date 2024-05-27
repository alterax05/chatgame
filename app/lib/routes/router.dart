import 'package:chatgame/pages/chat_screen.dart';
import 'package:chatgame/pages/login_screen.dart';
import 'package:chatgame/pages/registration_screen.dart';
import 'package:chatgame/pages/start_screen.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

Future<bool> isAuthenticated() async {
  final prefs = await SharedPreferences.getInstance();
  final token = prefs.getString('jwt');
  if (token != null && token.isNotEmpty) {
    return true;
  }
  return false;
}

final appRouter = GoRouter(
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => const StartScreen(),
      redirect: (context, state) async {
          if (await isAuthenticated() == false) {
            return '/login';
          }
          return null;
        },
    ),
    GoRoute(
      path: "/chat",
      builder: (context, state) => const ChatScreen(),
      redirect: (context, state) async {
        if (await isAuthenticated() == false) {
          return '/login';
        }
        return null;
      },
    ),
    GoRoute(
      path: "/login",
      builder: (context, state) => const LoginPage(),
    ),
    GoRoute(
      path: "/register",
      builder: (context, state) => const RegistrationPage(),
    ),
  ],
);

