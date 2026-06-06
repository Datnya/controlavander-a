module.exports = {
  packagerConfig: {
    name: 'Control de Lavandería',
    executableName: 'ControlLavanderia',
    icon: './assets/icon',
    asar: {
      unpack: '*.{node,dll}'
    }
  },
  rebuildConfig: {},
  makers: [
    // Instalador Squirrel: genera ControlLavanderia-Setup.exe + RELEASES + .nupkg.
    // Es el formato que habilita la AUTO-ACTUALIZACION (update-electron-app).
    // El cliente debe instalar con este Setup.exe para recibir updates automaticos.
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'ControlLavanderia',
        setupExe: 'ControlLavanderia-Setup.exe',
        authors: 'Foxy Studios',
        description: 'Control de Lavanderia'
      }
    },
    // ZIP portable (respaldo / distribucion manual sin auto-update).
    {
      name: '@electron-forge/maker-zip',
      platforms: ['win32']
    }
  ]
};
