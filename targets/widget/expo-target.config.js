/// <reference types="@bacons/apple-targets/app.plugin" />

/** Widget extension target for Mimi.
 *  Reads shared state via App Group "group.com.carlospariente.mimi". */
module.exports = {
  type: 'widget',
  name: 'MimiWidget',
  bundleIdentifier: 'com.carlospariente.mimi.widget',
  deploymentTarget: '17.0',
  icon: '../../assets/icon.png',
  colors: {
    $widgetBackground: '#0E0F12',
    $accent: '#A8A5E6',
  },
  entitlements: {
    'com.apple.security.application-groups': ['group.com.carlospariente.mimi'],
  },
};
