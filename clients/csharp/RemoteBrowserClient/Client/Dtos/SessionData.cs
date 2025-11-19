using System.Text.Json.Serialization;

namespace RemoteBrowserClient.Dtos
{
    internal class SessionData 
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = "";
    }
}

