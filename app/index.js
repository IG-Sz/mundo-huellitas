import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Redirect } from 'expo-router';

import { getStoredSession } from '../services/authService';

export default function Index() {
    const [destino, setDestino] = useState(null);

    useEffect(() => {
        let activo = true;

        getStoredSession()
            .then((user) => {
                if (!activo) return;

                if (!user) {
                    setDestino('/register');
                    return;
                }

                setDestino(
                    user.rol === 'refugio'
                        ? '/(refugio)/posteos'
                        : '/(tabs)/posteos'
                );
            })
            .catch(() => {
                if (activo) setDestino('/register');
            });

        return () => {
            activo = false;
        };
    }, []);

    if (!destino) {
        return (
            <View style={styles.espera}>
                <ActivityIndicator size="large" color="#795548" />
            </View>
        );
    }

    return <Redirect href={destino} />;
}

const styles = StyleSheet.create({
    espera: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F4E9DF',
    },
});
