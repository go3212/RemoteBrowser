using System.Threading.Tasks;
using RemoteBrowserClient.Dtos;

namespace RemoteBrowserClient.Models
{
    public class Page
    {
        public string Id { get; }
        private readonly RemoteBrowserClient _client;

        public Page(string id, RemoteBrowserClient client)
        {
            Id = id;
            _client = client;
        }

        public async Task CloseAsync()
        {
            await _client.DeleteAsync($"/pages/{Id}");
        }

        public async Task NavigateAsync(string url)
        {
            var body = new { url };
            await _client.PostAsync($"/pages/{Id}/navigate", body);
        }

        public async Task ClickAsync(string selector)
        {
            var body = new { selector };
            await _client.PostAsync($"/pages/{Id}/click", body);
        }

        public async Task TypeAsync(string selector, string text)
        {
            var body = new { selector, text };
            await _client.PostAsync($"/pages/{Id}/type", body);
        }

        public async Task<byte[]> ScreenshotAsync()
        {
            return await _client.GetBytesAsync($"/pages/{Id}/screenshot");
        }

        public async Task<T> EvaluateAsync<T>(string script)
        {
            var body = new { script };
            return (await _client.PostAsync<T>($"/pages/{Id}/evaluate", body))!;
        }
        
        public async Task<string> GetContentAsync()
        {
            return await _client.GetStringAsync($"/pages/{Id}/content");
        }

        public async Task<bool> QuerySelectorAsync(string selector)
        {
            var body = new { selector };
            return (await _client.PostAsync<bool>($"/pages/{Id}/querySelector", body));
        }

        public async Task<int> QuerySelectorAllAsync(string selector)
        {
            var body = new { selector };
            return (await _client.PostAsync<int>($"/pages/{Id}/querySelectorAll", body));
        }

        public async Task<string> GetElementTextAsync(string selector)
        {
            var body = new { selector };
            return (await _client.PostAsync<string>($"/pages/{Id}/elementText", body))!;
        }
        
        public async Task<string> GetElementAttributeAsync(string selector, string attribute)
        {
            var body = new { selector, attribute };
            return (await _client.PostAsync<string>($"/pages/{Id}/elementAttribute", body))!;
        }
    }
}

