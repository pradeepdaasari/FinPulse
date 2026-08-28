using Microsoft.AspNetCore.Identity;

namespace Pulse.Core.Models;

public class ApplicationUser : IdentityUser
{
    public string? PreferredTimezone { get; set; }
}
