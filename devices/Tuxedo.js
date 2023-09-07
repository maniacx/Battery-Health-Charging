'use strict';
/* Tuxedo Laptops using dkms https://github.com/tuxedocomputers/tuxedo-keyboard */
const {GLib, GObject} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Helper = Me.imports.lib.helper;
const {fileExists, readFile, runCommandCtl} = Helper;

const TUXEDO_AVAILABLE_PROFILE_PATH = '/sys/devices/platform/tuxedo_keyboard/charging_profile/charging_profiles_available';
const TUXEDO_PATH = '/sys/devices/platform/tuxedo_keyboard/charging_profile/charging_profile';

var Tuxedo3ModesSingleBattery = GObject.registerClass({
    Signals: {'threshold-applied': {param_types: [GObject.TYPE_BOOLEAN]}},
}, class Tuxedo3ModesSingleBattery extends GObject.Object {
    name = 'Tuxedo';
    type = 27;
    deviceNeedRootPermission = true;
    deviceHaveDualBattery = false;
    deviceHaveStartThreshold = false;
    deviceHaveVariableThreshold = false;
    deviceHaveBalancedMode = true;
    deviceHaveAdaptiveMode = false;
    deviceHaveExpressMode = false;
    deviceUsesModeNotValue = false;
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
        this._status = 0;
        this._chargingMode = chargingMode;
        if (this._chargingMode === 'ful') {
            this._profile = 'high_capacity';
            this._limit = 100;
        } else if (this._chargingMode === 'bal') {
            this._profile = 'balanced';
            this._limit = 90;
        } else if (this._chargingMode === 'max') {
            this._profile = 'stationary';
            this._limit = 80;
        }
        if (this._verifyThreshold())
            return this._status;
        this._status = await runCommandCtl('TUXEDO', this._profile, null, false);
        if (this._status === 0) {
            if (this._verifyThreshold())
                return this._status;
        }

        if (this._delayReadTimeoutId)
            GLib.source_remove(this._delayReadTimeoutId);
        delete this._delayReadTimeoutId;
        this._delayReadTimeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 200, () => {
            this._reVerifyThreshold();
            delete this._delayReadTimeoutId;
            return GLib.SOURCE_REMOVE;
        });
        return this._status;
    }

    _verifyThreshold() {
        const currentProfile = readFile(TUXEDO_PATH).replace('\n', '');
        if (this._profile === currentProfile) {
            this.endLimitValue = this._limit;
            this.emit('threshold-applied', true);
            return true;
        }
        return false;
    }

    _reVerifyThreshold() {
        if (this._status === 0) {
            if (this._verifyThreshold())
                return;
        }
        this.emit('threshold-applied', false);
    }

    destroy() {
        if (this._delayReadTimeoutId)
            GLib.source_remove(this._delayReadTimeoutId);
        delete this._delayReadTimeoutId;
    }
});

