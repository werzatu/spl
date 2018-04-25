const { exec } = require('child_process');
const fs = require('fs');
const Path = require('path');
const commander = require('commander');
const chalk = require('chalk');
var prompt = require('prompt');

function getHomeDir() {
  return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

function setupConfigFile() {
  prompt.start('');
  prompt.message = '';
  prompt.delimiter = '';
  console.log(chalk.yellow('Please enter the directory that contains your Sublime projects'));
  const schema = {
    properties: {
      path: {
        description: 'Path',
        required: true
      }
    }
  };
  prompt.get(schema, (err, result) => {
    fs.readdir(result.path, (err) => {
      if(err) {
        console.log(chalk.red('Directory does not Exist'));
        setupConfigFile();
      } else {
        const config = {
          projectsPath: result.path
        };
        fs.writeFileSync(Path.join(getHomeDir(), '.subl-proj-config'), JSON.stringify(config, null, '  '));
      }
    })
  });
}

function promptUserToChooseProject(projects) {
  projects.forEach((project, i) => {
    console.log(`${i + 1}: ${project.name}`);
  });

  prompt.start('');
  const schema = {
    properties: {
      proj: {
        description: 'Please choose a project',
        required: true
      }
    }
  };

  prompt.get(schema, (err, result) => {
    const path = projects[parseInt(result.proj) - 1].path;
    if(path) {
      exec(`subl ${path}`, (err, stdout, stderr) => {
        if (err) {
          console.log(chalk.red(`Error opening: ${path}`));
          return;
        }
        console.log('Opening:', chalk.green(projects[parseInt(result.proj) - 1].path));
      });
    }

  });
}

function getProjectsList(projectsDirectory) {
  const projFileRX = /^(.+)(\.sublime-project)$/;
  fs.readdir(projectsDirectory, (err, contents) => {
    const projects = contents
      .filter(file => projFileRX.test(file))
      .map(file => ({
        path: Path.join(projectsDirectory, file),
        name: file.match(projFileRX)[1] || 'Unknown'
      }));
    return promptUserToChooseProject(projects);
  });
}

function run() {
  fs.readFile(Path.join(getHomeDir(), '.subl-proj-config'), (err, file) => {
    if(err) {
      return setupConfigFile();
    }
    const config = JSON.parse(file.toString());
    return getProjectsList(config.projectsPath);
  });
}

module.exports = { run };
