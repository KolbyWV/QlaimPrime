import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  from,
} from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { setContext } from "@apollo/client/link/context";
import { fromPromise } from "@apollo/client/link/utils";
import { print } from "graphql";

import { GRAPHQL_URL } from "./config";
import { REFRESH_TOKEN_MUTATION } from "./domain/auth";

const refreshMutation = print(REFRESH_TOKEN_MUTATION);
const ACCESS_TOKEN_REFRESH_SKEW_MS = 30 * 1000;

function decodeBase64(value) {
  if (typeof atob === "function") {
    return atob(value);
  }
  if (typeof globalThis?.Buffer?.from === "function") {
    return globalThis.Buffer.from(value, "base64").toString("utf-8");
  }
  throw new Error("No base64 decoder available.");
}

function getAccessTokenExpiryMs(token) {
  if (!token || typeof token !== "string") {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  try {
    const payload = JSON.parse(
      decodeBase64(parts[1].replace(/-/g, "+").replace(/_/g, "/")),
    );
    if (!Number.isFinite(payload?.exp)) {
      return null;
    }
    return payload.exp * 1000;
  } catch {
    return null;
  }
}

function isAccessTokenStale(token) {
  const expiryMs = getAccessTokenExpiryMs(token);
  if (!expiryMs) {
    return false;
  }
  return Date.now() >= expiryMs - ACCESS_TOKEN_REFRESH_SKEW_MS;
}

function isUnauthorized(graphQLErrors = [], networkError) {
  const hasGraphQlAuthError = graphQLErrors.some((error) => {
    const code = error?.extensions?.code;
    const message = String(error?.message || "").toLowerCase();

    return (
      code === "UNAUTH" ||
      code === "UNAUTHORIZED" ||
      code === "UNAUTHENTICATED" ||
      message.includes("unauthorized") ||
      message.includes("unauth")
    );
  });

  const statusCode = networkError?.statusCode || networkError?.status;

  return hasGraphQlAuthError || statusCode === 401;
}

export function createApolloClient({
  tokenManager,
  graphqlUrl = GRAPHQL_URL,
}) {
  let refreshing = false;
  let refreshQueue = [];

  const resolveRefreshQueue = () => {
    refreshQueue.forEach((entry) => entry.resolve());
    refreshQueue = [];
  };

  const rejectRefreshQueue = (error) => {
    refreshQueue.forEach((entry) => entry.reject(error));
    refreshQueue = [];
  };

  const queueRefresh = () =>
    new Promise((resolve, reject) => {
      refreshQueue.push({ resolve, reject });
    });

  const refreshAccessToken = async () => {
    const currentRefreshToken = await tokenManager.getRefreshToken();

    if (!currentRefreshToken) {
      throw new Error("No refresh token available.");
    }

    const response = await fetch(graphqlUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        query: refreshMutation,
        variables: {
          refreshToken: currentRefreshToken,
        },
      }),
    });

    let payload;
    try {
      payload = await response.json();
    } catch {
      throw new Error("Refresh token response was not valid JSON.");
    }

    if (!response.ok || payload?.errors?.length) {
      const message = payload?.errors?.[0]?.message || "Refresh token request failed.";
      throw new Error(message);
    }

    const refreshed = payload?.data?.refreshToken;

    if (!refreshed?.accessToken || !refreshed?.refreshToken) {
      throw new Error("Refresh token response is missing new tokens.");
    }

    await tokenManager.setTokens({
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
    });

    return refreshed.accessToken;
  };

  const refreshAccessTokenWithLock = async () => {
    if (refreshing) {
      await queueRefresh();
      const tokenAfterRefresh = await tokenManager.getAccessToken();
      if (!tokenAfterRefresh) {
        throw new Error("Refresh completed without an access token.");
      }
      return tokenAfterRefresh;
    }

    refreshing = true;
    try {
      const newAccessToken = await refreshAccessToken();
      resolveRefreshQueue();
      return newAccessToken;
    } catch (error) {
      rejectRefreshQueue(error);
      await tokenManager.handleRefreshFailure(error);
      throw error;
    } finally {
      refreshing = false;
    }
  };

  const authLink = setContext(async (operation, { headers }) => {
    let accessToken = await tokenManager.getAccessToken();

    if (accessToken && isAccessTokenStale(accessToken)) {
      try {
        accessToken = await refreshAccessTokenWithLock();
      } catch {
        accessToken = null;
      }
    }

    const extraHeaders = {};
    if (operation.operationName === "RefreshToken") {
      const refreshToken = await tokenManager.getRefreshToken();
      extraHeaders["x-refresh-token"] = refreshToken || "";
    }

    return {
      headers: {
        ...headers,
        authorization: accessToken ? `Bearer ${accessToken}` : "",
        ...extraHeaders,
      },
    };
  });

  const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
    if (
      !isUnauthorized(graphQLErrors, networkError) ||
      operation.operationName === "RefreshToken" ||
      operation.getContext()._retry
    ) {
      return;
    }

    if (refreshing) {
      return fromPromise(queueRefresh())
        .flatMap(() => {
          operation.setContext({ _retry: true });
          return forward(operation);
        });
    }

    return fromPromise(
      refreshAccessTokenWithLock()
        .then((newAccessToken) => {
          return newAccessToken;
        })
    ).flatMap((newAccessToken) => {
      operation.setContext(({ headers = {} }) => ({
        headers: {
          ...headers,
          authorization: `Bearer ${newAccessToken}`,
        },
        _retry: true,
      }));

      return forward(operation);
    });
  });

  const httpLink = new HttpLink({ uri: graphqlUrl });

  return new ApolloClient({
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            gigs: {
              // We always replace these lists from network responses (no cursor merge).
              merge: false,
            },
            myWatchlist: {
              merge: false,
            },
            myAssignments: {
              merge: false,
            },
            myStarsTransactions: {
              merge: false,
            },
            myMoneyTransactions: {
              merge: false,
            },
            starsTransactions: {
              merge: false,
            },
            moneyTransactions: {
              merge: false,
            },
          },
        },
        Gig: {
          fields: {
            watchlistEntries: {
              merge: false,
            },
          },
        },
      },
    }),
    link: from([errorLink, authLink, httpLink]),
    connectToDevTools: __DEV__,
    defaultOptions: {
      watchQuery: {
        fetchPolicy: "cache-and-network",
        errorPolicy: "all",
      },
      query: {
        fetchPolicy: "network-only",
        errorPolicy: "all",
      },
      mutate: {
        errorPolicy: "all",
      },
    },
  });
}
