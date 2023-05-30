'use strict';
/* Toshiba Laptops */
const {Gio, GObject} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Helper = Me.imports.lib.helper;
const {fileExists, readFileInt, runCommandCtl} = Helper;

const VENDOR_TOSHIBA = '/sys/module/toshiba_acpi';
const BAT0_END_PATH = '/sys/class/power_supply/BAT0/charge_control_end_threshold';
const BAT1_END_PATH = '/sys/class/power_supply/BAT1/charge_control_end_threshold';
const BAT0_CAPACITY_PATH = '/sys/class/power_supply/BAT0/capacity';
const BAT1_CAPACITY_PATH = '/sys/class/power_supply/BAT1/capacity';

var ToshibaSingleBatteryBAT0 = GObject.registerClass({
    Signals: {
        'threshold-applied': {param_types: [GObject.TYPE_BOOLEAN]},
        'battery-level-changed': {},
    },
}, class ToshibaSingleBatteryBAT0 extends GObject.Object {
    name = 'Toshiba BAT0';
    type = 9;
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
    dischargeBeforeSet = 80;

    isAvailable() {
        if (!fileExists(VENDOR_TOSHIBA))
            return false;
        if (!fileExists(BAT0_END_PATH))
            return false;
        return true;
    }

    async setThresholdLimit(chargingMode) {
        let endValue;
        if (chargingMode === 'ful')
            endValue = 100;
        else if (chargingMode === 'max')
            endValue = 80;
        let status = await runCommandCtl('BAT0_END', `${endValue}`, null, false);
        if (status === 0)  {
            this.endLimitValue = endValue;
            this.emit('threshold-applied', true);
            return 0;
        }
        this.emit('threshold-applied', false);
        return 1;
    }

    initializeBatteryMonitoring() {
        this._batteryLevelPath = Gio.File.new_for_path(BAT0_CAPACITY_PATH);
        this._monitorLevel = this._batteryLevelPath.monitor_file(Gio.FileMonitorFlags.NONE, null);
        this._monitorLevelId = this._monitorLevel.connect('changed', (obj, theFile, otherFile, eventType) => {
            if (eventType === Gio.FileMonitorEvent.CHANGED) {
                if (fileExists(BAT0_CAPACITY_PATH)) {
                    const newLevel =  readFileInt(BAT0_CAPACITY_PATH);
                    if (newLevel !== this.batteryLevel) {
                        this.batteryLevel = newLevel;
                        this.emit('battery-level-changed');
                    }
                } else {
                    this.batteryLevel = 0;
                }
            }
        });

        if (fileExists(BAT0_CAPACITY_PATH))
            this.batteryLevel =  readFileInt(BAT0_CAPACITY_PATH);
        else
            this.batteryLevel = 0;
    }

    destroy() {
        if (this._monitorLevelId)
            this._monitorLevel.disconnect(this._monitorLevelId);
        this._monitorLevelId = null;
        this._monitorLevel.cancel();
        this._monitorLevel = null;
        this._batteryLevelPath = null;
    }
});

var ToshibaSingleBatteryBAT1 = GObject.registerClass({
    Signals: {
        'threshold-applied': {param_types: [GObject.TYPE_BOOLEAN]},
        'battery-level-changed': {},
    },
}, class ToshibaSingleBatteryBAT1 extends GObject.Object {
    name = 'Toshiba BAT1';
    type = 10;
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
    dischargeBeforeSet = 80;

    isAvailable() {
        if (!fileExists(VENDOR_TOSHIBA))
            return false;
        if (!fileExists(BAT1_END_PATH))
            return false;
        return true;
    }

    async setThresholdLimit(chargingMode) {
        let endValue;
        if (chargingMode === 'ful')
            endValue = 100;
        else if (chargingMode === 'max')
            endValue = 80;
        let status = await runCommandCtl('BAT1_END', `${endValue}`, null, false);
        if (status === 0)  {
            this.endLimitValue = endValue;
            this.emit('threshold-applied', true);
            return 0;
        }
        this.emit('threshold-applied', false);
        return 1;
    }

    initializeBatteryMonitoring() {
        this._batteryLevelPath = Gio.File.new_for_path(BAT1_CAPACITY_PATH);
        this._monitorLevel = this._batteryLevelPath.monitor_file(Gio.FileMonitorFlags.NONE, null);
        this._monitorLevelId = this._monitorLevel.connect('changed', (obj, theFile, otherFile, eventType) => {
            if (eventType === Gio.FileMonitorEvent.CHANGED) {
                if (fileExists(BAT0_CAPACITY_PATH)) {
                    const newLevel =  readFileInt(BAT0_CAPACITY_PATH);
                    if (newLevel !== this.batteryLevel) {
                        this.batteryLevel = newLevel;
                        this.emit('battery-level-changed');
                    }
                } else {
                    this.batteryLevel = 0;
                }
            }
        });

        if (fileExists(BAT0_CAPACITY_PATH))
            this.batteryLevel =  readFileInt(BAT0_CAPACITY_PATH);
        else
            this.batteryLevel = 0;
    }

    destroy() {
        if (this._monitorLevelId)
            this._monitorLevel.disconnect(this._monitorLevelId);
        this._monitorLevelId = null;
        this._monitorLevel.cancel();
        this._monitorLevel = null;
        this._batteryLevelPath = null;
    }
});


