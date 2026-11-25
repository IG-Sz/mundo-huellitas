import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Redirect, useFocusEffect } from 'expo-router';

import { getStoredSession } from '../../services/authService';

const DESTINOS = {
    refugio: '/(refugio)/posteos',
    adoptante: '/(tabs)/posteos',
};

/**
 * permitido: 'refugio' | 'adoptante'
 * Devuelve el reemplazo de pantalla, o null si el rol puede quedarse.
 */
export function useGuardaRol(permitido) {
    const [estado, setEstado] = useState('cargando');

    useFocusEffect(
        useCallback(() => {
            let activo = true;

            getStoredSession()
                .then((user) => {
                    if (!activo) return;

                    if (!user) {
                        setEstado('login');
                        return;
                    }

                    const esRefugio = user.rol === 'refugio';
                    const coincide =
                        permitido === 'refugio' ? esRefugio : !esRefugio;

                    setEstado(coincide ? 'ok' : 'ajeno');
                })
                .catch(() => {
                    if (activo) setEstado('login');
                });

            return () => {
                activo = false;
            };
        }, [permitido])
    );

    if (estado === 'cargando') {
        return (
            <View style={styles.espera}>
                <ActivityIndicator size="large" color="#795548" />
            </View>
        );
    }

    if (estado === 'login') {
        return <Redirect href="/login" />;
    }

    if (estado === 'ajeno') {
        const destino =
            permitido === 'refugio' ? DESTINOS.adoptante : DESTINOS.refugio;
        return <Redirect href={destino} />;
    }

    return null;
}

const styles = StyleSheet.create({
    espera: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F5EEE7',
    },
});
