using System;

namespace SignalR2.Models
{
    public class ChatMessage
    {
        public int Id { get; set; }
        public string? Sender { get; set; }
        public string? Recipient { get; set; }
        public string? Content { get; set; }
        public bool IsImage { get; set; }
        public DateTime Timestamp { get; set; }

    }
}
