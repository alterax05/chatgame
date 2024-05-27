import 'dart:async';
import 'dart:io';
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
    SharedPreferences prefs = await SharedPreferences.getInstance();
    String? jwt = prefs.getString('jwt');
    if (jwt == null) {
      stop();
      return;
    }

    http.post(Config.getServerURL(false, path: '/refresh'),
        headers: {HttpHeaders.authorizationHeader: jwt}).then((response) async {
      if (response.statusCode == 200) {
        Map<String, dynamic> tokenMap = jsonDecode(response.body);
        // Store the new token
        await prefs.setString('jwt', tokenMap['token']);
        debugPrint('Token refreshed');
      } else {
        debugPrint('Failed to refresh token');
      }
    }).catchError((error) {
      debugPrint('Failed to refresh token');
      stop();
    });
  }

  void stop() {
    _timer?.cancel();
  }
}
