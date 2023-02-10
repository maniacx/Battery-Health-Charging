'use strict';
const {Adw, GLib, GObject, Gio} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Driver = Me.imports.lib.driver;
const gettextDomain = Me.metadata['gettext-domain'];
const Gettext = imports.gettext.domain(gettextDomain);
const _ = Gettext.gettext;

var Threshold = GObject.registerClass({
    GTypeName: 'BHC_Threshold',
    Template: `file://${GLib.build_filenamev([Me.path, 'ui', 'threshold.ui'])}`,
    InternalChildren: [
        'customize_threshold',
        'default_threshold',
        'full_capacity_end_threshold_row',
        'full_capacity_start_threshold_row',
        'balanced_end_threshold_row',
        'balanced_start_threshold_row',
        'maxlife_end_threshold_row',
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

        this._isChargeStartThresholdSupported = Driver.isChargeStartThresholdSupported();
        this._updateRangeSubtitle(this._full_capacity_end_threshold_row, 90, 100);
        this._updateRangeSubtitle(this._balanced_end_threshold_row, 70, 80);
        this._updateRangeSubtitle(this._maxlife_end_threshold_row, 50, 60);

        if (this._isChargeStartThresholdSupported) { // if isChargeStartThresholdSupported
            this._updateRangeSubtitle(this._full_capacity_start_threshold_row,
                settings.get_int('full-capacity-end-threshold') - 10,
                settings.get_int('full-capacity-end-threshold') - 2);
            this._updateRangeSubtitle(this._balanced_start_threshold_row,
                settings.get_int('balanced-end-threshold') - 10,
                settings.get_int('balanced-end-threshold') - 2);
            this._updateRangeSubtitle(this._maxlife_start_threshold_row,
                settings.get_int('maxlife-end-threshold') - 10,
                settings.get_int('maxlife-end-threshold') - 2);
        }  //  endif isChargeStartThresholdSupported

        this._updateCurrentValueFullCapLabel(settings);
        this._updateCurrentValueBalanceLabel(settings);
        this._updateCurrentValueMaxlifeLabel(settings);

        if (!this._isChargeStartThresholdSupported) {
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

        if (this._isChargeStartThresholdSupported) { // if isChargeStartThresholdSupported
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
                let fullCapStartRangeLower = this._full_capacity_end_threshold.value - 10;
                let fullCapStartRangeUpper = this._full_capacity_end_threshold.value - 2;
                this._full_capacity_start_threshold.set_range(fullCapStartRangeLower, fullCapStartRangeUpper);
                this._updateRangeSubtitle(this._full_capacity_start_threshold_row, fullCapStartRangeLower, fullCapStartRangeUpper);
            });

            settings.connect('changed::balanced-end-threshold', () => {
                let balStartRangeLower = this._balanced_end_threshold.value - 10;
                let balStartRangeUpper = this._balanced_end_threshold.value - 2;
                this._balanced_start_threshold.set_range(balStartRangeLower, balStartRangeUpper);
                this._updateRangeSubtitle(this._balanced_start_threshold_row, balStartRangeLower, balStartRangeUpper);
            });

            settings.connect('changed::maxlife-end-threshold', () => {
                let maxLifeRangeLower = this._maxlife_end_threshold.value - 10;
                let maxlifeRangeUpper = this._maxlife_end_threshold.value - 2;
                this._maxlife_start_threshold.set_range(maxLifeRangeLower, maxlifeRangeUpper);
                this._updateRangeSubtitle(this._maxlife_start_threshold_row, maxLifeRangeLower, maxlifeRangeUpper);
            });
        }  //  endif isChargeStartThresholdSupported

        this._full_capacity_end_threshold_apply.connect('clicked', () => {
            this._updateCurrentValueFullCap(settings);
            this._updateCurrentValueFullCapLabel(settings);
        });

        this._balanced_end_threshold_apply.connect('clicked', () => {
            this._updateCurrentValueBalance(settings);
            this._updateCurrentValueBalanceLabel(settings);
        });

        this._maxlife_end_threshold_apply.connect('clicked', () => {
            this._updateCurrentValueMaxlife(settings);
            this._updateCurrentValueMaxlifeLabel(settings);
        });

        if (this._isChargeStartThresholdSupported) {
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

    _updateRangeSubtitle(row, lowerValue, upperValue) {
        row.set_subtitle(_('<i>Accepted Value : %d to %d</i>').format(lowerValue, upperValue));
    }

    _updateCurrentValueFullCap(settings) {
        settings.set_int('current-full-capacity-end-threshold',
            settings.get_int('full-capacity-end-threshold'));
        if (this._isChargeStartThresholdSupported) {
            settings.set_int('current-full-capacity-start-threshold',
                settings.get_int('full-capacity-start-threshold'));
        }
    }

    _updateCurrentValueBalance(settings) {
        settings.set_int('current-balanced-end-threshold',
            settings.get_int('balanced-end-threshold'));
        if (this._isChargeStartThresholdSupported) {
            settings.set_int('current-balanced-start-threshold',
                settings.get_int('balanced-start-threshold'));
        }
    }

    _updateCurrentValueMaxlife(settings) {
        settings.set_int('current-maxlife-end-threshold',
            settings.get_int('maxlife-end-threshold'));
        if (this._isChargeStartThresholdSupported) {
            settings.set_int('current-maxlife-start-threshold',
                settings.get_int('maxlife-start-threshold'));
        }
    }

    _updateCurrentValueFullCapLabel(settings) {
        this._full_capacity_end_threshold_actual_value.set_label(
            settings.get_int('current-full-capacity-end-threshold').toString());
        if (this._isChargeStartThresholdSupported) {
            this._full_capacity_start_threshold_actual_value.set_label(
                settings.get_int('current-full-capacity-start-threshold').toString());
        }
    }

    _updateCurrentValueBalanceLabel(settings) {
        this._balanced_end_threshold_actual_value.set_label(
            settings.get_int('current-balanced-end-threshold').toString());
        if (this._isChargeStartThresholdSupported) {
            this._balanced_start_threshold_actual_value.set_label(
                settings.get_int('current-balanced-start-threshold').toString());
        }
    }

    _updateCurrentValueMaxlifeLabel(settings) {
        this._maxlife_end_threshold_actual_value.set_label(
            settings.get_int('current-maxlife-end-threshold').toString());
        if (this._isChargeStartThresholdSupported) {
            this._maxlife_start_threshold_actual_value.set_label(
                settings.get_int('current-maxlife-start-threshold').toString());
        }
    }
});
