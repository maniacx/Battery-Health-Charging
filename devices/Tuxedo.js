'use strict';
/* Tuxedo Laptop using dkms https://github.com/tuxedocomputers/tuxedo-keyboard */
const {GObject} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Helper = Me.imports.lib.helper;
const {fileExists, readFile, runCommandCtl} = Helper;

const TUXEDO_AVAILABLE_PROFILE_PATH = '/sys/devices/platform/tuxedo_keyboard/charging_profile/charging_profiles_available';
const TUXEDO_PATH = '/sys/devices/platform/tuxedo_keyboard/charging_profile/charging_profile';

var Tuxedo3ModesSingleBattery = GObject.registerClass({
    Signals: {'read-completed': {}},
}, class Tuxedo3ModesSingleBattery extends GObject.Object {
    name = 'Tuxedo with Single Battery with 3 modes';
    type = 27;
    deviceNeedRootPermission = true;
    deviceHaveDualBattery = false;
    deviceHaveStartThreshold = false;
    deviceHaveVariableThreshold = false;
    deviceHaveBalancedMode = true;
    deviceHaveAdaptiveMode = false;
    deviceHaveExpressMode = false;
    iconForFullCapMode = '100';
    iconForBalanceMode = '090';
    iconForMaxLifeMode = '080';

    isAvailable() {
        if (!fileExists(TUXEDO_PATH))
            return false;
        if (!fileExists(TUXEDO_AVAILABLE_PROFILE_PATH))
            return false;
        if (readFile(TUXEDO_AVAILABLE_PROFILE_PATH).replace('\n', '') !== 'high_capacity balanced stationary')
            return false;

        return true;
    }

    async setThresholdLimit(chargingMode) {
        let profile, limit;
        if (chargingMode === 'ful') {
            profile = 'high_capacity';
            limit = 100;
        } else if (chargingMode === 'bal') {
            profile = 'balanced';
            limit = 90;
        } else if (chargingMode === 'max') {
            profile = 'stationary';
            limit = 80;
        }
        if (readFile(TUXEDO_PATH).replace('\n', '') === profile) {
            this.endLimitValue = limit;
            this.emit('read-completed');
            return 0;
        }
        let status = await runCommandCtl('TUXEDO', profile, null, false);
        if (status === 0)  {
            let currentProfile = readFile(TUXEDO_PATH).replace('\n', '');
            if (profile === currentProfile) {
                this.endLimitValue = limit;
                this.emit('read-completed');
                return 0;
            }
        }
        log('Battery Health Charging: Error threshold values not updated');
        return 1;
    }
});

