'use strict';
/* Sony Laptops */
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import * as Helper from '../lib/helper.js';

const {exitCode, fileExists, readFileInt, runCommandCtl} = Helper;

const SONY_PATH = '/sys/devices/platform/sony-laptop/battery_care_limiter';
const SONY_HIGHSPEED_CHARGING_PATH = '/sys/devices/platform/sony-laptop/battery_highspeed_charging';

export const SonySingleBattery = GObject.registerClass({
    Signals: {'threshold-applied': {param_types: [GObject.TYPE_STRING]}},
}, class SonySingleBattery extends GObject.Object {
    constructor(settings) {
        super();
        this.name = 'Sony';
        this.type = 7;
        this.deviceNeedRootPermission = true;
        this.deviceHaveDualBattery = false;
        this.deviceHaveStartThreshold = false;
        this.deviceHaveVariableThreshold = false;
        this.deviceHaveBalancedMode = true;
        this.deviceHaveAdaptiveMode = false;
        this.deviceHaveExpressMode = false;
        this.deviceUsesModeNotValue = false;
        this.iconForFullCapMode = '100';
        this.iconForBalanceMode = '080';
        this.iconForMaxLifeMode = '050';

        this._settings = settings;
        this.ctlPath = null;
    }

    isAvailable() {
        if (!fileExists(SONY_PATH))
            return false;
        if (fileExists(SONY_HIGHSPEED_CHARGING_PATH))
            this.deviceHaveExpressMode = true;
        return true;
    }

    async setThresholdLimit(chargingMode) {
        this._updateHighSpeedCharging = false;
        let highSpeedCharging = 'unsupported';
        this._chargingMode = chargingMode;
        if (this._chargingMode === 'ful') {
            this._batteryCareLimiter = 0;
            this._highSpeedCharging = 0;
        } else if (this._chargingMode === 'bal') {
            this._batteryCareLimiter = 80;
            this._highSpeedCharging = 0;
        } else if (this._chargingMode === 'max') {
            this._batteryCareLimiter = 50;
            this._highSpeedCharging = 0;
        } else if (chargingMode === 'exp') {
            this._batteryCareLimiter = 0;
            this._highSpeedCharging = 1;
        }

        if (this._verifyThreshold())
            return exitCode.SUCCESS;

        if (this._updateHighSpeedCharging) {
            if (this._highSpeedCharging === 1)
                highSpeedCharging = 'on';
            else if (this._highSpeedCharging === 0)
                highSpeedCharging = 'off';
        }

        const [status] = await runCommandCtl(this.ctlPath, 'SONY', `${this._batteryCareLimiter}`, highSpeedCharging);
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
        if (this.deviceHaveExpressMode && this._highSpeedCharging !== readFileInt(SONY_HIGHSPEED_CHARGING_PATH)) {
            this._updateHighSpeedCharging = true;
            return false;
        }
        this._updateHighSpeedCharging = false;
        const endLimitValue  = readFileInt(SONY_PATH);
        this.endLimitValue = endLimitValue === 0 ? 100 : endLimitValue;
        if (this._batteryCareLimiter !== endLimitValue)
            return false;
        this.mode = this._chargingMode;
        this.emit('threshold-applied', 'success');
        return true;
    }


    destroy() {
        if (this._delayReadTimeoutId)
            GLib.source_remove(this._delayReadTimeoutId);
        this._delayReadTimeoutId = null;
    }
});


