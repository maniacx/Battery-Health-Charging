'use strict';
const {Adw, GLib, GObject, Gio} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Driver = Me.imports.driver;
const gettextDomain = Me.metadata['gettext-domain'];
const Gettext = imports.gettext.domain(gettextDomain);
const _ = Gettext.gettext;
var isChargeStartThresholdSupported = false;

function runInstaller() {
    Driver.runInstaller();
}

function runUninstaller() {
    Driver.runUninstaller();
}

var Preferences = GObject.registerClass({
    GTypeName: 'BHC_Preferences',
    Template: `file://${GLib.build_filenamev([Me.path, 'preference.ui'])}`,
    InternalChildren: [
        'icon_style_mode_row',
        'icon_style_mode',
        'show_system_indicator',
        'install_service',
        'install_service_button',
    ],
}, class Preferences extends Adw.PreferencesPage {
    constructor(settings) {
        super({});

        this._updateInstallationLabelIcon(settings);
        this._iconModeSensitiveCheck(settings);

        settings.bind(
            'icon-style-type',
            this._icon_style_mode,
            'selected',
            Gio.SettingsBindFlags.DEFAULT
        );

        settings.bind(
            'show-system-indicator',
            this._show_system_indicator,
            'state',
            Gio.SettingsBindFlags.DEFAULT
        );

        this._install_service.connect('clicked', () => {
            if (settings.get_boolean('install-service'))
                runUninstaller();
            else
                runInstaller();
        });

        settings.connect('changed::install-service', () => {
            this._updateInstallationLabelIcon(settings);
        });

        settings.connect('changed::default-threshold', () => {
            this._iconModeSensitiveCheck(settings);
        });
    }

    _iconModeSensitiveCheck(settings) {
        if (settings.get_boolean('default-threshold')) {
            this._icon_style_mode_row.sensitive = false;
            settings.set_int('icon-style-type', 1);
        } else {
            this._icon_style_mode_row.sensitive = true;
        }
    }

    _updateInstallationLabelIcon(settings) {
        if (settings.get_boolean('install-service')) {
            this._install_service_button.set_label(_('Remove'));
            this._install_service_button.set_icon_name('user-trash-symbolic');
        } else {
            this._install_service_button.set_label(_('Install'));
            this._install_service_button.set_icon_name('emblem-system-symbolic');
        }
    }
});

var Threshold = GObject.registerClass({
    GTypeName: 'BHC_Threshold',
    Template: `file://${GLib.build_filenamev([Me.path, 'threshold.ui'])}`,
    InternalChildren: [
        'customize_threshold',
        'default_threshold',
        'full_capacity_start_threshold_row',
        'balanced_start_threshold_row',
        'maxlife_start_threshold_row',
        'full_capacity_end_threshold',
        'balanced_end_threshold',
        'maxlife_end_threshold',
        'full_capacity_end_threshold_actual_value',
        'balanced_end_threshold_actual_value',
        'maxlife_end_threshold_actual_value',
        'full_capacity_end_threshold_apply',
        'balanced_end_threshold_apply',
        'maxlife_end_threshold_apply',
        'full_capacity_start_threshold',
        'balanced_start_threshold',
        'maxlife_start_threshold',
        'full_capacity_start_threshold_actual_value',
        'balanced_start_threshold_actual_value',
        'maxlife_start_threshold_actual_value',
        'full_capacity_start_threshold_apply',
        'balanced_start_threshold_apply',
        'maxlife_start_threshold_apply',
    ],
}, class Threshold extends Adw.PreferencesPage {
    constructor(settings) {
        super({});

        this._updateCurrentValueFullCapLabel(settings);
        this._updateCurrentValueBalanceLabel(settings);
        this._updateCurrentValueMaxlifeLabel(settings);

        if (!isChargeStartThresholdSupported) {
            this._full_capacity_start_threshold_row.visible = false;
            this._balanced_start_threshold_row.visible = false;
            this._maxlife_start_threshold_row.visible = false;
        }

        settings.bind(
            'default-threshold',
            this._customize_threshold,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );

        settings.bind(
            'default-threshold',
            this._default_threshold,
            'active',
            Gio.SettingsBindFlags.INVERT_BOOLEAN
        );

        settings.bind(
            'full-capacity-end-threshold',
            this._full_capacity_end_threshold,
            'value',
            Gio.SettingsBindFlags.DEFAULT
        );

        settings.bind(
            'balanced-end-threshold',
            this._balanced_end_threshold,
            'value',
            Gio.SettingsBindFlags.DEFAULT
        );

        settings.bind(
            'maxlife-end-threshold',
            this._maxlife_end_threshold,
            'value',
            Gio.SettingsBindFlags.DEFAULT
        );

        if (isChargeStartThresholdSupported) {
            settings.bind(
                'full-capacity-start-threshold',
                this._full_capacity_start_threshold,
                'value',
                Gio.SettingsBindFlags.DEFAULT
            );

            settings.bind(
                'balanced-start-threshold',
                this._balanced_start_threshold,
                'value',
                Gio.SettingsBindFlags.DEFAULT
            );

            settings.bind(
                'maxlife-start-threshold',
                this._maxlife_start_threshold,
                'value',
                Gio.SettingsBindFlags.DEFAULT
            );

            settings.connect('changed::full-capacity-end-threshold', () => {
                this._full_capacity_start_threshold.set_range(this._full_capacity_end_threshold.value - 10, this._full_capacity_end_threshold.value - 2);
            });

            settings.connect('changed::balanced-end-threshold', () => {
                this._balanced_start_threshold.set_range(this._balanced_end_threshold.value - 10, this._balanced_end_threshold.value - 2);
            });

            settings.connect('changed::maxlife-end-threshold', () => {
                this._maxlife_start_threshold.set_range(this._maxlife_end_threshold.value - 10, this._maxlife_end_threshold.value - 2);
            });
        }  // isChargeStartThresholdSupported

        this._full_capacity_end_threshold_apply.connect('clicked', () => {
            this._updateCurrentValueFullCap(settings);
            if (isChargeStartThresholdSupported)
                this._updateCurrentValueFullCapLabel(settings);
        });

        this._balanced_end_threshold_apply.connect('clicked', () => {
            this._updateCurrentValueBalance(settings);
            if (isChargeStartThresholdSupported)
                this._updateCurrentValueBalanceLabel(settings);
        });

        this._maxlife_end_threshold_apply.connect('clicked', () => {
            this._updateCurrentValueMaxlife(settings);
            if (isChargeStartThresholdSupported)
                this._updateCurrentValueMaxlifeLabel(settings);
        });

        if (isChargeStartThresholdSupported) {
            this._full_capacity_start_threshold_apply.connect('clicked', () => {
                this._updateCurrentValueFullCap(settings);
                this._updateCurrentValueFullCapLabel(settings);
            });

            this._balanced_start_threshold_apply.connect('clicked', () => {
                this._updateCurrentValueBalance(settings);
                this._updateCurrentValueBalanceLabel(settings);
            });

            this._maxlife_start_threshold_apply.connect('clicked', () => {
                this._updateCurrentValueMaxlife(settings);
                this._updateCurrentValueMaxlifeLabel(settings);
            });
        } // isChargeStartThresholdSupported

        this._default_threshold.connect('clicked', () => {
            const keys = [
                'full-capacity-end-threshold',
                'full-capacity-start-threshold',
                'balanced-end-threshold',
                'balanced-start-threshold',
                'maxlife-end-threshold',
                'maxlife-start-threshold',
                'current-full-capacity-end-threshold',
                'current-full-capacity-start-threshold',
                'current-balanced-end-threshold',
                'current-balanced-start-threshold',
                'current-maxlife-end-threshold',
                'current-maxlife-start-threshold',
            ];
            keys.forEach(key => {
                settings.reset(key);
            });
            this._updateCurrentValueFullCapLabel(settings);
            this._updateCurrentValueBalanceLabel(settings);
            this._updateCurrentValueMaxlifeLabel(settings);
        });
    }

    _updateCurrentValueFullCapLabel(settings) {
        this._full_capacity_end_threshold_actual_value.set_label(
            settings.get_int('current-full-capacity-end-threshold').toString());
        if (isChargeStartThresholdSupported) {
            this._full_capacity_start_threshold_actual_value.set_label(
                settings.get_int('current-full-capacity-start-threshold').toString());
        }
    }

    _updateCurrentValueBalanceLabel(settings) {
        this._balanced_end_threshold_actual_value.set_label(
            settings.get_int('current-balanced-end-threshold').toString());
        if (isChargeStartThresholdSupported) {
            this._balanced_start_threshold_actual_value.set_label(
                settings.get_int('current-balanced-start-threshold').toString());
        }
    }

    _updateCurrentValueMaxlifeLabel(settings) {
        this._maxlife_end_threshold_actual_value.set_label(
            settings.get_int('current-maxlife-end-threshold').toString());
        if (isChargeStartThresholdSupported) {
            this._maxlife_start_threshold_actual_value.set_label(
                settings.get_int('current-maxlife-start-threshold').toString());
        }
    }

    _updateCurrentValueFullCap(settings) {
        settings.set_int('current-full-capacity-end-threshold',
            settings.get_int('full-capacity-end-threshold'));
        if (isChargeStartThresholdSupported) {
            settings.set_int('current-full-capacity-start-threshold',
                settings.get_int('full-capacity-start-threshold'));
        }
    }

    _updateCurrentValueBalance(settings) {
        settings.set_int('current-balanced-end-threshold',
            settings.get_int('balanced-end-threshold'));
        if (isChargeStartThresholdSupported) {
            settings.set_int('current-balanced-start-threshold',
                settings.get_int('balanced-start-threshold'));
        }
    }

    _updateCurrentValueMaxlife(settings) {
        settings.set_int('current-maxlife-end-threshold',
            settings.get_int('maxlife-end-threshold'));
        if (isChargeStartThresholdSupported) {
            settings.set_int('current-maxlife-start-threshold',
                settings.get_int('maxlife-start-threshold'));
        }
    }
});

function fillPreferencesWindow(window) {
    const settings = ExtensionUtils.getSettings();
    isChargeStartThresholdSupported = Driver.isChargeStartThresholdSupported();
    window.add(new Preferences(settings));
    window.add(new Threshold(settings));
}

function init() {
    ExtensionUtils.initTranslations(Me.metadata.uuid);
}
