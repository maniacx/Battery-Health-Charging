'use strict';
const {Adw, Gio, GLib, GObject} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

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
    constructor(settings, currentDevice) {
        super({});
        this._settings = settings;
        this._currentDevice = currentDevice;

        if (this._currentDevice.deviceHaveDualBattery)  // if laptop have dual battery
            this.set_title(_('Battery 1'));
        else
            this.set_title(_('Threshold'));

        this._setPrefGroupTitle();

        // Set range for end threshold value
        this._full_capacity_end_threshold.set_range(this._currentDevice.endFullCapacityRangeMin, this._currentDevice.endFullCapacityRangeMax);
        this._balanced_end_threshold.set_range(this._currentDevice.endBalancedRangeMin, this._currentDevice.endBalancedRangeMax);
        this._maxlife_end_threshold.set_range(this._currentDevice.endMaxLifeSpanRangeMin, this._currentDevice.endMaxLifeSpanRangeMax);

        // Set range for end threshold subtitle
        this._updateRangeSubtitle(this._full_capacity_end_threshold_row,
            this._currentDevice.endFullCapacityRangeMin, this._currentDevice.endFullCapacityRangeMax);
        this._updateRangeSubtitle(this._balanced_end_threshold_row,
            this._currentDevice.endBalancedRangeMin, this._currentDevice.endBalancedRangeMax);
        this._updateRangeSubtitle(this._maxlife_end_threshold_row,
            this._currentDevice.endMaxLifeSpanRangeMin, this._currentDevice.endMaxLifeSpanRangeMax);

        if (this._currentDevice.deviceHaveStartThreshold) { // if StartThresholdSupported
            this._full_capacity_start_threshold.set_range(this._currentDevice.startFullCapacityRangeMin, this._currentDevice.startFullCapacityRangeMax);
            this._balanced_start_threshold.set_range(this._currentDevice.startBalancedRangeMin, this._currentDevice.startBalancedRangeMax);
            this._maxlife_start_threshold.set_range(this._currentDevice.startMaxLifeSpanRangeMin, this._currentDevice.startMaxLifeSpanRangeMax);

            this._updateRangeSubtitle(this._full_capacity_start_threshold_row, this._currentDevice.startFullCapacityRangeMin,
                this._settings.get_int('ful-end-threshold') - this._currentDevice.minDiffLimit);
            this._updateRangeSubtitle(this._balanced_start_threshold_row, this._currentDevice.startBalancedRangeMin,
                this._settings.get_int('bal-end-threshold') - this._currentDevice.minDiffLimit);
            this._updateRangeSubtitle(this._maxlife_start_threshold_row, this._currentDevice.startMaxLifeSpanRangeMin,
                this._settings.get_int('max-end-threshold') - this._currentDevice.minDiffLimit);
        }  //  endif StartThresholdSupported

        this._updateCurrentValueLabel();

        this._full_capacity_start_threshold_row.visible = this._currentDevice.deviceHaveStartThreshold;
        this._balanced_start_threshold_row.visible = this._currentDevice.deviceHaveStartThreshold;
        this._maxlife_start_threshold_row.visible = this._currentDevice.deviceHaveStartThreshold;

        this._settings.bind(
            'default-threshold',
            this._customize_threshold,
            'active',
            Gio.SettingsBindFlags.INVERT_BOOLEAN
        );

        this._settings.bind(
            'default-threshold',
            this._default_threshold,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );

        this._settings.bind(
            'ful-end-threshold',
            this._full_capacity_end_threshold,
            'value',
            Gio.SettingsBindFlags.DEFAULT
        );

        this._settings.bind(
            'bal-end-threshold',
            this._balanced_end_threshold,
            'value',
            Gio.SettingsBindFlags.DEFAULT
        );

        this._settings.bind(
            'max-end-threshold',
            this._maxlife_end_threshold,
            'value',
            Gio.SettingsBindFlags.DEFAULT
        );

        this._settings.connect('changed::charging-mode', () => {
            this._setPrefGroupTitle();
        });

        if (this._currentDevice.deviceHaveStartThreshold) { // if StartThresholdSupported
            this._settings.bind(
                'ful-start-threshold',
                this._full_capacity_start_threshold,
                'value',
                Gio.SettingsBindFlags.DEFAULT
            );

            this._settings.bind(
                'bal-start-threshold',
                this._balanced_start_threshold,
                'value',
                Gio.SettingsBindFlags.DEFAULT
            );

            this._settings.bind(
                'max-start-threshold',
                this._maxlife_start_threshold,
                'value',
                Gio.SettingsBindFlags.DEFAULT
            );

            this._settings.connect('changed::ful-end-threshold', () => {
                const fullCapStartRangeLower = this._currentDevice.startFullCapacityRangeMin;
                const fullCapStartRangeUpper = this._full_capacity_end_threshold.value - this._currentDevice.minDiffLimit;
                this._full_capacity_start_threshold.set_range(fullCapStartRangeLower, fullCapStartRangeUpper);
                this._updateRangeSubtitle(this._full_capacity_start_threshold_row, fullCapStartRangeLower, fullCapStartRangeUpper);
            });

            this._settings.connect('changed::bal-end-threshold', () => {
                const balStartRangeLower = this._currentDevice.startBalancedRangeMin;
                const balStartRangeUpper = this._balanced_end_threshold.value - this._currentDevice.minDiffLimit;
                this._balanced_start_threshold.set_range(balStartRangeLower, balStartRangeUpper);
                this._updateRangeSubtitle(this._balanced_start_threshold_row, balStartRangeLower, balStartRangeUpper);
            });

            this._settings.connect('changed::max-end-threshold', () => {
                const maxLifeStartRangeLower = this._currentDevice.startMaxLifeSpanRangeMin;
                const maxlifeStartRangeUpper = this._maxlife_end_threshold.value - this._currentDevice.minDiffLimit;
                this._maxlife_start_threshold.set_range(maxLifeStartRangeLower, maxlifeStartRangeUpper);
                this._updateRangeSubtitle(this._maxlife_start_threshold_row, maxLifeStartRangeLower, maxlifeStartRangeUpper);
            });
        }  //  endif StartThresholdSupported

        this._apply_settings.connect('clicked', () => {
            this._updateCurrentValues();
            this._updateCurrentValueLabel();
            this._settings.set_boolean('dummy-apply-threshold', !this._settings.get_boolean('dummy-apply-threshold'));
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
                this._settings.reset(key);
            });
            this._updateCurrentValueLabel();
            this._settings.set_boolean('dummy-default-threshold', !this._settings.get_boolean('dummy-default-threshold'));
        });
    }

    _setPrefGroupTitle() {
        const chargingMode = this._settings.get_string('charging-mode');
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

    _updateCurrentValues() {
        this._settings.set_int('current-ful-end-threshold',
            this._settings.get_int('ful-end-threshold'));
        this._settings.set_int('current-bal-end-threshold',
            this._settings.get_int('bal-end-threshold'));
        this._settings.set_int('current-max-end-threshold',
            this._settings.get_int('max-end-threshold'));

        if (this._currentDevice.deviceHaveStartThreshold) {
            this._settings.set_int('current-ful-start-threshold',
                this._settings.get_int('ful-start-threshold'));
            this._settings.set_int('current-bal-start-threshold',
                this._settings.get_int('bal-start-threshold'));
            this._settings.set_int('current-max-start-threshold',
                this._settings.get_int('max-start-threshold'));
        }
    }

    _updateCurrentValueLabel() {
        this._full_capacity_end_threshold_actual_value.set_label(
            this._settings.get_int('current-ful-end-threshold').toString());
        this._balanced_end_threshold_actual_value.set_label(
            this._settings.get_int('current-bal-end-threshold').toString());
        this._maxlife_end_threshold_actual_value.set_label(
            this._settings.get_int('current-max-end-threshold').toString());

        if (this._currentDevice.deviceHaveStartThreshold) {
            this._full_capacity_start_threshold_actual_value.set_label(
                this._settings.get_int('current-ful-start-threshold').toString());
            this._balanced_start_threshold_actual_value.set_label(
                this._settings.get_int('current-bal-start-threshold').toString());
            this._maxlife_start_threshold_actual_value.set_label(
                this._settings.get_int('current-max-start-threshold').toString());
        }
    }
});
