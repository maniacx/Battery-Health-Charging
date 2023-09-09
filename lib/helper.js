'use strict';
import Gio from 'gi://Gio';

export function fileExists(path) {
    try {
        const f = Gio.File.new_for_path(path);
        return f.query_exists(null);
    } catch (e) {
        return false;
    }
}

export function readFile(path) {
    try {
        const f = Gio.File.new_for_path(path);
        const [, contents] = f.load_contents(null);
        const decoder = new TextDecoder('utf-8');
        return decoder.decode(contents);
    } catch (e) {
        return null;
    }
}

export function readFileUri(path) {
    try {
        const f = Gio.File.new_for_uri(path);
        const [, contents] = f.load_contents(null);
        const decoder = new TextDecoder('utf-8');
        return decoder.decode(contents);
    } catch (e) {
        return null;
    }
}

export function readFileInt(path) {
    try {
        const v = readFile(path);
        if (v)
            return parseInt(v);
        else
            return null;
    } catch (e) {
        return null;
    }
}

export function checkAuthRequired(path) {
    try {
        const f = Gio.File.new_for_path(path);
        const info = f.query_info('access::*', Gio.FileQueryInfoFlags.NONE, null);
        if (!info.get_attribute_boolean('access::can-write'))
            return true;
    } catch (e) {
        // Ignored
    }
    return false;
}

export async function execCheck(argv, logStdout, retStdout) {
    const flags = Gio.SubprocessFlags.STDOUT_PIPE |
                 Gio.SubprocessFlags.STDERR_PIPE;

    const proc = new Gio.Subprocess({
        argv,
        flags,
    });
    proc.init(null);

    return new Promise((resolve, reject) => {
        proc.communicate_utf8_async(null, null, (obj, res) => {
            try {
                const [, stdout, stderr] = obj.communicate_utf8_finish(res);
                const status = obj.get_exit_status();
                if (logStdout) {
                    if (status === 0)
                        log(`Battery Health Charging: ${stdout}`);
                    else
                        log(`Battery Health Charging: ${stderr}`);
                }
                if (retStdout)
                    resolve(stdout);
                else
                    resolve(status);
            } catch (e) {
                reject(e);
            }
        });
    });
}

export async function runCommandCtl(command, arg2, arg3, ctlPath, retStdout) {
    let argv = ['pkexec', ctlPath, command];
    if (arg2 !== null) {
        argv = argv.concat(arg2);
        if (arg3 !== null)
            argv = argv.concat(arg3);
    }
    const status = await execCheck(argv, false, retStdout);
    return status;
}


