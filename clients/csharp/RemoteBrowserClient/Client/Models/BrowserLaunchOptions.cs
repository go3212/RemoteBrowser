using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace RemoteBrowserClient.Models
{
    public class BrowserLaunchOptions
    {
        [JsonPropertyName("headless")]
        public bool? Headless { get; set; }
        [JsonPropertyName("args")]
        public List<string>? Args { get; set; }
        [JsonPropertyName("viewport")]
        public Viewport? Viewport { get; set; }
    }

    public class Viewport
    {
        [JsonPropertyName("width")]
        public int Width { get; set; }
        [JsonPropertyName("height")]
        public int Height { get; set; }
    }
}

