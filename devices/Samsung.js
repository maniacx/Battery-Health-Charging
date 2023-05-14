'use strict';
/* Samsung Laptops */
const {GObject} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Helper = Me.imports.lib.helper;
const {fileExists, readFileInt, runCommandCtl} = Helper;

const SAMSUNG_PATH = '/sys/devices/platform/samsung/battery_life_extender';

var SamsungSingleBattery = GObject.registerClass({
    Signals: {'read-completed': {}},
}, class SamsungSingleBattery extends GObject.Object {
    name = 'Samsung with Single Battery';
    type = 6;
    deviceNeedRootPermission = true;
    deviceHaveDualBattery = false;
    deviceHaveStartThreshold = false;
    deviceHaveVariableThreshold = false;
    deviceHaveBalancedMode = false;
    deviceHaveAdaptiveMode = false;
    deviceHaveExpressMode = false;
    deviceUsesModeNotValue = true;

    isAvailable() {
        if (!fileExists(SAMSUNG_PATH))
            return false;
        ExtensionUtils.getSettings().set_int('icon-style-type', 0);
        return true;
    }

    async setThresholdLimit(chargingMode) {
        let batteryLifeExtender;
        if (chargingMode === 'ful')
            batteryLifeExtender = 0;
        else if (chargingMode === 'max')
            batteryLifeExtender = 1;
        if (readFileInt(SAMSUNG_PATH) === batteryLifeExtender) {
            this.mode = chargingMode;
            this.emit('read-completed');
            return 0;
        }
        let status = await runCommandCtl('SAMSUNG', `${batteryLifeExtender}`, null, false);
        if (status === 0)  {
            if (readFileInt(SAMSUNG_PATH) === batteryLifeExtender) {
                this.mode = chargingMode;
                this.emit('read-completed');
                return 0;
            }
        }
        log('Battery Health Charging: Error threshold values not updated');
        return 1;
    }
});

