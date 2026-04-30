/**
 * Local Expo Config Plugin: adds the MimiWidget iOS Widget Extension
 * target to the Xcode project during prebuild.
 *
 * Why this exists: @bacons/apple-targets v4.0.6 (the only published
 * version) is incompatible with Expo SDK 54 — it imports a path that
 * @expo/prebuild-config no longer exposes. Until a compatible version
 * ships, this plugin handles the same job for our specific case.
 *
 * What it does each time `expo prebuild` runs for iOS:
 *  1. Copies the Swift sources from `targets/widget/` into
 *     `ios/MimiWidget/`.
 *  2. Generates `Info.plist` (NSExtension widgetkit-extension) and
 *     `MimiWidget.entitlements` (App Group) inside that folder.
 *  3. Creates the `MimiWidget` PBXNativeTarget (app extension), wires
 *     up Sources / Frameworks / Resources build phases, sets
 *     deployment iOS 17, Swift 5, code-sign entitlements, info plist,
 *     and embeds the produced .appex into the main Mimi target so it
 *     ships inside the IPA.
 *  4. Makes the main target depend on the widget target so a Build
 *     compiles both in the right order.
 *
 * Idempotent: re-running prebuild (without --clean) is a no-op once
 * the target exists. Safe to run with --clean too — it simply
 * recreates the target from scratch.
 */
const fs = require('fs');
const path = require('path');
const { withDangerousMod, withXcodeProject } = require('@expo/config-plugins');

const WIDGET_NAME = 'MimiWidget';
const WIDGET_BUNDLE_ID = 'com.carlospariente.mimi.widget';
const APP_GROUP = 'group.com.carlospariente.mimi';
const DEPLOYMENT_TARGET = '17.0';
const SWIFT_VERSION = '5.0';
const SWIFT_FILES = [
  'index.swift',
  'SharedStore.swift',
  'AppIntents.swift',
  'SleepTimerWidget.swift',
  'SuggestionWidget.swift',
  'WeeklyStatsWidget.swift',
];

const INFO_PLIST_FILENAME = `${WIDGET_NAME}-Info.plist`;
const ENTITLEMENTS_FILENAME = `${WIDGET_NAME}.entitlements`;

const INFO_PLIST_CONTENT = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDevelopmentRegion</key>
  <string>$(DEVELOPMENT_LANGUAGE)</string>
  <key>CFBundleDisplayName</key>
  <string>Mimi</string>
  <key>CFBundleExecutable</key>
  <string>$(EXECUTABLE_NAME)</string>
  <key>CFBundleIdentifier</key>
  <string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
  <key>CFBundleInfoDictionaryVersion</key>
  <string>6.0</string>
  <key>CFBundleName</key>
  <string>$(PRODUCT_NAME)</string>
  <key>CFBundlePackageType</key>
  <string>$(PRODUCT_BUNDLE_PACKAGE_TYPE)</string>
  <key>CFBundleShortVersionString</key>
  <string>$(MARKETING_VERSION)</string>
  <key>CFBundleVersion</key>
  <string>$(CURRENT_PROJECT_VERSION)</string>
  <key>NSExtension</key>
  <dict>
    <key>NSExtensionPointIdentifier</key>
    <string>com.apple.widgetkit-extension</string>
  </dict>
</dict>
</plist>
`;

const ENTITLEMENTS_CONTENT = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.application-groups</key>
  <array>
    <string>${APP_GROUP}</string>
  </array>
</dict>
</plist>
`;

/**
 * Step 1: copy Swift sources + write Info.plist + entitlements into
 * `ios/MimiWidget/`. Runs in the dangerous mod so we have access to
 * `platformProjectRoot` (the absolute path to the iOS project).
 */
const withWidgetFiles = (config) =>
  withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const platformRoot = config.modRequest.platformProjectRoot;
      const widgetDir = path.join(platformRoot, WIDGET_NAME);
      const sourceDir = path.join(projectRoot, 'targets', 'widget');

      fs.mkdirSync(widgetDir, { recursive: true });

      for (const file of SWIFT_FILES) {
        const src = path.join(sourceDir, file);
        const dst = path.join(widgetDir, file);
        if (!fs.existsSync(src)) {
          throw new Error(
            `[withMimiWidget] missing widget source: ${src}. ` +
              `Make sure targets/widget/ contains all expected files.`,
          );
        }
        fs.copyFileSync(src, dst);
      }

      fs.writeFileSync(
        path.join(widgetDir, INFO_PLIST_FILENAME),
        INFO_PLIST_CONTENT,
      );
      fs.writeFileSync(
        path.join(widgetDir, ENTITLEMENTS_FILENAME),
        ENTITLEMENTS_CONTENT,
      );

      return config;
    },
  ]);

/**
 * Step 2: mutate the parsed pbxproj to add the widget target with all
 * its plumbing. The Xcode lib gives us a fairly high-level API
 * (addTarget / addBuildPhase / addPbxGroup / addTargetDependency), so
 * the heavy lifting is mostly hand-off.
 */
const withWidgetXcodeTarget = (config) =>
  withXcodeProject(config, (config) => {
    const proj = config.modResults;

    // Idempotency: if a target with this name already exists, skip
    // re-adding everything. Re-running prebuild without --clean is a
    // no-op then.
    const nativeTargets = proj.pbxNativeTargetSection();
    const alreadyExists = Object.entries(nativeTargets).some(
      ([key, value]) =>
        !key.endsWith('_comment') &&
        typeof value === 'object' &&
        value !== null &&
        (value.name === WIDGET_NAME || value.name === `"${WIDGET_NAME}"`),
    );
    if (alreadyExists) {
      return config;
    }

    // Register the widget folder as a PbxGroup under the project root
    // so the files appear in the Xcode navigator.
    const groupFiles = [
      ...SWIFT_FILES,
      INFO_PLIST_FILENAME,
      ENTITLEMENTS_FILENAME,
    ];
    proj.addPbxGroup(groupFiles, WIDGET_NAME, WIDGET_NAME);

    // Hook the new group into the project's main group so it shows up.
    const mainGroupKey = proj.getFirstProject().firstProject.mainGroup;
    const widgetGroupKey = (() => {
      const groups = proj.hash.project.objects.PBXGroup;
      for (const [key, value] of Object.entries(groups)) {
        if (key.endsWith('_comment')) continue;
        if (
          typeof value === 'object' &&
          value !== null &&
          (value.name === WIDGET_NAME || value.path === WIDGET_NAME)
        ) {
          return key;
        }
      }
      return null;
    })();
    if (widgetGroupKey) {
      const mainGroup = proj.hash.project.objects.PBXGroup[mainGroupKey];
      const alreadyChild = (mainGroup.children || []).some(
        (c) => c.value === widgetGroupKey,
      );
      if (!alreadyChild) {
        mainGroup.children = mainGroup.children || [];
        mainGroup.children.push({
          value: widgetGroupKey,
          comment: WIDGET_NAME,
        });
      }
    }

    // Create the widget target. xcode lib handles XCConfigurationList,
    // PBXNativeTarget, product file ref, AND embedding into the first
    // target's CopyFiles phase when type === 'app_extension'.
    const target = proj.addTarget(
      WIDGET_NAME,
      'app_extension',
      WIDGET_NAME,
      WIDGET_BUNDLE_ID,
    );

    // Sources / Frameworks / Resources build phases.
    proj.addBuildPhase(
      SWIFT_FILES,
      'PBXSourcesBuildPhase',
      'Sources',
      target.uuid,
    );
    proj.addBuildPhase(
      [],
      'PBXFrameworksBuildPhase',
      'Frameworks',
      target.uuid,
    );
    proj.addBuildPhase(
      [],
      'PBXResourcesBuildPhase',
      'Resources',
      target.uuid,
    );

    // Override / extend build settings on both Debug and Release
    // configurations of the widget target. xcode lib's addTarget gave
    // us a minimal config; we layer the iOS 17 deployment, Swift
    // version, entitlements, custom Info.plist path, and signing
    // settings on top.
    const configList =
      proj.hash.project.objects.XCConfigurationList[
        proj.hash.project.objects.PBXNativeTarget[target.uuid]
          .buildConfigurationList
      ];
    const configKeys = (configList.buildConfigurations || []).map(
      (c) => c.value,
    );
    const xcConfigs = proj.hash.project.objects.XCBuildConfiguration;
    for (const key of configKeys) {
      const conf = xcConfigs[key];
      if (!conf || typeof conf !== 'object') continue;
      const settings = conf.buildSettings || {};
      settings.IPHONEOS_DEPLOYMENT_TARGET = DEPLOYMENT_TARGET;
      settings.SWIFT_VERSION = SWIFT_VERSION;
      settings.TARGETED_DEVICE_FAMILY = '"1,2"';
      settings.GENERATE_INFOPLIST_FILE = 'NO';
      settings.INFOPLIST_FILE = `${WIDGET_NAME}/${INFO_PLIST_FILENAME}`;
      settings.CODE_SIGN_ENTITLEMENTS = `${WIDGET_NAME}/${ENTITLEMENTS_FILENAME}`;
      settings.CODE_SIGN_STYLE = 'Automatic';
      settings.CURRENT_PROJECT_VERSION = '"$(CURRENT_PROJECT_VERSION)"';
      settings.MARKETING_VERSION = '"$(MARKETING_VERSION)"';
      settings.PRODUCT_NAME = `"${WIDGET_NAME}"`;
      settings.SKIP_INSTALL = 'YES';
      settings.LD_RUNPATH_SEARCH_PATHS =
        '"$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks"';
      settings.SWIFT_EMIT_LOC_STRINGS = 'YES';
      conf.buildSettings = settings;
    }

    // Make the main app target depend on the widget so Xcode builds
    // them in the correct order. xcode lib's addTarget already added
    // a CopyFiles phase that embeds the .appex inside the main app.
    const mainTargetUuid = proj.getFirstTarget().uuid;
    proj.addTargetDependency(mainTargetUuid, [target.uuid]);

    return config;
  });

module.exports = (config) => {
  config = withWidgetFiles(config);
  config = withWidgetXcodeTarget(config);
  return config;
};
