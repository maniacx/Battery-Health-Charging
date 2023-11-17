'use strict';
const {Adw, Gio, GLib, GObject} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

var About = GObject.registerClass({
    GTypeName: 'BHC_About',
    Template: `file://${GLib.build_filenamev([Me.path, 'ui', 'about.ui'])}`,
    InternalChildren: [
        'app_icon_image',
        'app_name_label',
        'version_label',
    ],
}, class About extends Adw.PreferencesPage {
    constructor(window) {
        super({});
        const actionGroup = new Gio.SimpleActionGroup();
        window.insert_action_group('prefs', actionGroup);
        this._app_name_label.label = Me.metadata.name;
        this._version_label.label = Me.metadata.version.toString();

        // a list of actions with their associated link
        const actions = [
            {
                name: 'open-readme',
                link: 'https://maniacx.github.io/Battery-Health-Charging/',
            },
            {
                name: 'open-bug-report',
                link: 'https://github.com/maniacx/Battery-Health-Charging/issues',
            },
            {
                name: 'open-translation',
                link: 'https://maniacx.github.io/Battery-Health-Charging/translation',
            },
            {
                name: 'open-sources',
                link: 'https://github.com/maniacx/Battery-Health-Charging/',
            },
            {
                name: 'open-rating',
                link: 'https://extensions.gnome.org/extension/5724/battery-health-charging',
            },
        ];

        actions.forEach(action => {
            const act = new Gio.SimpleAction({name: action.name});
            act.connect(
                'activate',
                _ => Gio.AppInfo.launch_default_for_uri_async(action.link, null, null, null)
            );
            actionGroup.add_action(act);
        });
    }
});
