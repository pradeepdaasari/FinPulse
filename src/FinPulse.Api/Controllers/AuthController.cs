using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using FinPulse.Core.Models;

namespace FinPulse.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;

    public AuthController(UserManager<ApplicationUser> userManager, SignInManager<ApplicationUser> signInManager)
    {
        _userManager = userManager;
        _signInManager = signInManager;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var result = await _signInManager.PasswordSignInAsync(
            request.Username, request.Password, isPersistent: true, lockoutOnFailure: false);

        if (result.IsLockedOut)
            return Unauthorized(new { error = "Account is deactivated. Contact administrator." });

        if (!result.Succeeded)
            return Unauthorized(new { error = "Invalid username or password" });

        var user = await _userManager.FindByNameAsync(request.Username);
        var roles = await _userManager.GetRolesAsync(user!);
        return Ok(new { email = user!.Email, role = roles.FirstOrDefault() ?? "User" });
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await _signInManager.SignOutAsync();
        return Ok();
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var user = await _userManager.FindByNameAsync(User.Identity?.Name!);
        if (user == null)
            return Unauthorized();
        var roles = await _userManager.GetRolesAsync(user);
        return Ok(new { email = user.Email, role = roles.FirstOrDefault() ?? "User" });
    }
}

public record LoginRequest(string Username, string Password);
