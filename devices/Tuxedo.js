'use strict';
/* Tuxedo Laptops using dkms https://github.com/tuxedocomputers/tuxedo-keyboard */
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import * as Helper from '../lib/helper.js';

const {exitCode, fileExists, readFile, runCommandCtl} = Helper;

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
        this.ctlPath = null;
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
        if (chargingMode === 'ful') {
            this._profile = 'high_capacity';
            this._limit = 100;
        } else if (chargingMode === 'bal') {
            this._profile = 'balanced';
            this._limit = 90;
        } else if (chargingMode === 'max') {
            this._profile = 'stationary';
            this._limit = 80;
        }

        if (this._verifyThreshold())
            return exitCode.SUCCESS;

        const [status] = await runCommandCtl(this.ctlPath, 'TUXEDO', this._profile);
        if (status === exitCode.ERROR) {
            this.emit('threshold-applied', 'error');
            return exitCode.ERROR;
        } else if (status === exitCode.TIMEOUT) {
            this.emit('threshold-applied', 'timeout');
            return exitCode.ERROR;
        }

        if (this._verifyThreshold())
            return exitCode.SUCCESS;

        if (this._delayReadTimeoutId)
            GLib.source_remove(this._delayReadTimeoutId);
        this._delayReadTimeoutId = null;

        await new Promise(resolve => {
            this._delayReadTimeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 200, () => {
                resolve();
                this._delayReadTimeoutId = null;
                return GLib.SOURCE_REMOVE;
            });
        });

        if (this._verifyThreshold())
            return exitCode.SUCCESS;

        this.emit('threshold-applied', 'not-updated');
        return exitCode.ERROR;
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

    destroy() {
        if (this._delayReadTimeoutId)
            GLib.source_remove(this._delayReadTimeoutId);
        this._delayReadTimeoutId = null;
    }
});

