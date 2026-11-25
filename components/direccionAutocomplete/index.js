import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { buscarDireccionesArgentina } from '../../services/ubicacion';

const colors = {
    primary: '#795548',
    secondary: '#8A776B',
    soft: '#E8DDD2',
    background: '#F5EEE7',
    card: '#FFFFFF',
};

const DireccionAutocomplete = ({
    value,
    onChangeText,
    onSeleccionar,
    placeholder = 'Ej: Belgrano, CABA',
}) => {
    const [sugerencias, setSugerencias] = useState([]);
    const [buscando, setBuscando] = useState(false);
    const [mostrarLista, setMostrarLista] = useState(false);
    const [error, setError] = useState('');
    // Solo busca si el usuario está editando el campo (no al cargar el perfil)
    const [editando, setEditando] = useState(false);
    const debounceRef = useRef(null);
    const blurTimeoutRef = useRef(null);

    useEffect(() => {
        if (!editando) {
            setSugerencias([]);
            setMostrarLista(false);
            setBuscando(false);
            setError('');
            return undefined;
        }

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        const texto = value?.trim() || '';

        if (texto.length < 3) {
            setSugerencias([]);
            setMostrarLista(false);
            setBuscando(false);
            setError('');
            return undefined;
        }

        setBuscando(true);

        debounceRef.current = setTimeout(async () => {
            try {
                const resultados = await buscarDireccionesArgentina(texto);
                setSugerencias(resultados);
                setMostrarLista(resultados.length > 0);
                setError(
                    resultados.length === 0
                        ? 'No encontramos coincidencias. Probá con barrio o ciudad.'
                        : ''
                );
            } catch (err) {
                console.log('Error autocomplete dirección:', err);
                setSugerencias([]);
                setMostrarLista(false);
                setError('No se pudieron cargar sugerencias. Reintentá.');
            } finally {
                setBuscando(false);
            }
        }, 800);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [value, editando]);

    const handleSeleccionar = (item) => {
        if (blurTimeoutRef.current) {
            clearTimeout(blurTimeoutRef.current);
        }

        setEditando(false);
        setMostrarLista(false);
        setSugerencias([]);
        setError('');
        onChangeText(item.label);
        onSeleccionar?.(item);
    };

    return (
        <View style={styles.wrapper}>
            <View style={styles.inputRow}>
                <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={(texto) => {
                        setEditando(true);
                        onChangeText(texto);
                    }}
                    placeholder={placeholder}
                    placeholderTextColor="#B5A69B"
                    autoCapitalize="words"
                    onFocus={() => {
                        // No abrir sugerencias solo por focus: hay que tipear
                    }}
                    onBlur={() => {
                        blurTimeoutRef.current = setTimeout(() => {
                            setMostrarLista(false);
                            setEditando(false);
                            setSugerencias([]);
                        }, 180);
                    }}
                />
                {buscando ? (
                    <ActivityIndicator
                        style={styles.spinner}
                        size="small"
                        color={colors.primary}
                    />
                ) : null}
            </View>

            <Text style={styles.hint}>
                Escribí al menos 3 letras y elegí una sugerencia.
            </Text>

            {error && editando ? (
                <Text style={styles.error}>{error}</Text>
            ) : null}

            {editando && mostrarLista && sugerencias.length > 0 ? (
                <View style={styles.dropdown}>
                    {sugerencias.map((item) => (
                        <Pressable
                            key={item.id}
                            style={styles.item}
                            onPress={() => handleSeleccionar(item)}
                        >
                            <Text style={styles.itemText}>{item.label}</Text>
                        </Pressable>
                    ))}
                </View>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        position: 'relative',
        zIndex: 100,
        elevation: 100,
    },
    inputRow: {
        position: 'relative',
        justifyContent: 'center',
    },
    input: {
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.soft,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        paddingRight: 40,
        fontSize: 15,
        color: colors.primary,
    },
    spinner: {
        position: 'absolute',
        right: 12,
    },
    hint: {
        fontSize: 12,
        color: colors.secondary,
        marginTop: 6,
    },
    error: {
        fontSize: 12,
        color: '#B85C4E',
        marginTop: 6,
    },
    dropdown: {
        marginTop: 8,
        backgroundColor: colors.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.soft,
        maxHeight: 220,
        overflow: 'hidden',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
    },
    item: {
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.background,
    },
    itemText: {
        fontSize: 13,
        color: colors.primary,
        lineHeight: 18,
    },
});

export default DireccionAutocomplete;
