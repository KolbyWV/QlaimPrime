import React, { useCallback, useState } from "react";
import { RefreshControl, Text } from "react-native";
import { useQuery } from "@apollo/client/react";

import {
  MY_MONEY_TRANSACTIONS_QUERY,
  MY_STARS_TRANSACTIONS_QUERY,
} from "../../graphql/domain";
import { Body, Card, Heading, LoadingState, Screen, SectionTitle } from "../../ui/components";
import { useAppTheme } from "../../ui/theme";

export function WorkerWalletScreen() {
  const { theme } = useAppTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState(null);

  const {
    data: starsData,
    loading: starsLoading,
    error: starsError,
    refetch: refetchStars,
  } = useQuery(MY_STARS_TRANSACTIONS_QUERY, {
    variables: { limit: 50, offset: 0 },
  });

  const {
    data: moneyData,
    loading: moneyLoading,
    error: moneyError,
    refetch: refetchMoney,
  } = useQuery(MY_MONEY_TRANSACTIONS_QUERY, {
    variables: { limit: 50, offset: 0 },
  });
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      setRefreshError(null);
      await Promise.all([refetchStars(), refetchMoney()]);
    } catch (nextError) {
      setRefreshError(nextError?.message || "Unable to refresh transactions.");
    } finally {
      setRefreshing(false);
    }
  }, [refetchMoney, refetchStars]);

  if (starsLoading || moneyLoading) {
    return (
      <Screen>
        <LoadingState label="Loading transactions..." />
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      contentStyle={{ paddingBottom: 40 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
        />
      }
    >
      <Heading>Transactions</Heading>
      {starsError ? <Text style={{ color: theme.colors.danger }}>{starsError.message}</Text> : null}
      {moneyError ? <Text style={{ color: theme.colors.danger }}>{moneyError.message}</Text> : null}
      {refreshError ? <Text style={{ color: theme.colors.danger }}>{refreshError}</Text> : null}

      <SectionTitle>Stars</SectionTitle>
      <Card>
        {(starsData?.myStarsTransactions || []).map((tx) => (
          <Body key={tx.id}>
            {tx.reason} · {tx.delta > 0 ? "+" : ""}
            {tx.delta}
          </Body>
        ))}
        {!starsData?.myStarsTransactions?.length ? <Body>No stars transactions.</Body> : null}
      </Card>

      <SectionTitle>Money</SectionTitle>
      <Card>
        {(moneyData?.myMoneyTransactions || []).map((tx) => (
          <Body key={tx.id}>
            {tx.reason} · ${((tx.amountCents || 0) / 100).toFixed(2)}
          </Body>
        ))}
        {!moneyData?.myMoneyTransactions?.length ? <Body>No money transactions.</Body> : null}
      </Card>
    </Screen>
  );
}
