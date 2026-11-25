import * as SecureStore from 'expo-secure-store';
import { apiRequest } from './api';
import { normalizeId, normalizeUser } from './normalize';

const AUTH_USER_KEY = 'authUser';

async function persistSession(token, user) {
    const normalized = normalizeUser(user);

    if (token) {
        await SecureStore.setItemAsync('authToken', token);
    }

    if (normalized) {
        await SecureStore.setItemAsync(
            AUTH_USER_KEY,
            JSON.stringify(normalized)
        );
    }

    return { token, user: normalized };
}

/**
 * POST /api/users/register
 * Backend espera: nombre, email, password, rol y telefono.
 * El teléfono es obligatorio solo para refugio.
 * Responde: { message, userId, token } (sin user completo)
 */
export async function registerUser(userData) {
    const payload = {
        nombre: userData.nombre,
        email: userData.email.trim().toLowerCase(),
        password: userData.password,
        rol: userData.rol || 'adoptante',
        telefono: String(userData.telefono || '').replace(/\D/g, ''),
    };

    const data = await apiRequest('/api/users/register', {
        method: 'POST',
        body: JSON.stringify(payload),
    });

    const user = normalizeUser({
        id: data.userId,
        nombre: payload.nombre,
        email: payload.email,
        rol: payload.rol,
        telefono: payload.telefono,
        ubicacion: userData.ubicacion || userData.direccion || '',
        direccion: userData.direccion || userData.ubicacion || '',
    });

    return persistSession(data.token, user);
}

/**
 * POST /api/users/login
 * Responde: { message, user, token }
 */
export async function loginUser(credentials) {
    const data = await apiRequest('/api/users/login', {
        method: 'POST',
        body: JSON.stringify({
            email: credentials.email.trim().toLowerCase(),
            password: credentials.password,
        }),
    });

    return persistSession(data.token, data.user);
}

export async function getCurrentUser() {
    const raw = await SecureStore.getItemAsync(AUTH_USER_KEY);
    if (!raw) return null;

    try {
        return normalizeUser(JSON.parse(raw));
    } catch {
        return null;
    }
}

/** Sesión válida solo si siguen el token y el usuario. Logout los borra. */
export async function getStoredSession() {
    const token = await SecureStore.getItemAsync('authToken');
    if (!token) return null;

    const user = await getCurrentUser();
    if (!user?.id) return null;

    return user;
}

/**
 * Actualiza sesión local + perfil de refugio en API si hay ubicacion/telefono.
 * PUT /api/users/profile acepta { ubicacion, telefono, latitude, longitude }.
 */
export async function updateCurrentUser(partial) {
    const current = await getCurrentUser();

    if (!current) {
        throw new Error('No hay una sesión activa.');
    }

    const ubicacion =
        partial.ubicacion ?? partial.direccion ?? current.ubicacion ?? '';
    const telefono = String(partial.telefono ?? current.telefono ?? '').replace(
        /\D/g,
        ''
    );
    const nombre = String(partial.nombre ?? current.nombre ?? '').trim();

    await apiRequest('/api/users/cuenta', {
        method: 'PUT',
        body: JSON.stringify({ nombre, telefono }),
    });

    if (current.rol === 'refugio') {
        if (!ubicacion || !telefono) {
            throw new Error(
                'Para guardar el perfil del refugio hace falta ubicación y teléfono.'
            );
        }

        const latitude = partial.latitude ?? current.latitude;
        const longitude = partial.longitude ?? current.longitude;
        const body = { ubicacion, telefono };

        if (
            typeof latitude === 'number' &&
            Number.isFinite(latitude) &&
            typeof longitude === 'number' &&
            Number.isFinite(longitude)
        ) {
            body.latitude = latitude;
            body.longitude = longitude;
        }

        await apiRequest('/api/users/profile', {
            method: 'PUT',
            body: JSON.stringify(body),
        });
    }

    const updated = normalizeUser({
        ...current,
        ...partial,
        id: current.id,
        nombre,
        email: current.email,
        rol: current.rol,
        ubicacion,
        direccion: partial.direccion ?? ubicacion,
        telefono,
    });

    await SecureStore.setItemAsync(AUTH_USER_KEY, JSON.stringify(updated));
    return { user: updated };
}

export async function logoutUser() {
    await SecureStore.deleteItemAsync('authToken');
    await SecureStore.deleteItemAsync(AUTH_USER_KEY);
}

export async function clearAllLocalData() {
    await logoutUser();
}

/**
 * Solo puede devolver el usuario de la sesión actual.
 * El backend no expone GET /api/users/:id.
 */
export async function getUserById(idUsuario) {
    const current = await getCurrentUser();
    if (current && normalizeId(current.id) === normalizeId(idUsuario)) {
        return current;
    }
    return null;
}
