using System.Text.Json.Serialization;

namespace RemoteBrowserClient.Dtos
{
    internal class CreatePageResponse
    {
        [JsonPropertyName("pageId")]
        public string PageId { get; set; } = "";
    }
}

