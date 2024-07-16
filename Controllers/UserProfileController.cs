using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SignalR.Data;
using SignalR2.Models;
using System;
using System.Collections.Generic;
using System.Linq;

namespace SignalR2.Controllers
{
    [Authorize]
    [Route("api/userprofile")]
    [ApiController]
    public class UserProfileController : ControllerBase
    {
        private readonly ApplicationDbContext _dbContext;
        public UserProfileController(ApplicationDbContext dbContext)
        {
            _dbContext = dbContext;
        }
        [HttpGet("messages")]
        public ActionResult<IEnumerable<ChatMessage>> GetUserProfileMessages(string selectedUserEmail)
        {
            try
            {
                var currentUserEmail = User.Identity.Name;
                Console.WriteLine($"Current User Email: {currentUserEmail}");
                Console.WriteLine($"Selected User Email: {selectedUserEmail}");


                var messages = _dbContext.ChatMessages
                    .Where(msg => (msg.Sender == currentUserEmail && msg.Recipient == selectedUserEmail) || (msg.Sender == selectedUserEmail && msg.Recipient == currentUserEmail))
                    .OrderBy(msg => msg.Timestamp)
                    .ToList();

                return Ok(messages);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error");
            }
        }
    }


}

