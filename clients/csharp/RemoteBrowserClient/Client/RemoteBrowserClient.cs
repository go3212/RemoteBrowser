using System;
using System.Net.Http;
using System.Net.Http.Headers;
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

        public RemoteBrowserClient(string baseUrl, string? password = null)
        {
            _baseUrl = baseUrl.TrimEnd('/');
            _httpClient = new HttpClient();
            
            if (!string.IsNullOrEmpty(password))
            {
                var authToken = Convert.ToBase64String(Encoding.ASCII.GetBytes($"admin:{password}"));
                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", authToken);
            }

            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
                PropertyNameCaseInsensitive = true
            };
        }

        public async Task<Session> CreateSessionAsync(BrowserLaunchOptions? options = null, UserProfile? userProfile = null)
        {
            var body = new { launchOptions = options, userProfile };
            var response = await PostAsync<SessionData>($"/sessions", body);
            
            var session = new Session(response!.Id, this);
            await session.StartAsync();
            return session;
        }

        public Session GetSession(string sessionId)
        {
            return new Session(sessionId, this);
        }

        public async Task ImportUserProfileAsync(string name, string zipFilePath)
        {
             using var content = new MultipartFormDataContent();
             using var fileStream = System.IO.File.OpenRead(zipFilePath);
             using var fileContent = new StreamContent(fileStream);
             
             content.Add(fileContent, "file", System.IO.Path.GetFileName(zipFilePath));
             content.Add(new StringContent(name), "name");
             
             var response = await _httpClient.PostAsync($"{_baseUrl}/profiles/import", content);
             response.EnsureSuccessStatusCode();
        }

        public async Task ExportUserProfileAsync(string name, string saveToPath)
        {
             var bytes = await GetBytesAsync($"/profiles/{name}/export");
             await System.IO.File.WriteAllBytesAsync(saveToPath, bytes);
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
