const cli = require('cli');
const fs = require('fs-extra');
const path = require('path');
const unzip = require('unzip');
const npmValid = require('validate-npm-package-name');
const npmRunScript = require('npm-run-script');

async function runSequence(promises) {
  for (const promise of promises) {
    try {
      await promise()
    } catch (error) {/* Quit */}
  }
};

runSequence([
  // Validate Project Name
  async() => {
    if (!cli.args[0]) {
      cli.error('Missing Project Name');
      throw 0;
    }

    const validate = npmValid(cli.args[0]);

    if (!validate.validForNewPackages) {
      if (validate.errors) {
        validate.errors.forEach(x => cli.error('An npm package ' + x));
      }
      if (validate.warnings) {
        validate.warnings.forEach(x => cli.error('An npm package ' + x));
      }
      throw 0;
    }
  },
  // Create Folder
  async() => {
    cli.info(`Creating new project "${cli.args[0]}"`);
    await fs.mkdirs(cli.args[0]);
  },
  // Unzip Template
  async() => {
    console.log('Copying Starter Template...');
    const zip = path.join(__dirname, '../templates/starter.zip');
    const out = path.join(process.cwd(), './' + cli.args[0]);

    await new Promise(resolve => {
      const stream = fs.createReadStream(zip).pipe(unzip.Extract({ path: out }));
      stream.on('close', resolve);
    });
  },
  // Run NPM Install
  () => {
    return new Promise((resolve, reject) => {
      process.chdir('./' + cli.args[0]);

      const child = npmRunScript('npm i -D');
      child.once('error', (error) => {
        reject(error);
      });
      child.once('exit', (exitCode) => {
        resolve();
      });
    });
  },
  // Say final message
  async() => {
    console.log('');
    console.log('DONE!');
    console.log('');
    console.log('Get started by running these commands:');
    console.log(` $ cd ${cli.args[0]}`);
    console.log(' $ npm start');
    console.log('');
  },
]);
