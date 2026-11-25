import { apiRequest } from './api';
import { getCurrentUser } from './authService';
import { normalizeAnimal, normalizeId } from './normalize';

/**
 * GET /api/animales — listado público
 */
export async function getAnimales() {
    const data = await apiRequest('/api/animales');
    const lista = Array.isArray(data) ? data : [];
    return lista.map(normalizeAnimal);
}

/**
 * Animales del refugio autenticado (filtra por user_id).
 * El backend no expone /mis-animales; se filtra en cliente.
 */
export async function getMisAnimales() {
    const usuario = await getCurrentUser();
    if (!usuario?.id) {
        throw new Error('Sesión requerida para ver tus animales.');
    }

    const animales = await getAnimales();
    const miId = normalizeId(usuario.id);

    return animales.filter(
        (animal) => normalizeId(animal.user_id || animal.idUsuario) === miId
    );
}

/**
 * GET /api/animales/:id
 */
export async function getAnimalById(id) {
    const data = await apiRequest(`/api/animales/${id}`);
    return normalizeAnimal(data);
}

/**
 * POST /api/animales — requiere Bearer + rol refugio
 * Body: nombre, especie, raza, edad (int), sexo, descripcion, imagen
 */
export async function crearAnimal(animalData) {
    const payload = {
        nombre: String(animalData.nombre || '').trim(),
        especie: String(animalData.especie || '').trim(),
        raza: String(animalData.raza || '').trim() || 'Mestizo',
        edad: Number(animalData.edad),
        sexo: String(animalData.sexo || '').trim(),
        descripcion: String(animalData.descripcion || '').trim(),
        imagen: String(animalData.imagen || '').trim(),
    };

    const data = await apiRequest('/api/animales', {
        method: 'POST',
        body: JSON.stringify(payload),
    });

    return {
        ...data,
        animalId: normalizeId(data.animalId || data.insertedId),
    };
}

/**
 * PUT /api/animales/:id
 */
export async function actualizarAnimal(id, partial) {
    return apiRequest(`/api/animales/${id}`, {
        method: 'PUT',
        body: JSON.stringify(partial),
    });
}

/**
 * DELETE /api/animales/:id
 */
export async function eliminarAnimal(id) {
    return apiRequest(`/api/animales/${id}`, {
        method: 'DELETE',
    });
}

/**
 * PUT /api/animales/:id { adoptado: true }
 * Solo el refugio dueño puede actualizarlo.
 */
export async function marcarAnimalAdoptado(id) {
    await actualizarAnimal(id, { adoptado: true });
    return getAnimalById(id);
}

// Compat: nombres viejos usados en otras pantallas
export const agregarAnimal = crearAnimal;
