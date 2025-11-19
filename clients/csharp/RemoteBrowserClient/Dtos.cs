using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace RemoteBrowserClient
{
    internal class SessionData 
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = "";
    }

    internal class CreateContextResponse
    {
        [JsonPropertyName("contextId")]
        public string ContextId { get; set; } = "";
    }
    
    internal class GetContextsResponse
    {
        [JsonPropertyName("contexts")]
        public List<string> Contexts { get; set; } = new List<string>();
    }

    internal class CreatePageResponse
    {
        [JsonPropertyName("pageId")]
        public string PageId { get; set; } = "";
    }

    internal class ResponseWrapper<T>
    {
        [JsonPropertyName("success")]
        public bool Success { get; set; }
        [JsonPropertyName("result")]
        public T Result { get; set; } = default!;
    }
}

