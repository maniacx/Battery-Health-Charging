'use strict';
import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

export function addMenu(window, path) {
    const builder = new Gtk.Builder();

    // add a dummy page and remove it immediately, to access headerbar
    builder.add_from_file(`${path}/ui/menu.ui`);
    const menu_util = builder.get_object('menu_util');
    window.add(menu_util);
    addMenuToHeader(window, builder);
    window.remove(menu_util);
}

function findWidgetByType(parent, type) {
    for (const child of [...parent]) {
      if (child instanceof type) return child;

      const match = findWidgetByType(child, type);
      if (match) return match;
    }

    return null;
}

function addMenuToHeader(window, builder) {
    const header = findWidgetByType(window.get_content(), Adw.HeaderBar);
    header.pack_start(builder.get_object('info_menu'));

    // setup menu actions
    const actionGroup = new Gio.SimpleActionGroup();
    window.insert_action_group('prefs', actionGroup);

    // a list of actions with their associated link
    const actions = [
        {
            name: 'open-readme',
            link: 'https://github.com/maniacx/Battery-Health-Charging',
        },
        {
            name: 'open-bug-report',
            link: 'https://github.com/maniacx/Battery-Health-Charging/issues',
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
