import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
// You might need to install and link this library
// npm install react-native-vector-icons
// react-native link react-native-vector-icons
import Icon from "react-native-vector-icons/Ionicons";

const LoginScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notifications, setNotifications] = useState(true);
  const [loading, setLoading] = useState(false);

  // New state variables for password visibility
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const { login, signup } = useAuth();

  const emailRef = useRef(null);
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  const clearLocalStorage = async () => {
    try {
      await AsyncStorage.clear();
      console.log("Local storage cleared");
    } catch (error) {
      console.error("Error clearing local storage:", error);
    }
  };

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        console.log("User signed in successfully");
      } else {
        await signup(email, password, username, notifications);
        console.log("User created successfully");
      }
    } catch (error) {
      console.error("Auth error:", error);
      let errorMessage = "An error occurred";

      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage = "Email is already registered";
          break;
        case "auth/weak-password":
          errorMessage = "Password should be at least 6 characters";
          break;
        case "auth/invalid-email":
          errorMessage = "Invalid email address";
          break;
        case "auth/user-not-found":
          errorMessage = "No account found with this email";
          break;
        case "auth/wrong-password":
          errorMessage = "Incorrect password";
          break;
        case "auth/invalid-credential":
          errorMessage = "Invalid email or password";
          break;
        default:
          errorMessage = error.message;
      }

      Alert.alert("Authentication Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = (nextRef) => {
    if (nextRef && nextRef.current) {
      nextRef.current.focus();
    } else {
      handleAuth();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0} 
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <Text style={styles.title}>Calendar ConnectionV2</Text>
            <Text style={styles.subtitle}>
              {isLogin ? "Welcome back!" : "Create your account"}
            </Text>

            <View style={styles.form}>
              <TextInput
                ref={emailRef}
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
                returnKeyType="next"
                onSubmitEditing={() =>
                  isLogin ? passwordRef.current.focus() : usernameRef.current.focus()
                }
                blurOnSubmit={false}
              />

              {!isLogin && (
                <TextInput
                  ref={usernameRef}
                  style={styles.input}
                  placeholder="Username"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  editable={!loading}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current.focus()}
                  blurOnSubmit={false}
                />
              )}

              {/* Password Input with Toggle */}
              <View style={styles.passwordInputContainer}>
                <TextInput
                  ref={passwordRef}
                  style={styles.inputWithIcon}
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!passwordVisible} // Use state here
                  editable={!loading}
                  returnKeyType={isLogin ? "done" : "next"}
                  onSubmitEditing={() =>
                    isLogin ? handleAuth() : confirmPasswordRef.current.focus()
                  }
                  blurOnSubmit={isLogin}
                />
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => setPasswordVisible(!passwordVisible)}
                >
                  <Icon
                    name={passwordVisible ? "eye-off-outline" : "eye-outline"} // Change icon based on state
                    size={24}
                    color="#6b7280"
                  />
                </TouchableOpacity>
              </View>

              {!isLogin && (
                // Confirm Password Input with Toggle
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    ref={confirmPasswordRef}
                    style={styles.inputWithIcon}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!confirmPasswordVisible} // Use state here
                    editable={!loading}
                    returnKeyType="done"
                    onSubmitEditing={handleAuth}
                    blurOnSubmit={true}
                  />
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                  >
                    <Icon
                      name={confirmPasswordVisible ? "eye-off-outline" : "eye-outline"} // Change icon based on state
                      size={24}
                      color="#6b7280"
                    />
                  </TouchableOpacity>
                </View>
              )}

              {!isLogin && (
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                  <TouchableOpacity
                    onPress={() => setNotifications(!notifications)}
                    style={{
                      width: 24,
                      height: 24,
                      borderWidth: 1,
                      borderColor: "#d1d5db",
                      borderRadius: 4,
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: 8,
                      backgroundColor: notifications ? "#3b82f6" : "white",
                    }}
                    disabled={loading}
                  >
                    {notifications && (
                      <Text style={{ color: "white", fontWeight: "bold" }}>✓</Text>
                    )}
                  </TouchableOpacity>
                  <Text style={{ color: "#374151" }}>
                    Enable Notifications? (You can edit later.)
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.authButton, loading && styles.disabledButton]}
                onPress={handleAuth}
                disabled={loading}
              >
                <Text style={styles.authButtonText}>
                  {loading ? "Loading..." : isLogin ? "Sign In" : "Sign Up"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.switchButton}
                onPress={() => setIsLogin(!isLogin)}
                disabled={loading}
              >
                <Text style={[styles.switchText, loading && styles.disabledText]}>
                  {isLogin
                    ? "Don't have an account? Sign Up"
                    : "Already have an account? Sign In"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8faff",
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 32,
    backgroundColor: "#f8faff",
    paddingBottom: 20,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#f8faff",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    color: "#1f2937",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    textAlign: "center",
    color: "#6b7280",
    marginBottom: 48,
  },
  form: {
    width: "100%",
  },
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  // New styles for password input with icon
  passwordInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    marginBottom: 16,
  },
  inputWithIcon: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
  },
  iconButton: {
    padding: 16,
  },
  authButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  authButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  disabledButton: {
    backgroundColor: "#9ca3af",
  },
  switchButton: {
    alignItems: "center",
  },
  switchText: {
    color: "#3b82f6",
    fontSize: 16,
  },
  disabledText: {
    color: "#9ca3af",
  },
});

export default LoginScreen;