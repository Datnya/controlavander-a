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
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'ControlLavanderia',
        setupIcon: './assets/icon.ico',
        title: 'Control de Lavandería'
      }
    }
  ]
};
