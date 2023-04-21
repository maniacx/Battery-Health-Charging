'use strict';
/* Dell SMC = Need smbios-battery-ctl from libsmbios  https://github.com/dell/libsmbios */
const {GLib, GObject} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Helper = Me.imports.lib.helper;
const {runCommandCtl} = Helper;

var DellSmBiosSingleBattery = GObject.registerClass({
    Signals: {'read-completed': {}},
}, class DellSmBiosSingleBattery extends GObject.Object {
    name = 'Dell wth smbios with Single Battery';
    type = 22;
    deviceNeedRootPermission = true;
    deviceHaveDualBattery = false;
    deviceHaveStartThreshold = true;
    deviceHaveVariableThreshold = true;
    deviceHaveBalancedMode = true;
    deviceHaveAdaptiveMode = true;
    deviceHaveExpressMode = true;
    iconForFullCapMode = '100';
    iconForBalanceMode = '080';
    iconForMaxLifeMode = '060';
    endFullCapacityRangeMax = 100;
    endFullCapacityRangeMin = 80;
    endBalancedRangeMax = 85;
    endBalancedRangeMin = 65;
    endMaxLifeSpanRangeMax = 85;
    endMaxLifeSpanRangeMin = 55;
    startFullCapacityRangeMax = 95;
    startFullCapacityRangeMin = 75;
    startBalancedRangeMax = 80;
    startBalancedRangeMin = 60;
    startMaxLifeSpanRangeMax = 80;
    startMaxLifeSpanRangeMin = 50;
    minDiffLimit = 5;

    isAvailable() {
        const havePath = GLib.find_program_in_path('smbios-battery-ctl');
        if (havePath !== null)
            return true;
        return false;
    }

    async setThresholdLimit(chargingMode) {
        const Settings = ExtensionUtils.getSettings();
        let endValue = null;
        let startValue = null;
        if ((chargingMode === 'adv') || (chargingMode === 'exp')) {
            endValue = chargingMode;
        } else {
            const endValueInt = Settings.get_int(`current-${chargingMode}-end-threshold`);
            let startValueInt = Settings.get_int(`current-${chargingMode}-start-threshold`);
            if ((endValueInt - startValueInt) < 5)
                startValueInt = endValueInt - 5;
            endValue = `${endValueInt}`;
            startValue = `${startValueInt}`;
        }
        await runCommandCtl('DELL_SMBIOS_BAT_WRITE', endValue, startValue, false);
        const output = await runCommandCtl('DELL_SMBIOS_BAT_READ', null, null, true);
        const filteredOutput = output.trim().replace('(', '').replace(')', '').replace(',', '').replace(/:/g, '');
        const splitOutput = filteredOutput.split('\n');
        const firstLine = splitOutput[0].split(' ');
        if (firstLine[0] === 'Charging' && firstLine[1] === 'mode') {
            this.mode = firstLine[2];
            if (firstLine[2] === 'custom') {
                const secondLine = splitOutput[1].split(' ');
                if (secondLine[0] === 'Charging' && secondLine[1] === 'interval') {
                    this.startLimitValue = parseInt(secondLine[2]);
                    this.endLimitValue = parseInt(secondLine[3]);
                }
            }
            this.emit('read-completed');
        }
        return 0;
    }
});
