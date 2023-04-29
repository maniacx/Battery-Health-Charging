'use strict';
/* Panasonic Laptop. */
const {GObject} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Helper = Me.imports.lib.helper;
const {fileExists, readFileInt, runCommandCtl} = Helper;

const PANASONIC_PATH = '/sys/devices/platform/panasonic/eco_mode';

var PanasonicSingleBattery = GObject.registerClass({
    Signals: {'read-completed': {}},
}, class PanasonicSingleBattery extends GObject.Object {
    name = 'Panasonic with Single Battery';
    type = 23;
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
        if (!fileExists(PANASONIC_PATH))
            return false;
        return true;
    }

    async setThresholdLimit(chargingMode) {
        let ecoMode;
        if (chargingMode === 'ful')
            ecoMode = 0;
        else if (chargingMode === 'max')
            ecoMode = 1;
        if (readFileInt(PANASONIC_PATH) === ecoMode) {
            if (ecoMode === 1)
                this.endLimitValue = 80;
            else
                this.endLimitValue = 100;
            this.emit('read-completed');
            return 0;
        }
        let status = await runCommandCtl('PANASONIC', `${ecoMode}`, null, false);
        if (status === 0)  {
            const endLimitValue = readFileInt(PANASONIC_PATH);
            if (ecoMode === endLimitValue) {
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

