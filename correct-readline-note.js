////////////////////////////////////////////////////////////////////////////////
// Read lines for all file formats (\n \r\n \r)
// Sync style
const fs = require('fs');
const readline = require('readline');

const filePath = 'path/to/your/file.txt';

// Create a readable stream
const readStream = fs.createReadStream(filePath, 'utf8');

// Create a readline interface using the readable stream
const rl = readline.createInterface({
  input: readStream,
  output: process.stdout, // You can change this if you want to output somewhere else
  terminal: false,
});

// Process each line synchronously
for (const line of rl) {
  const trimmedLine = line.trim();
  // Your code to process each line goes here
  // For example, you can log the trimmed line:
  console.log(trimmedLine);
}

// Close the file stream when done
readStream.close();

////////////////////////////////////////////////////////////////////////////////
// Async style
const fs = require('fs');
const readline = require('readline');

const filePath = 'path/to/your/file.txt';

// Create a readable stream
const readStream = fs.createReadStream(filePath, 'utf8');

// Create a readline interface to read the file line by line
const rl = readline.createInterface({
  input: readStream,
  output: process.stdout, // You can change this if you want to output somewhere else
  terminal: false,
});

// Process each line
rl.on('line', (line) => {
  const trimmedLine = line.trim();
  // Your code to process each line goes here
  // For example, you can log the trimmed line:
  console.log(trimmedLine);
});

// Handle errors
readStream.on('error', (err) => {
  console.error(err);
});

////////////////////////////////////////////////////////////////////////////////
// This code is generated by ChatGPT.