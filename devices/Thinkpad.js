'use strict';
/* Thinkpad Laptops */
const {Gio, GLib, GObject} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Helper = Me.imports.lib.helper;
const {fileExists, readFileInt, runCommandCtl} = Helper;

const VENDOR_THINKPAD = '/sys/devices/platform/thinkpad_acpi';
const BAT0_END_PATH = '/sys/class/power_supply/BAT0/charge_control_end_threshold';
const BAT0_START_PATH = '/sys/class/power_supply/BAT0/charge_control_start_threshold';
const BAT1_END_PATH = '/sys/class/power_supply/BAT1/charge_control_end_threshold';
const BAT1_START_PATH = '/sys/class/power_supply/BAT1/charge_control_start_threshold';

var ThinkpadDualBattery = GObject.registerClass({
    Signals: {
        'threshold-applied': {param_types: [GObject.TYPE_BOOLEAN]},
        'battery-status-changed': {},
    },
}, class ThinkpadDualBattery extends GObject.Object {
    name = 'Thinkpad BAT0/BAT1';
    type = 19;
    deviceNeedRootPermission = true;
    deviceHaveDualBattery = true;
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
    endMaxLifeSpanRangeMin = 50;
    startFullCapacityRangeMax = 98;
    startFullCapacityRangeMin = 75;
    startBalancedRangeMax = 83;
    startBalancedRangeMin = 60;
    startMaxLifeSpanRangeMax = 83;
    startMaxLifeSpanRangeMin = 40;
    minDiffLimit = 2;

    isAvailable() {
        const deviceType = ExtensionUtils.getSettings().get_int('device-type');
        if (deviceType === 0) {
            if (!fileExists(VENDOR_THINKPAD))
                return false;
            if (!fileExists(BAT1_START_PATH))
                return false;
            if (!fileExists(BAT1_END_PATH))
                return false;
            if (!fileExists(BAT0_START_PATH))
                return false;
            if (!fileExists(BAT0_END_PATH))
                return false;
            this.battery0Removed = false;
            this.battery1Removed = false;
        } else if (deviceType === this.type) {
            this.battery0Removed = !fileExists(BAT0_END_PATH);
            this.battery1Removed = !fileExists(BAT1_END_PATH);
        }
        return true;
    }

    async setThresholdLimit(chargingMode) {
        if (this.battery0Removed)
            return 0;
        let status;
        const settings = ExtensionUtils.getSettings();
        const endValue = settings.get_int(`current-${chargingMode}-end-threshold`);
        const startValue = settings.get_int(`current-${chargingMode}-start-threshold`);
        const oldEndValue = readFileInt(BAT0_END_PATH);
        const oldStartValue = readFileInt(BAT0_START_PATH);
        if ((oldEndValue === endValue) && (oldStartValue === startValue)) {
            this.endLimitValue = endValue;
            this.startLimitValue = startValue;
            this.emit('threshold-applied', true);
            return 0;
        }
        // Some device wont update end threshold if start threshold > end threshold
        if (startValue >= oldEndValue)
            status = await runCommandCtl('BAT0_END_START', `${endValue}`, `${startValue}`, false);
        else
            status = await runCommandCtl('BAT0_START_END', `${endValue}`, `${startValue}`, false);
        if (status === 0) {
            this.endLimitValue = readFileInt(BAT0_END_PATH);
            this.startLimitValue = readFileInt(BAT0_START_PATH);
            if ((endValue === this.endLimitValue) && (startValue === this.startLimitValue)) {
                this.emit('threshold-applied', true);
                return 0;
            }
        }
        this.emit('threshold-applied', false);
        return 1;
    }

    async setThresholdLimit2(chargingMode2) {
        if (this.battery1Removed)
            return 0;
        let status;
        const settings = ExtensionUtils.getSettings();
        const endValue = settings.get_int(`current-${chargingMode2}-end-threshold2`);
        const startValue = settings.get_int(`current-${chargingMode2}-start-threshold2`);
        const oldEndValue = readFileInt(BAT1_END_PATH);
        const oldStartValue = readFileInt(BAT1_START_PATH);
        if ((oldEndValue === endValue) && (oldStartValue === startValue)) {
            this.endLimit2Value = endValue;
            this.startLimit2Value = startValue;
            this.emit('threshold-applied', true);
            return 0;
        }
        // Some device wont update end threshold if start threshold > end threshold
        if (startValue >= oldEndValue)
            status = await runCommandCtl('BAT1_END_START', `${endValue}`, `${startValue}`, false);
        else
            status = await runCommandCtl('BAT1_START_END', `${endValue}`, `${startValue}`, false);
        if (status === 0) {
            this.endLimit2Value = readFileInt(BAT1_END_PATH);
            this.startLimit2Value = readFileInt(BAT1_START_PATH);
            if ((endValue === this.endLimit2Value) && (startValue === this.startLimit2Value)) {
                this.emit('threshold-applied', true);
                return 0;
            }
        }
        return 1;
    }

    async setThresholdLimitDual() {
        let status = await this.setThresholdLimit(ExtensionUtils.getSettings().get_string('charging-mode'));
        if (status === 0)
            status = await this.setThresholdLimit2(ExtensionUtils.getSettings().get_string('charging-mode2'));
        return status;
    }

    initializeBatteryMonitoring() {
        this._battery0LevelPath = Gio.File.new_for_path(BAT0_END_PATH);
        this._monitorLevel = this._battery0LevelPath.monitor_file(Gio.FileMonitorFlags.NONE, null);
        this._monitorLevelId = this._monitorLevel.connect('changed', (obj, theFile, otherFile, eventType) => {
            if (eventType === Gio.FileMonitorEvent.DELETED) {
                this.battery0Removed = true;
                this.emit('battery-status-changed');
            }
            if (eventType === Gio.FileMonitorEvent.CREATED) {
                this.battery0Removed = false;
                this.setThresholdLimit(ExtensionUtils.getSettings().get_string('charging-mode'));
                this.emit('battery-status-changed');
            }
        });

        this._battery1LevelPath = Gio.File.new_for_path(BAT1_END_PATH);
        this._monitorLevel2 = this._battery1LevelPath.monitor_file(Gio.FileMonitorFlags.NONE, null);
        this._monitorLevel2Id = this._monitorLevel2.connect('changed', (obj, theFile, otherFile, eventType) => {
            if (eventType === Gio.FileMonitorEvent.DELETED) {
                this.battery1Removed = true;
                this.emit('battery-status-changed');
            }
            if (eventType === Gio.FileMonitorEvent.CREATED) {
                this.battery1Removed = false;
                this.setThresholdLimit2(ExtensionUtils.getSettings().get_string('charging-mode2'));
                this.emit('battery-status-changed');
            }
        });
    }

    destroy() {
        if (this._monitorLevelId)
            this._monitorLevel.disconnect(this._monitorLevelId);
        this._monitorLevelId = null;
        if (this._monitorLevel)
            this._monitorLevel.cancel();
        this._monitorLevel = null;
        this._battery0LevelPath = null;

        if (this._monitorLevel2Id)
            this._monitorLevel2.disconnect(this._monitorLevel2Id);
        this._monitorLevel2Id = null;
        if (this._monitorLevel2)
            this._monitorLevel2.cancel();
        this._monitorLevel2 = null;
        this._battery1LevelPath = null;
    }
});

var ThinkpadSingleBatteryBAT0 = GObject.registerClass({
    Signals: {'threshold-applied': {param_types: [GObject.TYPE_BOOLEAN]}},
}, class ThinkpadSingleBatteryBAT0 extends GObject.Object {
    name = 'Thinkpad BAT0';
    type = 20;
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
    endMaxLifeSpanRangeMin = 50;
    startFullCapacityRangeMax = 98;
    startFullCapacityRangeMin = 75;
    startBalancedRangeMax = 83;
    startBalancedRangeMin = 60;
    startMaxLifeSpanRangeMax = 83;
    startMaxLifeSpanRangeMin = 40;
    minDiffLimit = 2;

    isAvailable() {
        if (!fileExists(VENDOR_THINKPAD))
            return false;
        if (!fileExists(BAT0_START_PATH))
            return false;
        if (!fileExists(BAT0_END_PATH))
            return false;
        if (fileExists(BAT1_END_PATH))
            return false;
        return true;
    }

    async setThresholdLimit(chargingMode) {
        this._status = 0;
        this._endValue = ExtensionUtils.getSettings().get_int(`current-${chargingMode}-end-threshold`);
        this._startValue = ExtensionUtils.getSettings().get_int(`current-${chargingMode}-start-threshold`);
        if (this._verifyThreshold())
            return this._status;
        // Some device wont update end threshold if start threshold > end threshold
        if (this._startValue >= this._oldEndValue)
            this._status = await runCommandCtl('BAT0_END_START', `${this._endValue}`, `${this._startValue}`, false);
        else
            this._status = await runCommandCtl('BAT0_START_END', `${this._endValue}`, `${this._startValue}`, false);

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
        this._oldEndValue = readFileInt(BAT0_END_PATH);
        this._oldStartValue = readFileInt(BAT0_START_PATH);
        if ((this._oldEndValue === this._endValue) && (this._oldStartValue === this._startValue)) {
            this.endLimitValue = this._endValue;
            this.startLimitValue = this._startValue;
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

var ThinkpadSingleBatteryBAT1 = GObject.registerClass({
    Signals: {'threshold-applied': {param_types: [GObject.TYPE_BOOLEAN]}},
}, class ThinkpadSingleBatteryBAT1 extends GObject.Object {
    name = 'Thinkpad BAT1';
    type = 21;
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
    endMaxLifeSpanRangeMin = 50;
    startFullCapacityRangeMax = 98;
    startFullCapacityRangeMin = 75;
    startBalancedRangeMax = 83;
    startBalancedRangeMin = 60;
    startMaxLifeSpanRangeMax = 83;
    startMaxLifeSpanRangeMin = 40;
    minDiffLimit = 2;

    isAvailable() {
        if (!fileExists(VENDOR_THINKPAD))
            return false;
        if (!fileExists(BAT1_START_PATH))
            return false;
        if (!fileExists(BAT1_END_PATH))
            return false;
        if (fileExists(BAT0_END_PATH))
            return false;
        return true;
    }

    async setThresholdLimit(chargingMode) {
        this._status = 0;
        this._endValue = ExtensionUtils.getSettings().get_int(`current-${chargingMode}-end-threshold`);
        this._startValue = ExtensionUtils.getSettings().get_int(`current-${chargingMode}-start-threshold`);
        if (this._verifyThreshold())
            return this._status;
        // Some device wont update end threshold if start threshold > end threshold
        if (this._startValue >= this._oldEndValue)
            this._status = await runCommandCtl('BAT1_END_START', `${this._endValue}`, `${this._startValue}`, false);
        else
            this._status = await runCommandCtl('BAT1_START_END', `${this._endValue}`, `${this._startValue}`, false);

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
        this._oldEndValue = readFileInt(BAT1_END_PATH);
        this._oldStartValue = readFileInt(BAT1_START_PATH);
        if ((this._oldEndValue === this._endValue) && (this._oldStartValue === this._startValue)) {
            this.endLimitValue = this._endValue;
            this.startLimitValue = this._startValue;
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

