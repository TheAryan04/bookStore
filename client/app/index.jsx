import { Link } from "expo-router";
import { Text, View } from "react-native";
import { useAuthStore } from "../store/authStore";
import { useEffect } from "react";

export default function Index() {
  const { user, token, checkAuth } = useAuthStore((state) => ({
    user: state.user,
    token: state.token,
    checkAuth: state.checkAuth,
  }));

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>
        {user?.username ? `hello ${user.username}` : "hello Guest"}
      </Text>

      <Link href="/(auth)/signup">Signup</Link>
      <Link href="/(auth)">Login</Link>
    </View>
  );
}

