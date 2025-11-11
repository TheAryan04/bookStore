import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>hello everyone, 123</Text>

      <Link href="/(auth)/signup">Signup</Link>
      <Link href="/(auth)/">Login</Link>
    </View>
  );
}
