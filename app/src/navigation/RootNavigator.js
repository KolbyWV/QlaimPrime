import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useSession } from "../auth/session";
import { ModeResetScreen } from "../auth/screens/ModeResetScreen";
import { ModeSelectScreen } from "../auth/screens/ModeSelectScreen";
import { RegisterScreen } from "../auth/screens/RegisterScreen";
import { SignInScreen } from "../auth/screens/SignInScreen";
import { useAppTheme } from "../ui/theme";
import { LoadingState, Screen } from "../ui/components";
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
import { WorkerHomeScreen } from "../worker/screens/WorkerHomeScreen";
import { WorkerOnboardingScreen } from "../worker/screens/WorkerOnboardingScreen";
import { WorkerShopScreen } from "../worker/screens/WorkerShopScreen";
import { WorkerWalletScreen } from "../worker/screens/WorkerWalletScreen";

const AuthStack = createNativeStackNavigator();
const ModeStack = createNativeStackNavigator();
const WorkerOnboardingStack = createNativeStackNavigator();
const CompanyOnboardingStack = createNativeStackNavigator();
const CompanyDashboardStack = createNativeStackNavigator();
const CompanyGigsStack = createNativeStackNavigator();
const WorkerTabs = createBottomTabNavigator();
const CompanyTabs = createBottomTabNavigator();

function ModeNavigator() {
  return (
    <ModeStack.Navigator>
      <ModeStack.Screen
        name="ModeSelect"
        component={ModeSelectScreen}
        options={{ title: "Choose mode" }}
      />
    </ModeStack.Navigator>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator>
      <AuthStack.Screen name="SignIn" component={SignInScreen} options={{ title: "Sign in" }} />
      <AuthStack.Screen name="Register" component={RegisterScreen} options={{ title: "Create account" }} />
      <AuthStack.Screen
        name="ModeReset"
        component={ModeResetScreen}
        options={{ headerShown: false, presentation: "modal" }}
      />
    </AuthStack.Navigator>
  );
}

function WorkerOnboardingNavigator() {
  return (
    <WorkerOnboardingStack.Navigator>
      <WorkerOnboardingStack.Screen
        name="ProfileSetup"
        component={WorkerOnboardingScreen}
        options={{ title: "Profile" }}
      />
    </WorkerOnboardingStack.Navigator>
  );
}

function CompanyOnboardingNavigator() {
  return (
    <CompanyOnboardingStack.Navigator>
      <CompanyOnboardingStack.Screen
        name="CompanySetup"
        component={CompanyOnboardingScreen}
        options={{ title: "Company setup" }}
      />
    </CompanyOnboardingStack.Navigator>
  );
}

function CompanyDashboardNavigator() {
  return (
    <CompanyDashboardStack.Navigator>
      <CompanyDashboardStack.Screen
        name="CompanyDashboardHome"
        component={CompanyDashboardScreen}
        options={{ headerShown: false }}
      />
      <CompanyDashboardStack.Screen
        name="CreateGig"
        component={CompanyCreateGigScreen}
        options={{ title: "Create gig" }}
      />
      <CompanyDashboardStack.Screen
        name="CreateLocation"
        component={CompanyCreateLocationScreen}
        options={{ title: "Create location" }}
      />
    </CompanyDashboardStack.Navigator>
  );
}

function CompanyGigsNavigator() {
  return (
    <CompanyGigsStack.Navigator>
      <CompanyGigsStack.Screen
        name="CompanyGigsList"
        component={CompanyGigsScreen}
        options={{ headerShown: false }}
      />
    </CompanyGigsStack.Navigator>
  );
}

function WorkerTabsNavigator() {
  return (
    <WorkerTabs.Navigator screenOptions={{ headerShown: false }}>
      <WorkerTabs.Screen name="Gigs" component={WorkerHomeScreen} />
      <WorkerTabs.Screen name="Assignments" component={WorkerAssignmentsScreen} />
      <WorkerTabs.Screen name="Shop" component={WorkerShopScreen} />
      <WorkerTabs.Screen name="Wallet" component={WorkerWalletScreen} />
      <WorkerTabs.Screen name="Account" component={WorkerAccountScreen} />
    </WorkerTabs.Navigator>
  );
}

function CompanyTabsNavigator() {
  return (
    <CompanyTabs.Navigator screenOptions={{ headerShown: false }}>
      <CompanyTabs.Screen name="Dashboard" component={CompanyDashboardNavigator} />
      <CompanyTabs.Screen name="Gigs" component={CompanyGigsNavigator} />
      <CompanyTabs.Screen name="Members" component={CompanyMembersScreen} />
      <CompanyTabs.Screen name="Reviews" component={CompanyReviewsScreen} />
      <CompanyTabs.Screen name="Account" component={CompanyAccountScreen} />
    </CompanyTabs.Navigator>
  );
}

export function RootNavigator() {
  const { theme } = useAppTheme();
  const { status, mode, me } = useSession();

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

  return (
    <NavigationContainer theme={navTheme}>
      {!mode ? (
        <ModeNavigator />
      ) : status !== "authenticated" ? (
        <AuthNavigator />
      ) : mode === "worker" ? (
        hasProfile ? (
          <WorkerTabsNavigator />
        ) : (
          <WorkerOnboardingNavigator />
        )
      ) : hasMembership ? (
        <CompanyTabsNavigator />
      ) : (
        <CompanyOnboardingNavigator />
      )}
    </NavigationContainer>
  );
}
