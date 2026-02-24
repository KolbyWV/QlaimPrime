import React from "react";
import { Text } from "react-native";
import { useQuery } from "@apollo/client/react";

import { MY_MONEY_TRANSACTIONS_QUERY, MY_STARS_TRANSACTIONS_QUERY } from "../../graphql/domain";
import { useAppTheme } from "../../ui/theme";
import { Body, Card, Heading, LoadingState, Screen } from "../../ui/components";

export function WorkerWalletScreen() {
  const { theme } = useAppTheme();

  const {
    data: starsData,
    loading: starsLoading,
    error: starsError,
  } = useQuery(MY_STARS_TRANSACTIONS_QUERY, {
    variables: { limit: 25, offset: 0 },
  });

  const {
    data: moneyData,
    loading: moneyLoading,
    error: moneyError,
  } = useQuery(MY_MONEY_TRANSACTIONS_QUERY, {
    variables: { limit: 25, offset: 0 },
  });

  if (starsLoading || moneyLoading) {
    return (
      <Screen>
        <LoadingState label="Loading transactions..." />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Heading>Wallet</Heading>
      <Body style={{ marginBottom: 12 }}>Stars and money transaction feeds.</Body>

      {starsError ? <Text style={{ color: theme.colors.danger }}>{starsError.message}</Text> : null}
      {moneyError ? <Text style={{ color: theme.colors.danger }}>{moneyError.message}</Text> : null}

      <Card>
        <Heading style={{ fontSize: 20 }}>Stars</Heading>
        {(starsData?.myStarsTransactions || []).map((tx) => (
          <Body key={tx.id}>
            {tx.reason} · {tx.delta > 0 ? "+" : ""}
            {tx.delta}
          </Body>
        ))}
        {!starsData?.myStarsTransactions?.length ? <Body>No stars transactions.</Body> : null}
      </Card>

      <Card>
        <Heading style={{ fontSize: 20 }}>Money</Heading>
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
