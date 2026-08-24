using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FinPulse.Core.Data;

namespace FinPulse.Api.Controllers;

[ApiController]
[Route("api/funding-sources")]
[Authorize]
public class FundingSourcesController : ControllerBase
{
    private readonly FinPulseDbContext _db;

    public FundingSourcesController(FinPulseDbContext db)
    {
        _db = db;
    }

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet]
    public async Task<ActionResult> GetAll()
    {
        var bankAccounts = await _db.BankAccounts
            .Where(a => a.UserId == UserId)
            .Select(a => new { type = "BankAccount", a.Id, name = a.AccountName, a.CurrentBalance, accountType = a.AccountType.ToString() })
            .ToListAsync();

        var creditCards = await _db.CreditCards
            .Where(c => c.UserId == UserId)
            .Select(c => new { type = "CreditCard", c.Id, name = c.CardName, c.CurrentBalance })
            .ToListAsync();

        return Ok(new { bankAccounts, creditCards });
    }
}
