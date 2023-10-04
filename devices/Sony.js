'use strict';
/* Sony Laptops */
const {GLib, GObject} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Helper = Me.imports.lib.helper;
const {fileExists, readFileInt, runCommandCtl} = Helper;

const SONY_PATH = '/sys/devices/platform/sony-laptop/battery_care_limiter';
const SONY_HIGHSPEED_CHARGING_PATH = '/sys/devices/platform/sony-laptop/battery_highspeed_charging';

var SonySingleBattery = GObject.registerClass({
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
    }

    isAvailable() {
        if (!fileExists(SONY_PATH))
            return false;
        if (fileExists(SONY_HIGHSPEED_CHARGING_PATH))
            this.deviceHaveExpressMode = true;
        return true;
    }

    async setThresholdLimit(chargingMode) {
        this._status = 0;
        this._updateHighSpeedCharging = false;
        let highSpeedCharging = 'unsupported';
        const ctlPath = this._settings.get_string('ctl-path');
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
            return this._status;
        if (this._updateHighSpeedCharging) {
            if (this._highSpeedCharging === 1)
                highSpeedCharging = 'on';
            else if (this._highSpeedCharging === 0)
                highSpeedCharging = 'off';
        }
        [this._status] = await runCommandCtl(ctlPath, 'SONY', `${this._batteryCareLimiter}`, highSpeedCharging, null);
        if (this._status === 0) {
            if (this._verifyThreshold()) {
                this._updateHighSpeedCharging = false;
                return this._status;
            }
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
        if (this.deviceHaveExpressMode && this._highSpeedCharging !== readFileInt(SONY_HIGHSPEED_CHARGING_PATH)) {
            this._updateHighSpeedCharging = true;
            return false;
        }
        const endLimitValue  = readFileInt(SONY_PATH);
        if (this._batteryCareLimiter !== endLimitValue)
            return false;
        this._updateHighSpeedCharging = false;
        this.mode = this._chargingMode;
        this.endLimitValue = endLimitValue === 0 ? 100 : endLimitValue;
        this.emit('threshold-applied', 'success');
        return true;
    }

    _reVerifyThreshold() {
        if (this._status === 0) {
            if (this._verifyThreshold()) {
                this._updateHighSpeedCharging = false;
                return;
            }
        }
        this.emit('threshold-applied', 'failed');
    }

    destroy() {
        if (this._delayReadTimeoutId)
            GLib.source_remove(this._delayReadTimeoutId);
        this._delayReadTimeoutId = null;
    }
});


