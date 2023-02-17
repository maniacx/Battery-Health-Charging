'use strict';

const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
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
            this._chargeLimitSection = new PopupMenu.PopupMenuSection();
            this.menu.addMenuItem(this._chargeLimitSection);
            this.label = _('Charger Limit');
            this.gicon = getIcon('charging-limit-mix-ful-symbolic');
            this.toggleMode = false;
            this.menu.setHeader(getIcon('charging-limit-mix-ful100-symbolic'), _('Battery Health Mode'));

            this.type = this._settings.get_int('device-type');

            let showLabel;
            if (Driver.deviceInfo[this.type][1] === '1')
                showLabel = _('BAT0: ');
            else
                showLabel = '';

            this.popupMenuFullCapacityLabel = _('%sFull Capacity Mode').format(showLabel);

            if (!(Driver.deviceInfo[this.type][4] === '-none-'))
                this.popupMenuBalancedLabel = _('%sBalanced Mode').format(showLabel);

            this.popupMenuMaxlifeLabel = _('%sMaximum Lifespan Mode').format(showLabel);

            this._updatePanelMenu();

            this._settings.connectObject(
                'changed::charging-mode', () => {
                    this._updatePanelMenu();
                },
                'changed::charging-mode2', () => {
                    this._updatePanelMenu();
                },
                'changed::icon-style-type', () => {
                    this._updatePanelMenu();
                },
                'changed::default-threshold', () => {
                    this._updatePanelMenu();
                },
                'changed::default-threshold2', () => {
                    this._updatePanelMenu();
                },
                'changed::apply-threshold', () => {
                    this._updatePanelMenu();
                },
                'changed::apply-threshold2', () => {
                    this._updatePanelMenu();
                },
                this
            );
        }

        _updatePanelMenu() {
            let currentMode2Settings;

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

            this._chargeLimitSection.removeAll();

            // BAT0
            let currentStartLimitValue = 0;
            let currentEndLimitValue = Driver.getCurrentEndLimitValue();

            if (Driver.deviceInfo[this.type][0] === '1')
                currentStartLimitValue = Driver.getCurrentStartLimitValue();

            let currentModeSettings = this._settings.get_string('charging-mode');

            this.menuItemFul = new PopupMenu.PopupImageMenuItem(this.popupMenuFullCapacityLabel,
                getIcon(`charging-limit-${iconType}-${Driver.deviceInfo[this.type][3]}-symbolic`));

            if (!(Driver.deviceInfo[this.type][4] === '-none-')) {
                this.menuItemBal = new PopupMenu.PopupImageMenuItem(this.popupMenuBalancedLabel,
                    getIcon(`charging-limit-${iconType}-${Driver.deviceInfo[this.type][4]}-symbolic`));
            }

            this.menuItemMax = new PopupMenu.PopupImageMenuItem(this.popupMenuMaxlifeLabel,
                getIcon(`charging-limit-${iconType}-${Driver.deviceInfo[this.type][5]}-symbolic`));

            let currentLimitValueString = '';
            if (Driver.deviceInfo[this.type][0] === '1')
                currentLimitValueString = _('Device will stop charging at %d%%\nDevice will start charging at %d%%').format(currentEndLimitValue, currentStartLimitValue);
            else
                currentLimitValueString = _('Charging Limit is set to %d%%').format(currentEndLimitValue);

            let currentLimitItem = new PopupMenu.PopupMenuItem(currentLimitValueString);
            currentLimitItem.sensitive = false;
            currentLimitItem.active = false;

            this.menuItemFul.connectObject('activate', () => {
                Main.overview.hide();
                Main.panel.closeQuickSettings();
                Driver.setThresholdLimit();
                this._settings.set_string('charging-mode', 'ful');
            });

            if (!(Driver.deviceInfo[this.type][4] === '-none-')) {
                this.menuItemBal.connectObject('activate', () => {
                    Main.overview.hide();
                    Main.panel.closeQuickSettings();
                    Driver.setThresholdLimit();
                    this._settings.set_string('charging-mode', 'bal');
                });
            }

            this.menuItemMax.connectObject('activate', () => {
                Main.overview.hide();
                Main.panel.closeQuickSettings();
                Driver.setThresholdLimit();
                this._settings.set_string('charging-mode', 'max');
            });

            this._chargeLimitSection.addMenuItem(this.menuItemFul);

            if (!(Driver.deviceInfo[this.type][4] === '-none-'))
                this._chargeLimitSection.addMenuItem(this.menuItemBal);

            this._chargeLimitSection.addMenuItem(this.menuItemMax);
            this._chargeLimitSection.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
            this._chargeLimitSection.addMenuItem(currentLimitItem);

            // BAT1
            if (Driver.deviceInfo[this.type][1] === '1') {
                let currentStartLimit2Value = 0;
                let currentEndLimit2Value = Driver.getCurrentEndLimitValue();

                if (Driver.deviceInfo[this.type][0] === '1')
                    currentStartLimit2Value = Driver.getCurrentStartLimitValue();

                let showLabel2 = 'BAT1: ';
                this.popupMenuFullCapacityLabel2 = _('%sFull Capacity Mode').format(showLabel2);

                if (!(Driver.deviceInfo[this.type][4] === '-none-'))
                    this.popupMenuBalancedLabel2 = _('%sBalanced Mode').format(showLabel2);

                this.popupMenuMaxlifeLabel2 = _('%sMaximum Lifespan Mode').format(showLabel2);

                currentMode2Settings = this._settings.get_string('charging-mode2');

                this.menuItem2Ful = new PopupMenu.PopupImageMenuItem(this.popupMenuFullCapacityLabel2,
                    getIcon(`charging-limit-${iconType}-${Driver.deviceInfo[this.type][3]}-symbolic`));

                if (!(Driver.deviceInfo[this.type][4] === '-none-')) {
                    this.menuItem2Bal = new PopupMenu.PopupImageMenuItem(this.popupMenuBalancedLabel2,
                        getIcon(`charging-limit-${iconType}-${Driver.deviceInfo[this.type][4]}-symbolic`));
                }

                this.menuItem2Max = new PopupMenu.PopupImageMenuItem(this.popupMenuMaxlifeLabel2,
                    getIcon(`charging-limit-${iconType}-${Driver.deviceInfo[this.type][5]}-symbolic`));

                let currentLimit2ValueString = '';
                if (Driver.deviceInfo[this.type][0] === '1')
                    currentLimit2ValueString = _('Device will stop charging at %d%%\nDevice will start charging at %d%%').format(currentEndLimit2Value, currentStartLimit2Value);
                else
                    currentLimit2ValueString = _('Charging Limit is set to %d%%').format(currentEndLimit2Value);

                let currentLimit2Item = new PopupMenu.PopupMenuItem(currentLimit2ValueString);
                currentLimit2Item.sensitive = false;
                currentLimit2Item.active = false;

                this.menuItem2Ful.connectObject('activate', () => {
                    Main.overview.hide();
                    Main.panel.closeQuickSettings();
                    Driver.setThresholdLimit();
                    this._settings.set_string('charging-mode2', 'ful');
                });

                if (!(Driver.deviceInfo[this.type][4] === '-none-')) {
                    this.menuItem2Bal.connectObject('activate', () => {
                        Main.overview.hide();
                        Main.panel.closeQuickSettings();
                        Driver.setThresholdLimit();
                        this._settings.set_string('charging-mode2', 'bal');
                    });
                }

                this.menuItem2Max.connectObject('activate', () => {
                    Main.overview.hide();
                    Main.panel.closeQuickSettings();
                    Driver.setThresholdLimit();
                    this._settings.set_string('charging-mode2', 'max');
                });

                this._chargeLimitSection.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

                this._chargeLimitSection.addMenuItem(this.menuItem2Ful);

                if (!(Driver.deviceInfo[this.type][4] === '-none-'))
                    this._chargeLimitSection.addMenuItem(this.menuItem2Bal);

                this._chargeLimitSection.addMenuItem(this.menuItem2Max);

                this._chargeLimitSection.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

                this._chargeLimitSection.addMenuItem(currentLimit2Item);
            }

            let currentModeIcon;
            if (currentModeSettings === 'full')
                currentModeIcon = Driver.deviceInfo[this.type][3];
            else if (currentModeSettings === 'bal')
                currentModeIcon = Driver.deviceInfo[this.type][4];
            else if (currentModeSettings === 'max')
                currentModeIcon = Driver.deviceInfo[this.type][5];

            this.menu.setHeader(getIcon(`charging-limit-${iconType}-${currentModeIcon}-symbolic`), _('Battery Health Mode'));

            this.menuItemFul.setOrnament(currentModeSettings === 'ful' ? PopupMenu.Ornament.DOT : PopupMenu.Ornament.NONE);
            if (!(Driver.deviceInfo[this.type][4] === '-none-'))
                this.menuItemBal.setOrnament(currentModeSettings === 'bal' ? PopupMenu.Ornament.DOT : PopupMenu.Ornament.NONE);

            this.menuItemMax.setOrnament(currentModeSettings === 'max' ? PopupMenu.Ornament.DOT : PopupMenu.Ornament.NONE);



            if (Driver.deviceInfo[this.type][1] === '1') {
                this.menuItem2Ful.setOrnament(currentMode2Settings === 'ful' ? PopupMenu.Ornament.DOT : PopupMenu.Ornament.NONE);
                if (!(Driver.deviceInfo[this.type][4] === '-none-'))
                    this.menuItem2Bal.setOrnament(currentMode2Settings === 'bal' ? PopupMenu.Ornament.DOT : PopupMenu.Ornament.NONE);

                this.menuItem2Max.setOrnament(currentMode2Settings === 'max' ? PopupMenu.Ornament.DOT : PopupMenu.Ornament.NONE);
            }
        }
    }
);

var ThresholdPanel = GObject.registerClass(
    class ThresholdPanel extends QuickSettings.SystemIndicator {
        constructor() {
            super();
            this._settings = ExtensionUtils.getSettings();

            switch (Driver.checkInCompatibility()) {
            // to do
            }

            this.type = this._settings.get_int('device-type');

            this._indicator = this._addIndicator();
            this._indicator.gicon = getIcon('charging-limit-mix-ful100-symbolic');
            this.quickSettingsItems.push(new SystemMenuToggle());

            QuickSettingsMenu._indicators.insert_child_at_index(this, 0);
            QuickSettingsMenu._addItems(this.quickSettingsItems);
            this._updateIndicator();

            this._settings.connectObject(
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

            let currentModeSettings = this._settings.get_string('charging-mode');

            let currentModeIcon;
            if (currentModeSettings === 'ful')
                currentModeIcon = Driver.deviceInfo[this.type][3];
            else if (currentModeSettings === 'bal')
                currentModeIcon = Driver.deviceInfo[this.type][4];
            else if (currentModeSettings === 'max')
                currentModeIcon = Driver.deviceInfo[this.type][5];

            this._indicator.gicon = getIcon(`charging-limit-${iconType}-${currentModeIcon}-symbolic`);

            if (this._settings.get_boolean('show-system-indicator'))
                this._indicator.visible = true;
            else
                this._indicator.visible = false;
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
