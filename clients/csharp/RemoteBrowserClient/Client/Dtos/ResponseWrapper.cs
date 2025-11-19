using System.Text.Json.Serialization;

namespace RemoteBrowserClient.Dtos
{
    internal class ResponseWrapper<T>
    {
        [JsonPropertyName("success")]
        public bool Success { get; set; }
        [JsonPropertyName("result")]
        public T Result { get; set; } = default!;
    }
}

