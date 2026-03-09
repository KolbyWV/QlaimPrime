import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Alert, Platform } from "react-native";

import { createApolloClient } from "../../graphql/client";
import { GRAPHQL_URL } from "../../graphql/config";
import {
  LOGIN_MUTATION,
  LOGOUT_MUTATION,
  ME_QUERY,
  REGISTER_MUTATION,
} from "../../graphql/domain";
import {
  clearStoredTokens,
  clearStoredTier,
  readStoredMode,
  readStoredTier,
  readStoredTokens,
  writeStoredMode,
  writeStoredTier,
  writeStoredTokens,
} from "./tokenStorage";

const SessionContext = createContext(null);

const EMPTY_TOKENS = {
  accessToken: null,
  refreshToken: null,
};
const TIER_ORDER = ["COPPER", "BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND"];

function tierRank(tier) {
  return TIER_ORDER.indexOf(tier);
}

function normalizeAuthErrorMessage(raw, fallback) {
  const message = String(raw || "").trim();
  if (!message) return fallback;

  const lower = message.toLowerCase();
  if (
    lower.includes("invalid `prisma.") ||
    lower.includes("database is offline") ||
    lower.includes("can't reach database server") ||
    lower.includes("connection refused") ||
    lower.includes("failed to connect") ||
    lower.includes("eperm")
  ) {
    return "Authentication is temporarily unavailable. Please try again shortly.";
  }
  if (lower.includes("too many attempts") || lower.includes("status code 429")) {
    return "Too many attempts right now. Please wait 15 minutes and try again.";
  }
  if (lower.includes("network") || lower.includes("failed to fetch")) {
    return "Network issue while contacting the server. Check connection and try again.";
  }
  return message;
}

function missingTokenMessage(action) {
  const base =
    action === "register"
      ? "Account was created, but the server did not return session tokens."
      : "Sign-in succeeded, but the server did not return session tokens.";

  if (__DEV__) {
    return `${base} Check GraphQL endpoint: ${GRAPHQL_URL}`;
  }
  return `${base} Please try again.`;
}

export function SessionProvider({ children }) {
  const tokensRef = useRef(EMPTY_TOKENS);
  const [tokens, setTokens] = useState(EMPTY_TOKENS);
  const [status, setStatus] = useState("booting");
  const [me, setMe] = useState(null);
  const [mode, setMode] = useState(null);

  const applyTokens = useCallback(async (nextTokens, { persist = true } = {}) => {
    const normalized = {
      accessToken: nextTokens?.accessToken || null,
      refreshToken: nextTokens?.refreshToken || null,
    };

    tokensRef.current = normalized;
    setTokens(normalized);

    if (persist) {
      await writeStoredTokens(normalized);
    }
  }, []);

  const clearSession = useCallback(async ({ persist = true } = {}) => {
    tokensRef.current = EMPTY_TOKENS;
    setTokens(EMPTY_TOKENS);
    setMe(null);
    setStatus("anonymous");

    if (persist) {
      await Promise.all([clearStoredTokens(), clearStoredTier()]);
    }
  }, []);

  const apolloClient = useMemo(() => {
    return createApolloClient({
      tokenManager: {
        getAccessToken: async () => tokensRef.current.accessToken,
        getRefreshToken: async () => tokensRef.current.refreshToken,
        setTokens: async (nextTokens) => {
          await applyTokens(nextTokens, { persist: true });
        },
        handleRefreshFailure: async () => {
          await clearSession({ persist: true });
        },
      },
    });
  }, [applyTokens, clearSession]);

  const maybeNotifyTierUpgrade = useCallback(async (nextMe) => {
    const nextTier = nextMe?.profile?.tier;
    if (!nextTier) return;

    const previousTier = await readStoredTier();
    await writeStoredTier(nextTier);

    if (!previousTier) return;
    if (tierRank(nextTier) <= tierRank(previousTier)) return;

    const message = `You have been upgraded from ${previousTier} to ${nextTier}.`;
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && typeof window.alert === "function") {
        window.alert(message);
      }
      return;
    }
    Alert.alert("Tier Upgraded", message);
  }, []);

  const refreshMe = useCallback(async () => {
    const { data, errors } = await apolloClient.query({
      query: ME_QUERY,
      fetchPolicy: "network-only",
    });

    if (errors?.length) {
      throw new Error(errors[0].message || "Failed to load session user.");
    }

    const nextMe = data?.me || null;
    setMe(nextMe);
    setStatus(nextMe ? "authenticated" : "anonymous");

    if (nextMe?.profile?.tier) {
      await maybeNotifyTierUpgrade(nextMe);
    }

    return nextMe;
  }, [apolloClient, maybeNotifyTierUpgrade]);

  const signIn = useCallback(
    async ({ email, password }) => {
      let data;
      let errors;
      try {
        const result = await apolloClient.mutate({
          mutation: LOGIN_MUTATION,
          variables: {
            email: email.trim(),
            password,
          },
        });
        data = result?.data;
        errors = result?.errors;
      } catch (error) {
        throw new Error(
          normalizeAuthErrorMessage(error?.message, "Unable to sign in."),
        );
      }

      if (errors?.length) {
        throw new Error(
          normalizeAuthErrorMessage(errors[0].message, "Unable to sign in."),
        );
      }

      const payload = data?.login;
      if (!payload?.accessToken || !payload?.refreshToken) {
        throw new Error(
          normalizeAuthErrorMessage(missingTokenMessage("login"), "Unable to sign in."),
        );
      }

      await applyTokens(
        {
          accessToken: payload.accessToken,
          refreshToken: payload.refreshToken,
        },
        { persist: true },
      );

      setMe(payload.user || null);
      setStatus("authenticated");
      if (payload.user?.profile?.tier) {
        await writeStoredTier(payload.user.profile.tier);
      }

      if (!payload.user) {
        await refreshMe();
      }

      return payload.user || null;
    },
    [apolloClient, applyTokens, refreshMe],
  );

  const register = useCallback(
    async ({ email, password }) => {
      let data;
      let errors;
      try {
        const result = await apolloClient.mutate({
          mutation: REGISTER_MUTATION,
          variables: {
            email: email.trim(),
            password,
          },
        });
        data = result?.data;
        errors = result?.errors;
      } catch (error) {
        throw new Error(
          normalizeAuthErrorMessage(error?.message, "Unable to create account."),
        );
      }

      if (errors?.length) {
        throw new Error(
          normalizeAuthErrorMessage(errors[0].message, "Unable to create account."),
        );
      }

      let payload = data?.register || null;
      if (!payload?.accessToken || !payload?.refreshToken) {
        // Fallback: account may have been created even if register response payload is incomplete.
        const loginResult = await apolloClient.mutate({
          mutation: LOGIN_MUTATION,
          variables: {
            email: email.trim(),
            password,
          },
        });

        if (loginResult?.errors?.length) {
          throw new Error(
            normalizeAuthErrorMessage(
              loginResult.errors[0].message,
              "Account created, but sign-in did not start automatically. Please sign in.",
            ),
          );
        }

        payload = loginResult?.data?.login || null;
      }

      if (!payload?.accessToken || !payload?.refreshToken) {
        throw new Error(
          missingTokenMessage("register"),
        );
      }

      await applyTokens(
        {
          accessToken: payload.accessToken,
          refreshToken: payload.refreshToken,
        },
        { persist: true },
      );

      setMe(payload.user || null);
      setStatus("authenticated");
      if (payload.user?.profile?.tier) {
        await writeStoredTier(payload.user.profile.tier);
      }

      if (!payload.user) {
        await refreshMe();
      }

      return payload.user || null;
    },
    [apolloClient, applyTokens, refreshMe],
  );

  const signOut = useCallback(async () => {
    const refreshToken = tokensRef.current.refreshToken;

    try {
      if (refreshToken) {
        await apolloClient.mutate({
          mutation: LOGOUT_MUTATION,
          variables: { refreshToken },
        });
      }
    } catch {
      // A local clear is still safe if remote revocation fails.
    }

    await clearSession({ persist: true });
  }, [apolloClient, clearSession]);

  const switchMode = useCallback(async (nextMode) => {
    const normalized = nextMode || null;

    if (normalized === "admin" && tokensRef.current.accessToken) {
      try {
        // Ensure role changes made server-side are visible before admin route gating.
        await refreshMe();
      } catch {
        // Ignore refresh failures here; route-level guards still apply.
      }
    }

    setMode(normalized);
    await writeStoredMode(normalized);
  }, [refreshMe]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setStatus("booting");

      try {
        const [storedMode, storedTokens] = await Promise.all([
          readStoredMode(),
          readStoredTokens(),
        ]);

        if (cancelled) {
          return;
        }

        setMode(
          storedMode === "worker" || storedMode === "company" || storedMode === "admin"
            ? storedMode
            : null,
        );

        await applyTokens(storedTokens, { persist: false });

        if (!storedTokens.accessToken) {
          if (!cancelled) {
            setStatus("anonymous");
          }
          return;
        }

        await refreshMe();
      } catch {
        if (!cancelled) {
          await clearSession({ persist: true });
        }
      } finally {
        if (!cancelled) {
          setStatus((current) => (current === "booting" ? "anonymous" : current));
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [applyTokens, clearSession, refreshMe]);

  const value = useMemo(
    () => ({
      apolloClient,
      status,
      me,
      mode,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      signIn,
      register,
      signOut,
      switchMode,
      refreshMe,
    }),
    [apolloClient, status, me, mode, tokens, signIn, register, signOut, switchMode, refreshMe],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error("useSession must be used inside SessionProvider.");
  }

  return context;
}
