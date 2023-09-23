'use strict';
import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import {gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export const ThresholdSecondary = GObject.registerClass({
    GTypeName: 'BHC_Threshold_Secondary',
    Template: GLib.Uri.resolve_relative(import.meta.url, '../ui/thresholdSecondary.ui', GLib.UriFlags.NONE),
    InternalChildren: [
        'customize_threshold_2',
        'default_threshold_2',
        'apply_settings_2',
        'full_capacity_mode_preference_group_2',
        'balanced_mode_preference_group_2',
        'maxlife_mode_preference_group_2',
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
    constructor(settings, currentDevice) {
        super({});
        this._settings = settings;
        this._currentDevice = currentDevice;

        this._setPrefGroupTitle();

        // Set range for end threshold value
        this._full_capacity_end_threshold_2.set_range(this._currentDevice.endFullCapacityRangeMin, this._currentDevice.endFullCapacityRangeMax);
        this._balanced_end_threshold_2.set_range(this._currentDevice.endBalancedRangeMin, this._currentDevice.endBalancedRangeMax);
        this._maxlife_end_threshold_2.set_range(this._currentDevice.endMaxLifeSpanRangeMin, this._currentDevice.endMaxLifeSpanRangeMax);

        // Set range for end threshold subtitle
        this._updateRangeSubtitle(this._full_capacity_end_threshold_row_2,
            this._currentDevice.endFullCapacityRangeMin, this._currentDevice.endFullCapacityRangeMax);
        this._updateRangeSubtitle(this._balanced_end_threshold_row_2,
            this._currentDevice.endBalancedRangeMin, this._currentDevice.endBalancedRangeMax);
        this._updateRangeSubtitle(this._maxlife_end_threshold_row_2,
            this._currentDevice.endMaxLifeSpanRangeMin, this._currentDevice.endMaxLifeSpanRangeMax);

        if (this._currentDevice.deviceHaveStartThreshold) { // if StartThresholdSupported
            this._full_capacity_start_threshold_2.set_range(this._currentDevice.startFullCapacityRangeMin, this._currentDevice.startFullCapacityRangeMax);
            this._balanced_start_threshold_2.set_range(this._currentDevice.startBalancedRangeMin, this._currentDevice.startBalancedRangeMax);
            this._maxlife_start_threshold_2.set_range(this._currentDevice.startMaxLifeSpanRangeMin, this._currentDevice.startMaxLifeSpanRangeMax);

            this._updateRangeSubtitle(this._full_capacity_start_threshold_row_2, this._currentDevice.startFullCapacityRangeMin,
                this._settings.get_int('ful-end-threshold2') - this._currentDevice.minDiffLimit);
            this._updateRangeSubtitle(this._balanced_start_threshold_row_2, this._currentDevice.startBalancedRangeMin,
                this._settings.get_int('bal-end-threshold2') - this._currentDevice.minDiffLimit);
            this._updateRangeSubtitle(this._maxlife_start_threshold_row_2, this._currentDevice.startMaxLifeSpanRangeMin,
                this._settings.get_int('max-end-threshold2') - this._currentDevice.minDiffLimit);
        }  //  endif StartThresholdSupported

        this._updateCurrentValueLabel();

        this._full_capacity_start_threshold_row_2.visible = this._currentDevice.deviceHaveStartThreshold;
        this._balanced_start_threshold_row_2.visible = this._currentDevice.deviceHaveStartThreshold;
        this._maxlife_start_threshold_row_2.visible = this._currentDevice.deviceHaveStartThreshold;

        this._setIncrements();

        this._settings.bind(
            'default-threshold2',
            this._customize_threshold_2,
            'active',
            Gio.SettingsBindFlags.INVERT_BOOLEAN
        );

        this._settings.bind(
            'default-threshold2',
            this._default_threshold_2,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );

        this._settings.bind(
            'ful-end-threshold2',
            this._full_capacity_end_threshold_2,
            'value',
            Gio.SettingsBindFlags.DEFAULT
        );

        this._settings.bind(
            'bal-end-threshold2',
            this._balanced_end_threshold_2,
            'value',
            Gio.SettingsBindFlags.DEFAULT
        );

        this._settings.bind(
            'max-end-threshold2',
            this._maxlife_end_threshold_2,
            'value',
            Gio.SettingsBindFlags.DEFAULT
        );

        this._settings.connect('changed::charging-mode2', () => {
            this._setPrefGroupTitle();
        });

        if (this._currentDevice.deviceHaveStartThreshold) { // if StartThresholdSupported
            this._settings.bind(
                'ful-start-threshold2',
                this._full_capacity_start_threshold_2,
                'value',
                Gio.SettingsBindFlags.DEFAULT
            );

            this._settings.bind(
                'bal-start-threshold2',
                this._balanced_start_threshold_2,
                'value',
                Gio.SettingsBindFlags.DEFAULT
            );

            this._settings.bind(
                'max-start-threshold2',
                this._maxlife_start_threshold_2,
                'value',
                Gio.SettingsBindFlags.DEFAULT
            );

            this._settings.connect('changed::ful-end-threshold2', () => {
                const fullCapStartRangeLower = this._currentDevice.startFullCapacityRangeMin;
                const fullCapStartRangeUpper = this._full_capacity_end_threshold_2.value - this._currentDevice.minDiffLimit;
                this._full_capacity_start_threshold_2.set_range(fullCapStartRangeLower, fullCapStartRangeUpper);
                this._updateRangeSubtitle(this._full_capacity_start_threshold_row_2, fullCapStartRangeLower, fullCapStartRangeUpper);
            });

            this._settings.connect('changed::bal-end-threshold2', () => {
                const balStartRangeLower = this._currentDevice.startBalancedRangeMin;
                const balStartRangeUpper = this._balanced_end_threshold_2.value - this._currentDevice.minDiffLimit;
                this._balanced_start_threshold_2.set_range(balStartRangeLower, balStartRangeUpper);
                this._updateRangeSubtitle(this._balanced_start_threshold_row_2, balStartRangeLower, balStartRangeUpper);
            });

            this._settings.connect('changed::max-end-threshold2', () => {
                const maxLifeStartRangeLower = this._currentDevice.startMaxLifeSpanRangeMin;
                const maxlifeStartRangeUpper = this._maxlife_end_threshold_2.value - this._currentDevice.minDiffLimit;
                this._maxlife_start_threshold_2.set_range(maxLifeStartRangeLower, maxlifeStartRangeUpper);
                this._updateRangeSubtitle(this._maxlife_start_threshold_row_2, maxLifeStartRangeLower, maxlifeStartRangeUpper);
            });
        }  //  endif StartThresholdSupported

        this._apply_settings_2.connect('clicked', () => {
            this._updateCurrentValues();
            this._updateCurrentValueLabel();
            this._settings.set_boolean('dummy-apply-threshold2', !this._settings.get_boolean('dummy-apply-threshold2'));
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
                this._settings.reset(key);
            });
            this._updateCurrentValueLabel();
            this._settings.set_boolean('dummy-default-threshold2', !this._settings.get_boolean('dummy-default-threshold2'));
        });
    }

    _setPrefGroupTitle() {
        const chargingMode = this._settings.get_string('charging-mode2');
        if (chargingMode === 'ful')
            this._full_capacity_mode_preference_group_2.set_title(_('Full Capacity Mode (Currently Active)'));
        else
            this._full_capacity_mode_preference_group_2.set_title(_('Full Capacity Mode'));
        if (chargingMode === 'bal')
            this._balanced_mode_preference_group_2.set_title(_('Balanced Mode (Currently Active)'));
        else
            this._balanced_mode_preference_group_2.set_title(_('Balanced Mode'));
        if (chargingMode === 'max')
            this._maxlife_mode_preference_group_2.set_title(_('Maximum Lifespan Mode (Currently Active)'));
        else
            this._maxlife_mode_preference_group_2.set_title(_('Maximum Lifespan Mode'));
    }

    _updateRangeSubtitle(row, lowerValue, upperValue) {
        row.set_subtitle(_('<i>Accepted Value : %d to %d</i>').format(lowerValue, upperValue));
    }

    _updateCurrentValues() {
        this._settings.set_int('current-ful-end-threshold2',
            this._settings.get_int('ful-end-threshold2'));
        this._settings.set_int('current-bal-end-threshold2',
            this._settings.get_int('bal-end-threshold2'));
        this._settings.set_int('current-max-end-threshold2',
            this._settings.get_int('max-end-threshold2'));

        if (this._currentDevice.deviceHaveStartThreshold) {
            this._settings.set_int('current-ful-start-threshold2',
                this._settings.get_int('ful-start-threshold2'));
            this._settings.set_int('current-bal-start-threshold2',
                this._settings.get_int('bal-start-threshold2'));
            this._settings.set_int('current-max-start-threshold2',
                this._settings.get_int('max-start-threshold2'));
        }
    }

    _updateCurrentValueLabel() {
        this._full_capacity_end_threshold_actual_value_2.set_label(
            this._settings.get_int('current-ful-end-threshold2').toString());
        this._balanced_end_threshold_actual_value_2.set_label(
            this._settings.get_int('current-bal-end-threshold2').toString());
        this._maxlife_end_threshold_actual_value_2.set_label(
            this._settings.get_int('current-max-end-threshold2').toString());

        if (this._currentDevice.deviceHaveStartThreshold) {
            this._full_capacity_start_threshold_actual_value_2.set_label(
                this._settings.get_int('current-ful-start-threshold2').toString());
            this._balanced_start_threshold_actual_value_2.set_label(
                this._settings.get_int('current-bal-start-threshold2').toString());
            this._maxlife_start_threshold_actual_value_2.set_label(
                this._settings.get_int('current-max-start-threshold2').toString());
        }
    }

    _setIncrements() {
        this._full_capacity_end_threshold_2.set_increments(this._currentDevice.incrementsStep, this._currentDevice.incrementsPage);
        this._balanced_end_threshold_2.set_increments(this._currentDevice.incrementsStep, this._currentDevice.incrementsPage);
        this._maxlife_end_threshold_2.set_increments(this._currentDevice.incrementsStep, this._currentDevice.incrementsPage);
        this._full_capacity_start_threshold_2.set_increments(this._currentDevice.incrementsStep, this._currentDevice.incrementsPage);
        this._balanced_start_threshold_2.set_increments(this._currentDevice.incrementsStep, this._currentDevice.incrementsPage);
        this._maxlife_start_threshold_2.set_increments(this._currentDevice.incrementsStep, this._currentDevice.incrementsPage);
    }
});
