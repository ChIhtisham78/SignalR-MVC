using LiveChat.SignalR.Hubs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
namespace SignalR.Controllers
{
    public class UploadController : ControllerBase
    {
        private readonly int FileSizeLimit;
        private readonly string[] AllowedExtensions;
        private readonly IWebHostEnvironment _environment;
        private readonly IHubContext<ChatHub> _hubContext;
        public UploadController(
            IWebHostEnvironment environment,
            IHubContext<ChatHub> hubContext,
            IConfiguration configuration)
        {
            _environment = environment;
            _hubContext = hubContext;

            FileSizeLimit = configuration.GetSection("FileUpload").GetValue<int>("FileSizeLimit");
            AllowedExtensions = configuration.GetSection("FileUpload").GetValue<string>("AllowedExtensions").Split(",");
        }
        [HttpPost]
        public async Task<IActionResult> AddOrEdit(MessageViewModel messageViewModel)
        {
            // Check if a file is uploaded
            if (messageViewModel.Pic != null && messageViewModel.Pic.Length > 0)
            {
                var fileName = Path.GetRandomFileName().Substring(0, 6) + "_" + Path.GetFileNameWithoutExtension(messageViewModel.Pic.FileName) + Path.GetExtension(messageViewModel.Pic.FileName);

                var uploadPath = Path.Combine(_environment.WebRootPath, "uploads");

                if (!Directory.Exists(uploadPath))
                {
                    Directory.CreateDirectory(uploadPath);
                }

                var filePath = Path.Combine(uploadPath, fileName);

                using (var fileStream = new FileStream(filePath, FileMode.Create))
                {
                    await messageViewModel.Pic.CopyToAsync(fileStream);
                }

                messageViewModel.Imageurl = "/uploads/" + fileName;
            }
            else
            {
                // Handle the case where no file is uploaded
                messageViewModel.Imageurl = null;
            }



            return Ok(new { success = true, message = "Transaction saved successfully.", fileUrl = messageViewModel.Imageurl });
        }


        private IActionResult Json(object value)
        {
            throw new NotImplementedException();
        }
    }
}
