import 'dart:io';
import 'package:flutter/foundation.dart';

class Config {
  static const serverUrl = 'ws://localhost:3000';
  static const androidServerUrl = 'ws://10.0.2.2:3000';

  static Uri getServerURL() {
    if (kIsWeb) {
      return Uri.parse(serverUrl);
    } else if (Platform.isAndroid) {
      return Uri.parse(androidServerUrl);
    } else {
      return Uri.parse(serverUrl);
    }
  }
}