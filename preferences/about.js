'use strict';
import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';


export const About = GObject.registerClass({
    GTypeName: 'BHC_About',
    Template: GLib.Uri.resolve_relative(import.meta.url, '../ui/about.ui', GLib.UriFlags.NONE),
    InternalChildren: [
        'app_icon_image',
        'app_name_label',
        'version_label',
    ],
}, class About extends Adw.PreferencesPage {
    constructor(window, extensionObject) {
        super({});
        const actionGroup = new Gio.SimpleActionGroup();
        window.insert_action_group('prefs', actionGroup);
        this._app_icon_image.gicon = Gio.icon_new_for_string(`${GLib.Uri.resolve_relative(import.meta.url, '../icons/battery-health-charging.svg', GLib.UriFlags.NONE)}`);
        this._app_name_label.label = extensionObject.metadata.name;
        this._version_label.label = extensionObject.metadata.version.toString();

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
                link: 'https://maniacx.github.io/Battery-Health-Charging/TRANSLATION.html',
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
