import React, {useState, useEffect, useMemo} from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Alert } from 'react-native';
import { Layout, useTheme} from '@ui-kitten/components';

import * as SecureStore from 'expo-secure-store';

import { NavigationContainer } from '@react-navigation/native';
import { AuthStack, BottomStack } from '../navigation';
import { CreateProfile } from '../screens/profiles/CreateProfile';

import { AuthContext } from '../context';

export const Router = () => {
    const theme = useTheme();

    const [isLoading, setIsLoading] = useState(true);
    const [userToken, setUserToken] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [userFinished, setUserFinished] = useState(true);

    const authContext = useMemo(() => ({
        login: async () => {
            const token = await SecureStore.getItemAsync('token');
            const profileId = await SecureStore.getItemAsync('profileId');
            setUserToken(token);
            setUserProfile(profileId);
            setIsLoading(false);
        },
        logout: async () => {
            await SecureStore.deleteItemAsync('token');
            await SecureStore.deleteItemAsync('userId');
            await SecureStore.deleteItemAsync('profileId');
            setUserToken(null);
            setIsLoading(false);
        },
        register: async () => {
            const token = await SecureStore.getItemAsync('token');
            setUserToken(token);
            setIsLoading(false);
            setUserFinished(false);
        },
        profiling: async () => {
            const profileId = await SecureStore.getItemAsync('profileId');
            setUserProfile(profileId);
            setIsLoading(false);
            setUserFinished(true);
        }
    }), []);

    const isLoggedIn = async () => {
        try {
            setIsLoading(true);
            const userToken = await SecureStore.getItemAsync('token');
            const profileId = await SecureStore.getItemAsync('profileId');
            setUserToken(userToken);
            setUserProfile(profileId);
            setIsLoading(false);
        } catch (error) {
            Alert.alert('Error', 'An error occurred. Please try again.');
        }
    }

    useEffect(() =>{
        setTimeout(async ()=> {      
        }, 2500);
        isLoggedIn();
    }, []);

    if(isLoading){
        return (
            <SafeAreaView style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                <ActivityIndicator size='large' color={theme['color-primary-500']}/>
            </SafeAreaView>
        )
    }

    return (
        <AuthContext.Provider value={authContext}>
            <NavigationContainer>
                {userToken == null ? <AuthStack/> : (userFinished ? <BottomStack/> : <CreateProfile/>)}
            </NavigationContainer>
        </AuthContext.Provider>
    );
}