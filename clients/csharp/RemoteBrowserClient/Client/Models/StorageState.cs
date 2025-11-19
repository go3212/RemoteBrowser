using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace RemoteBrowserClient.Models
{
    public class StorageState
    {
        public List<Cookie>? Cookies { get; set; }
        public List<Origin>? Origins { get; set; }
    }

    public class Cookie
    {
        public string Name { get; set; } = "";
        public string Value { get; set; } = "";
        public string Domain { get; set; } = "";
        public string Path { get; set; } = "";
        public double Expires { get; set; }
        public bool HttpOnly { get; set; }
        public bool Secure { get; set; }
        public string SameSite { get; set; } = "None";
    }

    public class Origin
    {
        [JsonPropertyName("origin")]
        public string OriginUrl { get; set; } = "";
        public List<LocalStorageEntry> LocalStorage { get; set; } = new();
    }

    public class LocalStorageEntry
    {
        public string Name { get; set; } = "";
        public string Value { get; set; } = "";
    }
}

