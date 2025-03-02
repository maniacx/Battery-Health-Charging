'use strict';
/* Apple Mac book with M-series processor - Asahi linux Laptops https://asahilinux.org/ */
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import * as Helper from '../lib/helper.js';

const {exitCode, fileExists, readFile, readFileInt, runCommandCtl} = Helper;

const ASAHI_END_PATH = '/sys/class/power_supply/macsmc-battery/charge_control_end_threshold';
const ASAHI_START_PATH = '/sys/class/power_supply/macsmc-battery/charge_control_start_threshold';
const KERNEL_VERSION_PATH = '/proc/sys/kernel/osrelease';

export const AsahiSingleBattery62 = GObject.registerClass({
    Signals: {'threshold-applied': {param_types: [GObject.TYPE_STRING]}},
}, class AsahiSingleBattery62 extends GObject.Object {
    constructor(settings) {
        super();
        this.name = 'AppleAsahiLinux-VariableThreshold';
        this.type = 25;
        this.deviceNeedRootPermission = true;
        this.deviceHaveDualBattery = false;
        this.deviceHaveStartThreshold = true;
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
        this.endMaxLifeSpanRangeMin = 52;
        this.startFullCapacityRangeMax = 98;
        this.startFullCapacityRangeMin = 75;
        this.startBalancedRangeMax = 83;
        this.startBalancedRangeMin = 60;
        this.startMaxLifeSpanRangeMax = 83;
        this.startMaxLifeSpanRangeMin = 50;
        this.minDiffLimit = 2;
        this.incrementsStep = 1;
        this.incrementsPage = 5;

        this._settings = settings;
        this.ctlPath = null;
    }

    isAvailable() {
        if (!fileExists(ASAHI_END_PATH))
            return false;
        if (!fileExists(ASAHI_START_PATH))
            return false;
        const kernelVersion = readFile(KERNEL_VERSION_PATH).trim().split('.', 2);
        if (parseInt(kernelVersion[0]) >= 6 && parseInt(kernelVersion[1]) >= 3)
            return false;
        return true;
    }

    async setThresholdLimit(chargingMode) {
        this._endValue = this._settings.get_int(`current-${chargingMode}-end-threshold`);
        this._startValue = this._settings.get_int(`current-${chargingMode}-start-threshold`);

        if (this._verifyThreshold())
            return exitCode.SUCCESS;

        const [status] = await runCommandCtl(this.ctlPath, 'ASAHI_END_START', `${this._endValue}`, `${this._startValue}`);
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
        this.endLimitValue = readFileInt(ASAHI_END_PATH);
        this.startLimitValue = readFileInt(ASAHI_START_PATH);
        if (this._endValue === this.endLimitValue && this._startValue === this.startLimitValue) {
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

export const AsahiSingleBattery63 = GObject.registerClass({
    Signals: {'threshold-applied': {param_types: [GObject.TYPE_STRING]}},
}, class AsahiSingleBattery63 extends GObject.Object {
    constructor(settings) {
        super();
        this.name = 'AppleAsahiLinux-FixedThreshold';
        this.type = 29;
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
        if (!fileExists(ASAHI_END_PATH))
            return false;
        if (!fileExists(ASAHI_START_PATH))
            return false;
        const kernelVersion = readFile(KERNEL_VERSION_PATH).trim().split('.', 2);
        if (parseInt(kernelVersion[0]) <= 6 && parseInt(kernelVersion[1]) <= 2)
            return false;
        return true;
    }

    async setThresholdLimit(chargingMode) {
        this._status = 0;
        if (chargingMode === 'ful') {
            this._endValue = 100;
            this._startValue = 100;
        } else if (chargingMode === 'max') {
            this._endValue = 80;
            this._startValue = 75;
        }

        if (this._verifyThreshold())
            return exitCode.SUCCESS;

        const [status] = await runCommandCtl(this.ctlPath, 'ASAHI_END_START', `${this._endValue}`, `${this._startValue}`);
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
        this.endLimitValue = readFileInt(ASAHI_END_PATH);
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
    }
});


