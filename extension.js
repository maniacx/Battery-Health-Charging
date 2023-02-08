'use strict';

const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const PopupMenu = imports.ui.popupMenu;
const Main = imports.ui.main;
const MessageTray = imports.ui.messageTray;
const SystemActions = imports.misc.systemActions;
const Util = imports.misc.util;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const QuickSettings = imports.ui.quickSettings;
const QuickSettingsMenu = imports.ui.main.panel.statusArea.quickSettings;
const Driver = Me.imports.driver;
const gettextDomain = Me.metadata['gettext-domain'];
const Gettext = imports.gettext.domain(gettextDomain);
const _ = Gettext.gettext;

const ICONS_FOLDER = Me.dir.get_child('icons').get_path();
var isChargeStartThresholdSupported = false;

function getIcon(iconName) {
    return Gio.icon_new_for_string(`${ICONS_FOLDER}/${iconName}.svg`);
}

const SystemMenuToggle = GObject.registerClass(
    class SystemMenuToggle extends QuickSettings.QuickMenuToggle {
        _init() {
            super._init();
            this._settings = ExtensionUtils.getSettings();
            this._chargeLimitSection = new PopupMenu.PopupMenuSection();
            this.menu.addMenuItem(this._chargeLimitSection);
            this.label = _('Charger Limit');
            this.gicon = getIcon('charging-limit-mix-ful-symbolic');
            this.toggleMode = false;
            this.menu.setHeader(getIcon('charging-limit-mix-ful-symbolic'), _('Battery Health Mode'));
            this._isChargeStartThresholdSupported = Driver.isChargeStartThresholdSupported();

            this.popupMenuFullCapacityLabel = _('Full Capacity Mode');
            this.popupMenuBalancedLabel = _('Balanced Mode');
            this.popupMenuMaxlifeLabel = _('Maximum Lifespan Mode');

            this._updatePanelMenu();

            if (isChargeStartThresholdSupported) {
                this._settings.connectObject(
                    'changed::charging-mode', () => {
                        this._updatePanelMenu();
                    },
                    'changed::icon-style-type', () => {
                        this._updatePanelMenu();
                    },
                    'changed::current-full-capacity-end-threshold', () => {
                        if (this._settings.get_string('charging-mode') === 'ful') {
                            let endValue = this._settings.get_int('current-full-capacity-end-threshold');
                            Driver.setEndThresholdLimit(endValue);
                            this._updatePanelMenu();
                        }
                    },
                    'changed::current-balanced-end-threshold', () => {
                        if (this._settings.get_string('charging-mode') === 'bal') {
                            let endValue = this._settings.get_int('current-balanced-end-threshold');
                            Driver.setEndThresholdLimit(endValue);
                            this._updatePanelMenu();
                        }
                    },
                    'changed::current-maxlife-end-threshold', () => {
                        if (this._settings.get_string('charging-mode') === 'max') {
                            let endValue = this._settings.get_int('current-maxlife-end-threshold');
                            Driver.setEndThresholdLimit(endValue);
                            this._updatePanelMenu();
                        }
                    },
                    'changed::current-full-capacity-start-threshold', () => {
                        if (this._settings.get_string('charging-mode') === 'ful') {
                            let startValue = this._settings.get_int('current-full-capacity-start-threshold');
                            Driver.setStartThresholdLimit(startValue);
                            this._updatePanelMenu();
                        }
                    },

                    'changed::current-balanced-start-threshold', () => {
                        if (this._settings.get_string('charging-mode') === 'bal') {
                            let startValue = this._settings.get_int('current-balanced-start-threshold');
                            Driver.setStartThresholdLimit(startValue);
                            this._updatePanelMenu();
                        }
                    },
                    'changed::current-maxlife-start-threshold', () => {
                        if (this._settings.get_string('charging-mode') === 'max') {
                            let startValue = this._settings.get_int('current-maxlife-start-threshold');
                            Driver.setStartThresholdLimit(startValue);
                            this._updatePanelMenu();
                        }
                    },
                    this
                );
            } else {
                this._settings.connectObject(
                    'changed::charging-mode', () => {
                        this._updatePanelMenu();
                    },
                    'changed::icon-style-type', () => {
                        this._updatePanelMenu();
                    },
                    'changed::current-full-capacity-end-threshold', () => {
                        if (this._settings.get_string('charging-mode') === 'ful') {
                            let endValue = this._settings.get_int('current-full-capacity-end-threshold');
                            Driver.setEndThresholdLimit(endValue);
                            this._updatePanelMenu();
                        }
                    },
                    'changed::current-balanced-end-threshold', () => {
                        if (this._settings.get_string('charging-mode') === 'bal') {
                            let endValue = this._settings.get_int('current-balanced-end-threshold');
                            Driver.setEndThresholdLimit(endValue);
                            this._updatePanelMenu();
                        }
                    },
                    'changed::current-maxlife-end-threshold', () => {
                        if (this._settings.get_string('charging-mode') === 'max') {
                            let endValue = this._settings.get_int('current-maxlife-end-threshold');
                            Driver.setEndThresholdLimit(endValue);
                            this._updatePanelMenu();
                        }
                    },
                    this
                );
            }
        }

        _updatePanelMenu() {
            const iconStyle = this._settings.get_int('icon-style-type');
            let iconType = 'mix';
            let currentLimitValueString = '';

            switch (iconStyle) {
            case 0:
                iconType = 'mix';
                break;
            case 1:
                iconType = 'sym';
                break;
            case 2:
                iconType = 'num';
                break;
            }

            this._chargeLimitSection.removeAll();

            let currentStartLimitValue = 0;
            let currentEndLimitValue = Driver.getCurrentEndLimitValue();

            if (isChargeStartThresholdSupported)
                currentStartLimitValue = Driver.getCurrentStartLimitValue();

            let currentLimitSettings = this._settings.get_string('charging-mode');

            let menuItemFul = new PopupMenu.PopupImageMenuItem(this.popupMenuFullCapacityLabel,
                getIcon(`charging-limit-${iconType}-ful-symbolic`));
            let menuItemBal = new PopupMenu.PopupImageMenuItem(this.popupMenuBalancedLabel,
                getIcon(`charging-limit-${iconType}-bal-symbolic`));
            let menuItemMax = new PopupMenu.PopupImageMenuItem(this.popupMenuMaxlifeLabel,
                getIcon(`charging-limit-${iconType}-max-symbolic`));

            if (isChargeStartThresholdSupported)
                currentLimitValueString = _('Device will stop charging at %d%%\nDevice will start charging at %d%%').format(currentEndLimitValue, currentStartLimitValue);
            else
                currentLimitValueString = _('Charging Limit is set to %d%%').format(currentEndLimitValue);


            let currentLimitItem = new PopupMenu.PopupMenuItem(currentLimitValueString);
            currentLimitItem.sensitive = false;
            currentLimitItem.active = false;

            menuItemFul.connect('activate', () => {
                Main.overview.hide();
                Main.panel.closeQuickSettings();
                Driver.setEndThresholdLimit(this._settings.get_int('current-full-capacity-end-threshold'));
                if (isChargeStartThresholdSupported)
                    Driver.setStartThresholdLimit(this._settings.get_int('current-full-capacity-start-threshold'));

                this._settings.set_string('charging-mode', 'ful');
            });

            menuItemBal.connect('activate', () => {
                Main.overview.hide();
                Main.panel.closeQuickSettings();
                Driver.setEndThresholdLimit(this._settings.get_int('current-balanced-end-threshold'));
                if (isChargeStartThresholdSupported)
                    Driver.setStartThresholdLimit(this._settings.get_int('current-balanced-start-threshold'));

                this._settings.set_string('charging-mode', 'bal');
            });

            menuItemMax.connect('activate', () => {
                Main.overview.hide();
                Main.panel.closeQuickSettings();
                Driver.setEndThresholdLimit(this._settings.get_int('current-maxlife-end-threshold'));
                if (isChargeStartThresholdSupported)
                    Driver.setStartThresholdLimit(this._settings.get_int('current-maxlife-start-threshold'));

                this._settings.set_string('charging-mode', 'max');
            });

            this._chargeLimitSection.addMenuItem(menuItemFul);
            this._chargeLimitSection.addMenuItem(menuItemBal);
            this._chargeLimitSection.addMenuItem(menuItemMax);
            this._chargeLimitSection.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
            this._chargeLimitSection.addMenuItem(currentLimitItem);
            this.gicon = getIcon(`charging-limit-${iconType}-${currentLimitSettings}-symbolic`);
            this.menu.setHeader(getIcon(`charging-limit-${iconType}-${currentLimitSettings}-symbolic`), _('Battery Health Mode'));

            menuItemFul.setOrnament(currentLimitSettings === 'ful'
                ? PopupMenu.Ornament.DOT
                : PopupMenu.Ornament.NONE);
            menuItemBal.setOrnament(currentLimitSettings === 'bal'
                ? PopupMenu.Ornament.DOT
                : PopupMenu.Ornament.NONE);
            menuItemMax.setOrnament(currentLimitSettings === 'max'
                ? PopupMenu.Ornament.DOT
                : PopupMenu.Ornament.NONE);
        }
    }
);

var SystemMenu = GObject.registerClass(
    class SystemMenu extends QuickSettings.SystemIndicator {
        _init() {
            super._init();

            this._settings = ExtensionUtils.getSettings();
            this._indicator = this._addIndicator();
            this._indicator.gicon = getIcon('charging-limit-mix-ful-symbolic');
            this.quickSettingsItems.push(new SystemMenuToggle());

            this.connect('destroy', () => {
                this.quickSettingsItems.forEach(item => item.destroy());
            });

            QuickSettingsMenu._indicators.insert_child_at_index(this, 0);
            QuickSettingsMenu._addItems(this.quickSettingsItems);
            this._updateIndicator();

            this._settings.connectObject(
                'changed::charging-mode', () => {
                    this._updateIndicator();
                },
                'changed::icon-style-type', () => {
                    this._updateIndicator();
                },
                'changed::show-system-indicator', () => {
                    this._updateIndicator();
                },
                this
            );
        }

        _updateIndicator() {
            const iconStyle = this._settings.get_int('icon-style-type');
            let iconType = 'mix';
            switch (iconStyle) {
            case 0:
                iconType = 'mix';
                break;
            case 1:
                iconType = 'sym';
                break;
            case 2:
                iconType = 'num';
                break;
            }

            let currentLimitSettings = this._settings.get_string('charging-mode');
            this._indicator.gicon = getIcon(`charging-limit-${iconType}-${currentLimitSettings}-symbolic`);

            if (this._settings.get_boolean('show-system-indicator'))
                this._indicator.visible = true;
            else
                this._indicator.visible = false;
        }
    }
);

class ChargeLimit {
    constructor() {
        this._indicator = null;
    }

    enable() {
        this._systemActions = new SystemActions.getDefault();
        this._settings = ExtensionUtils.getSettings();
        isChargeStartThresholdSupported = Driver.isChargeStartThresholdSupported();
        let flag = false;

        this._settings.connectObject(
            'changed::charging-mode', () => {
                let currentEndLimitValue = 0;
                let currentStartLimitValue = 0;
                let currentLimitSettings = this._settings.get_string('charging-mode');
                currentEndLimitValue = this.getCurrentEndValue(currentLimitSettings);

                if (isChargeStartThresholdSupported) {
                    currentStartLimitValue = this.getCurrentStartValue(currentLimitSettings);
                    this.notify(_('Charge thresholds are set to %d / %d %%').format(currentEndLimitValue, currentStartLimitValue), 'update');
                } else  {
                    this.notify(_('Charging Limit is set to %d%%').format(currentEndLimitValue), 'update');
                }
            },
            'changed::install-service', () => {
                if (flag) {
                    if (this._settings.get_boolean('install-service'))
                        this.notify(_('Installation Successfull. Please save your work and logout.'), 'installed');
                    else
                        this.notify(_('Uninstallation Successfull.'), 'uninstalled');
                }
            },
            this
        );

        switch (Driver.checkInCompatibility()) {
        case 0:
            flag = true;
            break;
        case 1:
            this.notify(_('Unsupported Gnome version.\nThis extension is compatible only with Gnome version 43 and above.'));
            return;
        case 2:
            this.notify(_('Unsupported device.\nCannot detect sysfs path : charge_control_end_threshold.'));
            return;
        case 3:
            this.notify(_('Battery Health service not installed.\n' +
                'Please install required service from Battery Health Charging extension settings under Install / Remove Service.'), 'show-settings');
            flag = true;
            return;
        }

        let currentLimitSettings = this._settings.get_string('charging-mode');
        Driver.setEndThresholdLimit(this.getCurrentEndValue(currentLimitSettings));
        if (isChargeStartThresholdSupported)
            Driver.setStartThresholdLimit(this.getCurrentStartValue(currentLimitSettings));


        this._indicator = new SystemMenu();
    }

    getCurrentEndValue(limit) {
        let value = 0;
        if (limit === 'ful')
            value = this._settings.get_int('current-full-capacity-end-threshold');
        else if (limit === 'bal')
            value = this._settings.get_int('current-balanced-end-threshold');
        else if (limit === 'max')
            value = this._settings.get_int('current-maxlife-end-threshold');

        return value;
    }

    getCurrentStartValue(limit) {
        let value = 0;
        if (limit === 'ful')
            value = this._settings.get_int('current-full-capacity-start-threshold');
        else if (limit === 'bal')
            value = this._settings.get_int('current-balanced-start-threshold');
        else if (limit === 'max')
            value = this._settings.get_int('current-maxlife-start-threshold');

        return value;
    }

    notify(msg, action = '') {
        let notifyTitle, notifyIcon;
        if (action === 'installed') {
            notifyTitle = _('Battery Health Charging');
            notifyIcon =  'system-reboot-symbolic';
        } else if (action === 'uninstalled') {
            notifyTitle = _('Battery Health Charging');
            notifyIcon = 'success-symbolic';
        } else if (action === 'update') {
            notifyTitle = _('Battery Health Charging');
            notifyIcon = 'battery-level-100-charged-symbolic';
        } else {
            notifyTitle = _('Battery Health Charging Gnome Extension Error');
            notifyIcon = 'mail-mark-junk-symbolic';
        }
        let source = new MessageTray.Source(Me.metadata.name, notifyIcon);
        Main.messageTray.add(source);

        let notification = new MessageTray.Notification(source, notifyTitle, msg);
        notification.setUrgency(3);
        notification.setTransient(true);
        if (action === 'installed') {
            notification.addAction(_('Log Out'), () => {
                this._systemActions.activateLogout();
            });
        } else if ((action === 'uninstalled') || (action === 'update')) {
            notification.setUrgency(1);
        } else if (action === 'show-settings') {
            notification.addAction(_('Settings'), () => {
                Util.spawn(['gnome-extensions', 'prefs', Me.metadata.uuid]);
            });
        }
        source.showNotification(notification);
    }

    disable() {
        this._settings.disconnectObject(this);
        if (this._indicator != null)
            this._indicator.destroy();
        this._settings = null;
        this._systemActions = null;
        this._indicator = null;
    }
}

function init() {
    ExtensionUtils.initTranslations(Me.metadata.uuid);
    return new ChargeLimit();
}
