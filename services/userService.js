import { getCurrentUser, updateCurrentUser } from './authService';

/**
 * Completa / edita perfil de refugio.
 * Backend: PUT /api/users/profile { ubicacion, telefono, latitude, longitude }
 */
export async function updateRefugioProfile(profileData) {
    return updateCurrentUser({
        ...profileData,
        ubicacion: profileData.ubicacion ?? profileData.direccion,
        direccion: profileData.direccion ?? profileData.ubicacion,
        telefono: profileData.telefono,
    });
}

export async function getSessionUser() {
    return getCurrentUser();
}
