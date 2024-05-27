import 'dart:io';
import 'package:flutter/foundation.dart';

class Config {
  static const stringServerUrl = 'localhost:3000';
  static const stringAndroidServerUrl = '10.0.2.2:3000';

  static Uri getServerURL(bool webSocket, {String path = ''}) {

    if (webSocket) {
      final normalPath = Uri.parse('ws://$stringServerUrl$path');
      if (kIsWeb) {
        return normalPath;
      } else if (Platform.isAndroid) {
        return Uri.parse('ws://$stringAndroidServerUrl$path');
      } else {
        return normalPath;
      }
    }
    else {
      final normalPath = Uri.parse('http://$stringServerUrl$path');
      if (kIsWeb) {
        return normalPath;
      } else if (Platform.isAndroid) {
        return Uri.parse('http://$stringAndroidServerUrl$path');
      } else {
        return normalPath;
      }
    }
  }
}