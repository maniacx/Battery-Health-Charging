'use strict';
const {Gio, GLib} = imports.gi;
const Main = imports.ui.main;
const MessageTray = imports.ui.messageTray;
const SystemActions = imports.misc.systemActions;
const NotificationDestroyedReason = imports.ui.messageTray.NotificationDestroyedReason;
const Urgency = imports.ui.messageTray.Urgency;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const gettextDomain = Me.metadata['gettext-domain'];
const Gettext = imports.gettext.domain(gettextDomain);
const _ = Gettext.gettext;
let source = null;

function checkActiveNotification() {
    let status = false;
    const activeSource = Main.messageTray.getSources();
    if (activeSource[0] == null) {
        source = null;
    } else {
        activeSource.forEach(item => {
            if (item === source)
                status = true;
        });
    }
    return status;
}

function notify(msg, action) {
    let notifyIcon;
    let notifyTitle = _('Battery Health Charging');
    let urgency = Urgency.CRITICAL;

    if (action === 'installed') {
        notifyIcon = 'system-reboot-symbolic';
    } else if (action === 'uninstalled') {
        notifyIcon = 'success-symbolic';
    } else if (action === 'update') {
        notifyIcon = 'battery-level-100-charged-symbolic';
    } else if ((action === 'error') || (action === 'show-settings')) {
        notifyTitle = _('Battery Health Charging Error');
        notifyIcon = 'dialog-warning-symbolic';
    }

    if (checkActiveNotification()) {
        source.destroy(NotificationDestroyedReason.REPLACED);
        source = null;
    }
    source = new MessageTray.Source(Me.metadata.name, notifyIcon);
    Main.messageTray.add(source);
    const notification = new MessageTray.Notification(source, notifyTitle, msg);

    if (action === 'installed') {
        notification.addAction(_('Log Out'), () => {
            SystemActions.getDefault().activateLogout();
        });
    } else if ((action === 'uninstalled') || (action === 'update')) {
        urgency = Urgency.NORMAL;
    } else if (action === 'show-settings') {
        notification.addAction(_('Settings'), () => {
            openPreferences();
        });
    }
    notification.setUrgency(urgency);
    notification.setTransient(true);
    source.showNotification(notification);
}

function removeActiveNofications() {
    if (checkActiveNotification())
        source.destroy(NotificationDestroyedReason.SOURCE_CLOSED);
    source = null;
}

function notifyGnomeIncompatible() {
    notify(_('Unsupported Gnome version.\nThis extension is compatible only with Gnome version 42 and above.'), 'error');
}

function notifyUnsupportedDevice() {
    notify(_('Unsupported device.\nThis extension is not compatible with your device.'), 'error');
}

function notifyNoPolkitInstalled() {
    notify(_('Please install polkit from extension settings under Installation.'), 'show-settings');
}

function notifyNeedPolkitUpdate() {
    notify(_('Please update polkit from extension settings under Installation.'), 'show-settings');
}

function notifyPolkitInstallationSuccessful() {
    notify(_('Installation Successful. Please save your work and logout.'), 'installed');
}

function notifyPolkitUpdateSuccessful() {
    notify(_('Installation Successful. Please save your work and logout.'), 'installed');
}

function notifyUnInstallationSuccessful() {
    notify(_('Uninstallation Successful.'), 'uninstalled');
}

function notifyAnErrorOccured(name) {
    if (ExtensionUtils.getSettings().get_boolean('show-dell-option'))
        notify(_('Encountered an unexpected error. (%s)\nChoose correct dell package in extension settings.\nDisable and enable the extension').format(name), 'show-settings');
    else
        notify(_('Encountered an unexpected error. (%s)').format(name), 'error');
}

function notifyThresholdNotUpdated(name) {
    if (ExtensionUtils.getSettings().get_boolean('show-dell-option'))
        notify(_('Charging threshold not updated. (%s)\nChoose correct dell package in extension settings\nDisable and enable the extension').format(name), 'show-settings');
    else
        notify(_('Charging threshold not updated. (%s)').format(name), 'error');
}

function notifyUpdateThresholdBat1(endThresholdValue, startThresholdValue) {
    notify(_('Battery 1\nCharge thresholds are set to %d / %d %%')
                    .format(endThresholdValue, startThresholdValue), 'update');
}

function notifyUpdateThreshold(endThresholdValue, startThresholdValue) {
    notify(_('Charge thresholds are set to %d / %d %%')
                    .format(endThresholdValue, startThresholdValue), 'update');
}

function notifyUpdateLimitBat1(limitValue) {
    notify(_('Battery 1\nCharging Limit is set to %d%%').format(limitValue), 'update');
}

function notifyUpdateLimit(limitValue) {
    notify(_('Charging Limit is set to %d%%').format(limitValue), 'update');
}

function notifyUpdateThresholdBat2(endThresholdValue, startThresholdValue) {
    notify(_('Battery 2\nCharge thresholds are set to %d / %d %%')
                .format(endThresholdValue, startThresholdValue), 'update');
}

function notifyUpdateLimitBat2(limitValue) {
    notify(_('Battery 2\nCharging Limit is set to %d%%')
                .format(limitValue), 'update');
}

function notifyUpdateModeFul() {
    notify(_('Charging Mode is set to Full Capacity'), 'update');
}

function notifyUpdateModeBal() {
    notify(_('Charging Mode is set to Balanced'), 'update');
}

function notifyUpdateModeMax() {
    notify(_('Charging Mode is set to Maximum Lifespan'), 'update');
}

function notifyUpdateModeExp() {
    notify(_('Charging Mode is set to Express'), 'update');
}

function notifyUpdateModeAdv() {
    notify(_('Charging Mode is set to Adaptive'), 'update');
}

async function openPreferences() {
    try {
        await Gio.DBus.session.call(
            'org.gnome.Shell.Extensions',
            '/org/gnome/Shell/Extensions',
            'org.gnome.Shell.Extensions',
            'OpenExtensionPrefs',
            new GLib.Variant('(ssa{sv})', [Me.metadata.uuid, '', {}]),
            null,
            Gio.DBusCallFlags.NONE,
            -1,
            null);
    } catch {
        // do nothing
    }
}

