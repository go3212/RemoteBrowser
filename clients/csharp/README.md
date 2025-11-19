# RemoteBrowserClient - C# Client Library

A C# client library for interacting with the RemoteBrowser orchestrator service.

## Project Structure

```
RemoteBrowserClient/
├── Client/               # Class library
│   ├── RemoteBrowserClient.cs
│   ├── Models/
│   │   ├── BrowserContext.cs
│   │   ├── BrowserLaunchOptions.cs
│   │   ├── Page.cs
│   │   ├── Session.cs
│   │   ├── StorageState.cs
│   │   └── UserProfile.cs
│   └── Dtos/
│       ├── CreateContextResponse.cs
│       ├── CreatePageResponse.cs
│       ├── GetContextsResponse.cs
│       ├── ResponseWrapper.cs
│       └── SessionData.cs
├── Tests/                # xUnit test project
│   └── RemoteBrowserClientTests.cs
└── RemoteBrowser.sln     # Solution file
```

## Features

- Session management with browser launch options
- Context and page creation
- Page navigation and interaction (click, type, screenshot)
- Storage state persistence
- User profile import/export
- Basic authentication support

## Usage

```csharp
using RemoteBrowserClient;
using RemoteBrowserClient.Models;

// Initialize client
var client = new RemoteBrowserClient("https://remotebrowser.miuratech.net", "password");

// Create and start session
var session = await client.CreateSessionAsync(new BrowserLaunchOptions
{
    Headless = true
});

// Create context
var context = await session.CreateContextAsync();

// Create page
var page = await context.CreatePageAsync();

// Navigate
await page.NavigateAsync("https://example.com");

// Take screenshot
var screenshot = await page.ScreenshotAsync();

// Cleanup
await page.CloseAsync();
await context.CloseAsync();
await session.StopAsync();
```

## Building

```bash
cd RemoteBrowserClient
dotnet build RemoteBrowser.sln
```

## Running Tests

```bash
dotnet test RemoteBrowser.sln
```

Tests require the RemoteBrowser server to be running at `https://remotebrowser.miuratech.net`.

## Authentication

Set the password either:
1. In the constructor: `new RemoteBrowserClient(url, "password")`
2. Via environment variable: `REMOTE_BROWSER_PASSWORD`
