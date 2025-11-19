using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;

namespace RemoteBrowserClient
{
    public class RemoteBrowserClient
    {
        private readonly HttpClient _httpClient;
        private readonly string _baseUrl;

        public RemoteBrowserClient(string baseUrl)
        {
            _baseUrl = baseUrl.TrimEnd('/');
            _httpClient = new HttpClient();
        }

        public async Task<Session> CreateSessionAsync(BrowserLaunchOptions? options = null)
        {
            var body = new { launchOptions = options };
            var response = await PostAsync<SessionData>($"/sessions", body);
            
            return new Session(response!.Id, this);
        }

        public Session GetSession(string sessionId)
        {
            return new Session(sessionId, this);
        }

        internal async Task<T?> PostAsync<T>(string path, object body)
        {
            var json = JsonConvert.SerializeObject(body, new JsonSerializerSettings { NullValueHandling = NullValueHandling.Ignore });
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync($"{_baseUrl}{path}", content);
            response.EnsureSuccessStatusCode();
            
            var responseContent = await response.Content.ReadAsStringAsync();
            if (string.IsNullOrEmpty(responseContent)) return default;
            
            // Try to parse as wrapper first if it has result property
            try {
                 var wrapper = JsonConvert.DeserializeObject<ResponseWrapper<T>>(responseContent);
                 if (wrapper != null && wrapper.Success) return wrapper.Result;
            } catch {}

            // Fallback or direct
            return JsonConvert.DeserializeObject<T>(responseContent);
        }
        
        internal async Task<T?> GetAsync<T>(string path)
        {
            var response = await _httpClient.GetAsync($"{_baseUrl}{path}");
            response.EnsureSuccessStatusCode();
            var content = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<T>(content);
        }

        internal async Task PostAsync(string path, object body)
        {
            var json = JsonConvert.SerializeObject(body, new JsonSerializerSettings { NullValueHandling = NullValueHandling.Ignore });
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync($"{_baseUrl}{path}", content);
            response.EnsureSuccessStatusCode();
        }

        internal async Task<byte[]> GetBytesAsync(string path)
        {
             var response = await _httpClient.GetAsync($"{_baseUrl}{path}");
             response.EnsureSuccessStatusCode();
             return await response.Content.ReadAsByteArrayAsync();
        }
        
        internal async Task<string> GetStringAsync(string path)
        {
             var response = await _httpClient.GetAsync($"{_baseUrl}{path}");
             response.EnsureSuccessStatusCode();
             return await response.Content.ReadAsStringAsync();
        }
        
        internal async Task DeleteAsync(string path)
        {
            var response = await _httpClient.DeleteAsync($"{_baseUrl}{path}");
            response.EnsureSuccessStatusCode();
        }
    }

    public class BrowserLaunchOptions
    {
        [JsonProperty("headless")]
        public bool? Headless { get; set; }
        [JsonProperty("args")]
        public List<string>? Args { get; set; }
        [JsonProperty("viewport")]
        public Viewport? Viewport { get; set; }
    }

    public class Viewport
    {
        [JsonProperty("width")]
        public int Width { get; set; }
        [JsonProperty("height")]
        public int Height { get; set; }
    }

    public class Session
    {
        public string Id { get; }
        private readonly RemoteBrowserClient _client;

        public Session(string id, RemoteBrowserClient client)
        {
            Id = id;
            _client = client;
        }

        public async Task StartAsync()
        {
            await _client.PostAsync($"/sessions/{Id}/start", null);
        }

        public async Task StopAsync()
        {
            await _client.DeleteAsync($"/sessions/{Id}");
        }

        public async Task<BrowserContext> CreateContextAsync()
        {
             var response = await _client.PostAsync<CreateContextResponse>($"/sessions/{Id}/contexts", new {});
             return new BrowserContext(response!.ContextId, _client);
        }
        
        public async Task<List<string>> GetContextsAsync()
        {
             var response = await _client.GetAsync<GetContextsResponse>($"/sessions/{Id}/contexts");
             return response?.Contexts ?? new List<string>();
        }
    }

    public class BrowserContext
    {
        public string Id { get; }
        private readonly RemoteBrowserClient _client;

        public BrowserContext(string id, RemoteBrowserClient client)
        {
            Id = id;
            _client = client;
        }

        public async Task<Page> CreatePageAsync()
        {
            var response = await _client.PostAsync<CreatePageResponse>($"/contexts/{Id}/pages", new {});
            return new Page(response!.PageId, _client);
        }

        public async Task CloseAsync()
        {
            await _client.DeleteAsync($"/contexts/{Id}");
        }
    }

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

    internal class SessionData 
    {
        [JsonProperty("id")]
        public string Id { get; set; } = "";
    }

    internal class CreateContextResponse
    {
        [JsonProperty("contextId")]
        public string ContextId { get; set; } = "";
    }
    
    internal class GetContextsResponse
    {
        [JsonProperty("contexts")]
        public List<string> Contexts { get; set; } = new List<string>();
    }

    internal class CreatePageResponse
    {
        [JsonProperty("pageId")]
        public string PageId { get; set; } = "";
    }

    internal class ResponseWrapper<T>
    {
        [JsonProperty("success")]
        public bool Success { get; set; }
        [JsonProperty("result")]
        public T Result { get; set; } = default!;
    }
}
