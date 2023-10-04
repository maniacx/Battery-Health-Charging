'use strict';
/* Tuxedo Laptops using dkms https://github.com/tuxedocomputers/tuxedo-keyboard */
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import * as Helper from '../lib/helper.js';

const {fileExists, readFile, runCommandCtl} = Helper;

const TUXEDO_AVAILABLE_PROFILE_PATH = '/sys/devices/platform/tuxedo_keyboard/charging_profile/charging_profiles_available';
const TUXEDO_PATH = '/sys/devices/platform/tuxedo_keyboard/charging_profile/charging_profile';

export const Tuxedo3ModesSingleBattery = GObject.registerClass({
    Signals: {'threshold-applied': {param_types: [GObject.TYPE_STRING]}},
}, class Tuxedo3ModesSingleBattery extends GObject.Object {
    constructor(settings) {
        super();
        this.name = 'Tuxedo';
        this.type = 27;
        this.deviceNeedRootPermission = true;
        this.deviceHaveDualBattery = false;
        this.deviceHaveStartThreshold = false;
        this.deviceHaveVariableThreshold = false;
        this.deviceHaveBalancedMode = true;
        this.deviceHaveAdaptiveMode = false;
        this.deviceHaveExpressMode = false;
        this.deviceUsesModeNotValue = false;
        this.iconForFullCapMode = '100';
        this.iconForBalanceMode = '090';
        this.iconForMaxLifeMode = '080';

        this._settings = settings;
    }

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
        const ctlPath = this._settings.get_string('ctl-path');
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
        [this._status] = await runCommandCtl(ctlPath, 'TUXEDO', this._profile, null, null);
        if (this._status === 0) {
            if (this._verifyThreshold())
                return this._status;
        }

        if (this._delayReadTimeoutId)
            GLib.source_remove(this._delayReadTimeoutId);
        this._delayReadTimeoutId = null;
        this._delayReadTimeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 200, () => {
            this._reVerifyThreshold();
            this._delayReadTimeoutId = null;
            return GLib.SOURCE_REMOVE;
        });
        return this._status;
    }

    _verifyThreshold() {
        const currentProfile = readFile(TUXEDO_PATH).replace('\n', '');
        if (this._profile === currentProfile) {
            this.endLimitValue = this._limit;
            this.emit('threshold-applied', 'success');
            return true;
        }
        return false;
    }

    _reVerifyThreshold() {
        if (this._status === 0) {
            if (this._verifyThreshold())
                return;
        }
        this.emit('threshold-applied', 'failed');
    }

    destroy() {
        if (this._delayReadTimeoutId)
            GLib.source_remove(this._delayReadTimeoutId);
        this._delayReadTimeoutId = null;
    }
});

