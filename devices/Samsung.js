'use strict';
/* Samsung Laptops */
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import * as Helper from '../lib/helper.js';

const {exitCode, fileExists, readFileInt, runCommandCtl, writeFileInt} = Helper;

const LEGACY_PATH = '/sys/devices/platform/samsung/battery_life_extender';
const GALAXYBOOK_PATH = '/sys/class/power_supply/BAT1/charge_control_end_threshold';

export const SamsungSingleBattery = GObject.registerClass({
    Signals: {'threshold-applied': {param_types: [GObject.TYPE_STRING]}},
}, class SamsungSingleBattery extends GObject.Object {
    constructor(settings) {
        super();
        this.name = 'Samsung';
        this.type = 6;
        this.deviceNeedRootPermission = true;
        this.deviceHaveDualBattery = false;
        this.deviceHaveStartThreshold = false;
        this.deviceHaveVariableThreshold = false;
        this.deviceHaveBalancedMode = false;
        this.deviceHaveAdaptiveMode = false;
        this.deviceHaveExpressMode = false;
        this.deviceUsesModeNotValue = true;

        this._settings = settings;
        this.ctlPath = null;

        // Determina qual caminho está disponível
        if (fileExists(GALAXYBOOK_PATH)) {
            this._path = GALAXYBOOK_PATH;
            this._mode = 'galaxybook';
        } else if (fileExists(LEGACY_PATH)) {
            this._path = LEGACY_PATH;
            this._mode = 'legacy';
        } else {
            this._path = null;
            this._mode = null;
        }
    }

    isAvailable() {
        if (!this._path)
            return false;
        this._settings.set_int('icon-style-type', 0);
        return true;
    }

    async setThresholdLimit(chargingMode) {
        if (!this._path)
            return exitCode.ERROR;

        if (chargingMode === 'ful')
            this._batteryLifeExtender = this._mode === 'galaxybook' ? 100 : 0;
        else if (chargingMode === 'max')
            this._batteryLifeExtender = this._mode === 'galaxybook' ? 85 : 1;

        if (this._verifyThreshold())
            return exitCode.SUCCESS;

        let status;
        if (this._mode === 'galaxybook') {
            const success = writeFileInt(this._path, this._batteryLifeExtender);
            status = success ? exitCode.SUCCESS : exitCode.ERROR;
        } else {
            [status] = await runCommandCtl(this.ctlPath, 'SAMSUNG', `${this._batteryLifeExtender}`);
        }

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
        const batteryLifeExtender = readFileInt(this._path);
        this.mode = (this._mode === 'galaxybook')
            ? (batteryLifeExtender === 85 ? 'max' : 'ful')
            : (batteryLifeExtender === 1 ? 'max' : 'ful');

        if (this._batteryLifeExtender === batteryLifeExtender) {
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
