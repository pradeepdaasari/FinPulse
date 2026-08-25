using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FinPulse.Core.Data;
using FinPulse.Core.Models;

namespace FinPulse.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly FinPulseDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    public AdminController(FinPulseDbContext context, UserManager<ApplicationUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    [HttpPost("reseed")]
    public IActionResult Reseed()
    {
        SeedData.Reseed(_context, UserId);
        return Ok(new { message = "Database reseeded successfully" });
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _userManager.Users.ToListAsync();
        var userDtos = new List<UserDto>();

        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);
            var isActive = !user.LockoutEnabled || user.LockoutEnd == null || user.LockoutEnd <= DateTimeOffset.UtcNow;
            userDtos.Add(new UserDto(user.Id, user.Email ?? user.UserName ?? "", user.UserName ?? "", isActive, roles.FirstOrDefault() ?? "User"));
        }

        return Ok(userDtos);
    }

    [HttpPost("users")]
    public async Task<IActionResult> CreateUser(CreateUserRequest request)
    {
        var user = new ApplicationUser
        {
            UserName = request.Username,
            Email = request.Email,
            EmailConfirmed = true
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });

        await _userManager.AddToRoleAsync(user, "User");
        return Ok(new UserDto(user.Id, user.Email!, user.UserName!, true, "User"));
    }

    [HttpPost("users/{id}/deactivate")]
    public async Task<IActionResult> DeactivateUser(string id)
    {
        if (id == UserId)
            return BadRequest(new { error = "Cannot deactivate your own account" });

        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
            return NotFound();

        await _userManager.SetLockoutEnabledAsync(user, true);
        await _userManager.SetLockoutEndDateAsync(user, DateTimeOffset.MaxValue);
        return Ok();
    }

    [HttpPost("users/{id}/activate")]
    public async Task<IActionResult> ActivateUser(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
            return NotFound();

        await _userManager.SetLockoutEndDateAsync(user, null);
        return Ok();
    }

    [HttpDelete("users/{id}")]
    public async Task<IActionResult> DeleteUser(string id)
    {
        if (id == UserId)
            return BadRequest(new { error = "Cannot delete your own account" });

        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
            return NotFound();

        await _userManager.DeleteAsync(user);
        return Ok();
    }
}

public record CreateUserRequest(string Username, string Email, string Password);
public record UserDto(string Id, string Email, string Username, bool IsActive, string Role);
