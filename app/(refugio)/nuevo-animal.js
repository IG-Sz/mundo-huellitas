import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';

import { crearAnimal } from '../../services/animales';
import { getCurrentUser } from '../../services/authService';
import { subirImagen } from '../../services/imagenes';
import FormularioScroll from '../../components/formularioScroll';

const colors = {
    primary: '#795548',
    secondary: '#8A776B',
    background: '#F5EEE7',
    card: '#FFFCF8',
    soft: '#E8DDD2',
    accent: '#C98276',
};

const ESPECIES = ['Perro', 'Gato', 'Otro'];
const SEXOS = ['Hembra', 'Macho'];
const EDADES = [
    { label: 'Cachorro (<1)', value: 0 },
    { label: '1 año', value: 1 },
    { label: '2 años', value: 2 },
    { label: '3 años', value: 3 },
    { label: '4 años', value: 4 },
    { label: '5+ años', value: 5 },
];

const IMAGEN_DEFAULT =
    'https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=800&q=80';

export default function NuevoAnimal() {
    const router = useRouter();

    const [nombre, setNombre] = useState('');
    const [especie, setEspecie] = useState('Perro');
    const [raza, setRaza] = useState('');
    const [edad, setEdad] = useState(0);
    const [sexo, setSexo] = useState('Hembra');
    const [descripcion, setDescripcion] = useState('');
    const [imagenUri, setImagenUri] = useState(null);
    const [imagenMimeType, setImagenMimeType] = useState(null);
    const [guardando, setGuardando] = useState(false);

    const elegirFoto = async () => {
        try {
            const permission =
                await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permission.granted) {
                Alert.alert(
                    'Permiso requerido',
                    'Necesitamos acceso a tu galería para elegir una foto.'
                );
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled) {
                const asset = result.assets[0];

                setImagenUri(asset.uri);
                setImagenMimeType(asset.mimeType || 'image/jpeg');
            }
        } catch (error) {
            Alert.alert('Error', 'No se pudo abrir la galería.');
        }
    };

    const handleGuardar = async () => {
        if (!nombre.trim() || !descripcion.trim()) {
            Alert.alert(
                'Campos incompletos',
                'Completá nombre y descripción.'
            );
            return;
        }

        try {
            setGuardando(true);

            const usuario = await getCurrentUser();
            if (!usuario?.id) {
                Alert.alert('Sesión requerida', 'Volvé a iniciar sesión.');
                router.replace('/login');
                return;
            }

            // El backend guarda un string URL. Las URI file:// del celular
            // no son accesibles para otros usuarios → usamos URL pública.
            let imagen = IMAGEN_DEFAULT;

            if (imagenUri) {
                if (imagenUri.startsWith('http')) {
                    imagen = imagenUri;
                } else {
                    imagen = await subirImagen(
                        imagenUri,
                        imagenMimeType
                    );
                }
            }
            
            await crearAnimal({
                nombre: nombre.trim(),
                especie,
                raza: raza.trim() || 'Mestizo',
                edad,
                sexo,
                descripcion: descripcion.trim(),
                imagen,
            });

            Alert.alert(
                'Animal registrado',
                `${nombre.trim()} quedó cargado. Ahora podés crear un posteo.`,
                [
                    {
                        text: 'Ver animales',
                        onPress: () => router.replace('/(refugio)/animales'),
                    },
                    {
                        text: 'Crear posteo',
                        onPress: () => router.replace('/(refugio)/nuevo-posteo'),
                    },
                ]
            );
        } catch (error) {
            Alert.alert(
                'Error',
                error.message || 'No se pudo registrar el animal.'
            );
        } finally {
            setGuardando(false);
        }
    };

    return (
        <SafeAreaView edges={['top']} style={styles.container}>
            <FormularioScroll contentContainerStyle={styles.content}>
                    <Pressable
                        onPress={() => router.back()}
                        style={styles.back}
                    >
                        <Ionicons
                            name="arrow-back"
                            size={22}
                            color={colors.primary}
                        />
                        <Text style={styles.backText}>Volver</Text>
                    </Pressable>

                    <Text style={styles.title}>Nuevo animal</Text>
                    <Text style={styles.subtitle}>
                        Completá los datos para dar de alta al animal
                    </Text>

                    <Pressable style={styles.photoBox} onPress={elegirFoto}>
                        {imagenUri ? (
                            <Image
                                source={{ uri: imagenUri }}
                                style={styles.photo}
                            />
                        ) : (
                            <View style={styles.photoPlaceholder}>
                                <Ionicons
                                    name="camera-outline"
                                    size={32}
                                    color={colors.secondary}
                                />
                                <Text style={styles.photoText}>
                                    Elegir foto
                                </Text>
                            </View>
                        )}
                    </Pressable>

                    <Text style={styles.label}>Nombre</Text>
                    <TextInput
                        style={styles.input}
                        value={nombre}
                        onChangeText={setNombre}
                        placeholder="Ej: Luna"
                        placeholderTextColor={colors.secondary}
                    />

                    <Text style={styles.label}>Especie</Text>
                    <View style={styles.chips}>
                        {ESPECIES.map((item) => (
                            <Pressable
                                key={item}
                                style={[
                                    styles.chip,
                                    especie === item && styles.chipActive,
                                ]}
                                onPress={() => setEspecie(item)}
                            >
                                <Text
                                    style={[
                                        styles.chipText,
                                        especie === item &&
                                            styles.chipTextActive,
                                    ]}
                                >
                                    {item}
                                </Text>
                            </Pressable>
                        ))}
                    </View>

                    <Text style={styles.label}>Raza</Text>
                    <TextInput
                        style={styles.input}
                        value={raza}
                        onChangeText={setRaza}
                        placeholder="Mestizo"
                        placeholderTextColor={colors.secondary}
                    />

                    <Text style={styles.label}>Edad</Text>
                    <View style={styles.chips}>
                        {EDADES.map((item) => (
                            <Pressable
                                key={item.label}
                                style={[
                                    styles.chip,
                                    edad === item.value && styles.chipActive,
                                ]}
                                onPress={() => setEdad(item.value)}
                            >
                                <Text
                                    style={[
                                        styles.chipText,
                                        edad === item.value &&
                                            styles.chipTextActive,
                                    ]}
                                >
                                    {item.label}
                                </Text>
                            </Pressable>
                        ))}
                    </View>

                    <Text style={styles.label}>Sexo</Text>
                    <View style={styles.chips}>
                        {SEXOS.map((item) => (
                            <Pressable
                                key={item}
                                style={[
                                    styles.chip,
                                    sexo === item && styles.chipActive,
                                ]}
                                onPress={() => setSexo(item)}
                            >
                                <Text
                                    style={[
                                        styles.chipText,
                                        sexo === item && styles.chipTextActive,
                                    ]}
                                >
                                    {item}
                                </Text>
                            </Pressable>
                        ))}
                    </View>

                    <Text style={styles.label}>Descripción</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={descripcion}
                        onChangeText={setDescripcion}
                        placeholder="Contá un poco sobre el animal..."
                        placeholderTextColor={colors.secondary}
                        multiline
                    />

                    <Pressable
                        style={[
                            styles.submit,
                            guardando && styles.submitDisabled,
                        ]}
                        onPress={handleGuardar}
                        disabled={guardando}
                    >
                        {guardando ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.submitText}>
                                Guardar animal
                            </Text>
                        )}
                    </Pressable>
            </FormularioScroll>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 40 },
    back: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    backText: { color: colors.primary, fontWeight: '600' },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.primary,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 13,
        color: colors.secondary,
        textAlign: 'center',
        marginBottom: 16,
        marginTop: 4,
    },
    photoBox: {
        height: 180,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.soft,
        marginBottom: 16,
    },
    photo: { width: '100%', height: '100%' },
    photoPlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    photoText: { color: colors.secondary },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.primary,
        marginBottom: 6,
        marginTop: 8,
    },
    input: {
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.soft,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        color: colors.primary,
        marginBottom: 4,
    },
    textArea: { minHeight: 100, textAlignVertical: 'top' },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.soft,
    },
    chipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    chipText: { color: colors.secondary, fontSize: 13 },
    chipTextActive: { color: '#FFF', fontWeight: '600' },
    submit: {
        marginTop: 20,
        backgroundColor: colors.primary,
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center',
    },
    submitDisabled: { opacity: 0.7 },
    submitText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});
