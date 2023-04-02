'use strict';
const {Adw, Gio, GLib, GObject} = imports.gi;
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
        'full_capacity_mode_preference_group',
        'balanced_mode_preference_group',
        'maxlife_mode_preference_group',
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

        this._currentDevice = Driver.currentDevice;
        this.deviceIsDell = this._currentDevice.type === 22;

        if (this._currentDevice.deviceHaveDualBattery)  // if laptop have dual battery
            this.set_title(_('Battery 1'));
        else
            this.set_title(_('Threshold'));

        this._setPrefGroupTitle(settings);

        // Set range for end threshold value
        this._full_capacity_end_threshold.set_range(80, 100);
        this._balanced_end_threshold.set_range(65, 85);
        this._maxlife_end_threshold.set_range(this.deviceIsDell ? 55 : 50, 85);

        // Set range for end threshold subtitle
        this._updateRangeSubtitle(this._full_capacity_end_threshold_row, 80, 100);
        this._updateRangeSubtitle(this._balanced_end_threshold_row, 65, 85);
        this._updateRangeSubtitle(this._maxlife_end_threshold_row, this.deviceIsDell ? 55 : 50, 85);

        if (this._currentDevice.deviceHaveStartThreshold) { // if StartThresholdSupported
            this._full_capacity_start_threshold.set_range(75, this.deviceIsDell ? 95 : 98);
            this._balanced_start_threshold.set_range(60, this.deviceIsDell ? 80 : 83);
            this._maxlife_start_threshold.set_range(this.deviceIsDell ? 50 : 40, 83);
            this._maxDiffInLimit = this.deviceIsDell ? 5 : 2;

            this._updateRangeSubtitle(this._full_capacity_start_threshold_row, 75,
                settings.get_int('ful-end-threshold') - this._maxDiffInLimit);
            this._updateRangeSubtitle(this._balanced_start_threshold_row, 60,
                settings.get_int('bal-end-threshold') - this._maxDiffInLimit);
            this._updateRangeSubtitle(this._maxlife_start_threshold_row, this.deviceIsDell ? 50 : 40,
                settings.get_int('max-end-threshold') - this._maxDiffInLimit);
        }  //  endif StartThresholdSupported

        this._updateCurrentValueLabel(settings);

        this._full_capacity_start_threshold_row.visible = this._currentDevice.deviceHaveStartThreshold;
        this._balanced_start_threshold_row.visible = this._currentDevice.deviceHaveStartThreshold;
        this._maxlife_start_threshold_row.visible = this._currentDevice.deviceHaveStartThreshold;

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
            'ful-end-threshold',
            this._full_capacity_end_threshold,
            'value',
            Gio.SettingsBindFlags.DEFAULT
        );

        settings.bind(
            'bal-end-threshold',
            this._balanced_end_threshold,
            'value',
            Gio.SettingsBindFlags.DEFAULT
        );

        settings.bind(
            'max-end-threshold',
            this._maxlife_end_threshold,
            'value',
            Gio.SettingsBindFlags.DEFAULT
        );

        settings.connect('changed::charging-mode', () => {
            this._setPrefGroupTitle(settings);
        });

        if (this._currentDevice.deviceHaveStartThreshold) { // if StartThresholdSupported
            settings.bind(
                'ful-start-threshold',
                this._full_capacity_start_threshold,
                'value',
                Gio.SettingsBindFlags.DEFAULT
            );

            settings.bind(
                'bal-start-threshold',
                this._balanced_start_threshold,
                'value',
                Gio.SettingsBindFlags.DEFAULT
            );

            settings.bind(
                'max-start-threshold',
                this._maxlife_start_threshold,
                'value',
                Gio.SettingsBindFlags.DEFAULT
            );

            settings.connect('changed::ful-end-threshold', () => {
                const fullCapStartRangeLower = 75;
                const fullCapStartRangeUpper = this._full_capacity_end_threshold.value - this._maxDiffInLimit;
                this._full_capacity_start_threshold.set_range(fullCapStartRangeLower, fullCapStartRangeUpper);
                this._updateRangeSubtitle(this._full_capacity_start_threshold_row, fullCapStartRangeLower, fullCapStartRangeUpper);
            });

            settings.connect('changed::bal-end-threshold', () => {
                const balStartRangeLower = 60;
                const balStartRangeUpper = this._balanced_end_threshold.value - this._maxDiffInLimit;
                this._balanced_start_threshold.set_range(balStartRangeLower, balStartRangeUpper);
                this._updateRangeSubtitle(this._balanced_start_threshold_row, balStartRangeLower, balStartRangeUpper);
            });

            settings.connect('changed::max-end-threshold', () => {
                const maxLifeStartRangeLower = this.deviceIsDell ? 50 : 40;
                const maxlifeStartRangeUpper = this._maxlife_end_threshold.value - this._maxDiffInLimit;
                this._maxlife_start_threshold.set_range(maxLifeStartRangeLower, maxlifeStartRangeUpper);
                this._updateRangeSubtitle(this._maxlife_start_threshold_row, maxLifeStartRangeLower, maxlifeStartRangeUpper);
            });
        }  //  endif StartThresholdSupported

        this._apply_settings.connect('clicked', () => {
            this._updateCurrentValues(settings);
            this._updateCurrentValueLabel(settings);
            settings.set_boolean('dummy-apply-threshold', !settings.get_boolean('dummy-apply-threshold'));
        });

        this._default_threshold.connect('clicked', () => {
            const keys = [
                'ful-end-threshold',
                'ful-start-threshold',
                'bal-end-threshold',
                'bal-start-threshold',
                'max-end-threshold',
                'max-start-threshold',
                'current-ful-end-threshold',
                'current-ful-start-threshold',
                'current-bal-end-threshold',
                'current-bal-start-threshold',
                'current-max-end-threshold',
                'current-max-start-threshold',
            ];
            keys.forEach(key => {
                settings.reset(key);
            });
            this._updateCurrentValueLabel(settings);
            settings.set_boolean('dummy-default-threshold', !settings.get_boolean('dummy-default-threshold'));
        });
    }

    _setPrefGroupTitle(settings) {
        const chargingMode = settings.get_string('charging-mode');
        if (chargingMode === 'ful')
            this._full_capacity_mode_preference_group.set_title(_('Full Capacity Mode (Currently Active)'));
        else
            this._full_capacity_mode_preference_group.set_title(_('Full Capacity Mode'));
        if (chargingMode === 'bal')
            this._balanced_mode_preference_group.set_title(_('Balanced Mode (Currently Active)'));
        else
            this._balanced_mode_preference_group.set_title(_('Balanced Mode'));
        if (chargingMode === 'max')
            this._maxlife_mode_preference_group.set_title(_('Maximum Lifespan Mode (Currently Active)'));
        else
            this._maxlife_mode_preference_group.set_title(_('Maximum Lifespan Mode'));
    }

    _updateRangeSubtitle(row, lowerValue, upperValue) {
        row.set_subtitle(_('<i>Accepted Value : %d to %d</i>').format(lowerValue, upperValue));
    }

    _updateCurrentValues(settings) {
        settings.set_int('current-ful-end-threshold',
            settings.get_int('ful-end-threshold'));
        settings.set_int('current-bal-end-threshold',
            settings.get_int('bal-end-threshold'));
        settings.set_int('current-max-end-threshold',
            settings.get_int('max-end-threshold'));

        if (this._currentDevice.deviceHaveStartThreshold) {
            settings.set_int('current-ful-start-threshold',
                settings.get_int('ful-start-threshold'));
            settings.set_int('current-bal-start-threshold',
                settings.get_int('bal-start-threshold'));
            settings.set_int('current-max-start-threshold',
                settings.get_int('max-start-threshold'));
        }
    }

    _updateCurrentValueLabel(settings) {
        this._full_capacity_end_threshold_actual_value.set_label(
            settings.get_int('current-ful-end-threshold').toString());
        this._balanced_end_threshold_actual_value.set_label(
            settings.get_int('current-bal-end-threshold').toString());
        this._maxlife_end_threshold_actual_value.set_label(
            settings.get_int('current-max-end-threshold').toString());

        if (this._currentDevice.deviceHaveStartThreshold) {
            this._full_capacity_start_threshold_actual_value.set_label(
                settings.get_int('current-ful-start-threshold').toString());
            this._balanced_start_threshold_actual_value.set_label(
                settings.get_int('current-bal-start-threshold').toString());
            this._maxlife_start_threshold_actual_value.set_label(
                settings.get_int('current-max-start-threshold').toString());
        }
    }
});
