const { exec } = require('child_process');
const fs = require('fs');
const Path = require('path');
const chalk = require('chalk');
const prompt = require('prompt');

function getHomeDir() {
  return process.env.HOME;
}

function setupConfigFile(config = {}) {
  prompt.start('');
  prompt.message = '';
  prompt.delimiter = '';
  console.log(chalk.yellow('Please enter the directory that contains your Sublime projects'));
  const schema = {
    properties: {
      path: {
        description: 'Path',
        default: config.projectsPath || Path.join(getHomeDir(), 'projects'),
        required: true
      },
      cmd: {
        description: 'Sublime start command',
        default: config.cmd || 'sublime',
        required: true
      }
    }
  };
  prompt.get(schema, (promtErr, result) => {
    fs.readdir(result.path, (readdirErr) => {
      if(readdirErr) {
        console.log(chalk.red('Directory does not Exist'));
        setupConfigFile();
      } else {
        const configFileContent = {
          projectsPath: result.path,
          cmd: 'subl'
        };
        fs.writeFileSync(Path.join(getHomeDir(), '.subl-proj-config'), JSON.stringify(configFileContent, null, '  '));
      }
    });
  });
}

function promptUserToChooseProject(projects, config) {
  console.log();
  console.log(chalk.bold(chalk.underline('Choose a project')));
  console.log();
  projects.forEach((project, i) => {
    console.log(`${chalk.bold(i + 1)}. ${project.name}`);
  });

  console.log();
  console.log(chalk.yellow(`(${chalk.bold('q')}) quit`), chalk.yellow(`(${chalk.bold('c')}) configure`));
  console.log();

  prompt.start('');
  prompt.message = '';
  prompt.delimiter = '';
  const schema = {
    properties: {
      opt: {
        description: 'Option:',
        required: true
      }
    }
  };

  prompt.get(schema, (err, result) => {
    if(err) {
      process.exit();
      return;
    }
    const val = (result && result.opt) || '';
    const valIsNumber = !isNaN(parseInt(val));
    if(valIsNumber) {
      const path = (projects[val - 1] && projects[val - 1].path) || null;
      if(path) {
        exec(`${config.cmd} ${path}`, (execErr) => {
          if(execErr) {
            console.log(chalk.red(`Error opening: ${path}`));
            return;
          }
          console.log(chalk.green('Opening:'), projects[parseInt(val) - 1].path);
        });
      } else {
        console.log('Invalid option');
        promptUserToChooseProject(projects, config);
      }
    } else {
      switch(val.toLowerCase()) {
        case 'q':
          process.exit();
          break;
        case 'c':
          setupConfigFile(config);
          break;
        default:
          console.log('Invalid option');
          promptUserToChooseProject(projects, config);
      }
    }
  });
}

function getProjectsList(config) {
  const projFileRX = /^(.+)(\.sublime-project)$/;
  fs.readdir(config.projectsPath, (err, contents) => {
    const projects = contents
      .filter(file => projFileRX.test(file))
      .map(file => ({
        path: Path.join(config.projectsPath, file),
        name: file.match(projFileRX)[1] || 'Unknown'
      }));
    return promptUserToChooseProject(projects, config);
  });
}

function run() {
  fs.readFile(Path.join(getHomeDir(), '.subl-proj-config'), (err, file) => {
    if(err) {
      return setupConfigFile();
    }
    const config = JSON.parse(file.toString());
    return getProjectsList(config);
  });
}

module.exports = { run };
