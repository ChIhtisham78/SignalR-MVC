namespace SignalR2.Models
{
    public class MessageStatus
    {
        public string? FromUserEmail { get; set; }
        public string? ToUserEmail { get; set; }
        public bool IsRead { get; set; }
    }
}
