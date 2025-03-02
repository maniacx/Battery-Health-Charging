'use strict';
/* Apple Mac book with Intel processors using dkms https://github.com/c---/applesmc-next  */
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import * as Helper from '../lib/helper.js';

const {exitCode, fileExists, readFileInt, runCommandCtl} = Helper;

const VENDOR_APPLE = '/sys/module/applesmc';
const BAT0_END_PATH = '/sys/class/power_supply/BAT0/charge_control_end_threshold';

export const AppleSingleBattery = GObject.registerClass({
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
        this.ctlPath = null;
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
        this._endValue = this._settings.get_int(`current-${chargingMode}-end-threshold`);
        if (!this._chargingLedStatusChanged && this._verifyThreshold())
            return exitCode.SUCCESS;

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

        const [status] = await runCommandCtl(this.ctlPath, 'APPLE', `${this._endValue}`, `${chargingLedValue}`);
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
        this.endLimitValue = readFileInt(BAT0_END_PATH);
        if (this._endValue === this.endLimitValue) {
            this.emit('threshold-applied', 'success');
            return true;
        }
        return false;
    }

    destroy() {
        if (this._delayReadTimeoutId)
            GLib.source_remove(this._delayReadTimeoutId);
        this._delayReadTimeoutId = null;
        this._settings.disconnectObject(this);
        this._settings = null;
    }
});
