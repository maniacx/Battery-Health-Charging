'use strict';
const {Adw, GLib, GObject, Gio} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Driver = Me.imports.lib.driver;
const gettextDomain = Me.metadata['gettext-domain'];
const Gettext = imports.gettext.domain(gettextDomain);
const _ = Gettext.gettext;

var ThresholdSecondary = GObject.registerClass({
    GTypeName: 'BHC_Threshold_Secondary',
    Template: `file://${GLib.build_filenamev([Me.path, 'ui', 'thresholdSecondary.ui'])}`,
    InternalChildren: [
        'customize_threshold_2',
        'default_threshold_2',
        'full_capacity_end_threshold_row_2',
        'full_capacity_start_threshold_row_2',
        'balanced_end_threshold_row_2',
        'balanced_start_threshold_row_2',
        'maxlife_end_threshold_row_2',
        'maxlife_start_threshold_row_2',
        'full_capacity_end_threshold_2',
        'balanced_end_threshold_2',
        'maxlife_end_threshold_2',
        'full_capacity_end_threshold_actual_value_2',
        'balanced_end_threshold_actual_value_2',
        'maxlife_end_threshold_actual_value_2',
        'full_capacity_start_threshold_2',
        'balanced_start_threshold_2',
        'maxlife_start_threshold_2',
        'full_capacity_start_threshold_actual_value_2',
        'balanced_start_threshold_actual_value_2',
        'maxlife_start_threshold_actual_value_2',
    ],
}, class ThresholdSecondary extends Adw.PreferencesPage {
    constructor(settings) {
        super({});

        this._isChargeStartThresholdSupported = 1;
        this._updateRangeSubtitle(this._full_capacity_end_threshold_row_2, 90, 100);
        this._updateRangeSubtitle(this._balanced_end_threshold_row_2, 70, 80);
        this._updateRangeSubtitle(this._maxlife_end_threshold_row_2, 50, 60);

        if (this._isChargeStartThresholdSupported) { // if isChargeStartThresholdSupported
            this._updateRangeSubtitle(this._full_capacity_start_threshold_row_2,
                settings.get_int('full-capacity-end-threshold') - 10,
                settings.get_int('full-capacity-end-threshold') - 2);
            this._updateRangeSubtitle(this._balanced_start_threshold_row_2,
                settings.get_int('balanced-end-threshold') - 10,
                settings.get_int('balanced-end-threshold') - 2);
            this._updateRangeSubtitle(this._maxlife_start_threshold_row_2,
                settings.get_int('maxlife-end-threshold') - 10,
                settings.get_int('maxlife-end-threshold') - 2);
        }  //  endif isChargeStartThresholdSupported

        this._updateCurrentValueFullCapLabel(settings);
        this._updateCurrentValueBalanceLabel(settings);
        this._updateCurrentValueMaxlifeLabel(settings);

        if (!this._isChargeStartThresholdSupported) {
            this._full_capacity_start_threshold_row_2.visible = false;
            this._balanced_start_threshold_row_2.visible = false;
            this._maxlife_start_threshold_row_2.visible = false;
        }

        settings.bind(
            'default-threshold',
            this._customize_threshold_2,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );

        settings.bind(
            'default-threshold',
            this._default_threshold_2,
            'active',
            Gio.SettingsBindFlags.INVERT_BOOLEAN
        );

        settings.bind(
            'full-capacity-end-threshold',
            this._full_capacity_end_threshold_2,
            'value',
            Gio.SettingsBindFlags.DEFAULT
        );

        settings.bind(
            'balanced-end-threshold',
            this._balanced_end_threshold_2,
            'value',
            Gio.SettingsBindFlags.DEFAULT
        );

        settings.bind(
            'maxlife-end-threshold',
            this._maxlife_end_threshold_2,
            'value',
            Gio.SettingsBindFlags.DEFAULT
        );

        if (this._isChargeStartThresholdSupported) { // if isChargeStartThresholdSupported
            settings.bind(
                'full-capacity-start-threshold',
                this._full_capacity_start_threshold_2,
                'value',
                Gio.SettingsBindFlags.DEFAULT
            );

            settings.bind(
                'balanced-start-threshold',
                this._balanced_start_threshold_2,
                'value',
                Gio.SettingsBindFlags.DEFAULT
            );

            settings.bind(
                'maxlife-start-threshold',
                this._maxlife_start_threshold_2,
                'value',
                Gio.SettingsBindFlags.DEFAULT
            );

            settings.connect('changed::full-capacity-end-threshold', () => {
                let fullCapStartRangeLower = this._full_capacity_end_threshold_2.value - 10;
                let fullCapStartRangeUpper = this._full_capacity_end_threshold_2.value - 2;
                this._full_capacity_start_threshold_2.set_range(fullCapStartRangeLower, fullCapStartRangeUpper);
                this._updateRangeSubtitle(this._full_capacity_start_threshold_row_2, fullCapStartRangeLower, fullCapStartRangeUpper);
            });

            settings.connect('changed::balanced-end-threshold', () => {
                let balStartRangeLower = this._balanced_end_threshold_2.value - 10;
                let balStartRangeUpper = this._balanced_end_threshold_2.value - 2;
                this._balanced_start_threshold_2.set_range(balStartRangeLower, balStartRangeUpper);
                this._updateRangeSubtitle(this._balanced_start_threshold_row_2, balStartRangeLower, balStartRangeUpper);
            });

            settings.connect('changed::maxlife-end-threshold', () => {
                let maxLifeRangeLower = this._maxlife_end_threshold_2.value - 10;
                let maxlifeRangeUpper = this._maxlife_end_threshold_2.value - 2;
                this._maxlife_start_threshold_2.set_range(maxLifeRangeLower, maxlifeRangeUpper);
                this._updateRangeSubtitle(this._maxlife_start_threshold_row_2, maxLifeRangeLower, maxlifeRangeUpper);
            });
        }  //  endif isChargeStartThresholdSupported
/*
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
        } // isChargeStartThresholdSupported*/

        this._default_threshold_2.connect('clicked', () => {
            const keys = [
                'full-capacity-end-threshold_2',
                'full-capacity-start-threshold_2',
                'balanced-end-threshold_2',
                'balanced-start-threshold_2',
                'maxlife-end-threshold_2',
                'maxlife-start-threshold_2',
                'current-full-capacity-end-threshold_2',
                'current-full-capacity-start-threshold_2',
                'current-balanced-end-threshold_2',
                'current-balanced-start-threshold_2',
                'current-maxlife-end-threshold_2',
                'current-maxlife-start-threshold_2',
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
        this._full_capacity_end_threshold_actual_value_2.set_label(
            settings.get_int('current-full-capacity-end-threshold').toString());
        if (this._isChargeStartThresholdSupported) {
            this._full_capacity_start_threshold_actual_value_2.set_label(
                settings.get_int('current-full-capacity-start-threshold').toString());
        }
    }

    _updateCurrentValueBalanceLabel(settings) {
        this._balanced_end_threshold_actual_value_2.set_label(
            settings.get_int('current-balanced-end-threshold').toString());
        if (this._isChargeStartThresholdSupported) {
            this._balanced_start_threshold_actual_value_2.set_label(
                settings.get_int('current-balanced-start-threshold').toString());
        }
    }

    _updateCurrentValueMaxlifeLabel(settings) {
        this._maxlife_end_threshold_actual_value_2.set_label(
            settings.get_int('current-maxlife-end-threshold').toString());
        if (this._isChargeStartThresholdSupported) {
            this._maxlife_start_threshold_actual_value_2.set_label(
                settings.get_int('current-maxlife-start-threshold').toString());
        }
    }
});
