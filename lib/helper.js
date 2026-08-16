'use strict';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

let execCheckRunning = false;
let execCheckTimerId = null;
let execCheckCancellable = null;

export const exitCode = {
    SUCCESS: 0,
    ERROR: 1,
    NEEDS_UPDATE: 2,
    TIMEOUT: 3,
    PRIVILEGE_REQUIRED: 126,
};

export function fileExists(path) {
    try {
        const f = Gio.File.new_for_path(path);
        return f.query_exists(null);
    } catch {
        return false;
    }
}

export function readFile(path) {
    try {
        const f = Gio.File.new_for_path(path);
        const [, contents] = f.load_contents(null);
        const decoder = new TextDecoder('utf-8');
        return decoder.decode(contents);
    } catch {
        return null;
    }
}

export function readFileUri(path) {
    try {
        const f = Gio.File.new_for_uri(path);
        const [, contents] = f.load_contents(null);
        const decoder = new TextDecoder('utf-8');
        return decoder.decode(contents);
    } catch {
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
    } catch {
        return null;
    }
}

export function dmiVendor() {
    return readFile('/sys/devices/virtual/dmi/id/sys_vendor');
}

export function dmiBoardName() {
    return readFile('/sys/devices/virtual/dmi/id/board_name');
}

export function findValidProgramInPath(program) {
    const validPaths = [
        '/usr/local/sbin/',
        '/usr/local/bin/',
        '/usr/sbin/',
        '/usr/bin/',
        '/opt/',
        '/run/wrapper/bin/',
        '/run/current-system/sw/bin/',
        '/etc/profiles/per-user/',
        "/home/linuxbrew/.linuxbrew/bin/",
        "/home/linuxbrew/.linuxbrew/sbin/",
    ];
    const path = GLib.find_program_in_path(program);
    if (path === null)
        return null;
    log(`Battery Health Charging: path = ${path}`);
    for (const basePath of validPaths) {
        if (path.startsWith(basePath))
            return path;
    }

    const validSymlinkedPath = `/home/${GLib.get_user_name()}/.nix-profile/bin/`;
    if (path.startsWith(validSymlinkedPath)) {
        const symlinkPath = GLib.file_read_link(path);
        log(`Battery Health Charging: symlinkPath = ${symlinkPath}`);
        if (symlinkPath.startsWith('/nix/store/') && symlinkPath.endsWith(`/${program}`))
            return symlinkPath;
    }

    return null;
}

export async function execCheck(argv, enableTimeout = true) {
    if (execCheckRunning) {
        log('Battery Health Charging: execCheck is already running.');
        return [exitCode.ERROR, null];
    }
    execCheckRunning = true;

    try {
        execCheckCancellable = new Gio.Cancellable();
        const flags = Gio.SubprocessFlags.STDOUT_PIPE |
                 Gio.SubprocessFlags.STDERR_PIPE;
        const proc = new Gio.Subprocess({
            argv,
            flags,
        });
        proc.init(null);

        const output = await new Promise(resolve => {
            if (enableTimeout) {
                execCheckTimerId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 5, () => {
                    log(`Battery Health Charging: Exceeded timeout for command: ${argv.join(' ')}`);
                    execCheckCancellable.cancel();
                    resolve([exitCode.TIMEOUT, null]);
                    execCheckTimerId = null;
                    return GLib.SOURCE_REMOVE;
                });
            }
            proc.communicate_utf8_async(null, execCheckCancellable, (obj, res) => {
                try {
                    if (execCheckCancellable === null || execCheckCancellable.is_cancelled())
                        return;

                    const [, stdout, stderr] = obj.communicate_utf8_finish(res);
                    const status = obj.get_exit_status();
                    if (execCheckTimerId !== null) {
                        GLib.Source.remove(execCheckTimerId);
                        execCheckTimerId = null;
                    }
                    if (stderr) {
                        log(`Battery Health Charging: StdErr for command: ${argv.join(' ')}`);
                        log(`Battery Health Charging: StdErr Error: ${stderr}`);
                    }
                    resolve([status, stdout]);
                // eslint-disable-next-line no-unused-vars
                } catch (e) {
                    resolve([exitCode.ERROR, null]);
                }
            });
        });
        return output;
    } catch (e) {
        log(`Battery Health Charging: Exception for command: ${argv.join(' ')}`);
        log(`Battery Health Charging: Exception Error: ${e}`);
        return [exitCode.ERROR, null];
    } finally {
        execCheckRunning = false;
        execCheckCancellable = null;
    }
}

export async function runCommandCtl(ctlPath, command, ...args) {
    const argv = ['pkexec', ctlPath, command, ...args.filter(arg => arg)];
    const result = await execCheck(argv);
    return result;
}

export function destroyExecCheck() {
    if (execCheckTimerId !== null) {
        GLib.Source.remove(execCheckTimerId);
        execCheckTimerId = null;
    }
    if (execCheckCancellable !== null && !execCheckCancellable.is_cancelled()) {
        execCheckCancellable.cancel();
        execCheckCancellable = null;
    }
    execCheckRunning = false;
}
