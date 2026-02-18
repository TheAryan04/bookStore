import { Link } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { useAuthStore } from "../store/authStore";
import { useEffect } from "react";

export default function Index() {
  // subscribe ONLY to state (not actions)
  const {user, logout} = useAuthStore();

  useEffect(() => {
    useAuthStore.getState().checkAuth();
  }, []);


  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>
        {user?.username ? `hello ${user?.username}` : "hello Guest"}
      </Text>

      <TouchableOpacity onPress={logout}>
        <Text>Logout</Text>
      </TouchableOpacity>

      <Link href="/(auth)/signup">Signup</Link>
      <Link href="/(auth)">Login</Link>
    </View>
  );
}

