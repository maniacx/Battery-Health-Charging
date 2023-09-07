'use strict';
/* Apple Mac book with M-series processor - Asahi linux Laptops https://asahilinux.org/ */
const {GLib, GObject} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Helper = Me.imports.lib.helper;
const {fileExists, readFile, readFileInt, runCommandCtl} = Helper;

const ASAHI_END_PATH = '/sys/class/power_supply/macsmc-battery/charge_control_end_threshold';
const ASAHI_START_PATH = '/sys/class/power_supply/macsmc-battery/charge_control_start_threshold';
const KERNEL_VERSION_PATH = '/proc/sys/kernel/osrelease';

var AsahiSingleBattery62 = GObject.registerClass({
    Signals: {'threshold-applied': {param_types: [GObject.TYPE_BOOLEAN]}},
}, class AsahiSingleBattery62 extends GObject.Object {
    name = 'AppleAsahiLinux-VariableThreshold';
    type = 25;
    deviceNeedRootPermission = true;
    deviceHaveDualBattery = false;
    deviceHaveStartThreshold = true;
    deviceHaveVariableThreshold = true;
    deviceHaveBalancedMode = true;
    deviceHaveAdaptiveMode = false;
    deviceHaveExpressMode = false;
    deviceUsesModeNotValue = false;
    iconForFullCapMode = '100';
    iconForBalanceMode = '080';
    iconForMaxLifeMode = '060';
    endFullCapacityRangeMax = 100;
    endFullCapacityRangeMin = 80;
    endBalancedRangeMax = 85;
    endBalancedRangeMin = 65;
    endMaxLifeSpanRangeMax = 85;
    endMaxLifeSpanRangeMin = 52;
    startFullCapacityRangeMax = 98;
    startFullCapacityRangeMin = 75;
    startBalancedRangeMax = 83;
    startBalancedRangeMin = 60;
    startMaxLifeSpanRangeMax = 83;
    startMaxLifeSpanRangeMin = 50;
    minDiffLimit = 2;

    isAvailable() {
        if (!fileExists(ASAHI_END_PATH))
            return false;
        if (!fileExists(ASAHI_START_PATH))
            return false;
        const kernelVersion = readFile(KERNEL_VERSION_PATH).trim().split('.', 2);
        if ((parseInt(kernelVersion[0]) >= 6) && (parseInt(kernelVersion[1]) >= 3))
            return false;
        return true;
    }

    async setThresholdLimit(chargingMode) {
        this._status = 0;
        this._endValue = ExtensionUtils.getSettings().get_int(`current-${chargingMode}-end-threshold`);
        this._startValue = ExtensionUtils.getSettings().get_int(`current-${chargingMode}-start-threshold`);
        if (this._verifyThreshold())
            return this._status;
        this._status = await runCommandCtl('ASAHI_END_START', `${this._endValue}`, `${this._startValue}`, false);
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
        this.endLimitValue = readFileInt(ASAHI_END_PATH);
        this.startLimitValue = readFileInt(ASAHI_START_PATH);
        if ((this._endValue === this.endLimitValue) && (this._startValue === this.startLimitValue)) {
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

var AsahiSingleBattery63 = GObject.registerClass({
    Signals: {'threshold-applied': {param_types: [GObject.TYPE_BOOLEAN]}},
}, class AsahiSingleBattery63 extends GObject.Object {
    name = 'AppleAsahiLinux-FixedThreshold';
    type = 29;
    deviceNeedRootPermission = true;
    deviceHaveDualBattery = false;
    deviceHaveStartThreshold = false;
    deviceHaveVariableThreshold = false;
    deviceHaveBalancedMode = false;
    deviceHaveAdaptiveMode = false;
    deviceHaveExpressMode = false;
    deviceUsesModeNotValue = false;
    iconForFullCapMode = '100';
    iconForMaxLifeMode = '080';

    isAvailable() {
        if (!fileExists(ASAHI_END_PATH))
            return false;
        if (!fileExists(ASAHI_START_PATH))
            return false;
        const kernelVersion = readFile(KERNEL_VERSION_PATH).trim().split('.', 2);
        if ((parseInt(kernelVersion[0]) <= 6) && (parseInt(kernelVersion[1]) <= 2))
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
            return this._status;
        this._status = await runCommandCtl('ASAHI_END_START', `${this._endValue}`, `${this._startValue}`, false);
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
        this.endLimitValue = readFileInt(ASAHI_END_PATH);
        if (this._endValue === this.endLimitValue) {
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


