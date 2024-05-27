import 'dart:convert';
import 'package:chatgame/config/config.dart';
import 'package:chatgame/utils/token_refresher.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();

  Future<void> _login() async {
    if (_formKey.currentState!.validate()) {
      // Perform login operation
      final username = _usernameController.text;
      final password = _passwordController.text;
      final url = Config.getServerURL(false, path: '/login');
      post(url, body: {
        'username': username,
        'password': password,
      }).then((response) async {
        if (response.statusCode == 200) {
          final prefs = await SharedPreferences.getInstance();
          Map <String, dynamic> tokenMap = jsonDecode(response.body);
          prefs.setString('jwt', tokenMap['token']);
          TokenRefresher().start();
          if (!mounted) return;
          context.go('/');
        } else {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text('Invalid username or password'),
          ));
        }
      }).catchError( (error) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('An error occurred'),
        ));
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Login'),
      ),
      body: Form(
        key: _formKey,
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            children: <Widget>[
              const SizedBox(height: 96.0),
              TextFormField(
                controller: _usernameController,
                decoration: const InputDecoration(labelText: 'Username'),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter your username';
                  }
                  return null;
                },
              ),
              TextFormField(
                controller: _passwordController,
                decoration: const InputDecoration(labelText: 'Password'),
                obscureText: true,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter your password';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 12.0),
              ElevatedButton(
                onPressed: _login,
                child: const Text('Login'),
              ),
              TextButton(
                onPressed: () {
                  // Navigate to registration page
                  context.push('/register');
                },
                child: const Text('Don\'t have an account? Register'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}