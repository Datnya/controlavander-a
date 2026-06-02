const { machineIdSync } = require('node-machine-id');
const crypto = require('crypto');

/**
 * Obtiene el identificador único del dispositivo actual.
 * Utiliza el MachineGuid del registro de Windows (hashed con SHA-256).
 * @returns {string} Hash SHA-256 del identificador del dispositivo
 */
function getDeviceId() {
  try {
    const rawId = machineIdSync(true);
    return rawId;
  } catch (error) {
    console.error('Error al obtener el ID del dispositivo:', error);
    // Fallback: generar un ID basado en variables del entorno
    const fallback = `${process.env.COMPUTERNAME || 'unknown'}-${process.env.USERNAME || 'user'}`;
    return crypto.createHash('sha256').update(fallback).digest('hex');
  }
}

module.exports = { getDeviceId };
