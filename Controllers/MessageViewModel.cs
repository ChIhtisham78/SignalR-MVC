using System.ComponentModel.DataAnnotations.Schema;

namespace SignalR.Controllers
{
    public class MessageViewModel
    {
        public string Imageurl { get; set; }
        [NotMapped]
        public IFormFile Pic { get; set; } // This property is used to receive the uploaded image
        public string Content { get; set; } // 
    }
}
