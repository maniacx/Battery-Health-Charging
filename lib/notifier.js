'use strict';
const Main = imports.ui.main;
const MessageTray = imports.ui.messageTray;
const SystemActions = imports.misc.systemActions;
const Util = imports.misc.util;
const NotificationDestroyedReason = imports.ui.messageTray.NotificationDestroyedReason;
const Urgency = imports.ui.messageTray.Urgency;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const Driver = Me.imports.lib.driver;

const gettextDomain = Me.metadata['gettext-domain'];
const Gettext = imports.gettext.domain(gettextDomain);
const _ = Gettext.gettext;
let source = null;

function checkActiveNotification() {
    let status = false;
    let activeSource = Main.messageTray.getSources();
    if (activeSource[0] == null) {
        source = null;
        return false;
    }
    activeSource.forEach(item => {
        if (item === source)
            status = true;
    });
    return status;
}

function notify(msg, action) {
    let notifyTitle, notifyIcon;
    let urgency = Urgency.CRITICAL;

    if (action === 'installed') {
        notifyTitle = _('Battery Health Charging');
        notifyIcon =  'system-reboot-symbolic';
    } else if (action === 'uninstalled') {
        notifyTitle = _('Battery Health Charging');
        notifyIcon = 'success-symbolic';
    } else if (action === 'update') {
        notifyTitle = _('Battery Health Charging');
        notifyIcon = 'battery-level-100-charged-symbolic';
    } else if (action === 'error') {
        notifyTitle = _('Battery Health Charging Gnome Extension Error');
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
            Util.spawn(['gnome-extensions', 'prefs', Me.metadata.uuid]);
        });
    } else if (action === 'clean') {
        notification.addAction(_('Remove files and restart'), () => {
            cleanOutdatedFilesnReboot();
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
    notify(_('Unsupported Gnome version.\nThis extension is compatible only with Gnome version 43 and above.'), 'error');
}

function notifyUnsupportedDevice() {
    notify(_('Unsupported device.\nThis extension is not compatible with your device'), 'error');
}

function notifyRemoveOutdatedFiles() {
    notify(_('Found unused service files from previous version of this extension. Remove to continue running this extension\nRoot privileges and a system restart are required. Please save your work and restart'), 'clean');
}

function notifyNoPolkitInstalled() {
    notify(_('Please install polkit from extension settings under Installation.'), 'show-settings');
}

function notifyNeedPolkitUpdate() {
    notify(_('Please update polkit from extension settings under Installation.'), 'show-settings');
}

function notifyPolkitInstallationSuccessfull() {
    notify(_('Installation Successfull. Please save your work and logout.'), 'installed');
}

function notifyPolkitUpdateSuccessfull() {
    notify(_('Installation Successfull. Please save your work and logout.'), 'installed');
}

function notifyUnInstallationSuccessfull() {
    notify(_('Uninstallation Successfull.'), 'uninstalled');
}

function notifyUpdateThreshold(currentEndLimitValue, currentStartLimitValue) {
    if (ExtensionUtils.getSettings().get_boolean('show-notifications')) {
        const type = ExtensionUtils.getSettings().get_int('device-type');
        if (Driver.deviceInfo[type][0] === '1') {
            if (Driver.deviceInfo[type][1] === '1') {
                notify(_('Battery 1\nCharge thresholds are set to %d / %d %%')
                    .format(currentEndLimitValue, currentStartLimitValue), 'update');
            } else {
                notify(_('Charge thresholds are set to %d / %d %%')
                    .format(currentEndLimitValue, currentStartLimitValue), 'update');
            }
        } else  if (Driver.deviceInfo[type][1] === '1') {
            notify(_('Battery 1\nCharging Limit is set to %d%%').format(currentEndLimitValue), 'update');
        } else {
            notify(_('Charging Limit is set to %d%%').format(currentEndLimitValue), 'update');
        }
    }
}

function notifyUpdateThreshold2(currentEndLimit2Value, currentStartLimit2Value) {
    if (ExtensionUtils.getSettings().get_boolean('show-notifications')) {
        const type = ExtensionUtils.getSettings().get_int('device-type');
        if (Driver.deviceInfo[type][0] === '1') {
            notify(_('Battery 2\nCharge thresholds are set to %d / %d %%')
                .format(currentEndLimit2Value, currentStartLimit2Value), 'update');
        } else {
            notify(_('Battery 2\nCharging Limit is set to %d%%')
                .format(currentEndLimit2Value), 'update');
        }
    }
}

async function cleanOutdatedFilesnReboot() {
    const status = await Driver.cleanOutdatedFiles();
    if (status === 0)
        SystemActions.getDefault().activateRestart();
}
