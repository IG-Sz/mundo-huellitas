import { apiRequest } from './api';
import { getAnimales } from './animales';
import { getCurrentUser } from './authService';
import { normalizeId, toCoord } from './normalize';
import { getPosteos } from './posteos';

const coordsValidas = (latitude, longitude) =>
    typeof latitude === 'number' &&
    Number.isFinite(latitude) &&
    typeof longitude === 'number' &&
    Number.isFinite(longitude);

const normalizarRefugio = (refugio) => {
    const id = normalizeId(refugio?.id ?? refugio?._id);

    return {
        id,
        nombre: refugio?.nombre || 'Refugio',
        telefono: refugio?.telefono || '',
        ubicacion: refugio?.ubicacion || refugio?.direccion || '',
        latitude: toCoord(refugio?.latitude),
        longitude: toCoord(refugio?.longitude),
    };
};

const contarPorUsuario = (lista, idUsuario, soloDisponibles = false) => {
    const id = normalizeId(idUsuario);

    return lista.filter((item) => {
        const mismoUsuario =
            normalizeId(item.idUsuario || item.user_id) === id;
        if (!mismoUsuario) return false;
        if (soloDisponibles && item.adoptado) return false;
        return true;
    }).length;
};

/** Publicaciones cuyo animal no está adoptado. */
const contarPublicacionesActivas = (posteos, animales, idUsuario) => {
    const id = normalizeId(idUsuario);
    const adoptados = new Set(
        animales
            .filter((animal) => animal.adoptado)
            .map((animal) => normalizeId(animal.id))
    );

    return posteos.filter((posteo) => {
        if (normalizeId(posteo.idUsuario || posteo.user_id) !== id) {
            return false;
        }

        const animalId = normalizeId(posteo.idAnimal || posteo.animal_id);
        return !adoptados.has(animalId);
    }).length;
};

const normalizarTelefonoWhatsApp = (telefono) => {
    if (!telefono) return '';
    return String(telefono).replace(/\D/g, '');
};

const validarTelefono = (telefono) => {
    const digitos = normalizarTelefonoWhatsApp(telefono);

    if (digitos.length <= 8) {
        return {
            ok: false,
            mensaje: 'El teléfono debe tener más de 8 dígitos.',
        };
    }

    return { ok: true, digitos };
};

/**
 * Refugios públicos del backend. Si el usuario logueado ya tiene
 * coordenadas en la sesión y el API todavía no, se usan esas.
 */
const listarRefugios = async () => {
    const data = await apiRequest('/api/users/refugios');
    const lista = (Array.isArray(data) ? data : []).map(normalizarRefugio);
    const sesion = await getCurrentUser();

    if (!sesion || sesion.rol !== 'refugio' || !sesion.id) {
        return lista;
    }

    const local = normalizarRefugio(sesion);
    const idx = lista.findIndex((refugio) => refugio.id === local.id);

    if (idx === -1) {
        return coordsValidas(local.latitude, local.longitude)
            ? [...lista, local]
            : lista;
    }

    const remoto = lista[idx];
    const tieneRemotas = coordsValidas(remoto.latitude, remoto.longitude);

    lista[idx] = {
        ...remoto,
        nombre: remoto.nombre || local.nombre,
        telefono: remoto.telefono || local.telefono,
        ubicacion: remoto.ubicacion || local.ubicacion,
        latitude: tieneRemotas ? remoto.latitude : local.latitude,
        longitude: tieneRemotas ? remoto.longitude : local.longitude,
    };

    return lista;
};

const getInfoRefugio = async (idUsuario, nombreFallback) => {
    if (!idUsuario) {
        return {
            id: null,
            nombre: nombreFallback || 'Refugio desconocido',
            telefono: '',
            ubicacion: '',
            latitude: null,
            longitude: null,
            cantidadPublicaciones: 0,
            animalesDisponibles: 0,
        };
    }

    const id = normalizeId(idUsuario);
    const [refugios, posteos, animales] = await Promise.all([
        listarRefugios(),
        getPosteos(),
        getAnimales(),
    ]);
    const usuario = refugios.find((refugio) => refugio.id === id);

    return {
        id,
        nombre: usuario?.nombre || nombreFallback || 'Refugio',
        telefono: usuario?.telefono || '',
        ubicacion: usuario?.ubicacion || '',
        latitude: usuario?.latitude ?? null,
        longitude: usuario?.longitude ?? null,
        cantidadPublicaciones: contarPublicacionesActivas(
            posteos,
            animales,
            id
        ),
        animalesDisponibles: contarPorUsuario(animales, id, true),
    };
};

/**
 * Nombre y publicaciones activas de cada refugio, para las tarjetas del feed.
 * La API de posteos no manda esos datos.
 */
const resumenRefugiosParaFeed = (refugios, posteos, animales) => {
    const resumen = new Map();

    for (const refugio of refugios) {
        resumen.set(String(refugio.id), {
            nombre: refugio.nombre,
            cantidadPublicaciones: contarPublicacionesActivas(
                posteos,
                animales,
                refugio.id
            ),
        });
    }

    return resumen;
};

/**
 * Pins del mapa: solo refugios con coordenadas reales del backend.
 */
const getRefugiosParaMapa = async () => {
    const [refugios, posteos, animales] = await Promise.all([
        listarRefugios(),
        getPosteos(),
        getAnimales(),
    ]);

    return refugios
        .filter((refugio) =>
            coordsValidas(refugio.latitude, refugio.longitude)
        )
        .map((refugio) => ({
            ...refugio,
            cantidadPublicaciones: contarPublicacionesActivas(
                posteos,
                animales,
                refugio.id
            ),
            animalesDisponibles: contarPorUsuario(animales, refugio.id, true),
        }));
};

export {
    getInfoRefugio,
    getRefugiosParaMapa,
    listarRefugios,
    resumenRefugiosParaFeed,
    normalizarTelefonoWhatsApp,
    validarTelefono,
};
