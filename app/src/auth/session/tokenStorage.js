import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "prime.accessToken";
const REFRESH_TOKEN_KEY = "prime.refreshToken";
const MODE_KEY = "prime.mode";

const memoryStore = {};

function canUseWebStorage() {
  try {
    return Platform.OS === "web" && typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
}

async function readItem(key) {
  if (Platform.OS === "web") {
    if (canUseWebStorage()) {
      return window.localStorage.getItem(key);
    }
    return memoryStore[key] || null;
  }

  return SecureStore.getItemAsync(key);
}

async function writeItem(key, value) {
  if (value === null || value === undefined || value === "") {
    return deleteItem(key);
  }

  if (Platform.OS === "web") {
    if (canUseWebStorage()) {
      window.localStorage.setItem(key, value);
      return;
    }

    memoryStore[key] = value;
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

async function deleteItem(key) {
  if (Platform.OS === "web") {
    if (canUseWebStorage()) {
      window.localStorage.removeItem(key);
      return;
    }

    delete memoryStore[key];
    return;
  }

  await SecureStore.deleteItemAsync(key);
}

export async function readStoredTokens() {
  const [accessToken, refreshToken] = await Promise.all([
    readItem(ACCESS_TOKEN_KEY),
    readItem(REFRESH_TOKEN_KEY),
  ]);

  return {
    accessToken: accessToken || null,
    refreshToken: refreshToken || null,
  };
}

export async function writeStoredTokens({ accessToken, refreshToken }) {
  await Promise.all([
    writeItem(ACCESS_TOKEN_KEY, accessToken || null),
    writeItem(REFRESH_TOKEN_KEY, refreshToken || null),
  ]);
}

export async function clearStoredTokens() {
  await Promise.all([deleteItem(ACCESS_TOKEN_KEY), deleteItem(REFRESH_TOKEN_KEY)]);
}

export async function readStoredMode() {
  return readItem(MODE_KEY);
}

export async function writeStoredMode(mode) {
  await writeItem(MODE_KEY, mode || null);
}

export async function clearStoredMode() {
  await deleteItem(MODE_KEY);
}
