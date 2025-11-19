using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace RemoteBrowserClient
{
    class Program
    {
        static async Task Main(string[] args)
        {
            Console.WriteLine("Remote Browser Client Example");

            var client = new RemoteBrowserClient("http://localhost:3000");

            try
            {
                Console.WriteLine("Creating session with custom options...");
                var options = new BrowserLaunchOptions
                {
                    Headless = false,
                    Args = new List<string> { "--start-maximized" }
                };

                var session = await client.CreateSessionAsync(options);
                Console.WriteLine($"Session created: {session.Id}");

                Console.WriteLine("Starting session...");
                await session.StartAsync();

                Console.WriteLine("Creating Context...");
                var context = await session.CreateContextAsync();

                Console.WriteLine("Creating Page...");
                var page = await context.CreatePageAsync();
                
                Console.WriteLine("Navigating...");
                await page.NavigateAsync("https://www.google.com");
                
                // ... (rest of interaction)

                Console.WriteLine("Stopping session...");
                await session.StopAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error: {ex.Message}");
            }
        }
    }
}
