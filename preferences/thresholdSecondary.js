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

        this.type = settings.get_int('device-type');
        this._updateRangeSubtitle(this._full_capacity_end_threshold_row_2, 90, 100);
        this._updateRangeSubtitle(this._balanced_end_threshold_row_2, 70, 80);
        this._updateRangeSubtitle(this._maxlife_end_threshold_row_2, 50, 60);

        if (Driver.deviceInfo[this.type][0] === '1') { // if StartThresholdSupported
            this._updateRangeSubtitle(this._full_capacity_start_threshold_row_2,
                settings.get_int('full-capacity-end-threshold2') - 10,
                settings.get_int('full-capacity-end-threshold2') - 2);
            this._updateRangeSubtitle(this._balanced_start_threshold_row_2,
                settings.get_int('balanced-end-threshold2') - 10,
                settings.get_int('balanced-end-threshold2') - 2);
            this._updateRangeSubtitle(this._maxlife_start_threshold_row_2,
                settings.get_int('maxlife-end-threshold2') - 10,
                settings.get_int('maxlife-end-threshold2') - 2);
        }  //  endif StartThresholdSupported

        this._updateCurrentValueLabel(settings);

        if (!(Driver.deviceInfo[this.type][0] === '1')) {
            this._full_capacity_start_threshold_row_2.visible = false;
            this._balanced_start_threshold_row_2.visible = false;
            this._maxlife_start_threshold_row_2.visible = false;
        } else {
            this._full_capacity_start_threshold_row_2.visible = true;
            this._balanced_start_threshold_row_2.visible = true;
            this._maxlife_start_threshold_row_2.visible = true;
        }

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
            'full-capacity-end-threshold2',
            this._full_capacity_end_threshold_2,
            'value',
            Gio.SettingsBindFlags.DEFAULT
        );

        settings.bind(
            'balanced-end-threshold2',
            this._balanced_end_threshold_2,
            'value',
            Gio.SettingsBindFlags.DEFAULT
        );

        settings.bind(
            'maxlife-end-threshold2',
            this._maxlife_end_threshold_2,
            'value',
            Gio.SettingsBindFlags.DEFAULT
        );

        if (Driver.deviceInfo[this.type][0] === '1') { // if StartThresholdSupported
            settings.bind(
                'full-capacity-start-threshold2',
                this._full_capacity_start_threshold_2,
                'value',
                Gio.SettingsBindFlags.DEFAULT
            );

            settings.bind(
                'balanced-start-threshold2',
                this._balanced_start_threshold_2,
                'value',
                Gio.SettingsBindFlags.DEFAULT
            );

            settings.bind(
                'maxlife-start-threshold2',
                this._maxlife_start_threshold_2,
                'value',
                Gio.SettingsBindFlags.DEFAULT
            );

            settings.connect('changed::full-capacity-end-threshold2', () => {
                const fullCapStartRangeLower = this._full_capacity_end_threshold_2.value - 10;
                const fullCapStartRangeUpper = this._full_capacity_end_threshold_2.value - 2;
                this._full_capacity_start_threshold_2.set_range(fullCapStartRangeLower, fullCapStartRangeUpper);
                this._updateRangeSubtitle(this._full_capacity_start_threshold_row_2, fullCapStartRangeLower, fullCapStartRangeUpper);
            });

            settings.connect('changed::balanced-end-threshold2', () => {
                const balStartRangeLower = this._balanced_end_threshold_2.value - 10;
                const balStartRangeUpper = this._balanced_end_threshold_2.value - 2;
                this._balanced_start_threshold_2.set_range(balStartRangeLower, balStartRangeUpper);
                this._updateRangeSubtitle(this._balanced_start_threshold_row_2, balStartRangeLower, balStartRangeUpper);
            });

            settings.connect('changed::maxlife-end-threshold2', () => {
                const maxLifeRangeLower = this._maxlife_end_threshold_2.value - 10;
                const maxlifeRangeUpper = this._maxlife_end_threshold_2.value - 2;
                this._maxlife_start_threshold_2.set_range(maxLifeRangeLower, maxlifeRangeUpper);
                this._updateRangeSubtitle(this._maxlife_start_threshold_row_2, maxLifeRangeLower, maxlifeRangeUpper);
            });
        }  //  endif StartThresholdSupported

        this._apply_settings_2.connect('clicked', () => {
            this._updateCurrentValues(settings);
            this._updateCurrentValueLabel(settings);
            Driver.setThresholdLimit2(settings.get_string('charging-mode2'));
            settings.set_boolean('dummy-apply-threshold2', !settings.get_boolean('dummy-apply-threshold2'));
        });

        this._default_threshold_2.connect('clicked', () => {
            const keys = [
                'full-capacity-end-threshold2',
                'full-capacity-start-threshold2',
                'balanced-end-threshold2',
                'balanced-start-threshold2',
                'maxlife-end-threshold2',
                'maxlife-start-threshold2',
                'current-full-capacity-end-threshold2',
                'current-full-capacity-start-threshold2',
                'current-balanced-end-threshold2',
                'current-balanced-start-threshold2',
                'current-maxlife-end-threshold2',
                'current-maxlife-start-threshold2',
            ];
            keys.forEach(key => {
                settings.reset(key);
            });
            this._updateCurrentValueLabel(settings);
            Driver.setThresholdLimit2(settings.get_string('charging-mode2'));
        });
    }

    _updateRangeSubtitle(row, lowerValue, upperValue) {
        row.set_subtitle(_('<i>Accepted Value : %d to %d</i>').format(lowerValue, upperValue));
    }

    _updateCurrentValues(settings) {
        settings.set_int('current-full-capacity-end-threshold2',
            settings.get_int('full-capacity-end-threshold2'));
        settings.set_int('current-balanced-end-threshold2',
            settings.get_int('balanced-end-threshold2'));
        settings.set_int('current-maxlife-end-threshold2',
            settings.get_int('maxlife-end-threshold2'));

        if (Driver.deviceInfo[this.type][0] === '1') {
            settings.set_int('current-full-capacity-start-threshold2',
                settings.get_int('full-capacity-start-threshold2'));
            settings.set_int('current-balanced-start-threshold2',
                settings.get_int('balanced-start-threshold2'));
            settings.set_int('current-maxlife-start-threshold2',
                settings.get_int('maxlife-start-threshold2'));
        }
    }

    _updateCurrentValueLabel(settings) {
        this._full_capacity_end_threshold_actual_value_2.set_label(
            settings.get_int('current-full-capacity-end-threshold2').toString());
        this._balanced_end_threshold_actual_value_2.set_label(
            settings.get_int('current-balanced-end-threshold2').toString());
        this._maxlife_end_threshold_actual_value_2.set_label(
            settings.get_int('current-maxlife-end-threshold2').toString());

        if (Driver.deviceInfo[this.type][0] === '1') {
            this._full_capacity_start_threshold_actual_value_2.set_label(
                settings.get_int('current-full-capacity-start-threshold2').toString());
            this._balanced_start_threshold_actual_value_2.set_label(
                settings.get_int('current-balanced-start-threshold2').toString());
            this._maxlife_start_threshold_actual_value_2.set_label(
                settings.get_int('current-maxlife-start-threshold2').toString());
        }
    }
});
