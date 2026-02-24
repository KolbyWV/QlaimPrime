import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { createApolloClient } from "../../graphql/client";
import {
  LOGIN_MUTATION,
  LOGOUT_MUTATION,
  ME_QUERY,
  REGISTER_MUTATION,
} from "../../graphql/domain";
import {
  clearStoredTokens,
  readStoredMode,
  readStoredTokens,
  writeStoredMode,
  writeStoredTokens,
} from "./tokenStorage";

const SessionContext = createContext(null);

const EMPTY_TOKENS = {
  accessToken: null,
  refreshToken: null,
};

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
      await clearStoredTokens();
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

  const refreshMe = useCallback(async () => {
    const { data, errors } = await apolloClient.query({
      query: ME_QUERY,
      fetchPolicy: "network-only",
    });

    if (errors?.length) {
      throw new Error(errors[0].message || "Failed to load session user.");
    }

    setMe(data?.me || null);
    setStatus(data?.me ? "authenticated" : "anonymous");

    return data?.me || null;
  }, [apolloClient]);

  const signIn = useCallback(
    async ({ email, password }) => {
      const { data, errors } = await apolloClient.mutate({
        mutation: LOGIN_MUTATION,
        variables: {
          email: email.trim(),
          password,
        },
      });

      if (errors?.length) {
        throw new Error(errors[0].message || "Unable to sign in.");
      }

      const payload = data?.login;
      if (!payload?.accessToken || !payload?.refreshToken) {
        throw new Error("Login response did not include tokens.");
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

      if (!payload.user) {
        await refreshMe();
      }

      return payload.user || null;
    },
    [apolloClient, applyTokens, refreshMe],
  );

  const register = useCallback(
    async ({ email, password }) => {
      const { data, errors } = await apolloClient.mutate({
        mutation: REGISTER_MUTATION,
        variables: {
          email: email.trim(),
          password,
        },
      });

      if (errors?.length) {
        throw new Error(errors[0].message || "Unable to register.");
      }

      const payload = data?.register;
      if (!payload?.accessToken || !payload?.refreshToken) {
        throw new Error("Registration response did not include tokens.");
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
    setMode(normalized);
    await writeStoredMode(normalized);
  }, []);

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

        setMode(storedMode === "worker" || storedMode === "company" ? storedMode : null);

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
