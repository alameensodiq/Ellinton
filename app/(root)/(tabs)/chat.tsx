import { View, ActivityIndicator, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePreventScreenCapture } from "expo-screen-capture";
import { WebView } from "react-native-webview";
import { useRef, useState } from "react";

export default function ChatScreen() {
  const webviewRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatKey, setChatKey] = useState(1);

  // Use the direct chat URL instead of embed script
  const CHAT_URL = "https://tawk.to/chat/69cd682b6272c91c348cc16a/1jl55tqi6";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f0f0f0" }}>
      <View style={{ flex: 1 }}>
        {loading && (
          <View
            style={{
              position: "absolute",
              top: "50%",
              left: 0,
              right: 0,
              alignItems: "center",
              zIndex: 1,
              transform: [{ translateY: -50 }]
            }}
          >
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={{ marginTop: 10, color: "#666", fontSize: 14 }}>
              Loading chat...
            </Text>
          </View>
        )}

        {error && (
          <View
            style={{
              position: "absolute",
              top: "50%",
              left: 0,
              right: 0,
              alignItems: "center",
              zIndex: 1,
              transform: [{ translateY: -50 }]
            }}
          >
            <Text
              style={{
                color: "#f44336",
                fontSize: 14,
                textAlign: "center",
                padding: 20
              }}
            >
              {error}
            </Text>
          </View>
        )}

        <WebView
          key={chatKey}
          ref={webviewRef}
          source={{ uri: CHAT_URL }}
          style={{ flex: 1 }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          menuItems={[]}
          suppressContextMenu={true}
          originWhitelist={["*"]}
          allowsInlineMediaPlayback={true}
          onShouldStartLoadWithRequest={(request) => {
            if (request.url === "about:blank") {
              setChatKey((prev) => prev + 1);
              return false;
            }
            return true;
          }}
          onNavigationStateChange={(navState) => {
            if (navState.url === "about:blank") {
              setChatKey((prev) => prev + 1);
            }
          }}
          onLoadStart={() => {
            setLoading(true);
            setError(null);
          }}
          onLoadEnd={() => {
            setLoading(false);
          }}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error("WebView error:", nativeEvent);
            setError(
              "Failed to load chat. Please check your internet connection."
            );
            setLoading(false);
          }}
        />
      </View>
    </SafeAreaView>
  );
}
