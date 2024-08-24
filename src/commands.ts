




export function getDevCommands(): string[] {
    return [
        "gcc", "g++", "make", "automake", "autoconf", "libtool", "binutils", "debugger",
        "rpm-build", "cmake", "flex", "bison", "gdb", "pkg-config", "strace", "valgrind",
        "elfutils", "patch", "rpmdevtools", "git", "subversion", "cvs", "gettext",
        "nasm", "as", "ld", "ar", "strip", "objdump", "objcopy"
    ];
}

export function getBasicCommands(): string[] {
    return [
        'mkdir', 'ls', 'pwd', 'rmdir', 'rm', 'cp', 'mv', 'touch', 'find', 'locate',
        'cat', 'more', 'less', 'head', 'tail', 'nano', 'vi', 'vim', 'grep', 'chmod',
        'chown', 'chgrp', 'umask', 'ps', 'top', 'kill', 'pkill', 'jobs', 'bg', 'fg',
        'df', 'du', 'free', 'uname', 'uptime', 'reboot', 'shutdown', 'ping', 'ifconfig',
        'ip', 'netstat', 'ss', 'wget', 'curl', 'history', 'man', 'echo', 'date',
        'tar', 'gzip', 'gunzip', 'zip', 'unzip', 'configure', 'cd'
    ];
}


export interface CommandObj {
    type: string,
    command: string
}

export function getAllCommands(): CommandObj[]{
    const devCommands = getDevCommands();
    const basicCommands = getBasicCommands();

    const devCommandObjects = devCommands.map(command => ({
        type: "Dev",
        command
    }));

    const basicCommandObjects = basicCommands.map(command => ({
        type: "Basic",
        command
    }));

    return [...basicCommandObjects, ...devCommandObjects];

}