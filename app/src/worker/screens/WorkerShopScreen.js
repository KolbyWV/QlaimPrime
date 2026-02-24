import React from "react";
import { Text } from "react-native";
import { useMutation, useQuery } from "@apollo/client/react";

import { MY_PURCHASES_QUERY, PRODUCTS_QUERY, PURCHASE_PRODUCT_MUTATION } from "../../graphql/domain";
import { useAppTheme } from "../../ui/theme";
import { Body, Button, Card, Heading, LoadingState, Screen } from "../../ui/components";

export function WorkerShopScreen() {
  const { theme } = useAppTheme();

  const {
    data: productsData,
    loading: productsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useQuery(PRODUCTS_QUERY, {
    variables: { limit: 30, offset: 0 },
  });

  const {
    data: purchasesData,
    loading: purchasesLoading,
    error: purchasesError,
    refetch: refetchPurchases,
  } = useQuery(MY_PURCHASES_QUERY, {
    variables: { limit: 30, offset: 0 },
  });

  const [purchaseProduct, { loading: purchasing }] = useMutation(PURCHASE_PRODUCT_MUTATION, {
    onCompleted: () => {
      refetchProducts();
      refetchPurchases();
    },
  });

  if (productsLoading || purchasesLoading) {
    return (
      <Screen>
        <LoadingState label="Loading shop..." />
      </Screen>
    );
  }

  const products = productsData?.products || [];
  const purchases = purchasesData?.myPurchases || [];

  return (
    <Screen scroll>
      <Heading>Star Market</Heading>
      <Body style={{ marginBottom: 12 }}>Products and purchases from schema-backed operations.</Body>

      {productsError ? <Text style={{ color: theme.colors.danger }}>{productsError.message}</Text> : null}
      {purchasesError ? <Text style={{ color: theme.colors.danger }}>{purchasesError.message}</Text> : null}

      <Card>
        <Heading style={{ fontSize: 20 }}>My purchases</Heading>
        {purchases.length === 0 ? <Body>No purchases yet.</Body> : null}
        {purchases.map((purchase) => (
          <Body key={purchase.id}>
            {purchase.product?.title || "Unknown"} · {purchase.status}
          </Body>
        ))}
      </Card>

      {products.map((product) => (
        <Card key={product.id}>
          <Heading style={{ fontSize: 19 }}>{product.title}</Heading>
          <Body>{product.subtitle || "No subtitle"}</Body>
          <Body>{product.starsCost || 0} stars</Body>
          <Button
            label="Purchase"
            onPress={() => purchaseProduct({ variables: { productId: product.id } })}
            loading={purchasing}
          />
        </Card>
      ))}
    </Screen>
  );
}
