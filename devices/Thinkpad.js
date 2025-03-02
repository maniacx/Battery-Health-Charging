'use strict';
/* Thinkpad Laptops */
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import * as Helper from '../lib/helper.js';

const {exitCode, fileExists, readFile, readFileInt, readFileUri, runCommandCtl} = Helper;

const VENDOR_THINKPAD = '/sys/devices/platform/thinkpad_acpi';
const BAT0_END_PATH = '/sys/class/power_supply/BAT0/charge_control_end_threshold';
const BAT0_START_PATH = '/sys/class/power_supply/BAT0/charge_control_start_threshold';
const BAT1_END_PATH = '/sys/class/power_supply/BAT1/charge_control_end_threshold';
const BAT1_START_PATH = '/sys/class/power_supply/BAT1/charge_control_start_threshold';
const BAT0_CAPACITY_PATH = '/sys/class/power_supply/BAT0/capacity';
const BAT1_CAPACITY_PATH = '/sys/class/power_supply/BAT1/capacity';
const BAT0_FORCE_DISCHARGE_PATH = '/sys/class/power_supply/BAT0/charge_behaviour';
const BAT1_FORCE_DISCHARGE_PATH = '/sys/class/power_supply/BAT1/charge_behaviour';

const BUS_NAME = 'org.freedesktop.UPower';
const OBJECT_PATH = '/org/freedesktop/UPower/devices/DisplayDevice';

export const ThinkpadDualBattery = GObject.registerClass({
    Signals: {
        'threshold-applied': {param_types: [GObject.TYPE_STRING]},
        'battery-status-changed': {},
    },
}, class ThinkpadDualBattery extends GObject.Object {
    constructor(settings) {
        super();
        this.name = 'Thinkpad BAT0/BAT1';
        this.type = 19;
        this.deviceNeedRootPermission = true;
        this.deviceHaveDualBattery = true;
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
        this.endMaxLifeSpanRangeMin = 50;
        this.startFullCapacityRangeMax = 98;
        this.startFullCapacityRangeMin = 75;
        this.startBalancedRangeMax = 83;
        this.startBalancedRangeMin = 60;
        this.startMaxLifeSpanRangeMax = 83;
        this.startMaxLifeSpanRangeMin = 40;
        this.minDiffLimit = 2;
        this.incrementsStep = 1;
        this.incrementsPage = 5;

        this._settings = settings;
        this.ctlPath = null;
    }

    isAvailable() {
        const deviceType = this._settings.get_int('device-type');
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
            const bat0EndPathExist = fileExists(BAT0_END_PATH);
            const bat1EndPathExist = fileExists(BAT1_END_PATH);
            if (!bat0EndPathExist && !bat1EndPathExist)
                return false;
            this.battery0Removed = !bat0EndPathExist;
            this.battery1Removed = !bat1EndPathExist;
        }
        this._initializeBatteryMonitoring();
        return true;
    }

    async setThresholdLimit(chargingMode) {
        if (this.battery0Removed)
            return exitCode.SUCCESS;
        const endValue = this._settings.get_int(`current-${chargingMode}-end-threshold`);
        const startValue = this._settings.get_int(`current-${chargingMode}-start-threshold`);
        this.endLimitValue = readFileInt(BAT0_END_PATH);
        this.startLimitValue = readFileInt(BAT0_START_PATH);
        if (this.endLimitValue === endValue && this.startLimitValue === startValue) {
            this.emit('threshold-applied', 'success');
            return exitCode.SUCCESS;
        }
        // Some device wont update end threshold if start threshold > end threshold
        const cmd = startValue >= this.endLimitValue ? 'BAT0_END_START' : 'BAT0_START_END';
        const [status] = await runCommandCtl(this.ctlPath, cmd, `${endValue}`, `${startValue}`);
        if (status === exitCode.ERROR) {
            this.emit('threshold-applied', 'error');
            return exitCode.ERROR;
        } else if (status === exitCode.TIMEOUT) {
            this.emit('threshold-applied', 'timeout');
            return exitCode.ERROR;
        }
        if (status === exitCode.SUCCESS) {
            this.endLimitValue = readFileInt(BAT0_END_PATH);
            this.startLimitValue = readFileInt(BAT0_START_PATH);
            if (endValue === this.endLimitValue && startValue === this.startLimitValue) {
                this.emit('threshold-applied', 'success');
                return exitCode.SUCCESS;
            }
        }
        this.emit('threshold-applied', 'not-updated');
        return exitCode.ERROR;
    }

    async setThresholdLimit2(chargingMode2) {
        if (this.battery1Removed)
            return exitCode.SUCCESS;

        const endValue = this._settings.get_int(`current-${chargingMode2}-end-threshold2`);
        const startValue = this._settings.get_int(`current-${chargingMode2}-start-threshold2`);
        this.endLimit2Value = readFileInt(BAT1_END_PATH);
        this.startLimit2Value = readFileInt(BAT1_START_PATH);
        if (this.endLimit2Value === endValue && this.startLimit2Value === startValue) {
            this.emit('threshold-applied', 'success-bat2');
            return exitCode.SUCCESS;
        }
        // Some device wont update end threshold if start threshold > end threshold
        const cmd = startValue >= this.endLimit2Value ? 'BAT1_END_START' : 'BAT1_START_END';
        const [status] = await runCommandCtl(this.ctlPath, cmd, `${endValue}`, `${startValue}`);
        if (status === exitCode.ERROR) {
            this.emit('threshold-applied', 'error');
            return exitCode.ERROR;
        } else if (status === exitCode.TIMEOUT) {
            this.emit('threshold-applied', 'timeout');
            return exitCode.ERROR;
        }
        if (status === exitCode.SUCCESS) {
            this.endLimit2Value = readFileInt(BAT1_END_PATH);
            this.startLimit2Value = readFileInt(BAT1_START_PATH);
            if (endValue === this.endLimit2Value && startValue === this.startLimit2Value) {
                this.emit('threshold-applied', 'success-bat2');
                return exitCode.SUCCESS;
            }
        }
        return exitCode.ERROR;
    }

    async setThresholdLimitDual() {
        let status = await this.setThresholdLimit(this._settings.get_string('charging-mode'));
        if (status === exitCode.SUCCESS)
            status = await this.setThresholdLimit2(this._settings.get_string('charging-mode2'));
        return status;
    }

    _initializeBatteryMonitoring() {
        this._battery0LevelPath = Gio.File.new_for_path(BAT0_END_PATH);
        this._monitorLevel = this._battery0LevelPath.monitor_file(Gio.FileMonitorFlags.NONE, null);
        this._monitorLevelId = this._monitorLevel.connect('changed', (obj, theFile, otherFile, eventType) => {
            if (eventType === Gio.FileMonitorEvent.DELETED) {
                this.battery0Removed = true;
                this.emit('battery-status-changed');
            }
            if (eventType === Gio.FileMonitorEvent.CREATED) {
                this.battery0Removed = false;
                this.setThresholdLimit(this._settings.get_string('charging-mode'));
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
                this.setThresholdLimit2(this._settings.get_string('charging-mode2'));
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

export const ThinkpadSingleBatteryBAT0 = GObject.registerClass({
    Signals: {'threshold-applied': {param_types: [GObject.TYPE_STRING]}},
}, class ThinkpadSingleBatteryBAT0 extends GObject.Object {
    constructor(settings) {
        super();
        this.name = 'Thinkpad BAT0';
        this.type = 20;
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
        this.endMaxLifeSpanRangeMin = 50;
        this.startFullCapacityRangeMax = 98;
        this.startFullCapacityRangeMin = 75;
        this.startBalancedRangeMax = 83;
        this.startBalancedRangeMin = 60;
        this.startMaxLifeSpanRangeMax = 83;
        this.startMaxLifeSpanRangeMin = 40;
        this.minDiffLimit = 2;
        this.incrementsStep = 1;
        this.incrementsPage = 5;

        this._settings = settings;
        this.ctlPath = null;
        this.endLimitValue = -1;
        this.startLimitValue = -1;
    }

    isAvailable() {
        if (!fileExists(VENDOR_THINKPAD))
            return false;
        if (!fileExists(BAT0_START_PATH))
            return false;
        if (!fileExists(BAT0_END_PATH))
            return false;
        if (fileExists(BAT1_END_PATH))
            return false;
        this._batteryMonitoringInitialized = false;
        return true;
    }

    async setThresholdLimit(chargingMode) {
        this._chargingMode = chargingMode;
        this._endValue = this._settings.get_int(`current-${chargingMode}-end-threshold`);
        this._startValue = this._settings.get_int(`current-${chargingMode}-start-threshold`);
        this._skipVerification = this._settings.get_boolean('skip-threshold-verification');

        if (!this._batteryMonitoringInitialized)
            await this._initializeBatteryMonitoring();
        else if (this._settings.get_boolean('force-discharge-enabled'))
            await this._forceDischarge();

        if (!this._skipVerification && this._verifyThreshold())
            return exitCode.SUCCESS;

        // Some device wont update end threshold if start threshold > end threshold
        const cmd = this._startValue >= this.endLimitValue ? 'BAT0_END_START' : 'BAT0_START_END';
        const [status] = await runCommandCtl(this.ctlPath, cmd, `${this._endValue}`, `${this._startValue}`);

        if (status === exitCode.ERROR) {
            this.emit('threshold-applied', 'error');
            return exitCode.ERROR;
        } else if (status === exitCode.TIMEOUT) {
            this.emit('threshold-applied', 'timeout');
            return exitCode.ERROR;
        }

        if (this._skipVerification) {
            this.endLimitValue = this._endValue;
            this.startLimitValue = this._startValue;
            this.emit('threshold-applied', 'success');
            return exitCode.SUCCESS;
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
        this.startLimitValue = readFileInt(BAT0_START_PATH);
        if (this.endLimitValue === this._endValue && this.startLimitValue === this._startValue) {
            this.emit('threshold-applied', 'success');
            return true;
        }
        return false;
    }

    _readForceDischargeMode() {
        const forceDischargeModeRead = readFile(BAT0_FORCE_DISCHARGE_PATH);
        return forceDischargeModeRead?.substring(
            forceDischargeModeRead?.indexOf('[') + 1,
            forceDischargeModeRead?.lastIndexOf(']')
        );
    }

    async _enableForceDischarge() {
        const forceDischargeModeRead = this._readForceDischargeMode();
        if (forceDischargeModeRead !== 'force-discharge')
            await runCommandCtl(this.ctlPath, 'FORCE_DISCHARGE_BAT0', 'force-discharge');
    }

    async _disableForceDischarge() {
        const forceDischargeModeRead = this._readForceDischargeMode();
        if (forceDischargeModeRead !== 'auto')
            await runCommandCtl(this.ctlPath, 'FORCE_DISCHARGE_BAT0', 'auto');
    }

    async _forceDischarge() {
        const currentThresholdValue = this._settings.get_int(`current-${this._chargingMode}-end-threshold`);
        if (this._batteryLevel > currentThresholdValue)
            await this._enableForceDischarge();
        else
            await this._disableForceDischarge();
    }

    async _initializeBatteryMonitoring() {
        if (this._settings.get_boolean('force-discharge-enabled'))
            await this._enableBatteryCapacityMonitoring();
        this._settings.connectObject(
            'changed::force-discharge-enabled', () => {
                if (this._settings.get_boolean('force-discharge-enabled'))
                    this._enableBatteryCapacityMonitoring();
                else
                    this._disableBatteryCapacityMonitoring();
            },
            this
        );
        this._batteryMonitoringInitialized = true;
    }

    async _enableBatteryCapacityMonitoring() {
        this._batteryLevel = readFileInt(BAT0_CAPACITY_PATH);
        await this._forceDischarge();
        const xmlFile = 'resource:///org/gnome/shell/dbus-interfaces/org.freedesktop.UPower.Device.xml';
        const powerManagerProxy = Gio.DBusProxy.makeProxyWrapper(readFileUri(xmlFile));
        this._proxy = new powerManagerProxy(Gio.DBus.system, BUS_NAME, OBJECT_PATH, (proxy, error) => {
            if (error) {
                log(error.message);
            } else {
                this._proxyId = this._proxy.connect('g-properties-changed', () => {
                    const batteryLevel = this._proxy.Percentage;
                    if (this._batteryLevel !== batteryLevel) {
                        this._batteryLevel = batteryLevel;
                        if (this._batteryMonitoringInitialized)
                            this._forceDischarge();
                    }
                });
            }
        });
    }

    _disableBatteryCapacityMonitoring() {
        this._disableForceDischarge();
        if (this._proxy)
            this._proxy.disconnect(this._proxyId);
        this._proxyId = null;
        this._proxy = null;
    }

    destroy() {
        if (this._delayReadTimeoutId)
            GLib.source_remove(this._delayReadTimeoutId);
        this._delayReadTimeoutId = null;
        this._disableBatteryCapacityMonitoring();
        this._settings.disconnectObject(this);
    }
});

export const ThinkpadSingleBatteryBAT1 = GObject.registerClass({
    Signals: {'threshold-applied': {param_types: [GObject.TYPE_STRING]}},
}, class ThinkpadSingleBatteryBAT1 extends GObject.Object {
    constructor(settings) {
        super();
        this.name = 'Thinkpad BAT1';
        this.type = 21;
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
        this.endMaxLifeSpanRangeMin = 50;
        this.startFullCapacityRangeMax = 98;
        this.startFullCapacityRangeMin = 75;
        this.startBalancedRangeMax = 83;
        this.startBalancedRangeMin = 60;
        this.startMaxLifeSpanRangeMax = 83;
        this.startMaxLifeSpanRangeMin = 40;
        this.minDiffLimit = 2;
        this.incrementsStep = 1;
        this.incrementsPage = 5;

        this._settings = settings;
        this.ctlPath = null;
        this.endLimitValue = -1;
        this.startLimitValue = -1;
    }

    isAvailable() {
        if (!fileExists(VENDOR_THINKPAD))
            return false;
        if (!fileExists(BAT1_START_PATH))
            return false;
        if (!fileExists(BAT1_END_PATH))
            return false;
        if (fileExists(BAT0_END_PATH))
            return false;
        this._batteryMonitoringInitialized = false;
        return true;
    }

    async setThresholdLimit(chargingMode) {
        this._chargingMode = chargingMode;
        this._endValue = this._settings.get_int(`current-${chargingMode}-end-threshold`);
        this._startValue = this._settings.get_int(`current-${chargingMode}-start-threshold`);
        this._skipVerification = this._settings.get_boolean('skip-threshold-verification');

        if (!this._batteryMonitoringInitialized)
            await this._initializeBatteryMonitoring();
        if (this._settings.get_boolean('force-discharge-enabled'))
            await this._forceDischarge();

        if (!this._skipVerification && this._verifyThreshold())
            return exitCode.SUCCESS;

        // Some device wont update end threshold if start threshold > end threshold
        const cmd = this._startValue >= this.endLimitValue ? 'BAT1_END_START' : 'BAT1_START_END';
        const [status] = await runCommandCtl(this.ctlPath, cmd, `${this._endValue}`, `${this._startValue}`);
        if (status === exitCode.ERROR) {
            this.emit('threshold-applied', 'error');
            return exitCode.ERROR;
        } else if (status === exitCode.TIMEOUT) {
            this.emit('threshold-applied', 'timeout');
            return exitCode.ERROR;
        }

        if (this._skipVerification) {
            this.endLimitValue = this._endValue;
            this.startLimitValue = this._startValue;
            this.emit('threshold-applied', 'success');
            return exitCode.SUCCESS;
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
        this.endLimitValue = readFileInt(BAT1_END_PATH);
        this.startLimitValue = readFileInt(BAT1_START_PATH);
        if (this.endLimitValue === this._endValue && this.startLimitValue === this._startValue) {
            this.emit('threshold-applied', 'success');
            return true;
        }
        return false;
    }

    _readForceDischargeMode() {
        const forceDischargeModeRead = readFile(BAT1_FORCE_DISCHARGE_PATH);
        return forceDischargeModeRead?.substring(
            forceDischargeModeRead?.indexOf('[') + 1,
            forceDischargeModeRead?.lastIndexOf(']')
        );
    }

    async _enableForceDischarge() {
        const forceDischargeModeRead = this._readForceDischargeMode();
        if (forceDischargeModeRead !== 'force-discharge')
            await runCommandCtl(this.ctlPath, 'FORCE_DISCHARGE_BAT1', 'force-discharge');
    }

    async _disableForceDischarge() {
        const forceDischargeModeRead = this._readForceDischargeMode();
        if (forceDischargeModeRead !== 'auto')
            await runCommandCtl(this.ctlPath, 'FORCE_DISCHARGE_BAT1', 'auto');
    }

    async _forceDischarge() {
        const currentThresholdValue = this._settings.get_int(`current-${this._chargingMode}-end-threshold`);
        if (this._batteryLevel > currentThresholdValue)
            await this._enableForceDischarge();
        else
            await this._disableForceDischarge();
    }

    async _initializeBatteryMonitoring() {
        if (this._settings.get_boolean('force-discharge-enabled'))
            await this._enableBatteryCapacityMonitoring();
        this._settings.connectObject(
            'changed::force-discharge-enabled', () => {
                if (this._settings.get_boolean('force-discharge-enabled'))
                    this._enableBatteryCapacityMonitoring();
                else
                    this._disableBatteryCapacityMonitoring();
            },
            this
        );
        this._batteryMonitoringInitialized = true;
    }

    async _enableBatteryCapacityMonitoring() {
        this._batteryLevel = readFileInt(BAT1_CAPACITY_PATH);
        await this._forceDischarge();
        const xmlFile = 'resource:///org/gnome/shell/dbus-interfaces/org.freedesktop.UPower.Device.xml';
        const powerManagerProxy = Gio.DBusProxy.makeProxyWrapper(readFileUri(xmlFile));
        this._proxy = new powerManagerProxy(Gio.DBus.system, BUS_NAME, OBJECT_PATH, (proxy, error) => {
            if (error) {
                log(error.message);
            } else {
                this._proxyId = this._proxy.connect('g-properties-changed', () => {
                    const batteryLevel = this._proxy.Percentage;
                    if (this._batteryLevel !== batteryLevel) {
                        this._batteryLevel = batteryLevel;
                        if (this._batteryMonitoringInitialized)
                            this._forceDischarge();
                    }
                });
            }
        });
    }

    _disableBatteryCapacityMonitoring() {
        this._disableForceDischarge();
        if (this._proxy)
            this._proxy.disconnect(this._proxyId);
        this._proxyId = null;
        this._proxy = null;
    }

    destroy() {
        if (this._delayReadTimeoutId)
            GLib.source_remove(this._delayReadTimeoutId);
        this._delayReadTimeoutId = null;
        this._disableBatteryCapacityMonitoring();
        this._settings.disconnectObject(this);
    }
});

