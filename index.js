const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const simpleGit = require('simple-git');
const { exec } = require('child_process');
const path = require('path');

const app = express();
const git = simpleGit();

app.use(cors());
app.use(bodyParser.json());

// Endpoint to clone the repository
app.post('/webhook', async (req, res) => {
  const { repository, username, token } = req.body;

  if (!repository || !repository.clone_url || !username || !token) {
    return res.status(400).send('Invalid payload');
  }

  const cloneUrl = repository.clone_url.replace('https://', `https://${username}:${token}@`);
  const repoName = repository.name;

  try {
    const clonePath = path.join(__dirname, repoName);
    await git.clone(cloneUrl, clonePath);
    console.log(`Cloned ${repoName} into ${clonePath}`);

    res.status(200).send('Repository cloned successfully');
  } catch (error) {
    console.error('Error cloning repository:', error);
    res.status(500).send('Failed to clone repository');
  }
});

// Endpoint to execute sudo command
app.post('/exec-sudo', (req, res) => {
  const { command } = req.body;

  if (!command) {
    return res.status(400).send('No command provided');
  }

  exec(`sudo ${command}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing command: ${error.message}`);
      return res.status(500).send(`Error: ${error.message}`);
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return res.status(500).send(`stderr: ${stderr}`);
    }
    console.log(`stdout: ${stdout}`);
    res.status(200).send(`Command executed successfully: ${stdout}`);
  });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});