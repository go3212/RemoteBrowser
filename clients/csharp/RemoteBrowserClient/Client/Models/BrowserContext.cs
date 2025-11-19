using System.Threading.Tasks;
using RemoteBrowserClient.Dtos;

namespace RemoteBrowserClient.Models
{
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

        public async Task<StorageState?> GetStorageStateAsync()
        {
            return await _client.GetAsync<StorageState>($"/contexts/{Id}/storageState");
        }

        public async Task CloseAsync()
        {
            await _client.DeleteAsync($"/contexts/{Id}");
        }
    }
}

