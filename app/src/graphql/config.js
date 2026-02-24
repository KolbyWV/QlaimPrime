import { Platform } from "react-native";

const fallbackHost = Platform.OS === "android" ? "http://localhost:4000/graphql" : "http://localhost:4000/graphql";

export const GRAPHQL_URL = process.env.EXPO_PUBLIC_GRAPHQL_URL || fallbackHost;
