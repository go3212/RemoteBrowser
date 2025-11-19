# Remote Browser C# Client

This is a .NET 8 client library for the Remote Browser Orchestrator.

## Prerequisites

- .NET 8 SDK
- Running Remote Browser Orchestrator (Node.js)

## Usage

1. Build the project:
   ```bash
   dotnet build
   ```

2. Run the example:
   ```bash
   dotnet run
   ```

## Client API

### `RemoteBrowserClient`
- `CreateSessionAsync(BrowserLaunchOptions? options)`: Creates a new `Session`.
  - `BrowserLaunchOptions`:
    - `Headless`: bool
    - `Args`: List<string> (e.g. `--start-maximized`)
    - `Viewport`: { Width, Height }
- `GetSession(string sessionId)`: Returns a `Session` object for an existing ID.

### `Session`
- `StartAsync()`: Starts the browser worker.
- `StopAsync()`: Stops the session.
- `CreateContextAsync()`: Creates a new `BrowserContext` (Incognito window).
- `GetContextsAsync()`: Lists available context IDs.

### `BrowserContext`
- `CreatePageAsync()`: Creates a new `Page` (Tab).
- `CloseAsync()`: Closes the context.

### `Page`
- `NavigateAsync(url)`
- `ClickAsync(selector)`
- `TypeAsync(selector, text)`
- `ScreenshotAsync()`
- `EvaluateAsync<T>(script)`
- `GetContentAsync()`
- `QuerySelectorAsync(selector)`
- `QuerySelectorAllAsync(selector)`
- `GetElementTextAsync(selector)`
- `GetElementAttributeAsync(selector, attribute)`
- `CloseAsync()`
