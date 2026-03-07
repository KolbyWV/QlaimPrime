import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";

import { useSession } from "../auth/session";
import { AdminDashboardScreen } from "../admin/screens/AdminDashboardScreen";
import { ModeResetScreen } from "../auth/screens/ModeResetScreen";
import { ModeSelectScreen } from "../auth/screens/ModeSelectScreen";
import { ForgotPasswordScreen } from "../auth/screens/ForgotPasswordScreen";
import { RegisterScreen } from "../auth/screens/RegisterScreen";
import { SignInScreen } from "../auth/screens/SignInScreen";
import { useAppTheme } from "../ui/theme";
import { Body, Button, Heading, LoadingState, Screen } from "../ui/components";
import { CompanyAccountScreen } from "../company/screens/CompanyAccountScreen";
import { CompanyCreateGigScreen } from "../company/screens/CompanyCreateGigScreen";
import { CompanyCreateLocationScreen } from "../company/screens/CompanyCreateLocationScreen";
import { CompanyDashboardScreen } from "../company/screens/CompanyDashboardScreen";
import { CompanyGigsScreen } from "../company/screens/CompanyGigsScreen";
import { CompanyMembersScreen } from "../company/screens/CompanyMembersScreen";
import { CompanyOnboardingScreen } from "../company/screens/CompanyOnboardingScreen";
import { CompanyReviewsScreen } from "../company/screens/CompanyReviewsScreen";
import { WorkerAccountScreen } from "../worker/screens/WorkerAccountScreen";
import { WorkerAssignmentsScreen } from "../worker/screens/WorkerAssignmentsScreen";
import { WorkerGigDetailScreen } from "../worker/screens/WorkerGigDetailScreen";
import { WorkerHomeScreen } from "../worker/screens/WorkerHomeScreen";
import { WorkerOnboardingScreen } from "../worker/screens/WorkerOnboardingScreen";
import { WorkerPastAssignmentsScreen } from "../worker/screens/WorkerPastAssignmentsScreen";
import { WorkerShopScreen } from "../worker/screens/WorkerShopScreen";
import { WorkerWalletScreen } from "../worker/screens/WorkerWalletScreen";

const AuthStack = createNativeStackNavigator();
const AdminAuthStack = createNativeStackNavigator();
const ModeStack = createNativeStackNavigator();
const WorkerOnboardingStack = createNativeStackNavigator();
const WorkerHomeStack = createNativeStackNavigator();
const WorkerAccountStack = createNativeStackNavigator();
const CompanyOnboardingStack = createNativeStackNavigator();
const CompanyDashboardStack = createNativeStackNavigator();
const CompanyGigsStack = createNativeStackNavigator();
const AdminStack = createNativeStackNavigator();
const WorkerTabs = createBottomTabNavigator();
const CompanyTabs = createBottomTabNavigator();

function ModeNavigator() {
  return (
    <ModeStack.Navigator screenOptions={{ headerShown: false }}>
      <ModeStack.Screen
        name="ModeSelect"
        component={ModeSelectScreen}
      />
    </ModeStack.Navigator>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="SignIn" component={SignInScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
      />
      <AuthStack.Screen
        name="ModeReset"
        component={ModeResetScreen}
        options={{ presentation: "modal" }}
      />
    </AuthStack.Navigator>
  );
}

function AdminAuthNavigator() {
  return (
    <AdminAuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AdminAuthStack.Screen
        name="SignIn"
        component={SignInScreen}
        initialParams={{ hideSignUp: true }}
      />
      <AdminAuthStack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
      />
      <AdminAuthStack.Screen
        name="ModeReset"
        component={ModeResetScreen}
        options={{ presentation: "modal" }}
      />
    </AdminAuthStack.Navigator>
  );
}

function WorkerOnboardingNavigator() {
  return (
    <WorkerOnboardingStack.Navigator screenOptions={{ headerShown: false }}>
      <WorkerOnboardingStack.Screen
        name="ProfileSetup"
        component={WorkerOnboardingScreen}
      />
    </WorkerOnboardingStack.Navigator>
  );
}

function CompanyOnboardingNavigator() {
  return (
    <CompanyOnboardingStack.Navigator screenOptions={{ headerShown: false }}>
      <CompanyOnboardingStack.Screen
        name="CompanySetup"
        component={CompanyOnboardingScreen}
      />
    </CompanyOnboardingStack.Navigator>
  );
}

function CompanyDashboardNavigator() {
  return (
    <CompanyDashboardStack.Navigator screenOptions={{ headerShown: false }}>
      <CompanyDashboardStack.Screen
        name="CompanyDashboardHome"
        component={CompanyDashboardScreen}
      />
      <CompanyDashboardStack.Screen
        name="CreateGig"
        component={CompanyCreateGigScreen}
      />
      <CompanyDashboardStack.Screen
        name="CreateLocation"
        component={CompanyCreateLocationScreen}
      />
    </CompanyDashboardStack.Navigator>
  );
}

function CompanyGigsNavigator() {
  return (
    <CompanyGigsStack.Navigator screenOptions={{ headerShown: false }}>
      <CompanyGigsStack.Screen
        name="CompanyGigsList"
        component={CompanyGigsScreen}
      />
    </CompanyGigsStack.Navigator>
  );
}

function WorkerHomeNavigator() {
  return (
    <WorkerHomeStack.Navigator screenOptions={{ headerShown: false }}>
      <WorkerHomeStack.Screen
        name="HomeFeed"
        component={WorkerHomeScreen}
      />
      <WorkerHomeStack.Screen
        name="GigDetails"
        component={WorkerGigDetailScreen}
      />
    </WorkerHomeStack.Navigator>
  );
}

function WorkerAccountNavigator() {
  return (
    <WorkerAccountStack.Navigator screenOptions={{ headerShown: false }}>
      <WorkerAccountStack.Screen
        name="AccountHome"
        component={WorkerAccountScreen}
      />
      <WorkerAccountStack.Screen
        name="PastAssignments"
        component={WorkerPastAssignmentsScreen}
      />
      <WorkerAccountStack.Screen
        name="Transactions"
        component={WorkerWalletScreen}
      />
    </WorkerAccountStack.Navigator>
  );
}

function WorkerTabsNavigator() {
  const { theme } = useAppTheme();
  const isWeb = Platform.OS === "web";

  return (
    <WorkerTabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: isWeb,
        tabBarLabelStyle: {
          fontSize: isWeb ? 14 : 12,
          lineHeight: isWeb ? 18 : 16,
          fontWeight: "700",
          marginBottom: isWeb ? 4 : 0,
        },
        tabBarActiveTintColor: isWeb ? theme.colors.strongSurfaceText : theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.text,
        tabBarStyle: {
          height: isWeb ? 78 : 70,
          borderTopWidth: 0,
          borderRadius: 999,
          marginHorizontal: isWeb ? 20 : 14,
          marginBottom: isWeb ? 14 : 8,
          paddingTop: isWeb ? 8 : 6,
          paddingBottom: isWeb ? 0 : 4,
          backgroundColor: theme.colors.surfaceAlt,
          position: "absolute",
        },
        tabBarItemStyle: {
          marginHorizontal: isWeb ? 6 : 4,
          borderRadius: isWeb ? 999 : theme.radii.md,
          overflow: isWeb ? "hidden" : "visible",
          paddingVertical: isWeb ? 0 : 2,
        },
        tabBarActiveBackgroundColor: isWeb ? theme.colors.primary : "transparent",
        tabBarIcon: ({ color, size }) => {
          const iconName = (() => {
            if (route.name === "Home") return "home";
            if (route.name === "Watchlist") return "heart";
            if (route.name === "Shop") return "star";
            return "person";
          })();
          return <Ionicons name={iconName} size={size || 20} color={color} />;
        },
      })}
    >
      <WorkerTabs.Screen name="Home" component={WorkerHomeNavigator} />
      <WorkerTabs.Screen name="Watchlist" component={WorkerAssignmentsScreen} />
      <WorkerTabs.Screen name="Shop" component={WorkerShopScreen} />
      <WorkerTabs.Screen name="Profile" component={WorkerAccountNavigator} />
    </WorkerTabs.Navigator>
  );
}

function CompanyTabsNavigator() {
  const { theme } = useAppTheme();
  const isWeb = Platform.OS === "web";

  return (
    <CompanyTabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: isWeb,
        tabBarLabelStyle: {
          fontSize: isWeb ? 14 : 12,
          lineHeight: isWeb ? 18 : 16,
          fontWeight: "700",
          marginBottom: isWeb ? 4 : 0,
        },
        tabBarActiveTintColor: isWeb ? theme.colors.strongSurfaceText : theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.text,
        tabBarStyle: {
          height: isWeb ? 78 : 70,
          borderTopWidth: 0,
          borderRadius: 999,
          marginHorizontal: isWeb ? 20 : 14,
          marginBottom: isWeb ? 14 : 8,
          paddingTop: isWeb ? 8 : 6,
          paddingBottom: isWeb ? 0 : 4,
          backgroundColor: theme.colors.surfaceAlt,
          position: "absolute",
        },
        tabBarItemStyle: {
          marginHorizontal: isWeb ? 6 : 4,
          borderRadius: isWeb ? 999 : theme.radii.md,
          overflow: isWeb ? "hidden" : "visible",
          paddingVertical: isWeb ? 0 : 2,
        },
        tabBarActiveBackgroundColor: isWeb ? theme.colors.primary : "transparent",
        tabBarIcon: ({ color, size }) => {
          const iconName = (() => {
            if (route.name === "Dashboard") return "home";
            if (route.name === "Gigs") return "briefcase";
            if (route.name === "Members") return "people";
            if (route.name === "Reviews") return "chatbubble-ellipses";
            return "person";
          })();
          return <Ionicons name={iconName} size={size || 20} color={color} />;
        },
      })}
    >
      <CompanyTabs.Screen name="Dashboard" component={CompanyDashboardNavigator} />
      <CompanyTabs.Screen name="Gigs" component={CompanyGigsNavigator} />
      <CompanyTabs.Screen name="Members" component={CompanyMembersScreen} />
      <CompanyTabs.Screen name="Reviews" component={CompanyReviewsScreen} />
      <CompanyTabs.Screen name="Account" component={CompanyAccountScreen} />
    </CompanyTabs.Navigator>
  );
}

function AdminNavigator() {
  return (
    <AdminStack.Navigator screenOptions={{ headerShown: false }}>
      <AdminStack.Screen
        name="AdminHome"
        component={AdminDashboardScreen}
      />
      <AdminStack.Screen
        name="AdminCompanyDashboard"
        component={CompanyDashboardScreen}
      />
      <AdminStack.Screen
        name="AdminCreateGig"
        component={CompanyCreateGigScreen}
      />
      <AdminStack.Screen
        name="AdminCreateLocation"
        component={CompanyCreateLocationScreen}
      />
      <AdminStack.Screen
        name="AdminCompanyGigs"
        component={CompanyGigsScreen}
      />
      <AdminStack.Screen
        name="AdminCompanyMembers"
        component={CompanyMembersScreen}
      />
      <AdminStack.Screen
        name="AdminCompanyReviews"
        component={CompanyReviewsScreen}
      />
      <AdminStack.Screen
        name="AdminCompanyAccount"
        component={CompanyAccountScreen}
      />
    </AdminStack.Navigator>
  );
}

export function RootNavigator() {
  const { theme } = useAppTheme();
  const { status, mode, me, switchMode, refreshMe } = useSession();

  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: theme.colors.background,
      card: theme.colors.surface,
      border: theme.colors.border,
      text: theme.colors.text,
      primary: theme.colors.primary,
    },
  };

  if (status === "booting") {
    return (
      <Screen>
        <LoadingState label="Restoring session..." />
      </Screen>
    );
  }

  const hasProfile = Boolean(me?.profile?.id);
  const hasMembership = Array.isArray(me?.companies) && me.companies.length > 0;
  const hasAdminRole = me?.role === "ADMIN";

  return (
    <NavigationContainer theme={navTheme}>
      {!mode ? (
        <ModeNavigator />
      ) : status !== "authenticated" ? (
        mode === "admin" ? <AdminAuthNavigator /> : <AuthNavigator />
      ) : mode === "worker" ? (
        hasProfile ? (
          <WorkerTabsNavigator />
        ) : (
          <WorkerOnboardingNavigator />
        )
      ) : mode === "company" ? (
        hasMembership ? (
          <CompanyTabsNavigator />
        ) : (
          <CompanyOnboardingNavigator />
        )
      ) : hasAdminRole ? (
        <AdminNavigator />
      ) : (
        <Screen>
          <Heading>Admin access required</Heading>
          <Body style={{ marginBottom: 12 }}>
            Your account does not have the ADMIN role.
          </Body>
          <Button
            label="Refresh access"
            variant="secondary"
            onPress={() => {
              refreshMe().catch(() => {
                // Keep current state if refresh fails.
              });
            }}
          />
          <Button label="Back to mode select" onPress={() => switchMode(null)} />
        </Screen>
      )}
    </NavigationContainer>
  );
}
