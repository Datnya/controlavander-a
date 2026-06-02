const https = require('https');
const { getDeviceId } = require('./device');
const db = require('./database');

const LICENSES_URL = 'https://raw.githubusercontent.com/Datnya/controlavander-a/main/licenses.json';
const VALIDATION_INTERVAL_HOURS = 7;

/**
 * Descarga el archivo de licencias desde GitHub.
 * @returns {Promise<Object>} Objeto JSON con las licencias
 */
function fetchLicenses() {
  return new Promise((resolve, reject) => {
    https.get(LICENSES_URL, { timeout: 15000 }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Error al procesar datos de licencia'));
        }
      });
    }).on('error', (err) => {
      reject(new Error('Sin conexión a internet'));
    }).on('timeout', function() {
      this.destroy();
      reject(new Error('Tiempo de espera agotado'));
    });
  });
}

/**
 * Activa una licencia con el código proporcionado.
 * @param {string} code - Código de licencia
 * @returns {Promise<Object>} Resultado de la activación
 */
async function activateLicense(code) {
  try {
    const machineId = getDeviceId();
    const licensesData = await fetchLicenses();

    if (!licensesData || !licensesData.licenses) {
      return { success: false, error: 'No se pudieron obtener las licencias' };
    }

    const license = licensesData.licenses.find(l => l.code === code.trim().toUpperCase());

    if (!license) {
      return { success: false, error: 'Código de licencia no válido' };
    }

    if (license.status !== 'active') {
      return { success: false, error: 'Esta licencia no está activa. Contacte a su proveedor.' };
    }

    // Verificar si ya está activada en otro dispositivo
    if (license.activated_device && license.activated_device !== '' && license.activated_device !== machineId) {
      return { success: false, error: 'Esta licencia ya está activada en otro dispositivo' };
    }

    // Guardar licencia localmente
    db.saveLicense(code.trim().toUpperCase(), machineId);

    return { 
      success: true, 
      data: { 
        code: license.code, 
        client_name: license.client_name,
        machineId 
      } 
    };
  } catch (error) {
    return { success: false, error: error.message || 'Error al activar la licencia' };
  }
}

/**
 * Valida la licencia actual contra el servidor remoto.
 * @returns {Promise<Object>} Estado de la validación
 */
async function validateLicense() {
  try {
    const localLicense = db.getLicense();
    if (!localLicense) {
      return { valid: false, reason: 'no-license' };
    }

    const machineId = getDeviceId();
    const licensesData = await fetchLicenses();

    if (!licensesData || !licensesData.licenses) {
      return { valid: false, reason: 'no-connection' };
    }

    const remoteLicense = licensesData.licenses.find(l => l.code === localLicense.code);

    if (!remoteLicense) {
      db.updateLicenseStatus('suspended');
      return { valid: false, reason: 'not-found' };
    }

    if (remoteLicense.status !== 'active') {
      db.updateLicenseStatus('suspended');
      return { valid: false, reason: 'suspended' };
    }

    if (remoteLicense.activated_device && remoteLicense.activated_device !== machineId) {
      db.updateLicenseStatus('suspended');
      return { valid: false, reason: 'wrong-device' };
    }

    // Licencia válida - actualizar timestamp
    db.updateLicenseValidation();
    db.updateLicenseStatus('active');

    return { valid: true };
  } catch (error) {
    // Sin conexión - no modificar estado local
    return { valid: false, reason: 'no-connection', error: error.message };
  }
}

/**
 * Verifica si la licencia necesita revalidación (han pasado más de 7 horas).
 * @returns {boolean}
 */
function needsValidation() {
  const license = db.getLicense();
  if (!license) return true;
  if (!license.last_validated) return true;

  const lastValidated = new Date(license.last_validated);
  const now = new Date();
  const hoursDiff = (now - lastValidated) / (1000 * 60 * 60);

  return hoursDiff >= VALIDATION_INTERVAL_HOURS;
}

/**
 * Verifica si la licencia es válida para uso.
 * Combina verificación local y remota según sea necesario.
 * @returns {Promise<Object>} Estado de la licencia
 */
async function isLicenseValid() {
  const localLicense = db.getLicense();

  // No hay licencia instalada
  if (!localLicense) {
    return { valid: false, reason: 'no-license' };
  }

  // La licencia local está suspendida
  if (localLicense.status === 'suspended') {
    // Intentar revalidar por si se reactivó
    const result = await validateLicense();
    if (result.valid) return { valid: true };
    return { valid: false, reason: 'suspended' };
  }

  // Verificar si necesita revalidación
  if (needsValidation()) {
    const result = await validateLicense();

    if (result.valid) {
      return { valid: true };
    }

    // Si no hay conexión pero la licencia estaba activa localmente
    if (result.reason === 'no-connection') {
      // Verificar si han pasado más de 7 horas sin validar
      const license = db.getLicense();
      if (license && license.last_validated) {
        const lastValidated = new Date(license.last_validated);
        const now = new Date();
        const hoursDiff = (now - lastValidated) / (1000 * 60 * 60);

        if (hoursDiff < VALIDATION_INTERVAL_HOURS) {
          return { valid: true };
        }
      }
      return { valid: false, reason: 'no-internet' };
    }

    return { valid: false, reason: result.reason || 'suspended' };
  }

  // No necesita revalidación, licencia local activa
  return { valid: true };
}

/**
 * Obtiene la información de la licencia para mostrar en la UI.
 * @returns {Object} Información de la licencia
 */
function getLicenseInfo() {
  const license = db.getLicense();
  const machineId = getDeviceId();

  if (!license) {
    return { 
      exists: false, 
      machineId 
    };
  }

  return {
    exists: true,
    code: license.code,
    machineId,
    activatedAt: license.activated_at,
    lastValidated: license.last_validated,
    status: license.status
  };
}

module.exports = {
  activateLicense,
  validateLicense,
  needsValidation,
  isLicenseValid,
  getLicenseInfo
};
