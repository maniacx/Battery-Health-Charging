'use strict';
/* Apple Mac book with Intel processors using dkms https://github.com/c---/applesmc-next  */
const {GLib, GObject} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Helper = Me.imports.lib.helper;
const {fileExists, readFileInt, runCommandCtl} = Helper;

const VENDOR_APPLE = '/sys/module/applesmc';
const BAT0_END_PATH = '/sys/class/power_supply/BAT0/charge_control_end_threshold';

var AppleSingleBattery = GObject.registerClass({
    Signals: {'threshold-applied': {param_types: [GObject.TYPE_STRING]}},
}, class AppleSingleBattery extends GObject.Object {
    constructor(settings) {
        super();
        this.name = 'Apple';
        this.type = 16;
        this.deviceNeedRootPermission = true;
        this.deviceHaveDualBattery = false;
        this.deviceHaveStartThreshold = false;
        this.deviceHaveVariableThreshold = true;
        this.deviceHaveBalancedMode = true;
        this.deviceHaveAdaptiveMode = false;
        this.deviceHaveExpressMode = false;
        this.deviceUsesModeNotValue = false;
        this.iconForFullCapMode = '100';
        this.iconForBalanceMode = '080';
        this.iconForMaxLifeMode = '060';
        this.endFullCapacityRangeMax = 100;
        this.endFullCapacityRangeMin = 80;
        this.endBalancedRangeMax = 85;
        this.endBalancedRangeMin = 65;
        this.endMaxLifeSpanRangeMax = 85;
        this.endMaxLifeSpanRangeMin = 50;
        this.incrementsStep = 1;
        this.incrementsPage = 5;

        this._settings = settings;
    }

    isAvailable() {
        if (!fileExists(VENDOR_APPLE))
            return false;
        if (!fileExists(BAT0_END_PATH))
            return false;
        this._chargingDisable = false;
        this._settings.connectObject(
            'changed::apple-charging-led', () => {
                this._chargingLedStatusChanged = true;
                this.setThresholdLimit(this._settings.get_string('charging-mode'));
            },
            this
        );
        return true;
    }

    async setThresholdLimit(chargingMode) {
        let chargingLedValue;
        this._status = 0;
        const ctlPath = this._settings.get_string('ctl-path');
        this._endValue = this._settings.get_int(`current-${chargingMode}-end-threshold`);
        if (!this._chargingLedStatusChanged && this._verifyThreshold())
            return this._status;
        const chargingLed = this._settings.get_boolean('apple-charging-led');

        if (this._chargingLedStatusChanged) {
            if (chargingLed)
                chargingLedValue = this._endValue >= 97 ? 95 : this._endValue - 2;
            else
                chargingLedValue = 95;
            this._chargingLedStatusChanged = false;
        } else if (chargingLed) {
            chargingLedValue = this._endValue >= 97 ? 95 : this._endValue - 2;
        } else {
            chargingLedValue = 0;
        }

        [this._status] = await runCommandCtl(ctlPath, 'APPLE', `${this._endValue}`, `${chargingLedValue}`, null);
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
        this.endLimitValue = readFileInt(BAT0_END_PATH);
        if (this._endValue === this.endLimitValue) {
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
        this._settings.disconnectObject(this);
        this._settings = null;
    }
});
