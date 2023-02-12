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

            this._settings.connectObject(
                'changed::charging-mode', () => {
                    this._updatePanelMenu();
                },
                'changed::icon-style-type', () => {
                    this._updatePanelMenu();
                },
                this
            );
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

            let currentModeSettings = this._settings.get_string('charging-mode');

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
            this.gicon = getIcon(`charging-limit-${iconType}-${currentModeSettings}-symbolic`);
            this.menu.setHeader(getIcon(`charging-limit-${iconType}-${currentModeSettings}-symbolic`), _('Battery Health Mode'));

            menuItemFul.setOrnament(currentModeSettings === 'ful'
                ? PopupMenu.Ornament.DOT
                : PopupMenu.Ornament.NONE);
            menuItemBal.setOrnament(currentModeSettings === 'bal'
                ? PopupMenu.Ornament.DOT
                : PopupMenu.Ornament.NONE);
            menuItemMax.setOrnament(currentModeSettings === 'max'
                ? PopupMenu.Ornament.DOT
                : PopupMenu.Ornament.NONE);
        }
    }
);

var ThresholdPanel = GObject.registerClass(
    class ThresholdPanel extends QuickSettings.SystemIndicator {
        constructor() {
            super();
            this._settings = ExtensionUtils.getSettings();

            Driver.checkInCompatibility();

            this._indicator = this._addIndicator();
            this._indicator.gicon = getIcon('charging-limit-mix-ful-symbolic');
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
            this._indicator.gicon = getIcon(`charging-limit-${iconType}-${currentModeSettings}-symbolic`);

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
