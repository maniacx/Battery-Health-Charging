'use strict';
const {Gio, GLib} = imports.gi;
const Main = imports.ui.main;
const MessageTray = imports.ui.messageTray;
const NotificationDestroyedReason = imports.ui.messageTray.NotificationDestroyedReason;
const Urgency = imports.ui.messageTray.Urgency;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const gettextDomain = Me.metadata['gettext-domain'];
const Gettext = imports.gettext.domain(gettextDomain);
const _ = Gettext.gettext;

var Notify = class {
    constructor(settings, extensionObject) {
        this._settings = settings;
        this._uuid = extensionObject.uuid;
        this._name = extensionObject.metadata.name;
        this._source = null;
    }

    _checkActiveNotification() {
        let status = false;
        const activeSource = Main.messageTray.getSources();
        if (activeSource[0] == null) {
            this._source = null;
        } else {
            activeSource.forEach(item => {
                if (item === this._source)
                    status = true;
            });
        }
        return status;
    }

    _notify(msg, action) {
        let notifyIcon = 'battery-level-100-charged-symbolic';
        let notifyTitle = _('Battery Health Charging');
        let urgency = Urgency.NORMAL;

        if ((action === 'error') || (action === 'show-settings') || (action === 'show-details')) {
            urgency = Urgency.CRITICAL;
            notifyTitle = _('Battery Health Charging Error');
            notifyIcon = 'dialog-warning-symbolic';
        }

        if (this._checkActiveNotification()) {
            this._source.destroy(NotificationDestroyedReason.REPLACED);
            this._source = null;
        }
        this._source = new MessageTray.Source(this._name, notifyIcon);
        Main.messageTray.add(this._source);
        const notification = new MessageTray.Notification(this._source, notifyTitle, msg);

        if (action === 'show-settings') {
            notification.addAction(_('Settings'), () => {
                this.openPreferences();
            });
        } else if (action === 'show-details') {
            notification.addAction(_('Show details'), () => {
                this._openDependencies();
            });
        }
        notification.setUrgency(urgency);
        notification.setTransient(true);
        this._source.showNotification(notification);
    }

    notifyUnsupportedDevice(pathSuffix) {
        this._pathSuffix = pathSuffix;
        if (this._pathSuffix === '')
            this._notify(_('Unsupported device.\nThis extension is not compatible with your device.'), 'show-details');
        else
            this._notify(_('Missing dependencies'), 'show-details');
    }

    notifyNoPolkitInstalled() {
        this._notify(_('Please install polkit from extension settings under Installation.'), 'show-settings');
    }

    notifyNeedPolkitUpdate() {
        this._notify(_('Please update polkit from extension settings under Installation.'), 'show-settings');
    }

    notifyAnErrorOccured(name) {
        if (this._settings.get_boolean('show-dell-option'))
            this._notify(_('Encountered an unexpected error. (%s)\nChoose correct dell package in extension settings.\nDisable and enable the extension').format(name), 'show-settings');
        else
            this._notify(_('Encountered an unexpected error. (%s)').format(name), 'error');
    }

    notifyThresholdNotUpdated(name) {
        if (this._settings.get_boolean('show-dell-option'))
            this._notify(_('Charging threshold not updated. (%s)\nChoose correct dell package in extension settings\nDisable and enable the extension').format(name), 'show-settings');
        else
            this._notify(_('Charging threshold not updated. (%s)').format(name), 'error');
    }

    notifyThresholdPasswordRequired() {
        this._notify(_('Apply correct Bios Password to set threshold.'), 'show-settings');
    }

    notifyUpdateThresholdBat1(endThresholdValue, startThresholdValue) {
        this._notify(_('Battery 1\nCharge thresholds are set to %d / %d %%')
                    .format(endThresholdValue, startThresholdValue));
    }

    notifyUpdateThreshold(endThresholdValue, startThresholdValue) {
        this._notify(_('Charge thresholds are set to %d / %d %%')
                    .format(endThresholdValue, startThresholdValue));
    }

    notifyUpdateLimitBat1(limitValue) {
        this._notify(_('Battery 1\nCharging Limit is set to %d%%').format(limitValue));
    }

    notifyUpdateLimit(limitValue) {
        this._notify(_('Charging Limit is set to %d%%').format(limitValue));
    }

    notifyUpdateThresholdBat2(endThresholdValue, startThresholdValue) {
        this._notify(_('Battery 2\nCharge thresholds are set to %d / %d %%')
                .format(endThresholdValue, startThresholdValue));
    }

    notifyUpdateLimitBat2(limitValue) {
        this._notify(_('Battery 2\nCharging Limit is set to %d%%')
                .format(limitValue));
    }

    notifyUpdateModeFul() {
        this._notify(_('Charging Mode is set to Full Capacity'));
    }

    notifyUpdateModeBal() {
        this._notify(_('Charging Mode is set to Balanced'));
    }

    notifyUpdateModeMax() {
        this._notify(_('Charging Mode is set to Maximum Lifespan'));
    }

    notifyUpdateModeExp() {
        this._notify(_('Charging Mode is set to Express'));
    }

    notifyUpdateModeAdv() {
        this._notify(_('Charging Mode is set to Adaptive'));
    }

    async openPreferences() {
        try {
            await Gio.DBus.session.call(
                'org.gnome.Shell.Extensions',
                '/org/gnome/Shell/Extensions',
                'org.gnome.Shell.Extensions',
                'OpenExtensionPrefs',
                new GLib.Variant('(ssa{sv})', [this._uuid, '', {}]),
                null,
                Gio.DBusCallFlags.NONE,
                -1,
                null);
        } catch {
        // do nothing
        }
    }

    _openDependencies() {
        const uri = `https://maniacx.github.io/Battery-Health-Charging/device-compatibility${this._pathSuffix}`;
        Gio.app_info_launch_default_for_uri(uri, null, null, null);
    }

    _removeActiveNofications() {
        if (this._checkActiveNotification())
            this._source.destroy(NotificationDestroyedReason.SOURCE_CLOSED);
        this._source = null;
    }

    destroy() {
        this._removeActiveNofications();
        this._settings = null;
    }
}
