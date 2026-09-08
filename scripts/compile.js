import fs from 'fs';
import path from 'path';
import solc from 'solc';

const contractsDir = path.resolve('contracts');
const files = ['dAssetToken.sol', 'MockRobinhoodOracle.sol', 'dAssetFactory.sol', 'MockHyperlaneBridge.sol'];

const sources = {};
for (const file of files) {
  const filePath = path.join(contractsDir, file);
  sources[file] = {
    content: fs.readFileSync(filePath, 'utf8')
  };
}

const input = {
  language: 'Solidity',
  sources,
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: {
      '*': {
        '*': ['abi', 'evm.bytecode.object']
      }
    }
  }
};

console.log('Compiling Solidity contracts with solc 0.8.20...');
const output = JSON.parse(solc.compile(JSON.stringify(input)));

if (output.errors) {
  let hasFatal = false;
  for (const err of output.errors) {
    if (err.severity === 'error') {
      console.error(err.formattedMessage);
      hasFatal = true;
    } else {
      console.warn(err.formattedMessage);
    }
  }
  if (hasFatal) {
    process.exit(1);
  }
}

const compiled = {};
for (const [file, contractMap] of Object.entries(output.contracts)) {
  for (const [name, data] of Object.entries(contractMap)) {
    compiled[name] = {
      abi: data.abi,
      bytecode: data.evm.bytecode.object
    };
    console.log(`✓ Compiled ${name} (${data.evm.bytecode.object.length / 2} bytes bytecode)`);
  }
}

const outPath = path.resolve('src/contracts/artifacts.json');
fs.writeFileSync(outPath, JSON.stringify(compiled, null, 2));
console.log(`\nArtifacts written to ${outPath}`);
