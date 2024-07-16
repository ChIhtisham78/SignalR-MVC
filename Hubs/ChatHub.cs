using Microsoft.AspNetCore.SignalR;
using SignalR.Data;
using SignalR2.Models;
namespace LiveChat.SignalR.Hubs
{
    public class ChatHub : Hub
    {
        private readonly ILogger<ChatHub> _logger;
        private readonly ApplicationDbContext _dbContext;
        private static Dictionary<string, string> connectedUsers = new Dictionary<string, string>();
        private static Dictionary<string, string> userAvatars = new Dictionary<string, string>();
        public static List<HubUser> connectedUserList = new List<HubUser>();
        private string currentUsername;

        public ChatHub(ApplicationDbContext dbContext, ILogger<ChatHub> logger)
        {

            _dbContext = dbContext;
            _logger = logger;
        }
        public override async Task OnConnectedAsync()
        {
            if (Context.User.Identity.IsAuthenticated)
            {
                var userEmail = Context.User.Identity.Name;
                var connectionId = Context.ConnectionId;
                connectedUsers[connectionId] = userEmail;
                var obj = new HubUser
                {
                    ConnectionId = connectionId,
                    UserName = userEmail,
                };
                connectedUserList.Add(obj);
                var previousMessages = _dbContext.ChatMessages
                    .Where(msg => (msg.Sender == userEmail && msg.Recipient == currentUsername) || (msg.Sender == currentUsername && msg.Recipient == userEmail))
                    .OrderBy(msg => msg.Timestamp)
                    .ToList();
                foreach (var message in previousMessages)
                {
                    if (message.IsImage)
                    {
                        await Clients.Client(connectionId).SendAsync("ReceiveMessage", message.Sender, message.Recipient, message.Content, true);
                    }
                    else
                    {
                        await Clients.Client(connectionId).SendAsync("ReceiveMessage", message.Sender, message.Recipient, message.Content);
                    }
                }
                await Clients.All.SendAsync("UpdateUserList", connectedUsers.Values, userAvatars);
                await Clients.All.SendAsync("UserJoinedChat", userEmail, connectionId);
            }
            await base.OnConnectedAsync();
        }
        public override async Task OnDisconnectedAsync(Exception exception)
        {
            var UserEmail = Context.User.Identity.Name;
            var connectionId = Context.ConnectionId;
            if (connectedUsers.ContainsKey(connectionId))
            {
                var username = connectedUsers[connectionId];
                connectedUsers.Remove(connectionId);
                await Clients.All.SendAsync("UpdateUserList", connectedUsers.Values);
                await Clients.Others.SendAsync("UserLeftChat", username);
                await Clients.All.SendAsync("UserDisconnected", username, connectionId);
            }
            await base.OnDisconnectedAsync(exception);
        }
        public async Task JoinChat(string userEmail)
        {
            var connectionId = Context.ConnectionId;
            connectedUsers[connectionId] = userEmail;
            await Groups.AddToGroupAsync(connectionId, userEmail);
        }
        public async Task SendMessage(string toUserEmail, string message)
        {
            try
            {
                var fromUserEmail = connectedUsers[Context.ConnectionId];
                var toUserConnectionId = connectedUsers.FirstOrDefault(x => x.Value == toUserEmail).Key;
                var toUserDisplayName = "Recipient"; // Replace with the actual display name

                if (!string.IsNullOrEmpty(toUserConnectionId))
                {
                    await Clients.Client(toUserConnectionId).SendAsync("ReceiveMessage", fromUserEmail, toUserDisplayName, message);
                    var chatMessage = new ChatMessage
                    {
                        Sender = fromUserEmail,
                        Recipient = toUserDisplayName, // Store the display name instead of the email
                        Content = message,
                        IsImage = false,
                        Timestamp = DateTime.Now
                    };
                    _dbContext.ChatMessages.Add(chatMessage);
                    await _dbContext.SaveChangesAsync();
                }
                else
                {
                    _logger.LogInformation($"User {toUserEmail} not found.");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error sending message: {ex.Message}");
            }
        }

        public async Task SendImage(string toUser, string imageUrl, bool isImage)
        {
            var fromUser = connectedUsers[Context.ConnectionId];
            var toUserConnectionId = connectedUsers.FirstOrDefault(x => x.Value == toUser && x.Key != Context.ConnectionId).Key;

            if (!string.IsNullOrEmpty(toUserConnectionId))
            {
                if (isImage)
                {
                    await Clients.Client(toUserConnectionId).SendAsync("ReceiveMessage", fromUser, toUser, imageUrl, true);

                }
                else
                {
                    await Clients.Client(toUserConnectionId).SendAsync("ReceiveMessage", fromUser, toUser, imageUrl, false);
                }
            }
            var chatMessage = new ChatMessage
            {
                Sender = fromUser,
                Recipient = toUser,
                Content = imageUrl,
                IsImage = true,
                Timestamp = DateTime.Now
            };
            _dbContext.ChatMessages.Add(chatMessage);
            await _dbContext.SaveChangesAsync();
        }
    }
}