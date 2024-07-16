namespace SignalR2.Models
{
    public class HubUser
    {
        public string? ConnectionId { get; set; }
        public string? UserName { get; set; }
        public bool IsOnline { get; internal set; }
    }


}
