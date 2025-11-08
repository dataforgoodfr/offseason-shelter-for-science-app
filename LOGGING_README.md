# Logging System - Shelter For Science

## Overview

This logging system allows displaying and managing application logs in a dedicated window while maintaining the ability to use the traditional console.

## Features

- **Dedicated logging window** : Opens automatically when the application starts
- **Real-time logs** : Live display of new logs
- **Filtering** : By level (info, warn, error, debug) and by source (main, renderer, system)
- **Display control** : Choice between console, logging window, or both
- **Persistence** : Logs are kept in memory during the session
- **Modern interface** : Dark design with color coding for different levels

## Usage

### From Main Process

```typescript
import { loggerService } from './services/logger';

// Simple log
loggerService.info('Information message');

// Log with data
loggerService.warn('Warning', { userId: 123, action: 'login' });
```

### From Renderer Process

```typescript
import { logger } from './utils/logger';

// Simple log
logger.info('Information message');

// Log with data
logger.warn('Warning', { foo: 'bar' });

## Log Structure

Each log contains:
- **id** : Unique identifier
- **timestamp** : Creation timestamp
- **level** : Log level (info, warn, error, debug)
- **source** : Log origin (main, renderer, system)
- **message** : Main message
- **data** : Additional data (optional)
- **console** : Display in console (default: true)
- **logger** : Display in logging window (default: true)

## IPC Channels

### Main → Renderer
- `logger:new-log` : New log received
- `logger:logs-cleared` : Logs cleared

### Renderer → Main
- `logger:add-log` : Add a new log
- `logger:get-logs` : Retrieve log history
- `logger:clear-logs` : Clear all logs

## User Interface

### Controls
- **Filters** : By level and by source
- **Display** : Buttons to enable/disable console and logger
- **Actions** : Log clearing button
- **Tests** : Buttons to generate test logs

### Display
- **Color coding** : Green (info), Yellow (warn), Red (error), Blue (debug)
- **Sources** : Distinct colors for main, renderer, system
- **Timestamp** : Localized format
- **Data** : Formatted JSON display for complex data

## Integration

The system is automatically integrated when the application starts:
1. Creation of the logging window
2. Configuration of the logging service
3. Automatic startup log
4. Management of closing events

## Customization

### Adding new log levels

Modify the `LogEntry` interface in `src/main/services/logger.ts` and add the corresponding methods.

### Modifying appearance

Edit the `LoggerScreen` component in `src/renderer/screens/logger.tsx` and adjust Tailwind CSS styles.

### Changing configuration

Modify parameters in `src/main/windows/logger.ts` for the window and `src/main/services/logger.ts` for the service.

## Troubleshooting

### Performance
- Reduce `maxLogs` in the service if necessary
- Use filters to limit display
- Disable auto-scroll if problematic
