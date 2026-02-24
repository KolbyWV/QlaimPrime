import "react-native-gesture-handler";
import React from "react";
import { Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ApolloProvider } from "@apollo/client/react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ThemeProvider, useAppTheme } from "./src/ui/theme";
import { SessionProvider, useSession } from "./src/auth/session";
import { RootNavigator } from "./src/navigation";
import { LoadingState, Screen } from "./src/ui/components";

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <View style={{ flex: 1, padding: 24, justifyContent: "center", backgroundColor: "#fff" }}>
        <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 10 }}>App failed to render</Text>
        <Text selectable>{String(this.state.error?.message || this.state.error)}</Text>
      </View>
    );
  }
}

function AppShell() {
  const { apolloClient } = useSession();
  const { themeMode } = useAppTheme();

  if (!apolloClient) {
    return (
      <Screen>
        <LoadingState label="Starting app..." />
      </Screen>
    );
  }

  return (
    <ApolloProvider client={apolloClient}>
      <StatusBar style={themeMode === "dark" ? "light" : "dark"} />
      <RootNavigator />
    </ApolloProvider>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppErrorBoundary>
            <SessionProvider>
              <AppShell />
            </SessionProvider>
          </AppErrorBoundary>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
