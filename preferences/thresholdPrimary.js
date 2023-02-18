'use strict';
const {Adw, GLib, GObject, Gio} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Driver = Me.imports.lib.driver;
const gettextDomain = Me.metadata['gettext-domain'];
const Gettext = imports.gettext.domain(gettextDomain);
const _ = Gettext.gettext;

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

        this.type = settings.get_int('device-type');
        if (Driver.deviceInfo[this.type][1] === '1')
            this.set_title(_('Battery 1'));
        else
            this.set_title(_('Threshold'));

        this._updateRangeSubtitle(this._full_capacity_end_threshold_row, 90, 100);
        this._updateRangeSubtitle(this._balanced_end_threshold_row, 70, 80);
        this._updateRangeSubtitle(this._maxlife_end_threshold_row, 50, 60);

        if (Driver.deviceInfo[this.type][0] === '1') { // if StartThresholdSupported
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

        if (!(Driver.deviceInfo[this.type][0] === '1')) {
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
            Gio.SettingsBindFlags.INVERT_BOOLEAN
        );

        settings.bind(
            'default-threshold',
            this._default_threshold,
            'active',
            Gio.SettingsBindFlags.DEFAULT
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

        if (Driver.deviceInfo[this.type][0] === '1') { // if StartThresholdSupported
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
                const fullCapStartRangeLower = this._full_capacity_end_threshold.value - 10;
                const fullCapStartRangeUpper = this._full_capacity_end_threshold.value - 2;
                this._full_capacity_start_threshold.set_range(fullCapStartRangeLower, fullCapStartRangeUpper);
                this._updateRangeSubtitle(this._full_capacity_start_threshold_row, fullCapStartRangeLower, fullCapStartRangeUpper);
            });

            settings.connect('changed::balanced-end-threshold', () => {
                const balStartRangeLower = this._balanced_end_threshold.value - 10;
                const balStartRangeUpper = this._balanced_end_threshold.value - 2;
                this._balanced_start_threshold.set_range(balStartRangeLower, balStartRangeUpper);
                this._updateRangeSubtitle(this._balanced_start_threshold_row, balStartRangeLower, balStartRangeUpper);
            });

            settings.connect('changed::maxlife-end-threshold', () => {
                const maxLifeRangeLower = this._maxlife_end_threshold.value - 10;
                const maxlifeRangeUpper = this._maxlife_end_threshold.value - 2;
                this._maxlife_start_threshold.set_range(maxLifeRangeLower, maxlifeRangeUpper);
                this._updateRangeSubtitle(this._maxlife_start_threshold_row, maxLifeRangeLower, maxlifeRangeUpper);
            });
        }  //  endif StartThresholdSupported

        this._apply_settings.connect('clicked', () => {
            this._updateCurrentValues(settings);
            this._updateCurrentValueLabel(settings);
            Driver.setThresholdLimit(settings.get_string('charging-mode'));
            settings.set_boolean('dummy-apply-threshold', !settings.get_boolean('dummy-apply-threshold'));
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
            Driver.setThresholdLimit(settings.get_string('charging-mode'));
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

        if (Driver.deviceInfo[this.type][0] === '1') {
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

        if (Driver.deviceInfo[this.type][0] === '1') {
            this._full_capacity_start_threshold_actual_value.set_label(
                settings.get_int('current-full-capacity-start-threshold').toString());
            this._balanced_start_threshold_actual_value.set_label(
                settings.get_int('current-balanced-start-threshold').toString());
            this._maxlife_start_threshold_actual_value.set_label(
                settings.get_int('current-maxlife-start-threshold').toString());
        }
    }
});
