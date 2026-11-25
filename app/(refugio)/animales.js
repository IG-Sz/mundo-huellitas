import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';

import { getMisPosteos } from '../../services/posteos';
import { getMisAnimales, marcarAnimalAdoptado } from '../../services/animales';
import { getCurrentUser } from '../../services/authService';

const colors = {
    primary: '#795548',
    secondary: '#8A776B',
    background: '#F5EEE7',
    card: '#FFFCF8',
    soft: '#E8DDD2',
    accent: '#C98276',
};

export default function AnimalesRefugio() {
    const router = useRouter();
    const [items, setItems] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [reloadKey, setReloadKey] = useState(0);

    useFocusEffect(
        useCallback(() => {
            let activo = true;

            const cargar = async () => {
                try {
                    setCargando(true);
                    setError('');

                    const usuario = await getCurrentUser();
                    if (!usuario?.id) {
                        router.replace('/login');
                        return;
                    }

                    const [posteos, animales] = await Promise.all([
                        getMisPosteos(),
                        getMisAnimales(),
                    ]);

                    if (!activo) return;

                    setItems(
                        posteos.map((posteo) => ({
                            posteo,
                            animal: animales.find(
                                (animal) =>
                                    String(animal.id) ===
                                    String(posteo.idAnimal)
                            ),
                        }))
                    );
                } catch (err) {
                    console.log('Error al cargar mis publicaciones:', err);
                    if (activo) {
                        setItems([]);
                        setError(
                            err.message ||
                                'No se pudieron cargar tus publicaciones.'
                        );
                    }
                } finally {
                    if (activo) setCargando(false);
                }
            };

            cargar();

            return () => {
                activo = false;
            };
        }, [router, reloadKey])
    );

    const marcarAdoptado = (animal) => {
        Alert.alert(
            'Marcar como adoptada',
            `¿Confirmás que ${animal.nombre} ya fue adoptada?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Confirmar',
                    onPress: async () => {
                        try {
                            await marcarAnimalAdoptado(animal.id);
                            setReloadKey((k) => k + 1);
                        } catch (err) {
                            Alert.alert(
                                'Error',
                                err.message ||
                                    'No se pudo marcar como adoptada.'
                            );
                        }
                    },
                },
            ]
        );
    };

    if (cargando) {
        return (
            <SafeAreaView style={styles.centrado}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.mensaje}>Cargando tus publicaciones...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView edges={['top']} style={styles.container}>
            <Text style={styles.title}>Mis animales</Text>
            <Text style={styles.subtitle}>
                Publicaciones de los animales de tu refugio
            </Text>

            {error ? (
                <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{error}</Text>
                    <Pressable
                        style={styles.retryBtn}
                        onPress={() => setReloadKey((k) => k + 1)}
                    >
                        <Text style={styles.retryText}>Reintentar</Text>
                    </Pressable>
                </View>
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={(item) => String(item.posteo.id)}
                    contentContainerStyle={styles.lista}
                    ListEmptyComponent={
                        <View style={styles.vacio}>
                            <Ionicons
                                name="paw-outline"
                                size={40}
                                color={colors.secondary}
                            />
                            <Text style={styles.vacioTitulo}>
                                Todavía no publicaste animales
                            </Text>
                            <Text style={styles.vacioTexto}>
                                Tocá el + para crear la primera publicación.
                            </Text>
                        </View>
                    }
                    renderItem={({ item }) => {
                        const animalId =
                            item.animal?.id || item.posteo.idAnimal;

                        return (
                            <View style={styles.card}>
                                {item.posteo.imagen ? (
                                    <Image
                                        source={{ uri: item.posteo.imagen }}
                                        style={styles.image}
                                        resizeMode="cover"
                                    />
                                ) : null}
                                <View style={styles.cardBody}>
                                    <Text style={styles.cardTitle}>
                                        {item.posteo.titulo}
                                    </Text>
                                    <Text
                                        style={styles.cardText}
                                        numberOfLines={3}
                                    >
                                        {item.posteo.texto}
                                    </Text>
                                    <Text style={styles.cardMeta}>
                                        {item.animal
                                            ? `${item.animal.nombre} · ${item.animal.especie}`
                                            : 'Animal publicado'}
                                        {item.animal?.adoptado
                                            ? ' · Adoptada'
                                            : ''}
                                    </Text>
                                    <Pressable
                                        style={styles.editarBtn}
                                        onPress={() =>
                                            router.push({
                                                pathname:
                                                    '/(refugio)/editar-posteo',
                                                params: { id: item.posteo.id },
                                            })
                                        }
                                    >
                                        <Text style={styles.botonTexto}>
                                            Editar publicación
                                        </Text>
                                    </Pressable>
                                    <Pressable
                                        style={styles.adoptadoBtn}
                                        disabled={
                                            Boolean(item.animal?.adoptado) ||
                                            !animalId
                                        }
                                        onPress={() =>
                                            marcarAdoptado({
                                                id: animalId,
                                                nombre:
                                                    item.animal?.nombre ||
                                                    'esta mascota',
                                            })
                                        }
                                    >
                                        <Text style={styles.botonTexto}>
                                            {item.animal?.adoptado
                                                ? 'Ya está adoptada'
                                                : 'Marcar como adoptada'}
                                        </Text>
                                    </Pressable>
                                </View>
                            </View>
                        );
                    }}
                />
            )}

            <Pressable
                style={styles.fab}
                onPress={() => router.push('/(refugio)/nuevo-posteo')}
                accessibilityLabel="Nueva publicación"
            >
                <Ionicons name="add" size={28} color="#FFFFFF" />
            </Pressable>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    centrado: {
        flex: 1,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.primary,
        textAlign: 'center',
        marginTop: 8,
    },
    subtitle: {
        fontSize: 14,
        color: colors.secondary,
        textAlign: 'center',
        marginBottom: 8,
        marginTop: 4,
        paddingHorizontal: 16,
    },
    mensaje: {
        color: colors.secondary,
        fontSize: 16,
    },
    lista: {
        paddingBottom: 100,
        flexGrow: 1,
    },
    vacio: {
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingTop: 48,
        gap: 10,
    },
    vacioTitulo: {
        fontSize: 17,
        fontWeight: '600',
        color: colors.primary,
        textAlign: 'center',
    },
    vacioTexto: {
        fontSize: 14,
        color: colors.secondary,
        textAlign: 'center',
    },
    errorBox: {
        margin: 16,
        padding: 16,
        borderRadius: 12,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.accent,
        gap: 12,
    },
    errorText: {
        color: colors.accent,
        fontSize: 14,
        textAlign: 'center',
    },
    retryBtn: {
        alignSelf: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: colors.primary,
    },
    retryText: {
        color: '#FFF',
        fontWeight: '600',
    },
    card: {
        backgroundColor: colors.card,
        borderRadius: 16,
        overflow: 'hidden',
        marginHorizontal: 12,
        marginVertical: 8,
        borderWidth: 1,
        borderColor: colors.soft,
    },
    image: {
        width: '100%',
        height: 160,
        backgroundColor: colors.soft,
    },
    cardBody: {
        padding: 14,
        gap: 6,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: colors.primary,
    },
    cardText: {
        fontSize: 14,
        color: colors.secondary,
        lineHeight: 20,
    },
    cardMeta: {
        fontSize: 13,
        color: colors.primary,
        fontWeight: '600',
        marginTop: 4,
    },
    editarBtn: {
        marginTop: 10,
        backgroundColor: colors.primary,
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
    },
    adoptadoBtn: {
        marginTop: 8,
        backgroundColor: colors.accent,
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
    },
    botonTexto: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 15,
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
    },
});
