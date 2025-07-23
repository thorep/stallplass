# Real-time Logging System

This directory contains scripts for real-time logging of command output.

## run-with-log.sh

Captures the last 5000 lines of any command's output in real-time with timestamps.

### Usage

```bash
# Basic usage
./scripts/run-with-log.sh "command to run" [log-name]

# Examples
./scripts/run-with-log.sh "npm run test:e2e" test-results
./scripts/run-with-log.sh "npm run build" build-output
./scripts/run-with-log.sh "npm run dev" dev-server
```

### Features

- **Real-time logging**: Output appears in terminal AND log file simultaneously
- **Auto-rotation**: Keeps only the last 5000 lines to prevent large files
- **Timestamps**: Each line is prefixed with date and time
- **Cleanup**: Automatically rotates log on exit

### Log Files

All logs are saved in the `logs/` directory:
- `logs/e2e-tests.log` - E2E test output (use `npm run test:e2e:log`)
- `logs/build.log` - Build output (use `npm run build:log`)
- `logs/[custom-name].log` - Custom commands

### Integration with npm Scripts

The logging system is integrated with npm scripts:
- `npm run test:e2e:log` - E2E tests with logging
- `npm run build:log` - Build with logging

This helps capture errors and API calls that might be missed in busy terminal output.