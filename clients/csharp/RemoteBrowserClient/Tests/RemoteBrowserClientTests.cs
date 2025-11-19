using System;
using System.Net.Http;
using System.Threading.Tasks;
using Xunit;
using RemoteBrowserClient;
using RemoteBrowserClient.Models;

namespace RemoteBrowserClient.Tests
{
    public class RemoteBrowserClientTests
    {
        private const string BaseUrl = "https://remotebrowser.miuratech.net";
        //private const string BaseUrl = "http://localhost:3000";


        private string? GetPassword()
        {
            return Environment.GetEnvironmentVariable("REMOTE_BROWSER_PASSWORD") ?? "rd132243";
        }

        [Fact]
        public async Task EndToEnd_BrowserFlow_ShouldWork()
        {
            var password = GetPassword();
            
            // 1. Initialize Client
            var client = new RemoteBrowserClient(BaseUrl, password);

            try
            {
                // 2. Create Session (this also calls StartAsync internally)
                Session session = await client.CreateSessionAsync(new BrowserLaunchOptions
                {
                    Headless = true
                });
                Assert.NotNull(session);
                Assert.NotNull(session.Id);

                try
                {
                    // Give the session a moment to fully initialize
                    await Task.Delay(2000);

                    // 3. Create Context
                    var context = await session.CreateContextAsync();
                    Assert.NotNull(context);
                    Assert.NotNull(context.Id);

                    try
                    {
                        // 4. Create Page
                        var page = await context.CreatePageAsync();
                        Assert.NotNull(page);
                        Assert.NotNull(page.Id);

                        try
                        {
                            // 5. Navigate
                            await page.NavigateAsync("https://example.com");

                            // 6. Verify content
                            var content = await page.GetContentAsync();
                            Assert.NotNull(content);
                            Assert.Contains("Example Domain", content);

                            // 7. Take Screenshot
                            var screenshot = await page.ScreenshotAsync();
                            Assert.NotNull(screenshot);
                            Assert.True(screenshot.Length > 0);
                        }
                        finally
                        {
                            await page.CloseAsync();
                        }
                    }
                    finally
                    {
                        await context.CloseAsync();
                    }
                }
                finally
                {
                    await session.StopAsync();
                }
            }
            catch (HttpRequestException ex) when (ex.Message.Contains("401"))
            {
                if (string.IsNullOrEmpty(password))
                {
                    throw new Exception("The server requires authentication. Please set the REMOTE_BROWSER_PASSWORD environment variable.", ex);
                }
                throw;
            }
            catch (HttpRequestException ex) when (ex.Message.Contains("500"))
            {
                throw new Exception($"Server error (500). This might be a Docker/infrastructure issue on the server. Details: {ex.Message}", ex);
            }
        }
    }
}
