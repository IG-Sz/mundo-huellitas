import { useMemo, useState } from 'react';
import {
    Image,
    Linking,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const colors = {
    primary: '#795548',
    secondary: '#8A776B',
    soft: '#E8DDD2',
    card: '#FFFCF8',
    pin: '#C62828',
};

const CAPTION_HEIGHT = 40;

/** Mapa estático ArcGIS (sin API key). OSM.de suele estar caído. */
export function buildStaticMapUrl(lat, lng, width, height, delta = 0.012) {
    const w = Math.max(Math.round(width), 200);
    const h = Math.max(Math.round(height), 120);
    const minLon = lng - delta;
    const maxLon = lng + delta;
    const minLat = lat - delta;
    const maxLat = lat + delta;

    return (
        `https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/export` +
        `?bbox=${minLon},${minLat},${maxLon},${maxLat}` +
        `&bboxSR=4326&imageSR=4326` +
        `&size=${w},${h}&format=png&f=image`
    );
}

export function openExternalMap(lat, lng) {
    const q = encodeURIComponent(`${lat},${lng}`);
    return Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`);
}

/**
 * Preview con mapa estático (ArcGIS) + pin centrado.
 * Evita react-native-maps (grilla blanca sin API key en Expo Go)
 * y react-native-webview (conflicto RNCWebView).
 */
const MapaRefugio = ({
    latitude,
    longitude,
    nombre,
    height = 180,
}) => {
    const [fallo, setFallo] = useState(false);
    const [mapWidth, setMapWidth] = useState(600);

    const tieneCoords =
        typeof latitude === 'number' &&
        Number.isFinite(latitude) &&
        typeof longitude === 'number' &&
        Number.isFinite(longitude);
    const lat = tieneCoords ? latitude : null;
    const lng = tieneCoords ? longitude : null;

    const mapHeight = Math.max(height - CAPTION_HEIGHT, 120);

    const uri = useMemo(() => {
        if (!tieneCoords) return null;
        return buildStaticMapUrl(lat, lng, mapWidth * 2, mapHeight * 2);
    }, [tieneCoords, lat, lng, mapWidth, mapHeight]);

    const abrirMapa = () => {
        if (!tieneCoords) return;
        openExternalMap(lat, lng).catch(() => {});
    };

    return (
        <View
            style={[styles.container, { height }]}
            onLayout={(e) => {
                const w = e.nativeEvent.layout.width;
                if (w > 0 && Math.abs(w - mapWidth) > 2) setMapWidth(w);
            }}
        >
            <Pressable style={{ height: mapHeight }} onPress={abrirMapa}>
                {tieneCoords && uri && !fallo ? (
                    <Image
                        key={`arcgis-${lat}-${lng}-${mapWidth}`}
                        source={{ uri }}
                        style={styles.mapImage}
                        resizeMode="cover"
                        accessibilityLabel={`Mapa de ${nombre || 'refugio'}`}
                        onError={() => setFallo(true)}
                        onLoad={() => setFallo(false)}
                    />
                ) : (
                    <View style={styles.fallback}>
                        <Ionicons
                            name="map-outline"
                            size={36}
                            color={colors.secondary}
                        />
                        <Text style={styles.fallbackText}>
                            {tieneCoords
                                ? 'No se pudo cargar el mapa'
                                : 'Este refugio todavía no cargó su ubicación'}
                        </Text>
                    </View>
                )}

                {tieneCoords ? (
                    <View pointerEvents="none" style={styles.pinWrap}>
                        <Ionicons
                            name="location"
                            size={36}
                            color={colors.pin}
                        />
                    </View>
                ) : null}
            </Pressable>

            <Pressable style={styles.captionRow} onPress={abrirMapa}>
                <Text style={styles.caption} numberOfLines={1}>
                    {tieneCoords
                        ? 'Tocá para abrir en Maps'
                        : 'Sin ubicación cargada'}
                </Text>
                {tieneCoords ? (
                    <Ionicons
                        name="open-outline"
                        size={16}
                        color={colors.primary}
                    />
                ) : null}
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.soft,
        backgroundColor: colors.card,
    },
    mapImage: {
        width: '100%',
        height: '100%',
        backgroundColor: colors.soft,
    },
    pinWrap: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        // El pin “apunta” al centro: subimos un poco el icono
        paddingBottom: 28,
    },
    fallback: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: colors.soft,
    },
    fallbackText: {
        color: colors.secondary,
        fontSize: 13,
    },
    captionRow: {
        height: CAPTION_HEIGHT,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingHorizontal: 10,
        backgroundColor: colors.card,
    },
    caption: {
        fontSize: 12,
        color: colors.secondary,
        textAlign: 'center',
    },
});

export default MapaRefugio;
