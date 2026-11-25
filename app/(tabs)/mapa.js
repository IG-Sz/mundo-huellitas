import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Linking,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

import {
    buildStaticMapUrl,
    openExternalMap,
} from '../../components/mapaRefugio';
import {
    getRefugiosParaMapa,
    normalizarTelefonoWhatsApp,
} from '../../services/refugios';

const colors = {
    primary: '#795548',
    secondary: '#8A776B',
    background: '#F5EEE7',
    card: '#FFFCF8',
    soft: '#E8DDD2',
    whatsapp: '#25D366',
    pin: '#C62828',
};

export default function MapaAdoptante() {
    const [region, setRegion] = useState(null);
    const [refugios, setRefugios] = useState([]);
    const [seleccionado, setSeleccionado] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [errorCarga, setErrorCarga] = useState('');
    const [mapWidth, setMapWidth] = useState(360);
    const [mapFallo, setMapFallo] = useState(false);

    useEffect(() => {
        let activo = true;

        const cargar = async () => {
            try {
                const lista = await getRefugiosParaMapa();
                if (activo) {
                    setRefugios(lista);
                    if (lista.length) setSeleccionado(lista[0]);
                }
            } catch (error) {
                console.log('Error al cargar refugios del mapa:', error);
                if (activo) {
                    setErrorCarga(
                        error?.message || 'No se pudo cargar el mapa.'
                    );
                }
            }

            try {
                const { status } =
                    await Location.requestForegroundPermissionsAsync();

                if (status === 'granted') {
                    const posicion = await Location.getCurrentPositionAsync({
                        accuracy: Location.Accuracy.Balanced,
                    });

                    if (activo) {
                        setRegion({
                            latitude: posicion.coords.latitude,
                            longitude: posicion.coords.longitude,
                            latitudeDelta: 0.06,
                            longitudeDelta: 0.06,
                        });
                    }
                }
            } catch (error) {
                console.log('Ubicación del dispositivo no disponible:', error);
            } finally {
                if (activo) setCargando(false);
            }
        };

        cargar();

        return () => {
            activo = false;
        };
    }, []);

    const centroLat = seleccionado?.latitude ?? region?.latitude ?? null;
    const centroLng = seleccionado?.longitude ?? region?.longitude ?? null;
    const centro =
        typeof centroLat === 'number' && typeof centroLng === 'number'
            ? { latitude: centroLat, longitude: centroLng }
            : null;

    const mapUri = useMemo(() => {
        if (typeof centroLat !== 'number' || typeof centroLng !== 'number') {
            return null;
        }
        return buildStaticMapUrl(centroLat, centroLng, mapWidth * 2, 440, 0.03);
    }, [centroLat, centroLng, mapWidth]);

    const contactarWhatsApp = async (refugio) => {
        const telefono = normalizarTelefonoWhatsApp(refugio?.telefono);

        if (!telefono) {
            Alert.alert(
                'Sin teléfono',
                'Este refugio todavía no cargó un número de WhatsApp.'
            );
            return;
        }

        const mensaje = encodeURIComponent(
            `Hola ${refugio.nombre}! Vi su refugio en el mapa de Mundo Huellitas y me gustaría consultar por adopción.`
        );
        const url = `https://wa.me/${telefono}?text=${mensaje}`;

        try {
            const soportado = await Linking.canOpenURL(url);
            if (!soportado) {
                Alert.alert(
                    'No se pudo abrir WhatsApp',
                    'Verificá que WhatsApp esté instalado.'
                );
                return;
            }
            await Linking.openURL(url);
        } catch (error) {
            Alert.alert('Error', 'No se pudo abrir el chat de WhatsApp.');
        }
    };

    if (cargando) {
        return (
            <SafeAreaView style={styles.centrado}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.mensaje}>Obteniendo tu ubicación...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView edges={['top']} style={styles.container}>
            <Text style={styles.title}>Mapa de refugios</Text>
            <Text style={styles.subtitle}>
                Elegí un refugio de la lista para verlo en el mapa.
            </Text>

            {errorCarga ? (
                <Text style={styles.errorCarga}>{errorCarga}</Text>
            ) : null}

            <View
                style={styles.mapCard}
                onLayout={(e) => {
                    const w = e.nativeEvent.layout.width;
                    if (w > 0 && Math.abs(w - mapWidth) > 2) setMapWidth(w);
                }}
            >
                {centro && mapUri && !mapFallo ? (
                    <Image
                        key={`mapa-${centro.latitude}-${centro.longitude}-${mapWidth}`}
                        source={{ uri: mapUri }}
                        style={styles.map}
                        resizeMode="cover"
                        onError={() => setMapFallo(true)}
                        onLoad={() => setMapFallo(false)}
                    />
                ) : (
                    <View style={styles.mapFallback}>
                        <Ionicons
                            name="map-outline"
                            size={40}
                            color={colors.secondary}
                        />
                        <Text style={styles.mapFallbackText}>
                            {mapFallo
                                ? 'No se pudo cargar el mapa'
                                : 'No hay una ubicación para mostrar'}
                        </Text>
                    </View>
                )}

                {seleccionado ? (
                    <View pointerEvents="none" style={styles.pinWrap}>
                        <Ionicons
                            name="location"
                            size={40}
                            color={colors.pin}
                        />
                    </View>
                ) : null}

                {centro ? (
                    <Pressable
                        style={styles.openMapsBtn}
                        onPress={() =>
                            openExternalMap(
                                centro.latitude,
                                centro.longitude
                            ).catch(() => {})
                        }
                    >
                        <Ionicons name="open-outline" size={16} color="#FFF" />
                        <Text style={styles.openMapsText}>Abrir en Maps</Text>
                    </Pressable>
                ) : null}
            </View>

            <FlatList
                data={refugios}
                keyExtractor={(item) => item.id}
                style={styles.lista}
                contentContainerStyle={styles.listaContent}
                ListEmptyComponent={
                    <Text style={styles.vacio}>
                        No hay refugios con ubicación. Cuando un refugio guarde
                        su dirección en el perfil, va a aparecer acá.
                    </Text>
                }
                renderItem={({ item }) => {
                    const activo = seleccionado?.id === item.id;
                    return (
                        <Pressable
                            style={[
                                styles.item,
                                activo && styles.itemActivo,
                            ]}
                            onPress={() => {
                                setSeleccionado(item);
                                setMapFallo(false);
                            }}
                        >
                            <View style={styles.flex}>
                                <Text style={styles.itemTitulo}>
                                    {item.nombre}
                                </Text>
                                <Text style={styles.itemTexto}>
                                    {item.ubicacion || 'Sin dirección'}
                                </Text>
                                <Text style={styles.itemTexto}>
                                    {item.animalesDisponibles}{' '}
                                    {item.animalesDisponibles === 1
                                        ? 'animal disponible'
                                        : 'animales disponibles'}
                                </Text>
                            </View>
                            <Ionicons
                                name="location"
                                size={22}
                                color={
                                    activo ? colors.primary : colors.secondary
                                }
                            />
                        </Pressable>
                    );
                }}
            />

            {seleccionado ? (
                <View style={styles.tarjeta}>
                    <Pressable
                        style={styles.whatsappButton}
                        onPress={() => contactarWhatsApp(seleccionado)}
                    >
                        <Ionicons
                            name="logo-whatsapp"
                            size={20}
                            color="#FFFFFF"
                        />
                        <Text style={styles.whatsappText}>
                            Contactar por WhatsApp
                        </Text>
                    </Pressable>
                </View>
            ) : null}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },
    container: {
        flex: 1,
        backgroundColor: colors.background,
        paddingHorizontal: 16,
    },
    centrado: {
        flex: 1,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.primary,
        textAlign: 'center',
        marginTop: 8,
    },
    subtitle: {
        fontSize: 14,
        color: colors.secondary,
        textAlign: 'center',
        marginBottom: 12,
        marginTop: 4,
    },
    mensaje: {
        color: colors.secondary,
        fontSize: 16,
    },
    errorCarga: {
        color: '#B85C4E',
        textAlign: 'center',
        marginBottom: 8,
        fontSize: 13,
    },
    mapCard: {
        height: 220,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.soft,
        marginBottom: 12,
        backgroundColor: colors.card,
    },
    map: {
        width: '100%',
        height: '100%',
        backgroundColor: colors.soft,
    },
    mapFallback: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: colors.soft,
    },
    mapFallbackText: {
        color: colors.secondary,
        fontSize: 13,
    },
    pinWrap: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 32,
    },
    openMapsBtn: {
        position: 'absolute',
        right: 10,
        bottom: 10,
        backgroundColor: colors.primary,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    openMapsText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '600',
    },
    lista: {
        flex: 1,
    },
    listaContent: {
        gap: 8,
        paddingBottom: 8,
    },
    vacio: {
        textAlign: 'center',
        color: colors.secondary,
        marginTop: 24,
    },
    item: {
        backgroundColor: colors.card,
        borderRadius: 14,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderWidth: 1,
        borderColor: colors.soft,
    },
    itemActivo: {
        borderColor: colors.primary,
        borderWidth: 2,
    },
    itemTitulo: {
        fontSize: 15,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 2,
    },
    itemTexto: {
        fontSize: 12,
        color: colors.secondary,
        marginTop: 2,
    },
    tarjeta: {
        marginBottom: 12,
    },
    whatsappButton: {
        backgroundColor: colors.whatsapp,
        borderRadius: 12,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    whatsappText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 15,
    },
});
