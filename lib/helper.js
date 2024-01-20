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

export async function execCheck(argv) {
    const flags = Gio.SubprocessFlags.STDOUT_PIPE |
                 Gio.SubprocessFlags.STDERR_PIPE;

    const proc = new Gio.Subprocess({
        argv,
        flags,
    });
    proc.init(null);

    const output = await new Promise((resolve, reject) => {
        proc.communicate_utf8_async(null, null, (obj, res) => {
            try {
                const [, stdout] = obj.communicate_utf8_finish(res);
                const status = obj.get_exit_status();
                resolve([status, stdout]);
            } catch (e) {
                reject(e);
            }
        });
    });
    return output;
}

export async function runCommandCtl(ctlPath, command, arg1, arg2, arg3) {
    let argv = ['pkexec', ctlPath, command];
    if (arg1) {
        argv = argv.concat(arg1);
        if (arg2) {
            argv = argv.concat(arg2);
            if (arg3)
                argv = argv.concat(arg3);
        }
    }
    const result = await execCheck(argv);
    return result;
}


