using System.Text.Json.Serialization;

namespace RemoteBrowserClient.Models
{
    public class UserProfile
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = "";
        [JsonPropertyName("createIfMissing")]
        public bool CreateIfMissing { get; set; } = true;
    }
}

