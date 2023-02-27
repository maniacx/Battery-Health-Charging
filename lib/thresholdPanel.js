'use strict';
const {Clutter, Gio, GLib, GObject, St} = imports.gi;
const Main = imports.ui.main;
const PopupMenu = imports.ui.popupMenu;
const QuickSettings = imports.ui.quickSettings;
const QuickSettingsMenu = imports.ui.main.panel.statusArea.quickSettings;
const Config = imports.misc.config;
const Util = imports.misc.util;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const Driver = Me.imports.lib.driver;
const Notify = Me.imports.lib.notifier;

const gettextDomain = Me.metadata['gettext-domain'];
const Gettext = imports.gettext.domain(gettextDomain);
const _ = Gettext.gettext;

const [major] = Config.PACKAGE_VERSION.split('.');
const shellVersion = Number.parseInt(major);

const ICONS_FOLDER = Me.dir.get_child('icons').get_path();
let delayPanelId = null;
let delayIndicatorId = null;

function getIcon(iconName) {
    return Gio.icon_new_for_string(`${ICONS_FOLDER}/${iconName}.svg`);
}

const ChargeLimitToggle = GObject.registerClass(
    class ChargeLimitToggle extends QuickSettings.QuickMenuToggle {
        _init() {
            super._init();
            this._settings = ExtensionUtils.getSettings();
            this._type = this._settings.get_int('device-type');

            this._deviceHaveDualBattery = Driver.deviceInfo[this._type][1] === '1';       // laptop has dual battery
            this._deviceHaveStartThreshold = Driver.deviceInfo[this._type][0] === '1';    // laptop has start threshold
            this._deviceHaveBalanceMode = Driver.deviceInfo[this._type][4] !== '-none-';   // laptop do not have balance mode

            this._chargeLimitSection = new PopupMenu.PopupMenuSection();

            this._batteryLabel = _('Battery');
            this._battery1Label = _('Battery 1');
            this._battery2Label = _('Battery 2');

            if (shellVersion >= 44)
                this.title = this._batteryLabel;
            else
                this.label = this._batteryLabel;

            this.gicon = getIcon('charging-limit-sym-ful100-symbolic');
            this.menu.setHeader(getIcon('charging-limit-sym-ful100-symbolic'), _('Battery Charging Mode'));

            this.menu.addMenuItem(this._chargeLimitSection);

            if (this._deviceHaveDualBattery) {
                this.toggleMode = true;
                if (shellVersion >= 44)
                    this.title = this._battery1Label;
                else
                    this.label = this._battery1Label;
            } else {
                this.toggleMode = false;
                this._settings.set_boolean('show-battery-panel2', false);
            }

            // Add Extension Preference shortcut button icon
            this._preferencesButton = new St.Button({
                reactive: true,
                track_hover: true,
                can_focus: true,
                x_expand: true,
                y_align: Clutter.ActorAlign.CENTER,
                x_align: Clutter.ActorAlign.END,
                style_class: 'bhc-preferences-button',
            });
            this._preferencesButtonIcon = new St.Icon({
                gicon: getIcon('settings-symbolic'),
                icon_size: 16,
            });
            this._preferencesButton.child = this._preferencesButtonIcon;
            this.menu.addHeaderSuffix(this._preferencesButton);

            this._preferencesButton.connectObject('clicked', () => {
                Main.overview.hide();
                Main.panel.closeQuickSettings();
                Util.spawn(['gnome-extensions', 'prefs', Me.metadata.uuid]);
            });

            if (this._settings.get_boolean('show-preferences')) {
                this._preferencesButtonIcon.visible = true;
                this._preferencesButton.visible = true;
            } else {
                this._preferencesButtonIcon.visible = false;
                this._preferencesButton.visible = false;
            }

            // Define Popup Menu Labels
            this._popupMenuFullCapacityLabel = _('Full Capacity Mode');
            if (this._deviceHaveBalanceMode)
                this._popupMenuBalancedLabel = _('Balanced Mode');
            this._popupMenuMaxlifeLabel = _('Maximum Lifespan Mode');

            // update menu UI
            this._notify = 0; // Notifcations 0-Dont notify, 1-notifyUpdateInthreshold1, 2-notifyUpdateInthreshold2
            this._updatePanelMenu();

            // Observe changes to update Panel
            this._settings.connectObject(
                'changed::charging-mode', () => {
                    this._notify = 1;
                    this._updatePanelMenuWithDelay();
                },
                'changed::icon-style-type', () => {
                    this._notify = 0;
                    this._updatePanelMenu();
                },
                'changed::show-preferences', () => {
                    if (this._settings.get_boolean('show-preferences')) {
                        this._preferencesButtonIcon.visible = true;
                        this._preferencesButton.visible = true;
                    } else {
                        this._preferencesButtonIcon.visible = false;
                        this._preferencesButton.visible = false;
                    }
                    this._notify = 0;
                    this._updatePanelMenu();
                },
                'changed::show-quickmenu-subtitle', () => {
                    this._notify = 0;
                    this._updatePanelMenu();
                },
                'changed::default-threshold', () => {
                    if (this._settings.get_boolean('default-threshold')) {
                        this._notify = 1;
                        this._updatePanelMenuWithDelay();
                    }
                },
                'changed::dummy-apply-threshold', () => {
                    this._notify = 1;
                    this._updatePanelMenuWithDelay();
                },
                this
            );
            if (this._deviceHaveDualBattery) {
                this._settings.bind(
                    'show-battery-panel2',
                    this,
                    'checked',
                    Gio.SettingsBindFlags.DEFAULT);

                this._settings.connectObject(
                    'changed::charging-mode2', () => {
                        this._notify = 2;
                        this._updatePanelMenuWithDelay();
                    },
                    'changed::show-battery-panel2', () => {
                        this._notify = 0;
                        this._updatePanelMenu();
                    },
                    'changed::default-threshold2', () => {
                        if (this._settings.get_boolean('default-threshold2')) {
                            this._notify = 2;
                            this._updatePanelMenuWithDelay();
                        }
                    },
                    'changed::dummy-apply-threshold2', () => {
                        this._notify = 2;
                        this._updatePanelMenuWithDelay();
                    },
                    this
                );
            }
        }

        // Delayed updatePanelMenu for threshold to apply before reading from sysfs
        _updatePanelMenuWithDelay() {
            delayPanelId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, () => {
                this._updatePanelMenu();
                return GLib.SOURCE_REMOVE;
            });
        }

        // UpdatePanelMenu UI
        _updatePanelMenu() {
            // Display Panel for Battery 1 (false) or Battery 2 (true)
            let switchPanelToBattery2 = this._settings.get_boolean('show-battery-panel2');

            // Read updated threshold values from sysfs and notify
            if (this._notify === 1) {
                this._currentEndLimitValue = Driver.getCurrentEndLimitValue();
                if (this._deviceHaveStartThreshold) {
                    this._currentStartLimitValue = Driver.getCurrentStartLimitValue();
                    Notify.notifyUpdateThreshold(this._currentEndLimitValue, this._currentStartLimitValue);
                } else {
                    Notify.notifyUpdateThreshold(this._currentEndLimitValue, 0);
                }
                if (switchPanelToBattery2)
                    return;
            }
            if (this._notify === 2) {
                this._currentEndLimitValue = Driver.getCurrentEndLimit2Value();
                if (this._deviceHaveStartThreshold) {
                    this._currentStartLimitValue = Driver.getCurrentStartLimit2Value();
                    Notify.notifyUpdateThreshold2(this._currentEndLimitValue, this._currentStartLimitValue);
                } else {
                    Notify.notifyUpdateThreshold2(this._currentEndLimitValue, 0);
                }
                if (!switchPanelToBattery2)
                    return;
            }
            if (this._notify === 0) {
                this._currentEndLimitValue = switchPanelToBattery2 ? Driver.getCurrentEndLimit2Value()
                    : Driver.getCurrentEndLimitValue();
                if (this._deviceHaveStartThreshold) {
                    this._currentStartLimitValue = switchPanelToBattery2 ? Driver.getCurrentStartLimit2Value()
                        : Driver.getCurrentStartLimitValue();
                }
            }

            // Remove all UI items for
            this._chargeLimitSection.removeAll();
            this._menuItemFul = null;
            this._menuItemBal = null;
            this._menuItemMax = null;
            this._currentLimitItem = null;

            if (delayPanelId !== null) {
                GLib.Source.remove(delayPanelId);
                delayPanelId = null;
            }

            // Update quickmenu Label(Title)
            if (this._deviceHaveDualBattery) {
                if (switchPanelToBattery2) {
                    this._setHeaderSubtitle = this._battery2Label;
                    if (shellVersion >= 44)
                        this.title = this._battery2Label;
                    else
                        this.label = this._battery2Label;
                } else {
                    this._setHeaderSubtitle = this._battery1Label;
                    if (shellVersion >= 44)
                        this.title = this._battery1Label;
                    else
                        this.label = this._battery1Label;
                }
            } else  {
                this._setHeaderSubtitle = '';
                if (shellVersion >= 44)
                    this.title = this._batteryLabel;
                else
                    this.label = this._batteryLabel;
            }

            // Update quickmenu toggle subtitle
            let currentModeSettings = '';
            if (switchPanelToBattery2)
                currentModeSettings = this._settings.get_string('charging-mode2');
            else
                currentModeSettings = this._settings.get_string('charging-mode');

            if ((shellVersion >= 44) && this._settings.get_boolean('show-quickmenu-subtitle')) {
                if (currentModeSettings === 'ful')
                    this.subtitle = _('Full Capacity');
                else if (currentModeSettings === 'bal')
                    this.subtitle = _('Balanced');
                else if (currentModeSettings === 'max')
                    this.subtitle = _('Max Lifespan');
            } else {
                this.subtitle = null;
            }

            // Update header icon and gicon
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
            let currentModeIcon = '';
            if (currentModeSettings === 'ful')
                currentModeIcon = Driver.deviceInfo[this._type][3]; // Get full capacity mode for type of laptop
            else if (currentModeSettings === 'bal')
                currentModeIcon = Driver.deviceInfo[this._type][4]; // Get balance mode for type of laptop
            else if (currentModeSettings === 'max')
                currentModeIcon = Driver.deviceInfo[this._type][5]; // Get maxlife mode for type of laptop

            const headerIconName = `charging-limit-${iconType}-${currentModeIcon}-symbolic`;
            this.gicon = getIcon(headerIconName);
            this.menu.setHeader(getIcon(headerIconName), _('Battery Charging Mode'), this._setHeaderSubtitle);


            // Define PopupMenu Items to display Current Threshold Reading on sysfs
            let currentLimitValueString = '';
            if (this._deviceHaveStartThreshold) {
                currentLimitValueString = _('Device will stop charging at %d%%\nDevice will start charging at %d%%')
                    .format(this._currentEndLimitValue, this._currentStartLimitValue);
            } else {
                currentLimitValueString = _('Charging Limit is set to %d%%').format(this._currentEndLimitValue);
            }
            this._currentLimitItem = new PopupMenu.PopupMenuItem(currentLimitValueString);
            this._currentLimitItem.sensitive = false;
            this._currentLimitItem.active = false;

            // Define PopupMenu Items for charging modes
            this._menuItemFul = new PopupMenu.PopupImageMenuItem(this._popupMenuFullCapacityLabel,
                getIcon(`charging-limit-${iconType}-${Driver.deviceInfo[this._type][3]}-symbolic`));
            if (this._deviceHaveBalanceMode) {
                this._menuItemBal = new PopupMenu.PopupImageMenuItem(this._popupMenuBalancedLabel,
                    getIcon(`charging-limit-${iconType}-${Driver.deviceInfo[this._type][4]}-symbolic`));
            }
            this._menuItemMax = new PopupMenu.PopupImageMenuItem(this._popupMenuMaxlifeLabel,
                getIcon(`charging-limit-${iconType}-${Driver.deviceInfo[this._type][5]}-symbolic`));

            // Add menu items to UI
            this._chargeLimitSection.addMenuItem(this._menuItemFul);
            if (this._deviceHaveBalanceMode)
                this._chargeLimitSection.addMenuItem(this._menuItemBal);
            this._chargeLimitSection.addMenuItem(this._menuItemMax);
            this._chargeLimitSection.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
            this._chargeLimitSection.addMenuItem(this._currentLimitItem);

            // Display a dot to highlight current mode
            this._menuItemFul.setOrnament(currentModeSettings === 'ful' ? PopupMenu.Ornament.DOT : PopupMenu.Ornament.NONE);
            if (this._deviceHaveBalanceMode)
                this._menuItemBal.setOrnament(currentModeSettings === 'bal' ? PopupMenu.Ornament.DOT : PopupMenu.Ornament.NONE);
            this._menuItemMax.setOrnament(currentModeSettings === 'max' ? PopupMenu.Ornament.DOT : PopupMenu.Ornament.NONE);

            // Connect on click
            this._menuItemFul.connectObject('activate', () => {
                Main.overview.hide();
                Main.panel.closeQuickSettings();
                if (switchPanelToBattery2) {
                    Driver.setThresholdLimit2('ful');
                    this._settings.set_string('charging-mode2', 'ful');
                } else {
                    Driver.setThresholdLimit('ful');
                    this._settings.set_string('charging-mode', 'ful');
                }
            });
            if (this._deviceHaveBalanceMode) {
                this._menuItemBal.connectObject('activate', () => {
                    Main.overview.hide();
                    Main.panel.closeQuickSettings();
                    if (switchPanelToBattery2) {
                        Driver.setThresholdLimit2('bal');
                        this._settings.set_string('charging-mode2', 'bal');
                    } else {
                        Driver.setThresholdLimit('bal');
                        this._settings.set_string('charging-mode', 'bal');
                    }
                });
            }
            this._menuItemMax.connectObject('activate', () => {
                Main.overview.hide();
                Main.panel.closeQuickSettings();
                if (switchPanelToBattery2) {
                    Driver.setThresholdLimit2('max');
                    this._settings.set_string('charging-mode2', 'max');
                } else {
                    Driver.setThresholdLimit('max');
                    this._settings.set_string('charging-mode', 'max');
                }
            });
        }
    }
);

var ThresholdPanel = GObject.registerClass(
    class ThresholdPanel extends QuickSettings.SystemIndicator {
        constructor() {
            super();
            this._settings = ExtensionUtils.getSettings();
            let installationCheckCompleted = false;
            let installationStatus = 0;

            if (shellVersion < 43) {
                Notify.notifyGnomeIncompatible();
                return;
            }

            // Observe changes (only after initialization) in install service and notify accordingly
            this._settings.connectObject(
                'changed::install-service', () => {
                    if (installationCheckCompleted) {
                        const installStatus = this._settings.get_int('install-service');
                        if ((installationStatus === 1) && (installStatus === 0)) {
                            Notify.notifyPolkitInstallationSuccessfull();
                            installationStatus = 0;
                        }
                        if ((installationStatus === 2) && (installStatus === 0)) {
                            Notify.notifyPolkitUpdateSuccessfull();
                            installationStatus = 0;
                        }
                        if ((installationStatus === 0) && (installStatus === 1)) {
                            Notify.notifyUnInstallationSuccessfull();
                            installationStatus = 1;
                        }
                    }
                },
                this
            );

            // Check for device compatibilty, notify and initialize driver
            Driver.checkInCompatibility().then(notifier => {
                switch (notifier) {
                    case 0:
                        installationCheckCompleted = true;
                        break;
                    case 1:
                        Notify.notifyUnsupportedDevice();
                        return;
                    case 2:
                        Notify.notifyRemoveOutdatedFiles();
                        return;
                    case 3:
                        Notify.notifyNeedPolkitUpdate();// 2
                        installationStatus = 2;
                        installationCheckCompleted = true;
                        return;
                    case 4:
                        Notify.notifyNoPolkitInstalled();// 1
                        installationStatus = 1;
                        installationCheckCompleted = true;
                        return;
                }

                // Delayed start indicator for threshold to apply before reading from sysfs
                delayIndicatorId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 2, () => {
                    this._startIndicator();
                    return GLib.SOURCE_REMOVE;
                });
            });
        }

        _startIndicator() {
            this._indicator = this._addIndicator();
            this._indicator.gicon = getIcon('charging-limit-sym-ful100-symbolic');
            this.quickSettingsItems.push(new ChargeLimitToggle());

            QuickSettingsMenu._indicators.insert_child_at_index(this, 0);
            QuickSettingsMenu._addItems(this.quickSettingsItems);
            this._updateIndicator();

            // Observe for changes to update indicator
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
            if (Driver.deviceInfo[this._type][1] === '1') {         // if laptop is dual battery
                this._settings.connectObject(
                    'changed::charging-mode2', () => {
                        this._updateIndicator();
                    },
                    'changed::show-battery-panel2', () => {
                        this._updateIndicator();
                    },
                    this
                );
            }
            if (delayIndicatorId !== null) {
                GLib.Source.remove(delayIndicatorId);
                delayIndicatorId = null;
            }
        }

        // start updating indicator icon
        _updateIndicator() {
            if (this._settings.get_boolean('show-system-indicator')) {    // if show indicator enabled
                this._indicator.visible = true;
                this._type = this._settings.get_int('device-type');
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

                let currentModeSettings = '';
                let currentModeIcon = '';

                // Display indicator for Battery 1 (false) or Battery 2 (true)
                if (this._settings.get_boolean('show-battery-panel2'))
                    currentModeSettings = this._settings.get_string('charging-mode2');
                else
                    currentModeSettings = this._settings.get_string('charging-mode');

                if (currentModeSettings === 'ful')
                    currentModeIcon = Driver.deviceInfo[this._type][3];
                else if (currentModeSettings === 'bal')
                    currentModeIcon = Driver.deviceInfo[this._type][4];
                else if (currentModeSettings === 'max')
                    currentModeIcon = Driver.deviceInfo[this._type][5];

                this._indicator.gicon = getIcon(`charging-limit-${iconType}-${currentModeIcon}-symbolic`);

            } else {    // else show indicator enabled
                this._indicator.visible = false;
            }    // fi show indicator enabled
        }

        destroy() {
            this._settings.disconnectObject(this);
            this.quickSettingsItems.forEach(item => item.destroy());
            if (delayPanelId !== null) {
                GLib.Source.remove(delayPanelId);
                delayPanelId = null;
            }
            if (delayIndicatorId !== null) {
                GLib.Source.remove(delayIndicatorId);
                delayIndicatorId = null;
            }
            this._settings = null;
            this._indicator = null;
            this.run_dispose();
        }
    }

);
