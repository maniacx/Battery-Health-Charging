'use strict';
/* Acer Laptop. Currently see https://github.com/frederik-h/acer-wmi-battery/issues */
const {GObject} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Helper = Me.imports.lib.helper;
const {fileExists, readFileInt, runCommandCtl} = Helper;

const ACER_PATH = '/sys/bus/wmi/drivers/acer-wmi-battery/health_mode';

var AcerSingleBattery = GObject.registerClass({
    Signals: {'read-completed': {}},
}, class AcerSingleBattery extends GObject.Object {
    name = 'Acer with Single Battery';
    type = 17;
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
        if (!fileExists(ACER_PATH))
            return false;
        return true;
    }

    async setThresholdLimit(chargingMode) {
        let healthMode;
        if (chargingMode === 'ful')
            healthMode = 0;
        else if (chargingMode === 'max')
            healthMode = 1;
        if (readFileInt(ACER_PATH) === healthMode) {
            if (healthMode === 1)
                this.endLimitValue = 80;
            else
                this.endLimitValue = 100;
            this.emit('read-completed');
            return 0;
        }
        let status = await runCommandCtl('ACER', `${healthMode}`, null, false);
        if (status === 0)  {
            const endLimitValue = readFileInt(ACER_PATH);
            if (healthMode === endLimitValue) {
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

