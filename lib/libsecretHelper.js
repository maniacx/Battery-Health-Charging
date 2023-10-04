import Secret from 'gi://Secret';

const secretDescription = 'Battery Health Charging Bios Password';
const BIOS_PASSWORD_SCHEMA = new Secret.Schema('org.gnome.shell.extensions.Battery-Health-Charging',
    Secret.SchemaFlags.NONE,
    {
        'string': Secret.SchemaAttributeType.STRING,
    }
);

const attributes = {
    'string': 'Battery-Health-Charging-Gnome-Extension',
};

export function setPassword(pass, callback) {
    Secret.password_store(BIOS_PASSWORD_SCHEMA, attributes, Secret.COLLECTION_DEFAULT, secretDescription, pass, null, (o, result) => {
        try {
            Secret.password_store_finish(result);
            callback();
        } catch (e) {
            log('Battery Health Charging: Failed to store password on Gnome Keyring');
        }
    });
}

export function getPassword(callback) {
    Secret.password_lookup(BIOS_PASSWORD_SCHEMA, attributes, null, (o, result) => {
        try {
            const password = Secret.password_lookup_finish(result);
            callback(password);
        } catch (e) {
            log('Battery Health Charging: Failed to lookup password from Gnome Keyring');
        }
    });
}

export function clearPassword() {
    Secret.password_clear(BIOS_PASSWORD_SCHEMA, attributes, null, (o, result) => {
        try {
            Secret.password_clear_finish(result);
        } catch (e) {
            log('Battery Health Charging: Failed to clear password from Gnome Keyring');
        }
    });
}
