using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace RemoteBrowserClient.Dtos
{
    internal class GetContextsResponse
    {
        [JsonPropertyName("contexts")]
        public List<string> Contexts { get; set; } = new List<string>();
    }
}

