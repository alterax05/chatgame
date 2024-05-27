import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import 'package:chatgame/config/config.dart';
import 'dart:convert';

class TokenRefresher {
  Timer? _timer;

  Future<void> start() async {
    _timer = Timer.periodic(const Duration(minutes: 30), (timer) async {
      await _refreshToken();
    });
  }

  Future<void> _refreshToken() async {
    // Make a network request to refresh the token
    var response = await http.post(Config.getServerURL(false, path: '/refresh'));

    if (response.statusCode == 200) {
      SharedPreferences prefs = await SharedPreferences.getInstance();
      Map<String, dynamic> tokenMap = jsonDecode(response.body);
      // Store the new token
      await prefs.setString('jwt', tokenMap['token']);
      debugPrint('Token refreshed');
    } else {
      debugPrint('Failed to refresh token');
    }
  }

  void stop() {
    _timer?.cancel();
  }
}