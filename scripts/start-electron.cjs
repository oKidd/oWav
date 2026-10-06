const { spawn } = require('node:child_process');
const path = require('node:path');
const electron = require('electron');
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;
env.OWAV_DEV = '1';
const child = spawn(electron, [path.resolve(__dirname, '..')], { stdio: 'inherit', env });
child.on('exit', code => process.exit(code ?? 0));
