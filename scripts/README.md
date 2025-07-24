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

---

# Database Scripts

This directory also contains SQL scripts for managing test data in the Stallplass application.

## Test Data Scripts

### `seed-test-data.sql`

Creates comprehensive test data for testing the application:

- **Users**: Uses existing `user3@test.com` and `user4@test.com` 
- **Stables**: Creates 5 stables for each user (10 total) with varying:
  - Locations across Norway (Oslo, Bergen, Trondheim, Stavanger, etc.)
  - Advertising status (active, expired, disabled)
  - Amenities and features
- **Boxes**: Creates 10 boxes per stable (100 total) with varying:
  - Prices (3000-8000 NOK)
  - Availability status
  - Indoor/outdoor types
  - Sponsored status
  - Amenities and features
- **Additional Data**: Includes rentals, reviews, conversations, and messages

### `cleanup-test-data.sql`

Removes all test data created by the seed script while preserving:
- User authentication records
- System amenities and reference data

## NPM Commands

```bash
# Add test data to database (same as db:seed-data)
npm run db:seed

# Add test data to existing database
npm run db:seed-data

# Remove test data only
npm run db:cleanup-test
```

## Test Data Structure

### Stables
- **5 stables per user** (user3 and user4)
- **Mixed advertising status**:
  - Active advertising (will show in search)
  - Expired advertising (won't show in search)
  - No advertising (won't show in search)
- **Various locations** across Norway
- **Different amenities** for each stable

### Boxes
- **10 boxes per stable** (100 total)
- **Price tiers**:
  - Premium: 6000-7500 NOK (boxes 1-3)
  - Standard: 4700-5500 NOK (boxes 4-7)
  - Budget: 3100-3900 NOK (boxes 8-10)
- **Mixed availability**:
  - Available boxes (will show in search when occupancyStatus = 'available')
  - Unavailable boxes (won't show in search when occupancyStatus = 'available')
- **Indoor/outdoor mix**
- **Sponsored placement** on some boxes (only for stables with active advertising)

### Additional Features
- **Active rentals** on some unavailable boxes
- **Reviews** with ratings and comments
- **Conversations** and messages between users
- **Varying amenities** based on box quality

## Testing Scenarios

This test data enables testing of:

1. **Price filtering**: Wide range of prices across all tiers
2. **Availability filtering**: Mix of available/unavailable boxes
3. **Advertising requirements**: Only active advertising stables show in search
4. **Location filtering**: Stables across different fylker and kommuner
5. **Sponsored placement**: Premium positioning in search results
6. **Real-time features**: Active rentals, conversations, reviews

## Usage Tips

- Use `npm run db:seed` or `npm run db:seed-data` to add test data to existing database
- Use `npm run db:cleanup-test` to remove only test data without affecting other data
- **Important**: The test users (user3@test.com and user4@test.com) must exist before running seed scripts
- The script will not reset the database - it only adds data