'use strict';
/* LG Laptop */
const {GObject} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Helper = Me.imports.lib.helper;
const {fileExists, readFileInt, runCommandCtl} = Helper;

const LG_PATH = '/sys/devices/platform/lg-laptop/battery_care_limit';

var LgSingleBattery = GObject.registerClass({
    Signals: {'read-completed': {}},
}, class LgSingleBattery extends GObject.Object {
    name = 'LG with Single Battery';
    type = 5;
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
        if (!fileExists(LG_PATH))
            return false;
        return true;
    }

    async setThresholdLimit(chargingMode) {
        let batteryCareLimit;
        if (chargingMode === 'ful')
            batteryCareLimit = 100;
        else if (chargingMode === 'max')
            batteryCareLimit = 80;
        if (readFileInt(LG_PATH) === batteryCareLimit) {
            this.endLimitValue = batteryCareLimit;
            this.emit('read-completed');
            return 0;
        }
        let status = await runCommandCtl('LG', `${batteryCareLimit}`, null, false);
        if (status === 0)  {
            this.endLimitValue = readFileInt(LG_PATH);
            if (batteryCareLimit === this.endLimitValue) {
                this.emit('read-completed');
                return 0;
            }
        }
        log('Battery Health Charging: Error threshold values not updated');
        return 1;
    }
});

