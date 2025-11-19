using System.Text.Json.Serialization;

namespace RemoteBrowserClient.Dtos
{
    internal class CreateContextResponse
    {
        [JsonPropertyName("contextId")]
        public string ContextId { get; set; } = "";
    }
}

