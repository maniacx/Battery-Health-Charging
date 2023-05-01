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
    iconForFullCapMode = '100';
    iconForMaxLifeMode = '080';

    isAvailable() {
        if (!fileExists(SAMSUNG_PATH))
            return false;
        return true;
    }

    async setThresholdLimit(chargingMode) {
        let batteryLifeExtender;
        if (chargingMode === 'ful')
            batteryLifeExtender = 0;
        else if (chargingMode === 'max')
            batteryLifeExtender = 1;
        if (readFileInt(SAMSUNG_PATH) === batteryLifeExtender) {
            if (batteryLifeExtender === 1)
                this.endLimitValue = 80;
            else
                this.endLimitValue = 100;
            this.emit('read-completed');
            return 0;
        }
        let status = await runCommandCtl('SAMSUNG', `${batteryLifeExtender}`, null, false);
        if (status === 0)  {
            const endLimitValue = readFileInt(SAMSUNG_PATH);
            if (batteryLifeExtender === endLimitValue) {
                if (endLimitValue === 1)
                    this.endLimitValue = 80;
                else
                    this.endLimitValue = 100;
                this.emit('read-completed');
                return 0;
            }
        }
        log('Battery Health Charging: Error threshold values not updated');
        return 1;
    }
});

