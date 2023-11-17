'use strict';
/* Razer Laptops using package razer-cli from https://github.com/Razer-Linux/razer-laptop-control-no-dkms */
const {GObject} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Helper = Me.imports.lib.helper;
const {fileExists, execCheck} = Helper;

const RAZERCLI_PATH = '/usr/bin/razer-cli';

var RazerSingleBattery = GObject.registerClass({
    Signals: {'threshold-applied': {param_types: [GObject.TYPE_STRING]}},
}, class RazerSingleBattery extends GObject.Object {
    constructor(settings) {
        super();
        this.name = 'Razer';
        this.type = 30;
        this.deviceNeedRootPermission = false;
        this.deviceHaveDualBattery = false;
        this.deviceHaveStartThreshold = false;
        this.deviceHaveVariableThreshold = true;
        this.deviceHaveBalancedMode = true;
        this.deviceHaveAdaptiveMode = false;
        this.deviceHaveExpressMode = false;
        this.deviceUsesModeNotValue = false;
        this.iconForFullCapMode = '100';
        this.iconForBalanceMode = '080';
        this.iconForMaxLifeMode = '060';
        this.endFullCapacityRangeMax = 100;
        this.endFullCapacityRangeMin = 100;
        this.endBalancedRangeMax = 80;
        this.endBalancedRangeMin = 65;
        this.endMaxLifeSpanRangeMax = 80;
        this.endMaxLifeSpanRangeMin = 50;
        this.minDiffLimit = 5;
        this.incrementsStep = 5;
        this.incrementsPage = 10;

        this._settings = settings;
    }

    isAvailable() {
        if (!fileExists(RAZERCLI_PATH))
            return false;
        return true;
    }

    async setThresholdLimit(chargingMode) {
        let output, filteredOutput, splitOutput, firstLine, razerWriteCommand;
        const endValue = this._settings.get_int(`current-${chargingMode}-end-threshold`);

        const razerReadCommand = ['razer-cli', 'read', 'bho'];
        [, output] = await execCheck(razerReadCommand);
        filteredOutput = output.trim().replace('{ ', '').replace(' }', '').replace(',', '').replace(/:/g, '');
        splitOutput = filteredOutput.split('\n');
        firstLine = splitOutput[0].split(' ');
        if (firstLine[0] === 'RES' && firstLine[1] === 'GetBatteryHealthOptimizer' && firstLine[2] === 'is_on') {
            if (((endValue === 100) && (firstLine[3] === 'false')) ||
                ((endValue !== 100) && (firstLine[3] === 'true') && (parseInt(firstLine[5]) === endValue))) {
                this.endLimitValue = endValue;
                this.emit('threshold-applied', 'success');
                return 0;
            }
        }
        if (endValue === 100)
            razerWriteCommand = ['razer-cli', 'write', 'bho', 'off'];
        else
            razerWriteCommand = ['razer-cli', 'write', 'bho', 'on', `${endValue}`];

        [, output] = await execCheck(razerWriteCommand);
        filteredOutput = output.trim().replace('{ ', '').replace(' }', '').replace(/:/g, '');
        splitOutput = filteredOutput.split('\n');
        firstLine = splitOutput[0].split(' ');
        const secondLine = splitOutput[1].split(' ');
        if (firstLine[0] === 'RES' && firstLine[1] === 'SetBatteryHealthOptimizer' &&
            firstLine[2] === 'result' && firstLine[3] === 'true') {
            if ((endValue === 100 &&
                secondLine[0] === 'Successfully' &&
                secondLine[1] === 'turned' &&
                secondLine[2] === 'off' &&
                secondLine[3] === 'bho') ||
                (endValue !== 100 &&
                 secondLine[0] === 'Battery' &&
                 secondLine[1] === 'health' &&
                secondLine[2] === 'optimization' &&
                secondLine[4] === 'on' &&
                parseInt(secondLine[9]) === endValue)) {
                this.mode = chargingMode;
                this.endLimitValue = endValue;
                this.emit('threshold-applied', 'success');
                return 0;
            }
        }
        this.emit('threshold-applied', 'failed');
        return 1;
    }

    destroy() {
        // Nothing to destroy for this device
    }
});

