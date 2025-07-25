'use strict';
/* Acer Laptops using dkms https://github.com/maxco2/acer-battery-wmi */
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import * as Helper from '../lib/helper.js';

const {exitCode, fileExists, readFileInt, runCommandCtl} = Helper;

const ACER2_PATH = '/sys/devices/platform/acer_battery_wmi/acer_battery/health_mode';

export const Acer2SingleBattery = GObject.registerClass({
    Signals: {'threshold-applied': {param_types: [GObject.TYPE_STRING]}},
}, class Acer2SingleBattery extends GObject.Object {
    constructor(settings) {
        super();
        this.name = 'Acer2';
        this.type = 39;
        this.deviceNeedRootPermission = true;
        this.deviceHaveDualBattery = false;
        this.deviceHaveStartThreshold = false;
        this.deviceHaveVariableThreshold = false;
        this.deviceHaveBalancedMode = false;
        this.deviceHaveAdaptiveMode = false;
        this.deviceHaveExpressMode = false;
        this.deviceUsesModeNotValue = false;
        this.iconForFullCapMode = '100';
        this.iconForMaxLifeMode = '080';

        this._settings = settings;
        this.ctlPath = null;
    }

    isAvailable() {
        if (!fileExists(ACER2_PATH))
            return false;
        return true;
    }

    async setThresholdLimit(chargingMode) {
        if (chargingMode === 'ful')
            this._healthMode = 0;
        else if (chargingMode === 'max')
            this._healthMode = 1;

        if (this._verifyThreshold())
            return exitCode.SUCCESS;

        const [status] = await runCommandCtl(this.ctlPath, 'ACER2', `${this._healthMode}`);
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
        const healthMode = readFileInt(ACER2_PATH);
        this.endLimitValue = healthMode === 1 ? 80 : 100;
        if (this._healthMode === healthMode) {
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

