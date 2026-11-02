const { existsSync } = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const clientDir = path.resolve(__dirname, '../../client');

if (!existsSync(path.join(clientDir, 'package.json'))) {
  console.log('[build-client] Client folder not found; skipping.');
  process.exit(0);
}

const runNpm = (args) => {
  const result = spawnSync('npm', args, {
    cwd: clientDir,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, NODE_ENV: 'development' },
  });
  return result.status === 0;
};

if (!existsSync(path.join(clientDir, 'node_modules'))) {
  console.log('[build-client] Installing client dependencies...');
  if (!runNpm(['install', '--include=dev'])) {
    process.exit(1);
  }
}

console.log('[build-client] Building client...');
if (!runNpm(['run', 'build'])) {
  process.exit(1);
}

console.log('[build-client] Client build complete.');
