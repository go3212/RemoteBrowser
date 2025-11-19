using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using RemoteBrowserClient.Models;
using RemoteBrowserClient.Dtos;

namespace RemoteBrowserClient
{
    public class RemoteBrowserClient
    {
        private readonly HttpClient _httpClient;
        private readonly string _baseUrl;
        private readonly JsonSerializerOptions _jsonOptions;

        public RemoteBrowserClient(string baseUrl)
        {
            _baseUrl = baseUrl.TrimEnd('/');
            _httpClient = new HttpClient();
            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
                PropertyNameCaseInsensitive = true
            };
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
            var json = JsonSerializer.Serialize(body, _jsonOptions);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync($"{_baseUrl}{path}", content);
            response.EnsureSuccessStatusCode();
            
            var responseContent = await response.Content.ReadAsStringAsync();
            if (string.IsNullOrEmpty(responseContent)) return default;
            
            // Try to parse as wrapper first if it has result property
            try {
                 var wrapper = JsonSerializer.Deserialize<ResponseWrapper<T>>(responseContent, _jsonOptions);
                 if (wrapper != null && wrapper.Success) return wrapper.Result;
            } catch {}

            // Fallback or direct
            return JsonSerializer.Deserialize<T>(responseContent, _jsonOptions);
        }
        
        internal async Task<T?> GetAsync<T>(string path)
        {
            var response = await _httpClient.GetAsync($"{_baseUrl}{path}");
            response.EnsureSuccessStatusCode();
            var content = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<T>(content, _jsonOptions);
        }

        internal async Task PostAsync(string path, object body)
        {
            var json = JsonSerializer.Serialize(body, _jsonOptions);
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
}
