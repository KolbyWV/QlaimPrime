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

  const authLink = setContext(async (_, { headers }) => {
    const accessToken = await tokenManager.getAccessToken();
    const refreshToken = await tokenManager.getRefreshToken();

    return {
      headers: {
        ...headers,
        authorization: accessToken ? `Bearer ${accessToken}` : "",
        "x-refresh-token": refreshToken || "",
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

    refreshing = true;

    return fromPromise(
      refreshAccessToken()
        .then((newAccessToken) => {
          resolveRefreshQueue();
          return newAccessToken;
        })
        .catch(async (error) => {
          rejectRefreshQueue(error);
          await tokenManager.handleRefreshFailure(error);
          throw error;
        })
        .finally(() => {
          refreshing = false;
        }),
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
    cache: new InMemoryCache(),
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
