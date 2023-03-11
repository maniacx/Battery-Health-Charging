'use strict';
const {Adw, Gio, GLib, GObject} = imports.gi;
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
        'apply_settings_2',
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

        this._currentDevice = Driver.currentDevice;

        // Set range for end threshold value
        this._full_capacity_end_threshold_2.set_range(80, 100);
        this._balanced_end_threshold_2.set_range(65, 85);
        this._maxlife_end_threshold_2.set_range(50, 65);

        this._updateRangeSubtitle(this._full_capacity_end_threshold_row_2, 80, 100);
        this._updateRangeSubtitle(this._balanced_end_threshold_row_2, 65, 85);
        this._updateRangeSubtitle(this._maxlife_end_threshold_row_2, 50, 65);

        if (this._currentDevice.deviceHaveStartThreshold) { // if StartThresholdSupported
            this._full_capacity_start_threshold_2.set_range(75, this.deviceIsDell ? 95 : 98);
            this._balanced_start_threshold_2.set_range(60, this.deviceIsDell ? 80 : 83);
            this._maxlife_start_threshold_2.set_range(this.deviceIsDell ? 50 : 40, this.deviceIsDell ? 60 : 63);

            this._updateRangeSubtitle(this._full_capacity_start_threshold_row_2, 75,
                settings.get_int('ful-end-threshold2') - 2);
            this._updateRangeSubtitle(this._balanced_start_threshold_row_2, 60,
                settings.get_int('bal-end-threshold2') - 2);
            this._updateRangeSubtitle(this._maxlife_start_threshold_row_2, 40,
                settings.get_int('max-end-threshold2') - 2);
        }  //  endif StartThresholdSupported

        this._updateCurrentValueLabel(settings);

        this._full_capacity_start_threshold_row_2.visible = this._currentDevice.deviceHaveStartThreshold;
        this._balanced_start_threshold_row_2.visible = this._currentDevice.deviceHaveStartThreshold;
        this._maxlife_start_threshold_row_2.visible = this._currentDevice.deviceHaveStartThreshold;


        settings.bind(
            'default-threshold2',
            this._customize_threshold_2,
            'active',
            Gio.SettingsBindFlags.INVERT_BOOLEAN
        );

        settings.bind(
            'default-threshold2',
            this._default_threshold_2,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );

        settings.bind(
            'ful-end-threshold2',
            this._full_capacity_end_threshold_2,
            'value',
            Gio.SettingsBindFlags.DEFAULT
        );

        settings.bind(
            'bal-end-threshold2',
            this._balanced_end_threshold_2,
            'value',
            Gio.SettingsBindFlags.DEFAULT
        );

        settings.bind(
            'max-end-threshold2',
            this._maxlife_end_threshold_2,
            'value',
            Gio.SettingsBindFlags.DEFAULT
        );

        if (this._currentDevice.deviceHaveStartThreshold) { // if StartThresholdSupported
            settings.bind(
                'ful-start-threshold2',
                this._full_capacity_start_threshold_2,
                'value',
                Gio.SettingsBindFlags.DEFAULT
            );

            settings.bind(
                'bal-start-threshold2',
                this._balanced_start_threshold_2,
                'value',
                Gio.SettingsBindFlags.DEFAULT
            );

            settings.bind(
                'max-start-threshold2',
                this._maxlife_start_threshold_2,
                'value',
                Gio.SettingsBindFlags.DEFAULT
            );

            settings.connect('changed::ful-end-threshold2', () => {
                const fullCapStartRangeLower = 75;
                const fullCapStartRangeUpper = this._full_capacity_end_threshold_2.value - 2;
                this._full_capacity_start_threshold_2.set_range(fullCapStartRangeLower, fullCapStartRangeUpper);
                this._updateRangeSubtitle(this._full_capacity_start_threshold_row_2, fullCapStartRangeLower, fullCapStartRangeUpper);
            });

            settings.connect('changed::bal-end-threshold2', () => {
                const balStartRangeLower = 60;
                const balStartRangeUpper = this._balanced_end_threshold_2.value - 2;
                this._balanced_start_threshold_2.set_range(balStartRangeLower, balStartRangeUpper);
                this._updateRangeSubtitle(this._balanced_start_threshold_row_2, balStartRangeLower, balStartRangeUpper);
            });

            settings.connect('changed::max-end-threshold2', () => {
                const maxLifeRangeLower = 40;
                const maxlifeRangeUpper = this._maxlife_end_threshold_2.value - 2;
                this._maxlife_start_threshold_2.set_range(maxLifeRangeLower, maxlifeRangeUpper);
                this._updateRangeSubtitle(this._maxlife_start_threshold_row_2, maxLifeRangeLower, maxlifeRangeUpper);
            });
        }  //  endif StartThresholdSupported

        this._apply_settings_2.connect('clicked', () => {
            this._updateCurrentValues(settings);
            this._updateCurrentValueLabel(settings);
            settings.set_boolean('dummy-apply-threshold2', !settings.get_boolean('dummy-apply-threshold2'));
        });

        this._default_threshold_2.connect('clicked', () => {
            const keys = [
                'ful-end-threshold2',
                'ful-start-threshold2',
                'bal-end-threshold2',
                'bal-start-threshold2',
                'max-end-threshold2',
                'max-start-threshold2',
                'current-ful-end-threshold2',
                'current-ful-start-threshold2',
                'current-bal-end-threshold2',
                'current-bal-start-threshold2',
                'current-max-end-threshold2',
                'current-max-start-threshold2',
            ];
            keys.forEach(key => {
                settings.reset(key);
            });
            this._updateCurrentValueLabel(settings);
            settings.set_boolean('dummy-default-threshold2', !settings.get_boolean('dummy-default-threshold2'));
        });
    }

    _updateRangeSubtitle(row, lowerValue, upperValue) {
        row.set_subtitle(_('<i>Accepted Value : %d to %d</i>').format(lowerValue, upperValue));
    }

    _updateCurrentValues(settings) {
        settings.set_int('current-ful-end-threshold2',
            settings.get_int('ful-end-threshold2'));
        settings.set_int('current-bal-end-threshold2',
            settings.get_int('bal-end-threshold2'));
        settings.set_int('current-max-end-threshold2',
            settings.get_int('max-end-threshold2'));

        if (this._currentDevice.deviceHaveStartThreshold) {
            settings.set_int('current-ful-start-threshold2',
                settings.get_int('ful-start-threshold2'));
            settings.set_int('current-bal-start-threshold2',
                settings.get_int('bal-start-threshold2'));
            settings.set_int('current-max-start-threshold2',
                settings.get_int('max-start-threshold2'));
        }
    }

    _updateCurrentValueLabel(settings) {
        this._full_capacity_end_threshold_actual_value_2.set_label(
            settings.get_int('current-ful-end-threshold2').toString());
        this._balanced_end_threshold_actual_value_2.set_label(
            settings.get_int('current-bal-end-threshold2').toString());
        this._maxlife_end_threshold_actual_value_2.set_label(
            settings.get_int('current-max-end-threshold2').toString());

        if (this._currentDevice.deviceHaveStartThreshold) {
            this._full_capacity_start_threshold_actual_value_2.set_label(
                settings.get_int('current-ful-start-threshold2').toString());
            this._balanced_start_threshold_actual_value_2.set_label(
                settings.get_int('current-bal-start-threshold2').toString());
            this._maxlife_start_threshold_actual_value_2.set_label(
                settings.get_int('current-max-start-threshold2').toString());
        }
    }
});
