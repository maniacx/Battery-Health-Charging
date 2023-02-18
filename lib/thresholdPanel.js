'use strict';

const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const PopupMenu = imports.ui.popupMenu;
const Main = imports.ui.main;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const QuickSettings = imports.ui.quickSettings;
const QuickSettingsMenu = imports.ui.main.panel.statusArea.quickSettings;
const Driver = Me.imports.lib.driver;
const Notify = Me.imports.lib.notifier;
const gettextDomain = Me.metadata['gettext-domain'];
const Gettext = imports.gettext.domain(gettextDomain);
const _ = Gettext.gettext;

const ICONS_FOLDER = Me.dir.get_child('icons').get_path();

function getIcon(iconName) {
    return Gio.icon_new_for_string(`${ICONS_FOLDER}/${iconName}.svg`);
}

const SystemMenuToggle = GObject.registerClass(
    class SystemMenuToggle extends QuickSettings.QuickMenuToggle {
        _init() {
            super._init();
            this._settings = ExtensionUtils.getSettings();
            this.type = this._settings.get_int('device-type');

            this._chargeLimitSection = new PopupMenu.PopupMenuSection();
            this.label = _('Charger Limit');
            this.menu.addMenuItem(this._chargeLimitSection);
            if (Driver.deviceInfo[this.type][1] === '1') {
                this.label = _('Battery 1');
                this.toggleMode = true;
                this._chargeLimitSection2 = new PopupMenu.PopupMenuSection();
                this.menu.addMenuItem(this._chargeLimitSection2);
            } else {
                this.toggleMode = false;
                this._settings.set_boolean('show-battery-panel2', false);
            }

            this.gicon = getIcon('charging-limit-sym-ful100-symbolic');
            this.menu.setHeader(getIcon('charging-limit-sym-ful100-symbolic'), _('Battery Health Mode'));

            // Define Popup Menu Labels
            this.popupMenuFullCapacityLabel = _('Full Capacity Mode');
            if (!(Driver.deviceInfo[this.type][4] === '-none-'))
                this.popupMenuBalancedLabel = _('Balanced Mode');
            this.popupMenuMaxlifeLabel = _('Maximum Lifespan Mode');

            // update menu UI
            this._updatePanelMenu();

            this._settings.connectObject(
                'changed::charging-mode', () => {
                    this._setDelayId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, () => {
                        this._updatePanelMenu();
                        Notify.notifyUpdateThreshold();
                        return GLib.SOURCE_REMOVE;
                    });
                },
                'changed::icon-style-type', () => {
                    this._updatePanelMenu();
                },
                'changed::default-threshold', () => {
                    if (this._settings.get_boolean('default-threshold')) {
                        this._setDelayId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, () => {
                            this._updatePanelMenu();
                            Notify.notifyUpdateThreshold();
                            return GLib.SOURCE_REMOVE;
                        });
                    }
                },
                'changed::dummy-apply-threshold', () => {
                    this._setDelayId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, () => {
                        this._updatePanelMenu();
                        Notify.notifyUpdateThreshold();
                        return GLib.SOURCE_REMOVE;
                    });
                },
                this
            );
            if (Driver.deviceInfo[this.type][1] === '1') {
                this._settings.bind(
                    'show-battery-panel2',
                    this,
                    'checked',
                    Gio.SettingsBindFlags.DEFAULT);

                this._settings.connectObject(
                    'changed::charging-mode2', () => {
                        this._setDelayId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, () => {
                            this._updatePanelMenu();
                            Notify.notifyUpdateThreshold2();
                            return GLib.SOURCE_REMOVE;
                        });
                    },
                    'changed::show-battery-panel2', () => {
                        this._updatePanelMenu();
                    },
                    'changed::default-threshold2', () => {
                        if (this._settings.get_boolean('default-threshold2')) {
                            this._setDelayId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, () => {
                                this._updatePanelMenu();
                                Notify.notifyUpdateThreshold2();
                                return GLib.SOURCE_REMOVE;
                            });
                        }
                    },
                    'changed::dummy-apply-threshold2', () => {
                        this._setDelayId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, () => {
                            this._updatePanelMenu();
                            Notify.notifyUpdateThreshold2();
                            return GLib.SOURCE_REMOVE;
                        });
                    },
                    this
                );
            }
        }

        _updatePanelMenu() {
            const iconStyle = this._settings.get_int('icon-style-type');
            this.iconType = 'mix';
            switch (iconStyle) {
                case 0:
                    this.iconType = 'mix';
                    break;
                case 1:
                    this.iconType = 'sym';
                    break;
                case 2:
                    this.iconType = 'num';
                    break;
            }

            if (this._setDelayId > 0)
                GLib.source_remove(this._setDelayId);

            // Remove all UI items for
            this._chargeLimitSection.removeAll();
            if (Driver.deviceInfo[this.type][1] === '1')
                this._chargeLimitSection2.removeAll();

            // Battery1/2 Panel and Recreate with new parameters
            if (!this._settings.get_boolean('show-battery-panel2')) {
                this.currentModeSettings = this._settings.get_string('charging-mode');
                this._updatePanelMenuBattery1();
            } else if (Driver.deviceInfo[this.type][1] === '1') {
                this.currentMode2Settings = this._settings.get_string('charging-mode2');
                this._updatePanelMenuBattery2();
            }

            // Update Icon & Header Icon
            if (!this._settings.get_boolean('show-battery-panel2')) {
                if (this.currentModeSettings === 'ful')
                    this.currentModeIcon = Driver.deviceInfo[this.type][3];
                else if (this.currentModeSettings === 'bal')
                    this.currentModeIcon = Driver.deviceInfo[this.type][4];
                else if (this.currentModeSettings === 'max')
                    this.currentModeIcon = Driver.deviceInfo[this.type][5];
            }   else if (Driver.deviceInfo[this.type][1] === '1') {
                if (this.currentMode2Settings === 'ful')
                    this.currentModeIcon = Driver.deviceInfo[this.type][3];
                else if (this.currentMode2Settings === 'bal')
                    this.currentModeIcon = Driver.deviceInfo[this.type][4];
                else if (this.currentMode2Settings === 'max')
                    this.currentModeIcon = Driver.deviceInfo[this.type][5];
            }

            if (Driver.deviceInfo[this.type][1] === '1') {
                if (!this._settings.get_boolean('show-battery-panel2')) {
                    this.label = _('Battery 1');
                    this.setHeaderSubtitle = _('Battery 1');
                } else {
                    this.label = _('Battery 2');
                    this.setHeaderSubtitle = _('Battery 2');
                }
            } else  {
                this.label = _('Charger Limit');
                this.setHeaderSubtitle = '';
            }

            const headerIconName = `charging-limit-${this.iconType}-${this.currentModeIcon}-symbolic`;
            this.gicon = getIcon(headerIconName);
            this.menu.setHeader(getIcon(headerIconName), _('Battery Health Mode'), this.setHeaderSubtitle);
        }

        _updatePanelMenuBattery1() {
            // Define PopupMenu Items to click on modes
            this.menuItemFul = new PopupMenu.PopupImageMenuItem(this.popupMenuFullCapacityLabel,
                getIcon(`charging-limit-${this.iconType}-${Driver.deviceInfo[this.type][3]}-symbolic`));
            if (!(Driver.deviceInfo[this.type][4] === '-none-')) {
                this.menuItemBal = new PopupMenu.PopupImageMenuItem(this.popupMenuBalancedLabel,
                    getIcon(`charging-limit-${this.iconType}-${Driver.deviceInfo[this.type][4]}-symbolic`));
            }
            this.menuItemMax = new PopupMenu.PopupImageMenuItem(this.popupMenuMaxlifeLabel,
                getIcon(`charging-limit-${this.iconType}-${Driver.deviceInfo[this.type][5]}-symbolic`));

            // Define PopupMenu Items to show Current Threshold Reading on sysfs
            let currentLimitValueString = '';
            this.currentEndLimitValue = Driver.getCurrentEndLimitValue();
            if (Driver.deviceInfo[this.type][0] === '1') {
                this.currentStartLimitValue = Driver.getCurrentStartLimitValue();
                currentLimitValueString = _('Device will stop charging at %d%%\nDevice will start charging at %d%%').format(this.currentEndLimitValue, this.currentStartLimitValue);
            } else {
                currentLimitValueString = _('Charging Limit is set to %d%%').format(this.currentEndLimitValue);
            }
            this.currentLimitItem = new PopupMenu.PopupMenuItem(currentLimitValueString);
            this.currentLimitItem.sensitive = false;
            this.currentLimitItem.active = false;

            // Add menu items to UI
            this._chargeLimitSection.addMenuItem(this.menuItemFul);
            if (!(Driver.deviceInfo[this.type][4] === '-none-'))
                this._chargeLimitSection.addMenuItem(this.menuItemBal);
            this._chargeLimitSection.addMenuItem(this.menuItemMax);
            this._chargeLimitSection.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
            this._chargeLimitSection.addMenuItem(this.currentLimitItem);

            // Display a dot to highlight current mode
            this.menuItemFul.setOrnament(this.currentModeSettings === 'ful' ? PopupMenu.Ornament.DOT : PopupMenu.Ornament.NONE);
            if (!(Driver.deviceInfo[this.type][4] === '-none-'))
                this.menuItemBal.setOrnament(this.currentModeSettings === 'bal' ? PopupMenu.Ornament.DOT : PopupMenu.Ornament.NONE);
            this.menuItemMax.setOrnament(this.currentModeSettings === 'max' ? PopupMenu.Ornament.DOT : PopupMenu.Ornament.NONE);

            // Connect on click
            this.menuItemFul.connectObject('activate', () => {
                Main.overview.hide();
                Main.panel.closeQuickSettings();
                Driver.setThresholdLimit('ful');
                this._settings.set_string('charging-mode', 'ful');
            });
            if (!(Driver.deviceInfo[this.type][4] === '-none-')) {
                this.menuItemBal.connectObject('activate', () => {
                    Main.overview.hide();
                    Main.panel.closeQuickSettings();
                    Driver.setThresholdLimit('bal');
                    this._settings.set_string('charging-mode', 'bal');
                });
            }
            this.menuItemMax.connectObject('activate', () => {
                Main.overview.hide();
                Main.panel.closeQuickSettings();
                Driver.setThresholdLimit('max');
                this._settings.set_string('charging-mode', 'max');
            });
        }


        _updatePanelMenuBattery2() {
            // Define PopupMenu Items to click on modes
            this.menuItem2Ful = new PopupMenu.PopupImageMenuItem(this.popupMenuFullCapacityLabel,
                getIcon(`charging-limit-${this.iconType}-${Driver.deviceInfo[this.type][3]}-symbolic`));
            if (!(Driver.deviceInfo[this.type][4] === '-none-')) {
                this.menuItem2Bal = new PopupMenu.PopupImageMenuItem(this.popupMenuBalancedLabel,
                    getIcon(`charging-limit-${this.iconType}-${Driver.deviceInfo[this.type][4]}-symbolic`));
            }
            this.menuItem2Max = new PopupMenu.PopupImageMenuItem(this.popupMenuMaxlifeLabel,
                getIcon(`charging-limit-${this.iconType}-${Driver.deviceInfo[this.type][5]}-symbolic`));

            // Define PopupMenu Items to show Current Threshold Reading on sysfs
            let currentLimit2ValueString = '';
            this.currentEndLimit2Value = Driver.getCurrentEndLimit2Value();
            if (Driver.deviceInfo[this.type][0] === '1') {
                this.currentStartLimit2Value = Driver.getCurrentStartLimit2Value();
                currentLimit2ValueString = _('Device will stop charging at %d%%\nDevice will start charging at %d%%').format(this.currentEndLimit2Value, this.currentStartLimit2Value);
            } else {
                currentLimit2ValueString = _('Charging Limit is set to %d%%').format(this.currentEndLimit2Value);
            }
            this.currentLimit2Item = new PopupMenu.PopupMenuItem(currentLimit2ValueString);
            this.currentLimit2Item.sensitive = false;
            this.currentLimit2Item.active = false;

            // Add menu items to UI
            this._chargeLimitSection2.addMenuItem(this.menuItem2Ful);
            if (!(Driver.deviceInfo[this.type][4] === '-none-'))
                this._chargeLimitSection2.addMenuItem(this.menuItem2Bal);
            this._chargeLimitSection2.addMenuItem(this.menuItem2Max);
            this._chargeLimitSection2.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
            this._chargeLimitSection2.addMenuItem(this.currentLimit2Item);

            // Display a dot to highlight current mode
            this.menuItem2Ful.setOrnament(this.currentMode2Settings === 'ful' ? PopupMenu.Ornament.DOT : PopupMenu.Ornament.NONE);
            if (!(Driver.deviceInfo[this.type][4] === '-none-'))
                this.menuItem2Bal.setOrnament(this.currentMode2Settings === 'bal' ? PopupMenu.Ornament.DOT : PopupMenu.Ornament.NONE);
            this.menuItem2Max.setOrnament(this.currentMode2Settings === 'max' ? PopupMenu.Ornament.DOT : PopupMenu.Ornament.NONE);

            // Connect on click
            this.menuItem2Ful.connectObject('activate', () => {
                Main.overview.hide();
                Main.panel.closeQuickSettings();
                Driver.setThresholdLimit2('ful');
                this._settings.set_string('charging-mode2', 'ful');
            });
            if (!(Driver.deviceInfo[this.type][4] === '-none-')) {
                this.menuItem2Bal.connectObject('activate', () => {
                    Main.overview.hide();
                    Main.panel.closeQuickSettings();
                    Driver.setThresholdLimit2('bal');
                    this._settings.set_string('charging-mode2', 'bal');
                });
            }
            this.menuItem2Max.connectObject('activate', () => {
                Main.overview.hide();
                Main.panel.closeQuickSettings();
                Driver.setThresholdLimit2('max');
                this._settings.set_string('charging-mode2', 'max');
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

            Driver.checkInCompatibility().then(notifier => {
                switch (notifier) {
                    case 0:
                        installationCheckCompleted = true;
                        break;
                    case 1:
                        Notify.notifyGnomeIncompatible();
                        return;
                    case 2:
                        Notify.notifyUnsupportedDevice();
                        return;
                    case 3:
                        Notify.notifyRemoveOutdatedFiles();
                        return;
                    case 4:
                        Notify.notifyNeedPolkitUpdate();// 2
                        installationStatus = 2;
                        installationCheckCompleted = true;
                        return;
                    case 5:
                        Notify.notifyNoPolkitInstalled();// 1
                        installationStatus = 1;
                        installationCheckCompleted = true;
                        return;
                    case 6:
                        Notify.notifyUnknownError();
                        return;
                }

                this._setDelayIndicatorId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 2, () => {
                    this._startIndicator();
                    return GLib.SOURCE_REMOVE;
                });
            });
        }

        _startIndicator() {
            this._indicator = this._addIndicator();
            this._indicator.gicon = getIcon('charging-limit-sym-ful100-symbolic');
            this.quickSettingsItems.push(new SystemMenuToggle());

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
            if (Driver.deviceInfo[this.type][1] === '1') {
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
            if (this._setDelayIndicatorId > 0)
                GLib.source_remove(this._setDelayIndicatorId);
        }

        _updateIndicator() {
            if (this._settings.get_boolean('show-system-indicator')) {
                this._indicator.visible = true;
                this.type = this._settings.get_int('device-type');
                const iconStyle = this._settings.get_int('icon-style-type');
                this.iconType = 'mix';
                switch (iconStyle) {
                    case 0:
                        this.iconType = 'mix';
                        break;
                    case 1:
                        this.iconType = 'sym';
                        break;
                    case 2:
                        this.iconType = 'num';
                        break;
                }

                if (!this._settings.get_boolean('show-battery-panel2')) {
                    this.currentModeSettings = this._settings.get_string('charging-mode');
                    if (this.currentModeSettings === 'ful')
                        this.currentModeIcon = Driver.deviceInfo[this.type][3];
                    else if (this.currentModeSettings === 'bal')
                        this.currentModeIcon = Driver.deviceInfo[this.type][4];
                    else if (this.currentModeSettings === 'max')
                        this.currentModeIcon = Driver.deviceInfo[this.type][5];
                }   else if (Driver.deviceInfo[this.type][1] === '1') {
                    this.currentMode2Settings = this._settings.get_string('charging-mode2');
                    if (this.currentMode2Settings === 'ful')
                        this.currentModeIcon = Driver.deviceInfo[this.type][3];
                    else if (this.currentMode2Settings === 'bal')
                        this.currentModeIcon = Driver.deviceInfo[this.type][4];
                    else if (this.currentMode2Settings === 'max')
                        this.currentModeIcon = Driver.deviceInfo[this.type][5];
                }
                this._indicator.gicon = getIcon(`charging-limit-${this.iconType}-${this.currentModeIcon}-symbolic`);
            } else {
                this._indicator.visible = false;
            }
        }

        destroy() {
            this._settings.disconnectObject(this);
            this.quickSettingsItems.forEach(item => item.destroy());
            this._settings = null;
            this._indicator = null;
            this.run_dispose();
        }
    }

);
