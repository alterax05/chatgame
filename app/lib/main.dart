import 'package:chatgame/blocs/game_bloc/game_bloc.dart';
import 'package:chatgame/routes/router.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      debugShowCheckedModeBanner: false,
      title: 'Chat Game',
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xff6f61e8),
          primary: const Color(0xff6f61e8),
        ),
        primaryColorDark: const Color.fromARGB(255, 78, 69, 155),
        textTheme: ThemeData.light().textTheme.copyWith(
              bodyLarge: const TextStyle(fontSize: 18),
              bodyMedium: const TextStyle(fontSize: 16),
              bodySmall: const TextStyle(fontSize: 14),
            ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ButtonStyle(
            backgroundColor: MaterialStateProperty.all(const Color(0xff6f61e8)),
            foregroundColor: MaterialStateProperty.all(Colors.white),
          ),
        ),
      ),
      routerConfig: appRouter,
      builder: (context, child) {
        return MultiBlocProvider(
          providers: [
            BlocProvider(
              create: (ctx) => GameBloc(),
            )
          ],
          child: child!,
        );
      },
    );
  }
}
