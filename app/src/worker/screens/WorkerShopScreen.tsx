import React, { useCallback, useMemo, useState } from "react";
import { RefreshControl, Text, View } from "react-native";
import { useMutation, useQuery } from "@apollo/client/react";
import { useFocusEffect } from "@react-navigation/native";

import { useSession } from "../../auth/session";
import {
  MY_PURCHASES_QUERY,
  PRODUCTS_QUERY,
  PURCHASE_PRODUCT_MUTATION,
} from "../../graphql/domain";
import { Body, Card, Heading, LoadingState, Screen, SearchInput, SectionTitle } from "../../ui/components";
import { ShopProductCard, UserSummaryCard } from "../../ui/domain";
import { useAppTheme } from "../../ui/theme";

function normalizeSearch(value) {
  return value.trim().toLowerCase();
}

function matchesProduct(product, search) {
  if (!search) {
    return true;
  }

  const combined = [product?.title, product?.subtitle, product?.category].filter(Boolean).join(" ").toLowerCase();
  return combined.includes(search);
}

export function WorkerShopScreen() {
  const { theme } = useAppTheme();
  const { me, refreshMe } = useSession();
  const shopLocked = true;
  const [search, setSearch] = useState("");
  const [operationError, setOperationError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: productsData,
    loading: productsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useQuery(PRODUCTS_QUERY, {
    variables: { limit: 50, offset: 0 },
  });

  const {
    data: purchasesData,
    loading: purchasesLoading,
    error: purchasesError,
    refetch: refetchPurchases,
  } = useQuery(MY_PURCHASES_QUERY, {
    variables: { limit: 50, offset: 0 },
  });

  const [purchaseProduct, { loading: purchasing }] = useMutation(PURCHASE_PRODUCT_MUTATION, {
    onCompleted: async () => {
      setOperationError(null);
      await Promise.all([refetchProducts(), refetchPurchases(), refreshMe()]);
    },
    onError: (nextError) => {
      setOperationError(nextError.message || "Unable to purchase item.");
    },
  });

  useFocusEffect(
    useCallback(() => {
      refreshMe().catch(() => {
        // Ignore focus-refresh failures; existing queries still render screen state.
      });
    }, [refreshMe]),
  );
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchProducts(), refetchPurchases(), refreshMe()]);
    } catch (nextError) {
      setOperationError(nextError?.message || "Unable to refresh Star Shop.");
    } finally {
      setRefreshing(false);
    }
  }, [refetchProducts, refetchPurchases, refreshMe]);

  const normalizedSearch = normalizeSearch(search);
  const products = useMemo(
    () => (productsData?.products || []).filter((product) => matchesProduct(product, normalizedSearch)),
    [productsData, normalizedSearch],
  );
  const ownedProductIds = useMemo(() => {
    const ids = new Set();
    (purchasesData?.myPurchases || []).forEach((purchase) => {
      if (purchase?.status === "ACTIVE" || purchase?.status === "CONSUMED") {
        ids.add(purchase.productId);
      }
    });
    return ids;
  }, [purchasesData]);

  const membershipProducts = products.filter((product) => product.category === "MEMBERSHIP_UPGRADE");
  const bonusProducts = products.filter((product) => product.category === "PAY_BONUS");

  if (productsLoading || purchasesLoading) {
    return (
      <Screen hideBack>
        <LoadingState label="Loading StarShop..." />
      </Screen>
    );
  }

  return (
    <Screen
      hideBack
      scroll
      contentStyle={{ paddingBottom: 130 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
        />
      }
    >
      <View style={{ position: "relative" }}>
        <View pointerEvents={shopLocked ? "none" : "auto"} style={shopLocked ? { opacity: 0.35 } : null}>
          <Heading style={{ fontSize: 32, marginBottom: 10 }}>STAR SHOP</Heading>
          <UserSummaryCard
            name={`${me?.profile?.firstName || ""} ${me?.profile?.lastName || ""}`.trim() || me?.email || "Profile"}
            username={me?.profile?.username || "username"}
            avatarUrl={me?.profile?.avatarUrl || ""}
            tier={me?.profile?.tier || "COPPER"}
            starsBalance={me?.profile?.starsBalance || 0}
            gigCount={me?.assignments?.length || 0}
            starsOnly
          />

          <SearchInput value={search} onChangeText={setSearch} placeholder="Search" />

          {productsError ? <Text style={{ color: theme.colors.danger }}>{productsError.message}</Text> : null}
          {purchasesError ? <Text style={{ color: theme.colors.danger }}>{purchasesError.message}</Text> : null}
          {operationError ? <Text style={{ color: theme.colors.danger }}>{operationError}</Text> : null}

          <SectionTitle>Membership upgrades</SectionTitle>
          {membershipProducts.map((product) => (
            <ShopProductCard
              key={product.id}
              product={product}
              variant="membership"
              onPurchase={() => purchaseProduct({ variables: { productId: product.id } })}
              loading={purchasing}
              owned={ownedProductIds.has(product.id)}
            />
          ))}
          {membershipProducts.length === 0 ? (
            <Card>
              <Body>No membership products found.</Body>
            </Card>
          ) : null}

          <SectionTitle style={{ marginTop: 8 }}>Cash bonuses</SectionTitle>
          {bonusProducts.map((product) => (
            <ShopProductCard
              key={product.id}
              product={product}
              variant="bonus"
              onPurchase={() => purchaseProduct({ variables: { productId: product.id } })}
              loading={purchasing}
              owned={ownedProductIds.has(product.id)}
            />
          ))}
          {bonusProducts.length === 0 ? (
            <Card>
              <Body>No bonus products found.</Body>
            </Card>
          ) : null}
        </View>

        {shopLocked ? (
          <View
            style={{
              position: "absolute",
              top: 180,
              left: 0,
              right: 0,
              alignItems: "center",
              paddingHorizontal: 12,
            }}
          >
            <Card style={{ width: "100%", maxWidth: 420, alignItems: "center", paddingVertical: 18 }}>
              <Heading style={{ fontSize: 26, marginBottom: 6 }}>Under Construction</Heading>
              <Body style={{ textAlign: "center", marginBottom: 0 }}>
                Star Shop purchases are temporarily locked while we finish updates.
              </Body>
            </Card>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
