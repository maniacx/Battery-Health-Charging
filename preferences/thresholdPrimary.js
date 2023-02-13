'use strict';
const {Adw, GLib, GObject, Gio} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const gettextDomain = Me.metadata['gettext-domain'];
const Gettext = imports.gettext.domain(gettextDomain);
const _ = Gettext.gettext;

/*
Device that support start threshold

*/
const device = [false, true, true, true, false, false, false, false, false, false, false, false, false, false, false, false];
let type = 1;

var ThresholdPrimary = GObject.registerClass({
    GTypeName: 'BHC_Threshold_Primary',
    Template: `file://${GLib.build_filenamev([Me.path, 'ui', 'thresholdPrimary.ui'])}`,
    InternalChildren: [
        'customize_threshold',
        'default_threshold',
        'apply_settings',
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
        'full_capacity_start_threshold',
        'balanced_start_threshold',
        'maxlife_start_threshold',
        'full_capacity_start_threshold_actual_value',
        'balanced_start_threshold_actual_value',
        'maxlife_start_threshold_actual_value',
    ],
}, class ThresholdPrimary extends Adw.PreferencesPage {
    constructor(settings) {
        super({});

        this._updateRangeSubtitle(this._full_capacity_end_threshold_row, 90, 100);
        this._updateRangeSubtitle(this._balanced_end_threshold_row, 70, 80);
        this._updateRangeSubtitle(this._maxlife_end_threshold_row, 50, 60);

        if (device[type]) { // if StartThresholdSupported
            this._updateRangeSubtitle(this._full_capacity_start_threshold_row,
                settings.get_int('full-capacity-end-threshold') - 10,
                settings.get_int('full-capacity-end-threshold') - 2);
            this._updateRangeSubtitle(this._balanced_start_threshold_row,
                settings.get_int('balanced-end-threshold') - 10,
                settings.get_int('balanced-end-threshold') - 2);
            this._updateRangeSubtitle(this._maxlife_start_threshold_row,
                settings.get_int('maxlife-end-threshold') - 10,
                settings.get_int('maxlife-end-threshold') - 2);
        }  //  endif StartThresholdSupported

        this._updateCurrentValueLabel(settings);

        if (!device[type]) {
            this._full_capacity_start_threshold_row.visible = false;
            this._balanced_start_threshold_row.visible = false;
            this._maxlife_start_threshold_row.visible = false;
        } else {
            this._full_capacity_start_threshold_row.visible = true;
            this._balanced_start_threshold_row.visible = true;
            this._maxlife_start_threshold_row.visible = true;
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

        if (device[type]) { // if StartThresholdSupported
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
        }  //  endif StartThresholdSupported

        this._apply_settings.connect('clicked', () => {
            this._updateCurrentValues(settings);
            this._updateCurrentValueLabel(settings);
            settings.set_boolean('apply-threshold', !settings.get_boolean('apply-threshold'));
        });

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
            this._updateCurrentValueLabel(settings);
        });
    }

    _updateRangeSubtitle(row, lowerValue, upperValue) {
        row.set_subtitle(_('<i>Accepted Value : %d to %d</i>').format(lowerValue, upperValue));
    }

    _updateCurrentValues(settings) {
        settings.set_int('current-full-capacity-end-threshold',
            settings.get_int('full-capacity-end-threshold'));
        settings.set_int('current-balanced-end-threshold',
            settings.get_int('balanced-end-threshold'));
        settings.set_int('current-maxlife-end-threshold',
            settings.get_int('maxlife-end-threshold'));

        if (device[type]) {
            settings.set_int('current-full-capacity-start-threshold',
                settings.get_int('full-capacity-start-threshold'));
            settings.set_int('current-balanced-start-threshold',
                settings.get_int('balanced-start-threshold'));
            settings.set_int('current-maxlife-start-threshold',
                settings.get_int('maxlife-start-threshold'));
        }
    }

    _updateCurrentValueLabel(settings) {
        this._full_capacity_end_threshold_actual_value.set_label(
            settings.get_int('current-full-capacity-end-threshold').toString());
        this._balanced_end_threshold_actual_value.set_label(
            settings.get_int('current-balanced-end-threshold').toString());
        this._maxlife_end_threshold_actual_value.set_label(
            settings.get_int('current-maxlife-end-threshold').toString());

        if (device[type]) {
            this._full_capacity_start_threshold_actual_value.set_label(
                settings.get_int('current-full-capacity-start-threshold').toString());
            this._balanced_start_threshold_actual_value.set_label(
                settings.get_int('current-balanced-start-threshold').toString());
            this._maxlife_start_threshold_actual_value.set_label(
                settings.get_int('current-maxlife-start-threshold').toString());
        }
    }
});
