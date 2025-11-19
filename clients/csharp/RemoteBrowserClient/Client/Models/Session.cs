using System.Threading.Tasks;
using RemoteBrowserClient.Dtos;

namespace RemoteBrowserClient.Models
{
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
            await _client.PostAsync($"/sessions/{Id}/start", new { });
        }

        public async Task StopAsync()
        {
            await _client.DeleteAsync($"/sessions/{Id}");
        }

        public async Task<BrowserContext> CreateContextAsync(StorageState? storageState = null)
        {
             var response = await _client.PostAsync<CreateContextResponse>($"/sessions/{Id}/contexts", new { storageState });
             return new BrowserContext(response!.ContextId, _client);
        }
        
        public async Task<List<string>> GetContextsAsync()
        {
             var response = await _client.GetAsync<GetContextsResponse>($"/sessions/{Id}/contexts");
             return response?.Contexts ?? new List<string>();
        }
    }
}

