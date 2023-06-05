'use strict';
const {GObject, Gio, UPowerGlib: UPower} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Helper = Me.imports.lib.helper;
const {fileExists, readFileInt} = Helper;

const PowerToggle = imports.ui.main.panel.statusArea.aggregateMenu._power;

const gettextDomain = Me.metadata['gettext-domain'];
const Gettext = imports.gettext.domain(gettextDomain);
const _ = Gettext.gettext;

const {loadInterfaceXML} = imports.misc.fileUtils;
const BUS_NAME = 'org.freedesktop.UPower';
const OBJECT_PATH = '/org/freedesktop/UPower/devices/DisplayDevice';
const POWERSUPPLY_PATH = '/sys/class/power_supply/';

const DisplayDeviceInterface = loadInterfaceXML('org.freedesktop.UPower.Device');
const PowerManagerProxy = Gio.DBusProxy.makeProxyWrapper(DisplayDeviceInterface);

// When chargign threshold is set, Upower reports Device.state as either charging, charge-pending or discharging.
// This changes the system power icon sometimes to on-battery even though charger is always plugged-in
// We will read powersupply AC/ADP online status and change the power icon accordingly

var BatteryStatusIndicator = GObject.registerClass({
}, class BatteryStatusIndicator extends GObject.Object {
    constructor() {
        super();
        this._proxy = null;
        this._acOnlinePath = null;
        this._settings = ExtensionUtils.getSettings();

        this._findAcOnlineSupplyPath();
        // If no path is found we cannot know charging status so just return
        if (this._acOnlinePath === null)
            return;

        // Observe for changes to update indicator
        this._settings.connectObject(
            'changed::amend-power-indicator', () => {
                if (this._settings.get_boolean('amend-power-indicator'))
                    this._enablePowerProxy();
                else
                    this._disablePowerProxy();
            },
            this
        );

        if (this._settings.get_boolean('amend-power-indicator'))
            this._enablePowerProxy();
    }

    _findAcOnlineSupplyPath() {
        // Find power_supply AC/ADP
        const directory = Gio.File.new_for_path(POWERSUPPLY_PATH);
        const iter = directory.enumerate_children('standard::*',
            Gio.FileQueryInfoFlags.NOFOLLOW_SYMLINKS, null);

        while (true) {
            const info = iter.next_file(null);

            if (info == null)
                break;
            // Check for powersupply prefixed with AC/ADP and if exist check for online directory
            if (info.get_name().startsWith('AC') || info.get_name().startsWith('ADP') || info.get_name().startsWith('macsmc-ac')) {
                this._acOnlinePath = `${POWERSUPPLY_PATH}${info.get_name()}/online`;
                if (fileExists(this._acOnlinePath))
                    break;
                else
                    this._acOnlinePath = null;
            }
        }
    }

    _enablePowerProxy() {
        // Stop original proxy
        PowerToggle._proxy = null;
        // Run our proxy
        this._proxy = new PowerManagerProxy(Gio.DBus.system, BUS_NAME, OBJECT_PATH,
            (proxy, error) => {
                if (error) {
                    console.error(error.message);
                } else {
                    this._proxyId = this._proxy.connect('g-properties-changed', () => this.sync());
                    this.sync();
                }
            });

        PowerToggle._proxy = this._proxy;
    }

    sync() {
        PowerToggle.visible = this._proxy.IsPresent;
        let thresholdMode = false;
        if (!PowerToggle.visible)
            return;
        // Code from gnome shell.
        let chargingState = this._proxy.State === UPower.DeviceState.CHARGING ? '-charging' : '';

        // Override Charging state if charging state is pending-charge/discharging
        // and charging threshold is enabled (i.e mode is balanced/maxlifespan or mode is fullcapacity and threshold is not 100)
        if ((this._proxy.State === UPower.DeviceState.PENDING_CHARGE) ||
             (this._proxy.State === UPower.DeviceState.DISCHARGING)) {
            const chargingMode = this._settings.get_string('charging-mode');
            if ((chargingMode === 'bal') || (chargingMode === 'max') ||
                ((chargingMode === 'ful') && (this._settings.get_int('current-ful-end-threshold') !== 100)))
                chargingState = readFileInt(this._acOnlinePath) ? '-charging' : '';
            thresholdMode = true;
        }

        // Below code from gnome shell
        const fillLevel = 10 * Math.floor(this._proxy.Percentage / 10);
        const charged =
            this._proxy.State === UPower.DeviceState.FULLY_CHARGED ||
            (this._proxy.State === UPower.DeviceState.CHARGING && fillLevel === 100);
        const icon = charged
            ? 'battery-level-100-charged-symbolic'
            : `battery-level-${fillLevel}${chargingState}-symbolic`;

        const gicon = new Gio.ThemedIcon({
            name: icon,
            use_default_fallbacks: false,
        });

        PowerToggle._indicator.gicon = gicon;
        PowerToggle._item.icon.gicon = gicon;

        const fallbackIcon = this._proxy.IconName;
        PowerToggle._indicator.fallback_icon_name = fallbackIcon;
        PowerToggle._item.icon.fallback_icon_name = fallbackIcon;

        // The icon label
        const label = _('%d\u2009%%').format(this._proxy.Percentage);
        PowerToggle._percentageLabel.text = label;

        // The status label
        // TRANSLATORS: Keep translation short if possible. Maximum  34 characters can be displayed here
        PowerToggle._item.label.text = thresholdMode ? _('Charging stopped (Threshold)') : PowerToggle._getStatus();
    }

    _disablePowerProxy() {
        if (this._proxy == null)
            return;
        this._proxy.disconnect(this._proxyId);
        this._proxyId = null;
        PowerToggle._proxy = null;
        this._proxy = null;

        PowerToggle._proxy = new PowerManagerProxy(Gio.DBus.system, BUS_NAME, OBJECT_PATH,
            (proxy, error) => {
                if (error)
                    console.error(error.message);
                else
                    PowerToggle._proxy.connect('g-properties-changed', () => PowerToggle._sync());
                PowerToggle._sync();
            });
    }

    disable() {
        this._disablePowerProxy();
        this._settings.disconnectObject(this);
        this._settings = null;
    }
});


