class Config {
 static const productionStringServerUrl = 'chatgame.5cimicheleporcellato.barsanti.edu.it';

  static Uri getServerURL(bool webSocket, {String path = ''}) {
    if (webSocket) {
      return Uri.parse('wss://$productionStringServerUrl$path');
    } else {
      return Uri.parse('https://$productionStringServerUrl/api$path');
    }
  }
}
