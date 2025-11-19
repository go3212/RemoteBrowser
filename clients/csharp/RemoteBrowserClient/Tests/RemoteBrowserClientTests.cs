using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using Xunit;
using RemoteBrowserClient;
using RemoteBrowserClient.Models;

namespace RemoteBrowserClient.Tests
{
    /// <summary>
    /// Comprehensive tests for RemoteBrowserClient covering all functionalities
    /// </summary>
    public class RemoteBrowserClientTests
    {
        private const string BaseUrl = "https://remotebrowser.miuratech.net";
        //private const string BaseUrl = "http://localhost:3000";

        private string? GetPassword()
        {
            return Environment.GetEnvironmentVariable("REMOTE_BROWSER_PASSWORD") ?? "rd132243";
        }

        private RemoteBrowserClient CreateClient()
        {
            return new RemoteBrowserClient(BaseUrl, GetPassword());
        }

        #region Basic Session Operations

        [Fact]
        public async Task Test01_CreateSession_ShouldReturnValidSession()
        {
            var client = CreateClient();
            
            var session = await client.CreateSessionAsync(new BrowserLaunchOptions
            {
                Headless = true
            });

            Assert.NotNull(session);
            Assert.NotNull(session.Id);
            Assert.NotEmpty(session.Id);

            // Cleanup
            await session.StopAsync();
        }

        [Fact]
        public async Task Test02_CreateSessionWithOptions_ShouldWork()
        {
            var client = CreateClient();
            
            var session = await client.CreateSessionAsync(new BrowserLaunchOptions
            {
                Headless = true,
                Args = new List<string> { "--no-sandbox", "--disable-dev-shm-usage" }
            });

            Assert.NotNull(session);
            await Task.Delay(2000); // Wait for browser to be ready

            // Verify session works by creating a context
            var context = await session.CreateContextAsync();
            Assert.NotNull(context);

            // Cleanup
            await context.CloseAsync();
            await session.StopAsync();
        }

        [Fact]
        public async Task Test03_GetContexts_ShouldReturnEmptyListInitially()
        {
            var client = CreateClient();
            var session = await client.CreateSessionAsync(new BrowserLaunchOptions { Headless = true });
            await Task.Delay(2000);

            var contexts = await session.GetContextsAsync();
            
            Assert.NotNull(contexts);
            Assert.Empty(contexts);

            await session.StopAsync();
        }

        [Fact]
        public async Task Test04_GetContexts_ShouldReturnCreatedContexts()
        {
            var client = CreateClient();
            var session = await client.CreateSessionAsync(new BrowserLaunchOptions { Headless = true });
            await Task.Delay(2000);

            // Create multiple contexts
            var context1 = await session.CreateContextAsync();
            var context2 = await session.CreateContextAsync();

            var contexts = await session.GetContextsAsync();
            
            Assert.Equal(2, contexts.Count);
            Assert.Contains(context1.Id, contexts);
            Assert.Contains(context2.Id, contexts);

            // Cleanup
            await context1.CloseAsync();
            await context2.CloseAsync();
            await session.StopAsync();
        }

        #endregion

        #region Context Operations

        [Fact]
        public async Task Test05_CreateContext_ShouldReturnValidContext()
        {
            var client = CreateClient();
            var session = await client.CreateSessionAsync(new BrowserLaunchOptions { Headless = true });
            await Task.Delay(2000);

            var context = await session.CreateContextAsync();
            
            Assert.NotNull(context);
            Assert.NotNull(context.Id);
            Assert.NotEmpty(context.Id);

            await context.CloseAsync();
            await session.StopAsync();
        }

        [Fact]
        public async Task Test06_GetStorageState_ShouldReturnState()
        {
            var client = CreateClient();
            var session = await client.CreateSessionAsync(new BrowserLaunchOptions { Headless = true });
            await Task.Delay(2000);

            var context = await session.CreateContextAsync();
            
            var storageState = await context.GetStorageStateAsync();
            
            Assert.NotNull(storageState);
            // Storage state should have cookies and origins arrays
            Assert.NotNull(storageState.Cookies);
            Assert.NotNull(storageState.Origins);

            await context.CloseAsync();
            await session.StopAsync();
        }

        [Fact]
        public async Task Test07_CloseContext_ShouldRemoveFromContextList()
        {
            var client = CreateClient();
            var session = await client.CreateSessionAsync(new BrowserLaunchOptions { Headless = true });
            await Task.Delay(2000);

            var context = await session.CreateContextAsync();
            var contextId = context.Id;

            // Verify it exists
            var contexts = await session.GetContextsAsync();
            Assert.Contains(contextId, contexts);

            // Close it
            await context.CloseAsync();
            await Task.Delay(1000);

            // Verify it's removed
            contexts = await session.GetContextsAsync();
            Assert.DoesNotContain(contextId, contexts);

            await session.StopAsync();
        }

        #endregion

        #region Page Operations

        [Fact]
        public async Task Test08_CreatePage_ShouldReturnValidPage()
        {
            var client = CreateClient();
            var session = await client.CreateSessionAsync(new BrowserLaunchOptions { Headless = true });
            await Task.Delay(2000);

            var context = await session.CreateContextAsync();
            var page = await context.CreatePageAsync();
            
            Assert.NotNull(page);
            Assert.NotNull(page.Id);
            Assert.NotEmpty(page.Id);

            await page.CloseAsync();
            await context.CloseAsync();
            await session.StopAsync();
        }

        [Fact]
        public async Task Test09_Navigate_ShouldLoadPage()
        {
            var client = CreateClient();
            var session = await client.CreateSessionAsync(new BrowserLaunchOptions { Headless = true });
            await Task.Delay(2000);

            var context = await session.CreateContextAsync();
            var page = await context.CreatePageAsync();

            await page.NavigateAsync("https://example.com");
            await Task.Delay(1000);

            var content = await page.GetContentAsync();
            Assert.Contains("Example Domain", content);

            await page.CloseAsync();
            await context.CloseAsync();
            await session.StopAsync();
        }

        [Fact]
        public async Task Test10_GetContent_ShouldReturnHtml()
        {
            var client = CreateClient();
            var session = await client.CreateSessionAsync(new BrowserLaunchOptions { Headless = true });
            await Task.Delay(2000);

            var context = await session.CreateContextAsync();
            var page = await context.CreatePageAsync();

            await page.NavigateAsync("https://example.com");
            await Task.Delay(1000);

            var content = await page.GetContentAsync();
            
            Assert.NotNull(content);
            Assert.Contains("<!DOCTYPE", content);
            Assert.Contains("html", content);

            await page.CloseAsync();
            await context.CloseAsync();
            await session.StopAsync();
        }

        [Fact]
        public async Task Test11_Screenshot_ShouldReturnImageData()
        {
            var client = CreateClient();
            var session = await client.CreateSessionAsync(new BrowserLaunchOptions { Headless = true });
            await Task.Delay(2000);

            var context = await session.CreateContextAsync();
            var page = await context.CreatePageAsync();

            await page.NavigateAsync("https://example.com");
            await Task.Delay(1000);

            var screenshot = await page.ScreenshotAsync();
            
            Assert.NotNull(screenshot);
            Assert.True(screenshot.Length > 1000, "Screenshot should be larger than 1KB");
            
            // Verify it's a PNG (starts with PNG magic bytes)
            Assert.Equal(0x89, screenshot[0]);
            Assert.Equal(0x50, screenshot[1]);
            Assert.Equal(0x4E, screenshot[2]);
            Assert.Equal(0x47, screenshot[3]);

            await page.CloseAsync();
            await context.CloseAsync();
            await session.StopAsync();
        }

        [Fact]
        public async Task Test12_Evaluate_ShouldExecuteJavaScript()
        {
            var client = CreateClient();
            var session = await client.CreateSessionAsync(new BrowserLaunchOptions { Headless = true });
            await Task.Delay(2000);

            var context = await session.CreateContextAsync();
            var page = await context.CreatePageAsync();

            await page.NavigateAsync("https://example.com");
            await Task.Delay(1000);

            var title = await page.EvaluateAsync<string>("document.title");
            
            Assert.NotNull(title);
            Assert.Contains("Example", title);

            await page.CloseAsync();
            await context.CloseAsync();
            await session.StopAsync();
        }

        [Fact]
        public async Task Test13_EvaluateComplex_ShouldReturnObject()
        {
            var client = CreateClient();
            var session = await client.CreateSessionAsync(new BrowserLaunchOptions { Headless = true });
            await Task.Delay(2000);

            var context = await session.CreateContextAsync();
            var page = await context.CreatePageAsync();

            await page.NavigateAsync("https://example.com");
            await Task.Delay(1000);

            var result = await page.EvaluateAsync<Dictionary<string, object>>(
                "({ title: document.title, url: window.location.href })"
            );
            
            Assert.NotNull(result);
            Assert.True(result.ContainsKey("title"));
            Assert.True(result.ContainsKey("url"));

            await page.CloseAsync();
            await context.CloseAsync();
            await session.StopAsync();
        }

        #endregion

        #region Selector Operations

        [Fact]
        public async Task Test14_QuerySelector_ShouldFindExistingElement()
        {
            var client = CreateClient();
            var session = await client.CreateSessionAsync(new BrowserLaunchOptions { Headless = true });
            await Task.Delay(2000);

            var context = await session.CreateContextAsync();
            var page = await context.CreatePageAsync();

            await page.NavigateAsync("https://example.com");
            await Task.Delay(1000);

            var exists = await page.QuerySelectorAsync("h1");
            Assert.True(exists);

            await page.CloseAsync();
            await context.CloseAsync();
            await session.StopAsync();
        }

        [Fact]
        public async Task Test15_QuerySelector_ShouldReturnFalseForNonExistent()
        {
            var client = CreateClient();
            var session = await client.CreateSessionAsync(new BrowserLaunchOptions { Headless = true });
            await Task.Delay(2000);

            var context = await session.CreateContextAsync();
            var page = await context.CreatePageAsync();

            await page.NavigateAsync("https://example.com");
            await Task.Delay(1000);

            var exists = await page.QuerySelectorAsync(".non-existent-class-xyz");
            Assert.False(exists);

            await page.CloseAsync();
            await context.CloseAsync();
            await session.StopAsync();
        }

        [Fact]
        public async Task Test16_QuerySelectorAll_ShouldReturnCount()
        {
            var client = CreateClient();
            var session = await client.CreateSessionAsync(new BrowserLaunchOptions { Headless = true });
            await Task.Delay(2000);

            var context = await session.CreateContextAsync();
            var page = await context.CreatePageAsync();

            await page.NavigateAsync("https://example.com");
            await Task.Delay(1000);

            var count = await page.QuerySelectorAllAsync("p");
            Assert.True(count > 0, "Should find at least one paragraph element");

            await page.CloseAsync();
            await context.CloseAsync();
            await session.StopAsync();
        }

        [Fact]
        public async Task Test17_GetElementText_ShouldReturnText()
        {
            var client = CreateClient();
            var session = await client.CreateSessionAsync(new BrowserLaunchOptions { Headless = true });
            await Task.Delay(2000);

            var context = await session.CreateContextAsync();
            var page = await context.CreatePageAsync();

            await page.NavigateAsync("https://example.com");
            await Task.Delay(1000);

            var text = await page.GetElementTextAsync("h1");
            Assert.NotNull(text);
            Assert.Contains("Example", text);

            await page.CloseAsync();
            await context.CloseAsync();
            await session.StopAsync();
        }

        [Fact]
        public async Task Test18_GetElementAttribute_ShouldReturnAttribute()
        {
            var client = CreateClient();
            var session = await client.CreateSessionAsync(new BrowserLaunchOptions { Headless = true });
            await Task.Delay(2000);

            var context = await session.CreateContextAsync();
            var page = await context.CreatePageAsync();

            await page.NavigateAsync("https://example.com");
            await Task.Delay(1000);

            var href = await page.GetElementAttributeAsync("a", "href");
            Assert.NotNull(href);
            Assert.Contains("iana.org", href);

            await page.CloseAsync();
            await context.CloseAsync();
            await session.StopAsync();
        }

        #endregion

        #region Form Interactions

        [Fact]
        public async Task Test19_TypeAndClick_ShouldInteractWithForm()
        {
            var client = CreateClient();
            var session = await client.CreateSessionAsync(new BrowserLaunchOptions { Headless = true });
            await Task.Delay(2000);

            var context = await session.CreateContextAsync();
            var page = await context.CreatePageAsync();

            // Create a test page with a form
            var html = @"
                <!DOCTYPE html>
                <html>
                <head><title>Test Form</title></head>
                <body>
                    <form id='testForm'>
                        <input type='text' id='username' name='username' />
                        <button type='submit' id='submitBtn'>Submit</button>
                    </form>
                    <div id='result'></div>
                    <script>
                        document.getElementById('testForm').addEventListener('submit', function(e) {
                            e.preventDefault();
                            document.getElementById('result').textContent = 'Form submitted!';
                        });
                    </script>
                </body>
                </html>
            ";

            await page.NavigateAsync("data:text/html," + Uri.EscapeDataString(html));
            await Task.Delay(1000);

            // Type into input
            await page.TypeAsync("#username", "testuser");
            await Task.Delay(500);

            // Verify the value was set
            var value = await page.EvaluateAsync<string>("document.getElementById('username').value");
            Assert.Equal("testuser", value);

            // Click submit button
            await page.ClickAsync("#submitBtn");
            await Task.Delay(1000);

            // Verify form was submitted
            var resultText = await page.GetElementTextAsync("#result");
            Assert.Contains("Form submitted!", resultText);

            await page.CloseAsync();
            await context.CloseAsync();
            await session.StopAsync();
        }

        #endregion

        #region Multiple Contexts and Pages

        [Fact]
        public async Task Test20_MultipleContexts_ShouldWorkIndependently()
        {
            var client = CreateClient();
            var session = await client.CreateSessionAsync(new BrowserLaunchOptions { Headless = true });
            await Task.Delay(2000);

            // Create multiple contexts
            var context1 = await session.CreateContextAsync();
            var context2 = await session.CreateContextAsync();
            var context3 = await session.CreateContextAsync();

            // Verify all exist
            var contexts = await session.GetContextsAsync();
            Assert.Equal(3, contexts.Count);

            // Create pages in different contexts
            var page1 = await context1.CreatePageAsync();
            var page2 = await context2.CreatePageAsync();

            await page1.NavigateAsync("https://example.com");
            await page2.NavigateAsync("https://www.iana.org");
            await Task.Delay(2000);

            // Verify they loaded different content
            var content1 = await page1.GetContentAsync();
            var content2 = await page2.GetContentAsync();

            Assert.Contains("Example Domain", content1);
            Assert.Contains("IANA", content2);

            // Cleanup
            await page1.CloseAsync();
            await page2.CloseAsync();
            await context1.CloseAsync();
            await context2.CloseAsync();
            await context3.CloseAsync();
            await session.StopAsync();
        }

        [Fact]
        public async Task Test21_MultiplePagesInContext_ShouldWork()
        {
            var client = CreateClient();
            var session = await client.CreateSessionAsync(new BrowserLaunchOptions { Headless = true });
            await Task.Delay(2000);

            var context = await session.CreateContextAsync();

            // Create multiple pages
            var page1 = await context.CreatePageAsync();
            var page2 = await context.CreatePageAsync();
            var page3 = await context.CreatePageAsync();

            // Navigate to different URLs
            await page1.NavigateAsync("https://example.com");
            await page2.NavigateAsync("https://www.iana.org");
            await Task.Delay(2000);

            // Verify they have different content
            var content1 = await page1.GetContentAsync();
            var content2 = await page2.GetContentAsync();

            Assert.Contains("Example Domain", content1);
            Assert.Contains("IANA", content2);

            // Cleanup
            await page1.CloseAsync();
            await page2.CloseAsync();
            await page3.CloseAsync();
            await context.CloseAsync();
            await session.StopAsync();
        }

        #endregion

        #region Advanced Scenarios

        [Fact]
        public async Task Test22_ComplexJavaScriptEvaluation_ShouldWork()
        {
            var client = CreateClient();
            var session = await client.CreateSessionAsync(new BrowserLaunchOptions { Headless = true });
            await Task.Delay(2000);

            var context = await session.CreateContextAsync();
            var page = await context.CreatePageAsync();

            var html = @"
                <!DOCTYPE html>
                <html>
                <body>
                    <ul id='list'>
                        <li>Item 1</li>
                        <li>Item 2</li>
                        <li>Item 3</li>
                    </ul>
                </body>
                </html>
            ";

            await page.NavigateAsync("data:text/html," + Uri.EscapeDataString(html));
            await Task.Delay(1000);

            // Execute complex JavaScript
            var items = await page.EvaluateAsync<List<string>>(
                "Array.from(document.querySelectorAll('#list li')).map(li => li.textContent)"
            );

            Assert.NotNull(items);
            Assert.Equal(3, items.Count);
            Assert.Contains("Item 1", items);
            Assert.Contains("Item 2", items);
            Assert.Contains("Item 3", items);

            await page.CloseAsync();
            await context.CloseAsync();
            await session.StopAsync();
        }

        [Fact]
        public async Task Test23_NavigateMultipleTimes_ShouldWork()
        {
            var client = CreateClient();
            var session = await client.CreateSessionAsync(new BrowserLaunchOptions { Headless = true });
            await Task.Delay(2000);

            var context = await session.CreateContextAsync();
            var page = await context.CreatePageAsync();

            // Navigate to first page
            await page.NavigateAsync("https://example.com");
            await Task.Delay(1000);
            var content1 = await page.GetContentAsync();
            Assert.Contains("Example Domain", content1);

            // Navigate to second page
            await page.NavigateAsync("https://www.iana.org");
            await Task.Delay(2000);
            var content2 = await page.GetContentAsync();
            Assert.Contains("IANA", content2);

            await page.CloseAsync();
            await context.CloseAsync();
            await session.StopAsync();
        }

        [Fact]
        public async Task Test24_DifferentSelectors_ShouldAllWork()
        {
            var client = CreateClient();
            var session = await client.CreateSessionAsync(new BrowserLaunchOptions { Headless = true });
            await Task.Delay(2000);

            var context = await session.CreateContextAsync();
            var page = await context.CreatePageAsync();

            var html = @"
                <!DOCTYPE html>
                <html>
                <body>
                    <div id='myId' class='myClass' data-test='myData'>Content</div>
                    <p class='myClass'>Paragraph</p>
                    <span>Span text</span>
                </body>
                </html>
            ";

            await page.NavigateAsync("data:text/html," + Uri.EscapeDataString(html));
            await Task.Delay(1000);

            // Test different selector types
            Assert.True(await page.QuerySelectorAsync("#myId")); // ID selector
            Assert.True(await page.QuerySelectorAsync(".myClass")); // Class selector
            Assert.True(await page.QuerySelectorAsync("span")); // Tag selector
            Assert.True(await page.QuerySelectorAsync("[data-test='myData']")); // Attribute selector

            // Test querySelector all with class selector
            var classCount = await page.QuerySelectorAllAsync(".myClass");
            Assert.Equal(2, classCount);

            await page.CloseAsync();
            await context.CloseAsync();
            await session.StopAsync();
        }

        #endregion

        #region Storage State / Cookies

        [Fact]
        public async Task Test25_StorageState_ShouldPersistCookies()
        {
            var client = CreateClient();
            var session = await client.CreateSessionAsync(new BrowserLaunchOptions { Headless = true });
            await Task.Delay(2000);

            var context = await session.CreateContextAsync();
            var page = await context.CreatePageAsync();

            // Set a cookie via JavaScript
            var html = @"
                <!DOCTYPE html>
                <html>
                <body>
                    <script>document.cookie = 'testcookie=testvalue; path=/';</script>
                    <div>Test page</div>
                </body>
                </html>
            ";

            await page.NavigateAsync("data:text/html," + Uri.EscapeDataString(html));
            await Task.Delay(1000);

            // Get storage state
            var storageState = await context.GetStorageStateAsync();
            
            Assert.NotNull(storageState);
            Assert.NotNull(storageState.Cookies);

            await page.CloseAsync();
            await context.CloseAsync();
            await session.StopAsync();
        }

        #endregion

        #region Full End-to-End Workflow

        [Fact]
        public async Task Test26_FullWorkflow_AllOperations()
        {
            var client = CreateClient();
            
            try
            {
                // 1. Create and start session
                var session = await client.CreateSessionAsync(new BrowserLaunchOptions
                {
                    Headless = true
                });
                Assert.NotNull(session);
                Assert.NotNull(session.Id);

                try
                {
                    await Task.Delay(2000);

                    // 2. Create context
                    var context = await session.CreateContextAsync();
                    Assert.NotNull(context);
                    Assert.NotNull(context.Id);

                    try
                    {
                        // 3. Create page
                        var page = await context.CreatePageAsync();
                        Assert.NotNull(page);
                        Assert.NotNull(page.Id);

                        try
                        {
                            // 4. Navigate
                            await page.NavigateAsync("https://example.com");
                            await Task.Delay(1000);

                            // 5. Get content
                            var content = await page.GetContentAsync();
                            Assert.NotNull(content);
                            Assert.Contains("Example Domain", content);

                            // 6. Query selector
                            var h1Exists = await page.QuerySelectorAsync("h1");
                            Assert.True(h1Exists);

                            // 7. Get element text
                            var h1Text = await page.GetElementTextAsync("h1");
                            Assert.Contains("Example Domain", h1Text);

                            // 8. Query selector all
                            var pCount = await page.QuerySelectorAllAsync("p");
                            Assert.True(pCount > 0);

                            // 9. Get attribute
                            var href = await page.GetElementAttributeAsync("a", "href");
                            Assert.NotNull(href);

                            // 10. Evaluate JavaScript
                            var title = await page.EvaluateAsync<string>("document.title");
                            Assert.Contains("Example", title);

                            // 11. Take screenshot
                            var screenshot = await page.ScreenshotAsync();
                            Assert.NotNull(screenshot);
                            Assert.True(screenshot.Length > 0);

                            // 12. Get storage state
                            var storageState = await context.GetStorageStateAsync();
                            Assert.NotNull(storageState);
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

                    // 13. Verify contexts list is now empty
                    var contexts = await session.GetContextsAsync();
                    Assert.Empty(contexts);
                }
                finally
                {
                    await session.StopAsync();
                }
            }
            catch (HttpRequestException ex) when (ex.Message.Contains("401"))
            {
                throw new Exception("Authentication failed. Please check REMOTE_BROWSER_PASSWORD environment variable.", ex);
            }
        }

        #endregion
    }
}
