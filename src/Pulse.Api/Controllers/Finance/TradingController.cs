using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pulse.Core.Data;
using Pulse.Core.Models;
using Pulse.Core.Models.Enums;
using Pulse.Core.Models.Trading;
using Pulse.Api;

namespace Pulse.Api.Controllers.Finance;

[ApiController]
[Route("api/trading")]
[Authorize]
public class TradingController : ControllerBase
{
    private readonly PulseDbContext _db;

    public TradingController(PulseDbContext db)
    {
        _db = db;
    }

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    // ─── Setups ───────────────────────────────────────────

    [HttpGet("setups")]
    public async Task<ActionResult> GetSetups()
    {
        var setups = await _db.TradingSetups
            .Where(s => s.UserId == UserId)
            .OrderByDescending(s => s.IsActive)
            .ThenByDescending(s => s.UpdatedAt)
            .Select(s => new
            {
                s.Id,
                s.Name,
                s.Description,
                s.IsActive,
                ItemCount = s.ChecklistItems.Count,
                TradeCount = _db.TradeEntries.Count(t => t.SetupId == s.Id && t.UserId == UserId),
                WinRate = _db.TradeEntries.Where(t => t.SetupId == s.Id && t.UserId == UserId && t.Pnl != null).Count() == 0
                    ? (decimal?)null
                    : (decimal)_db.TradeEntries.Count(t => t.SetupId == s.Id && t.UserId == UserId && t.Pnl > 0) * 100
                      / _db.TradeEntries.Where(t => t.SetupId == s.Id && t.UserId == UserId && t.Pnl != null).Count()
            })
            .ToListAsync();
        return Ok(setups);
    }

    [HttpGet("setups/{id}")]
    public async Task<ActionResult> GetSetup(int id)
    {
        var setup = await _db.TradingSetups
            .Include(s => s.ChecklistItems.OrderBy(i => i.OrderIndex))
            .FirstOrDefaultAsync(s => s.Id == id && s.UserId == UserId);
        if (setup == null) return NotFound();
        return Ok(setup);
    }

    [HttpPost("setups")]
    public async Task<ActionResult> CreateSetup([FromBody] TradingSetup setup)
    {
        setup.UserId = UserId;
        _db.TradingSetups.Add(setup);
        await _db.SaveChangesAsync();
        return Ok(setup);
    }

    [HttpPut("setups/{id}")]
    public async Task<ActionResult> UpdateSetup(int id, [FromBody] TradingSetup input)
    {
        var setup = await _db.TradingSetups
            .Include(s => s.ChecklistItems)
            .FirstOrDefaultAsync(s => s.Id == id && s.UserId == UserId);
        if (setup == null) return NotFound();

        setup.Name = input.Name;
        setup.Description = input.Description;
        setup.IsActive = input.IsActive;

        _db.ChecklistItems.RemoveRange(setup.ChecklistItems);
        setup.ChecklistItems = input.ChecklistItems.Select((item, idx) => new ChecklistItem
        {
            Label = item.Label,
            OrderIndex = idx,
            SetupId = id
        }).ToList();

        await _db.SaveChangesAsync();
        return Ok(setup);
    }

    [HttpDelete("setups/{id}")]
    public async Task<ActionResult> DeleteSetup(int id)
    {
        var setup = await _db.TradingSetups.FirstOrDefaultAsync(s => s.Id == id && s.UserId == UserId);
        if (setup == null) return NotFound();
        _db.TradingSetups.Remove(setup);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ─── Pre-Market Notes ─────────────────────────────────

    [HttpGet("premarket")]
    public async Task<ActionResult> GetPreMarketNotes([FromQuery] string? fromDate, [FromQuery] string? toDate)
    {
        var query = _db.PreMarketNotes.Where(n => n.UserId == UserId);
        if (DateTime.TryParse(fromDate, out var from)) query = query.Where(n => n.Date >= from);
        if (DateTime.TryParse(toDate, out var to)) query = query.Where(n => n.Date <= to);
        var notes = await query.OrderByDescending(n => n.Date).ToListAsync();
        return Ok(notes);
    }

    [HttpGet("premarket/date/{date}")]
    public async Task<ActionResult> GetPreMarketByDate(string date)
    {
        if (!DateTime.TryParse(date, out var d)) return BadRequest();
        var note = await _db.PreMarketNotes.FirstOrDefaultAsync(n => n.UserId == UserId && n.Date.Date == d.Date);
        if (note == null) return NotFound();
        return Ok(note);
    }

    [HttpGet("premarket/today")]
    public async Task<ActionResult> GetTodayNote()
    {
        var today = DateTime.UtcNow.Date;
        var note = await _db.PreMarketNotes.FirstOrDefaultAsync(n => n.UserId == UserId && n.Date.Date == today);
        if (note == null) return NotFound();
        return Ok(note);
    }

    [HttpPost("premarket")]
    public async Task<ActionResult> CreatePreMarketNote([FromBody] PreMarketNote note)
    {
        note.UserId = UserId;
        _db.PreMarketNotes.Add(note);
        await _db.SaveChangesAsync();
        return Ok(note);
    }

    [HttpPut("premarket/{id}")]
    public async Task<ActionResult> UpdatePreMarketNote(int id, [FromBody] PreMarketNote input)
    {
        var note = await _db.PreMarketNotes.FirstOrDefaultAsync(n => n.Id == id && n.UserId == UserId);
        if (note == null) return NotFound();

        note.Date = input.Date;
        note.MarketBias = input.MarketBias;
        note.KeyLevels = input.KeyLevels;
        note.Catalysts = input.Catalysts;
        note.Plan = input.Plan;
        note.MentalState = input.MentalState;
        note.MentalStateNotes = input.MentalStateNotes;
        note.MaxTrades = input.MaxTrades;
        note.MaxLoss = input.MaxLoss;

        await _db.SaveChangesAsync();
        return Ok(note);
    }

    // ─── Trade Entries ────────────────────────────────────

    [HttpGet("trades")]
    public async Task<ActionResult> GetTrades([FromQuery] string? fromDate, [FromQuery] string? toDate)
    {
        IQueryable<TradeEntry> query = _db.TradeEntries
            .Where(t => t.UserId == UserId)
            .Include(t => t.ChecklistResponses);

        var tz = await TimeZoneHelper.GetUserTimeZone(_db, UserId);
        if (DateTime.TryParse(fromDate, out var from))
        {
            var fromUtc = TimeZoneHelper.ToUtc(from, tz);
            query = query.Where(t => t.Date >= fromUtc);
        }
        if (DateTime.TryParse(toDate, out var to))
        {
            var toUtc = TimeZoneHelper.ToUtc(to.Date.AddDays(1), tz);
            query = query.Where(t => t.Date < toUtc);
        }

        var trades = await query.OrderByDescending(t => t.Date).ThenByDescending(t => t.CreatedAt)
            .Select(t => new
            {
                t.Id, t.Date, t.SetupId,
                SetupName = t.Setup != null ? t.Setup.Name : null,
                t.Instrument, t.Direction, t.EntryPrice, t.ExitPrice, t.Quantity,
                t.Pnl, t.ChecklistCompleted, t.ChecklistResponses,
                t.EntryTime, t.ExitTime, t.Notes,
                Tags = t.Tags != null ? JsonSerializer.Deserialize<string[]>(t.Tags) : null,
                t.IsRevengeTrading, t.EmotionAtEntry, t.CreatedAt,
                t.AssetType, t.OptionType, t.SpreadType,
                t.StrikePrice, t.StrikePrice2, t.StrikePrice3, t.StrikePrice4,
                t.ExpirationDate, t.EntryPremium, t.ExitPremium, t.ExpiredWorthless, t.Multiplier, t.BankAccountId,
                t.CommissionFees, t.RegExchangeFees, t.TotalFees, t.NetPnl
            })
            .ToListAsync();
        return Ok(trades);
    }

    [HttpGet("trades/by-account/{accountId}")]
    public async Task<ActionResult> GetTradesByAccount(int accountId)
    {
        var trades = await _db.TradeEntries
            .Where(t => t.UserId == UserId && t.BankAccountId == accountId)
            .Include(t => t.Setup)
            .OrderByDescending(t => t.Date)
            .Select(t => new
            {
                t.Id, t.Date, t.SetupId,
                SetupName = t.Setup != null ? t.Setup.Name : null,
                t.Instrument, t.Direction, t.EntryPrice, t.ExitPrice, t.Quantity,
                t.Pnl, t.ChecklistCompleted, t.EntryTime, t.ExitTime,
                t.AssetType, t.OptionType, t.SpreadType,
                t.StrikePrice, t.StrikePrice2, t.StrikePrice3, t.StrikePrice4,
                t.ExpirationDate, t.EntryPremium, t.ExitPremium, t.ExpiredWorthless, t.Multiplier, t.BankAccountId,
                t.CommissionFees, t.RegExchangeFees, t.TotalFees, t.NetPnl, t.CreatedAt
            })
            .Take(20)
            .ToListAsync();
        return Ok(trades);
    }

    [HttpPost("trades")]
    public async Task<ActionResult> CreateTrade([FromBody] TradeEntryCreateDto input)
    {
        try
        {
            var tz = await TimeZoneHelper.GetUserTimeZone(_db, UserId);
            var tradeDate = TimeZoneHelper.ToUtc(input.Date, tz);

            var (commission, regExchange) = input.CommissionFees.HasValue || input.RegExchangeFees.HasValue
                ? (input.CommissionFees ?? 0, input.RegExchangeFees ?? 0)
                : await CalculateFeesBreakdown(input.BankAccountId, input.AssetType, input.Quantity, input.SpreadType, tradeDate, input.ExpiredWorthless);
            var fees = commission + regExchange;

            var trade = new TradeEntry
            {
                UserId = UserId,
                Date = tradeDate,
                SetupId = input.SetupId,
                Instrument = input.Instrument,
                Direction = input.Direction,
                EntryPrice = input.EntryPrice,
                ExitPrice = input.ExitPrice,
                Quantity = input.Quantity,
                Pnl = input.Pnl,
                CommissionFees = commission,
                RegExchangeFees = regExchange,
                TotalFees = fees,
                NetPnl = input.Pnl.HasValue ? input.Pnl.Value - fees : null,
                ChecklistCompleted = input.ChecklistCompleted,
                EntryTime = input.EntryTime,
                ExitTime = input.ExitTime,
                Notes = input.Notes,
                Tags = input.Tags != null ? JsonSerializer.Serialize(input.Tags) : null,
                IsRevengeTrading = input.IsRevengeTrading,
                EmotionAtEntry = input.EmotionAtEntry,
                AssetType = input.AssetType,
                OptionType = input.OptionType,
                SpreadType = input.SpreadType,
                StrikePrice = input.StrikePrice,
                StrikePrice2 = input.StrikePrice2,
                StrikePrice3 = input.StrikePrice3,
                StrikePrice4 = input.StrikePrice4,
                ExpirationDate = input.ExpirationDate,
                EntryPremium = input.EntryPremium,
                ExitPremium = input.ExitPremium,
                ExpiredWorthless = input.ExpiredWorthless,
                Multiplier = input.Multiplier,
                BankAccountId = input.BankAccountId,
                ChecklistResponses = (input.ChecklistResponses ?? new()).Select(r => new ChecklistResponse
                {
                    ChecklistItemId = r.ChecklistItemId,
                    Label = r.Label,
                    Checked = r.Checked
                }).ToList()
            };
            _db.TradeEntries.Add(trade);
            await _db.SaveChangesAsync();

            await SyncLinkedExpense(trade);

            trade.Setup = null;
            trade.LinkedExpense = null;
            return Ok(trade);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message, inner = ex.InnerException?.Message });
        }
    }

    [HttpPut("trades/{id}")]
    public async Task<ActionResult> UpdateTrade(int id, [FromBody] TradeEntryCreateDto input)
    {
        var trade = await _db.TradeEntries
            .Include(t => t.ChecklistResponses)
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == UserId);
        if (trade == null) return NotFound();

        try
        {
            var tz = await TimeZoneHelper.GetUserTimeZone(_db, UserId);
            var tradeDate = TimeZoneHelper.ToUtc(input.Date, tz);

            var (commission, regExchange) = input.CommissionFees.HasValue || input.RegExchangeFees.HasValue
                ? (input.CommissionFees ?? 0, input.RegExchangeFees ?? 0)
                : await CalculateFeesBreakdown(input.BankAccountId, input.AssetType, input.Quantity, input.SpreadType, tradeDate, input.ExpiredWorthless);
            var fees = commission + regExchange;

            trade.Date = tradeDate;
            trade.SetupId = input.SetupId;
            trade.Instrument = input.Instrument;
            trade.Direction = input.Direction;
            trade.EntryPrice = input.EntryPrice;
            trade.ExitPrice = input.ExitPrice;
            trade.Quantity = input.Quantity;
            trade.Pnl = input.Pnl;
            trade.CommissionFees = commission;
            trade.RegExchangeFees = regExchange;
            trade.TotalFees = fees;
            trade.NetPnl = input.Pnl.HasValue ? input.Pnl.Value - fees : null;
            trade.ChecklistCompleted = input.ChecklistCompleted;
            trade.EntryTime = input.EntryTime;
            trade.ExitTime = input.ExitTime;
            trade.Notes = input.Notes;
            trade.Tags = input.Tags != null ? JsonSerializer.Serialize(input.Tags) : null;
            trade.IsRevengeTrading = input.IsRevengeTrading;
            trade.EmotionAtEntry = input.EmotionAtEntry;
            trade.AssetType = input.AssetType;
            trade.OptionType = input.OptionType;
            trade.SpreadType = input.SpreadType;
            trade.StrikePrice = input.StrikePrice;
            trade.StrikePrice2 = input.StrikePrice2;
            trade.StrikePrice3 = input.StrikePrice3;
            trade.StrikePrice4 = input.StrikePrice4;
            trade.ExpirationDate = input.ExpirationDate;
            trade.EntryPremium = input.EntryPremium;
            trade.ExitPremium = input.ExitPremium;
            trade.ExpiredWorthless = input.ExpiredWorthless;
            trade.Multiplier = input.Multiplier;
            trade.BankAccountId = input.BankAccountId;

            _db.ChecklistResponses.RemoveRange(trade.ChecklistResponses);
            trade.ChecklistResponses = (input.ChecklistResponses ?? new()).Select(r => new ChecklistResponse
            {
                ChecklistItemId = r.ChecklistItemId,
                Label = r.Label,
                Checked = r.Checked
            }).ToList();

            await _db.SaveChangesAsync();

            await SyncLinkedExpense(trade);

            trade.Setup = null;
            trade.LinkedExpense = null;
            return Ok(trade);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message, inner = ex.InnerException?.Message });
        }
    }

    [HttpDelete("trades/{id}")]
    public async Task<ActionResult> DeleteTrade(int id)
    {
        var trade = await _db.TradeEntries
            .Include(t => t.ChecklistResponses)
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == UserId);
        if (trade == null) return NotFound();

        try
        {
            if (trade.LinkedExpenseId != null)
            {
                var expense = await _db.DailyExpenses.FirstOrDefaultAsync(e => e.Id == trade.LinkedExpenseId);
                if (expense != null)
                {
                    var account = await _db.BankAccounts.FirstOrDefaultAsync(a => a.Id == trade.BankAccountId && a.UserId == UserId);
                    if (account != null)
                        ReverseBalance(account, expense.TransactionType, expense.Amount);
                    _db.DailyExpenses.Remove(expense);
                }
            }

            _db.ChecklistResponses.RemoveRange(trade.ChecklistResponses);
            _db.TradeEntries.Remove(trade);
            await _db.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message, inner = ex.InnerException?.Message });
        }
    }

    // ─── Rules ────────────────────────────────────────────

    [HttpGet("rules")]
    public async Task<ActionResult> GetRules()
    {
        var rules = await _db.TradingRules
            .Where(r => r.UserId == UserId)
            .OrderBy(r => r.OrderIndex)
            .ToListAsync();
        return Ok(rules);
    }

    [HttpPost("rules")]
    public async Task<ActionResult> CreateRule([FromBody] TradingRule rule)
    {
        rule.UserId = UserId;
        var maxOrder = await _db.TradingRules.Where(r => r.UserId == UserId).MaxAsync(r => (int?)r.OrderIndex) ?? 0;
        rule.OrderIndex = maxOrder + 1;
        _db.TradingRules.Add(rule);
        await _db.SaveChangesAsync();
        return Ok(rule);
    }

    [HttpPut("rules/{id}")]
    public async Task<ActionResult> UpdateRule(int id, [FromBody] TradingRule input)
    {
        var rule = await _db.TradingRules.FirstOrDefaultAsync(r => r.Id == id && r.UserId == UserId);
        if (rule == null) return NotFound();
        rule.Text = input.Text;
        rule.Category = input.Category;
        rule.IsActive = input.IsActive;
        await _db.SaveChangesAsync();
        return Ok(rule);
    }

    [HttpDelete("rules/{id}")]
    public async Task<ActionResult> DeleteRule(int id)
    {
        var rule = await _db.TradingRules.FirstOrDefaultAsync(r => r.Id == id && r.UserId == UserId);
        if (rule == null) return NotFound();
        _db.TradingRules.Remove(rule);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("rules/reorder")]
    public async Task<ActionResult> ReorderRules([FromBody] ReorderDto input)
    {
        var rules = await _db.TradingRules.Where(r => r.UserId == UserId).ToListAsync();
        for (int i = 0; i < input.Ids.Count; i++)
        {
            var rule = rules.FirstOrDefault(r => r.Id == input.Ids[i]);
            if (rule != null) rule.OrderIndex = i;
        }
        await _db.SaveChangesAsync();
        return Ok();
    }

    // ─── Daily Review ─────────────────────────────────────

    [HttpGet("reviews")]
    public async Task<ActionResult> GetReviews([FromQuery] string? fromDate, [FromQuery] string? toDate)
    {
        var query = _db.DailyReviews.Where(r => r.UserId == UserId);
        if (DateTime.TryParse(fromDate, out var from)) query = query.Where(r => r.Date >= from);
        if (DateTime.TryParse(toDate, out var to)) query = query.Where(r => r.Date <= to);
        var reviews = await query.OrderByDescending(r => r.Date).ToListAsync();
        return Ok(reviews);
    }

    [HttpGet("reviews/today")]
    public async Task<ActionResult> GetTodayReview()
    {
        var today = DateTime.UtcNow.Date;
        var review = await _db.DailyReviews.FirstOrDefaultAsync(r => r.UserId == UserId && r.Date.Date == today);
        if (review == null) return NotFound();
        return Ok(review);
    }

    [HttpPost("reviews")]
    public async Task<ActionResult> CreateReview([FromBody] DailyReview review)
    {
        review.UserId = UserId;
        _db.DailyReviews.Add(review);
        await _db.SaveChangesAsync();
        return Ok(review);
    }

    [HttpPut("reviews/{id}")]
    public async Task<ActionResult> UpdateReview(int id, [FromBody] DailyReview input)
    {
        var review = await _db.DailyReviews.FirstOrDefaultAsync(r => r.Id == id && r.UserId == UserId);
        if (review == null) return NotFound();
        review.Date = input.Date;
        review.Grade = input.Grade;
        review.FollowedPlan = input.FollowedPlan;
        review.FollowedRules = input.FollowedRules;
        review.TotalTrades = input.TotalTrades;
        review.TotalPnl = input.TotalPnl;
        review.RulesViolated = input.RulesViolated;
        review.LessonsLearned = input.LessonsLearned;
        review.ImprovementNote = input.ImprovementNote;
        review.EmotionalSummary = input.EmotionalSummary;
        review.IsObservationOnly = input.IsObservationOnly;
        review.MarketCondition = input.MarketCondition;
        review.MarketObservation = input.MarketObservation;
        await _db.SaveChangesAsync();
        return Ok(review);
    }

    // ─── Limits ───────────────────────────────────────────

    [HttpGet("limits")]
    public async Task<ActionResult> GetLimits()
    {
        var limits = await _db.DailyLimits.FirstOrDefaultAsync(l => l.UserId == UserId);
        if (limits == null)
        {
            limits = new DailyLimits { UserId = UserId };
            _db.DailyLimits.Add(limits);
            await _db.SaveChangesAsync();
        }
        return Ok(limits);
    }

    [HttpPut("limits")]
    public async Task<ActionResult> UpdateLimits([FromBody] DailyLimits input)
    {
        var limits = await _db.DailyLimits.FirstOrDefaultAsync(l => l.UserId == UserId);
        if (limits == null)
        {
            limits = new DailyLimits { UserId = UserId };
            _db.DailyLimits.Add(limits);
        }
        limits.MaxTradesPerDay = input.MaxTradesPerDay;
        limits.MaxDailyLoss = input.MaxDailyLoss;
        limits.StopAfterConsecutiveLosses = input.StopAfterConsecutiveLosses;
        await _db.SaveChangesAsync();
        return Ok(limits);
    }

    // ─── Stats ────────────────────────────────────────────

    [HttpGet("stats")]
    public async Task<ActionResult> GetStats([FromQuery] int? days)
    {
        var cutoff = days.HasValue ? DateTime.UtcNow.AddDays(-days.Value) : DateTime.MinValue;
        var trades = await _db.TradeEntries
            .Where(t => t.UserId == UserId && t.Date >= cutoff)
            .ToListAsync();

        var closedTrades = trades.Where(t => t.Pnl.HasValue).ToList();
        var today = DateTime.UtcNow.Date;

        var stats = new
        {
            TotalTrades = trades.Count,
            WinRate = closedTrades.Count == 0 ? 0m : Math.Round((decimal)closedTrades.Count(t => t.Pnl > 0) / closedTrades.Count * 100, 1),
            AveragePnl = closedTrades.Count == 0 ? 0m : Math.Round(closedTrades.Average(t => t.Pnl!.Value), 2),
            TotalPnl = closedTrades.Sum(t => t.Pnl ?? 0),
            CurrentRuleStreak = await GetRuleStreak(),
            LongestRuleStreak = 0,
            AverageGrade = await GetAverageGrade(cutoff),
            TradesToday = trades.Count(t => t.Date.Date == today),
            PnlToday = trades.Where(t => t.Date.Date == today).Sum(t => t.Pnl ?? 0),
            ChecklistComplianceRate = trades.Count == 0 ? 0m : Math.Round((decimal)trades.Count(t => t.ChecklistCompleted) / trades.Count * 100, 1),
            SetupBreakdown = trades
                .GroupBy(t => t.SetupId)
                .Select(g =>
                {
                    var closed = g.Where(t => t.Pnl.HasValue).ToList();
                    return new
                    {
                        SetupId = g.Key,
                        SetupName = _db.TradingSetups.FirstOrDefault(s => s.Id == g.Key)?.Name ?? "Unknown",
                        Trades = g.Count(),
                        WinRate = closed.Count == 0 ? 0m : Math.Round((decimal)closed.Count(t => t.Pnl > 0) / closed.Count * 100, 1),
                        TotalPnl = closed.Sum(t => t.Pnl ?? 0),
                        AveragePnl = closed.Count == 0 ? 0m : Math.Round(closed.Average(t => t.Pnl!.Value), 2)
                    };
                }).ToList()
        };
        return Ok(stats);
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult> GetDashboard([FromQuery] string? from, [FromQuery] string? to)
    {
        var tz = await TimeZoneHelper.GetUserTimeZone(_db, UserId);
        DateTime cutoff, endDate;
        if (!string.IsNullOrEmpty(from) && DateTime.TryParse(from, out var fromDt))
            cutoff = TimeZoneHelper.ToUtc(fromDt, tz);
        else
            cutoff = TimeZoneHelper.ToUtc(new DateTime(DateTime.UtcNow.Year, 1, 1), tz);
        if (!string.IsNullOrEmpty(to) && DateTime.TryParse(to, out var toDt))
            endDate = TimeZoneHelper.ToUtc(toDt.Date.AddDays(1), tz);
        else
            endDate = DateTime.UtcNow;
        var trades = await _db.TradeEntries
            .Include(t => t.Setup)
            .Where(t => t.UserId == UserId && t.Date >= cutoff && t.Date < endDate)
            .ToListAsync();

        var closed = trades.Where(t => t.Pnl.HasValue).ToList();
        var today = DateTime.UtcNow.Date;
        var wins = closed.Where(t => t.Pnl > 0).ToList();
        var losses = closed.Where(t => t.Pnl <= 0).ToList();
        var avgWin = wins.Count > 0 ? wins.Average(t => t.NetPnl ?? t.Pnl!.Value) : 0m;
        var avgLoss = losses.Count > 0 ? Math.Abs(losses.Average(t => t.NetPnl ?? t.Pnl!.Value)) : 0m;

        // Consecutive wins/losses
        int maxConsWins = 0, maxConsLosses = 0, curWins = 0, curLosses = 0;
        foreach (var t in closed.OrderBy(t => t.Date))
        {
            if (t.Pnl > 0) { curWins++; curLosses = 0; maxConsWins = Math.Max(maxConsWins, curWins); }
            else { curLosses++; curWins = 0; maxConsLosses = Math.Max(maxConsLosses, curLosses); }
        }

        // Daily P&L for best/worst day
        var dailyPnl = closed.GroupBy(t => t.Date.Date)
            .Select(g => new { Date = g.Key, Pnl = g.Sum(t => t.NetPnl ?? t.Pnl ?? 0) }).ToList();

        // Monthly P&L
        var monthlyPnl = closed.GroupBy(t => new { t.Date.Year, t.Date.Month })
            .Select(g => new
            {
                g.Key.Year, g.Key.Month,
                Pnl = g.Sum(t => t.Pnl ?? 0),
                NetPnl = g.Sum(t => t.NetPnl ?? t.Pnl ?? 0),
                Fees = g.Sum(t => t.TotalFees ?? 0),
                Trades = g.Count(),
                Wins = g.Count(t => t.Pnl > 0)
            })
            .OrderBy(m => m.Year).ThenBy(m => m.Month).ToList();

        // Day of week (convert UTC trade date to user's local day)
        var dayOfWeek = closed.GroupBy(t => TimeZoneInfo.ConvertTimeFromUtc(t.Date, tz).DayOfWeek)
            .Where(g => g.Key != DayOfWeek.Saturday && g.Key != DayOfWeek.Sunday)
            .Select(g => new
            {
                Day = g.Key.ToString(),
                Pnl = g.Sum(t => t.NetPnl ?? t.Pnl ?? 0),
                Trades = g.Count(),
                Wins = g.Count(t => t.Pnl > 0),
                WinRate = g.Count() == 0 ? 0m : Math.Round((decimal)g.Count(t => t.Pnl > 0) / g.Count() * 100, 1),
                AvgPnl = Math.Round(g.Average(t => t.NetPnl ?? t.Pnl ?? 0), 2)
            })
            .ToList();

        // By instrument
        var byInstrument = closed.GroupBy(t => t.Instrument)
            .Select(g => new
            {
                Instrument = g.Key,
                Pnl = g.Sum(t => t.NetPnl ?? t.Pnl ?? 0),
                Trades = g.Count(),
                Wins = g.Count(t => t.Pnl > 0),
                WinRate = g.Count() == 0 ? 0m : Math.Round((decimal)g.Count(t => t.Pnl > 0) / g.Count() * 100, 1),
                AvgPnl = Math.Round(g.Average(t => t.NetPnl ?? t.Pnl ?? 0), 2)
            }).ToList();

        // By setup
        var bySetup = closed.GroupBy(t => t.SetupId)
            .Select(g => new
            {
                SetupId = g.Key,
                SetupName = g.First().Setup?.Name ?? "Unknown",
                Pnl = g.Sum(t => t.NetPnl ?? t.Pnl ?? 0),
                Trades = g.Count(),
                Wins = g.Count(t => t.Pnl > 0),
                WinRate = g.Count() == 0 ? 0m : Math.Round((decimal)g.Count(t => t.Pnl > 0) / g.Count() * 100, 1),
                AvgPnl = Math.Round(g.Average(t => t.NetPnl ?? t.Pnl ?? 0), 2)
            }).ToList();

        // By option type (Call vs Put)
        var byOptionType = closed.Where(t => t.OptionType != null)
            .GroupBy(t => t.OptionType!)
            .Select(g => new
            {
                OptionType = g.Key,
                Pnl = g.Sum(t => t.NetPnl ?? t.Pnl ?? 0),
                Trades = g.Count(),
                Wins = g.Count(t => t.Pnl > 0),
                WinRate = g.Count() == 0 ? 0m : Math.Round((decimal)g.Count(t => t.Pnl > 0) / g.Count() * 100, 1),
                AvgPnl = Math.Round(g.Average(t => t.NetPnl ?? t.Pnl ?? 0), 2)
            }).ToList();

        // Time of day buckets (user's local time)
        var timeOfDay = closed.GroupBy(t =>
            {
                var localHour = TimeZoneInfo.ConvertTimeFromUtc(t.Date, tz).Hour;
                return localHour switch
                {
                    < 9 => "Pre-Market",
                    < 11 => "Morning (9-11)",
                    < 13 => "Midday (11-1)",
                    < 15 => "Afternoon (1-3)",
                    _ => "Power Hour (3+)"
                };
            })
            .Select(g => new
            {
                Bucket = g.Key,
                Pnl = g.Sum(t => t.NetPnl ?? t.Pnl ?? 0),
                Trades = g.Count(),
                Wins = g.Count(t => t.Pnl > 0),
                WinRate = g.Count() == 0 ? 0m : Math.Round((decimal)g.Count(t => t.Pnl > 0) / g.Count() * 100, 1),
                AvgPnl = Math.Round(g.Average(t => t.NetPnl ?? t.Pnl ?? 0), 2)
            }).ToList();

        return Ok(new
        {
            TotalPnl = closed.Sum(t => t.Pnl ?? 0),
            TotalFees = closed.Sum(t => t.TotalFees ?? 0),
            NetPnl = closed.Sum(t => t.NetPnl ?? t.Pnl ?? 0),
            TotalTrades = closed.Count,
            WinRate = closed.Count == 0 ? 0m : Math.Round((decimal)wins.Count / closed.Count * 100, 1),
            AvgWin = Math.Round(avgWin, 2),
            AvgLoss = Math.Round(avgLoss, 2),
            ProfitFactor = avgLoss == 0 ? 0m : Math.Round(wins.Sum(t => t.NetPnl ?? t.Pnl ?? 0) / Math.Abs(losses.Sum(t => t.NetPnl ?? t.Pnl ?? 0) == 0 ? 1 : losses.Sum(t => t.NetPnl ?? t.Pnl ?? 0)), 2),
            LargestWin = closed.Count == 0 ? 0m : closed.Max(t => t.NetPnl ?? t.Pnl ?? 0),
            LargestLoss = closed.Count == 0 ? 0m : closed.Min(t => t.NetPnl ?? t.Pnl ?? 0),
            BestDay = dailyPnl.Count == 0 ? 0m : dailyPnl.Max(d => d.Pnl),
            WorstDay = dailyPnl.Count == 0 ? 0m : dailyPnl.Min(d => d.Pnl),
            MaxConsecutiveWins = maxConsWins,
            MaxConsecutiveLosses = maxConsLosses,
            TradesToday = trades.Count(t => t.Date.Date == today),
            PnlToday = trades.Where(t => t.Date.Date == today).Sum(t => t.NetPnl ?? t.Pnl ?? 0),
            ChecklistCompliance = trades.Count == 0 ? 0m : Math.Round((decimal)trades.Count(t => t.ChecklistCompleted) / trades.Count * 100, 1),
            MonthlyPnl = monthlyPnl,
            DayOfWeek = dayOfWeek,
            ByInstrument = byInstrument,
            BySetup = bySetup,
            ByOptionType = byOptionType,
            TimeOfDay = timeOfDay
        });
    }

    [HttpGet("weekly-focus")]
    public async Task<ActionResult> GetWeeklyFocus()
    {
        var weekStart = DateTime.UtcNow.Date.AddDays(-(int)DateTime.UtcNow.DayOfWeek + 1);
        var rule = await _db.TradingRules
            .Where(r => r.UserId == UserId && r.IsActive)
            .OrderBy(r => r.OrderIndex)
            .FirstOrDefaultAsync();

        if (rule == null) return Ok(new { weekStart, ruleId = 0, ruleText = "Create your first trading rule", complianceDays = 0 });

        var reviewsThisWeek = await _db.DailyReviews
            .Where(r => r.UserId == UserId && r.Date >= weekStart)
            .CountAsync(r => r.FollowedRules);

        return Ok(new { weekStart, ruleId = rule.Id, ruleText = rule.Text, complianceDays = reviewsThisWeek });
    }

    // ─── Weekly Summary ───────────────────────────────────

    [HttpGet("weekly-summary")]
    public async Task<ActionResult> GetWeeklySummary([FromQuery] string? weekStart)
    {
        var start = DateTime.TryParse(weekStart, out var ws) ? ws.Date : DateTime.UtcNow.Date.AddDays(-(int)DateTime.UtcNow.DayOfWeek + 1);
        var end = start.AddDays(7);

        var trades = await _db.TradeEntries
            .Where(t => t.UserId == UserId && t.Date >= start && t.Date < end)
            .ToListAsync();
        var closed = trades.Where(t => t.Pnl.HasValue).ToList();

        var summary = new
        {
            WeekStart = start,
            WeekEnd = end.AddDays(-1),
            TotalTrades = trades.Count,
            WinningTrades = closed.Count(t => t.Pnl > 0),
            LosingTrades = closed.Count(t => t.Pnl <= 0),
            WinRate = closed.Count == 0 ? 0m : Math.Round((decimal)closed.Count(t => t.Pnl > 0) / closed.Count * 100, 1),
            TotalPnl = closed.Sum(t => t.Pnl ?? 0),
            AveragePnl = closed.Count == 0 ? 0m : Math.Round(closed.Average(t => t.Pnl!.Value), 2),
            LargestWin = closed.Count == 0 ? 0m : closed.Max(t => t.Pnl ?? 0),
            LargestLoss = closed.Count == 0 ? 0m : closed.Min(t => t.Pnl ?? 0),
            ChecklistCompliance = trades.Count == 0 ? 0m : Math.Round((decimal)trades.Count(t => t.ChecklistCompleted) / trades.Count * 100, 1),
            AverageGrade = await GetAverageGrade(start, end),
            TradingDays = trades.Select(t => t.Date.Date).Distinct().Count(),
            RuleStreak = await GetRuleStreak(),
            SetupPerformance = trades.GroupBy(t => t.SetupId).Select(g =>
            {
                var gc = g.Where(t => t.Pnl.HasValue).ToList();
                var wins = gc.Count(t => t.Pnl > 0);
                var wr = gc.Count == 0 ? 0m : Math.Round((decimal)wins / gc.Count * 100, 1);
                return new { SetupId = g.Key, SetupName = _db.TradingSetups.FirstOrDefault(s => s.Id == g.Key)?.Name ?? "Unknown", Trades = g.Count(), Wins = wins, Losses = gc.Count - wins, WinRate = wr, TotalPnl = gc.Sum(t => t.Pnl ?? 0), Grade = wr >= 60 ? "strong" : wr >= 40 ? "neutral" : "weak" };
            }).ToList(),
            TimeAnalysis = new List<object>(),
            DayOfWeekAnalysis = new List<object>(),
            Improvements = new List<string>(),
            Strengths = new List<string>(),
            DangerZones = new List<string>(),
            MentorFeedback = ""
        };
        return Ok(summary);
    }

    [HttpGet("weekly-summaries")]
    public async Task<ActionResult> GetWeeklySummaries([FromQuery] int? count)
    {
        var weeks = count ?? 4;
        var summaries = new List<object>();
        var currentWeekStart = DateTime.UtcNow.Date.AddDays(-(int)DateTime.UtcNow.DayOfWeek + 1);

        for (int i = 0; i < weeks; i++)
        {
            var start = currentWeekStart.AddDays(-7 * i);
            var end = start.AddDays(7);
            var trades = await _db.TradeEntries
                .Where(t => t.UserId == UserId && t.Date >= start && t.Date < end)
                .ToListAsync();
            var closed = trades.Where(t => t.Pnl.HasValue).ToList();
            summaries.Add(new
            {
                WeekStart = start,
                WeekEnd = end.AddDays(-1),
                TotalTrades = trades.Count,
                WinningTrades = closed.Count(t => t.Pnl > 0),
                LosingTrades = closed.Count(t => t.Pnl <= 0),
                WinRate = closed.Count == 0 ? 0m : Math.Round((decimal)closed.Count(t => t.Pnl > 0) / closed.Count * 100, 1),
                TotalPnl = closed.Sum(t => t.Pnl ?? 0),
                AveragePnl = closed.Count == 0 ? 0m : Math.Round(closed.Average(t => t.Pnl!.Value), 2),
                TradingDays = trades.Select(t => t.Date.Date).Distinct().Count()
            });
        }
        return Ok(summaries);
    }

    // ─── Wisdom ───────────────────────────────────────────

    [AllowAnonymous]
    [HttpGet("wisdom/daily")]
    public async Task<ActionResult> GetDailyWisdom()
    {
        var count = await _db.TradingWisdoms.CountAsync();
        if (count == 0) return Ok(new { id = 0, text = "Discipline is the bridge between goals and accomplishment.", category = "discipline", author = "Jim Rohn" });
        var dayOfYear = DateTime.UtcNow.DayOfYear;
        var wisdom = await _db.TradingWisdoms.Skip(dayOfYear % count).Take(1).FirstOrDefaultAsync();
        return Ok(wisdom);
    }

    [AllowAnonymous]
    [HttpGet("wisdom")]
    public async Task<ActionResult> GetWisdom([FromQuery] string? category)
    {
        var query = _db.TradingWisdoms.AsQueryable();
        if (!string.IsNullOrEmpty(category)) query = query.Where(w => w.Category == category);
        return Ok(await query.ToListAsync());
    }

    // ─── Helpers ──────────────────────────────────────────

    private async Task<int> GetRuleStreak()
    {
        var reviews = await _db.DailyReviews
            .Where(r => r.UserId == UserId)
            .OrderByDescending(r => r.Date)
            .Take(30)
            .ToListAsync();

        int streak = 0;
        foreach (var r in reviews)
        {
            if (r.FollowedRules) streak++;
            else break;
        }
        return streak;
    }

    private async Task<decimal> GetAverageGrade(DateTime from, DateTime? to = null)
    {
        var query = _db.DailyReviews.Where(r => r.UserId == UserId && r.Date >= from);
        if (to.HasValue) query = query.Where(r => r.Date < to.Value);
        var grades = await query.Select(r => r.Grade).ToListAsync();
        if (grades.Count == 0) return 0;
        return (decimal)Math.Round(grades.Average(g => g switch { "A" => 4, "B" => 3, "C" => 2, "D" => 1, _ => 0 }), 1);
    }

    private async Task<(decimal commission, decimal regExchange)> CalculateFeesBreakdown(int? bankAccountId, string assetType, decimal quantity, string? spreadType = null, DateTime? tradeDate = null, bool expiredWorthless = false)
    {
        if (!bankAccountId.HasValue) return (0, 0);

        decimal commissionRate, regFeeRate;

        var effectiveDate = tradeDate?.Date ?? DateTime.UtcNow.Date;
        var schedule = await _db.CommissionSchedules
            .Where(s => s.BankAccountId == bankAccountId.Value
                     && s.UserId == UserId
                     && s.EffectiveFrom <= effectiveDate)
            .OrderByDescending(s => s.EffectiveFrom)
            .FirstOrDefaultAsync();

        if (schedule != null)
        {
            commissionRate = assetType == "Futures"
                ? (schedule.FuturesCommissionPerContract ?? 0)
                : (schedule.OptionsCommissionPerContract ?? 0);
            regFeeRate = assetType == "Futures"
                ? (schedule.FuturesRegFeePerContract ?? 0)
                : (schedule.OptionsRegFeePerContract ?? 0);
        }
        else
        {
            var account = await _db.BankAccounts.FirstOrDefaultAsync(a => a.Id == bankAccountId.Value && a.UserId == UserId);
            if (account == null) return (0, 0);
            commissionRate = assetType == "Futures"
                ? (account.FuturesCommissionPerContract ?? 0)
                : (account.OptionsCommissionPerContract ?? 0);
            regFeeRate = assetType == "Futures"
                ? (account.FuturesRegFeePerContract ?? 0)
                : (account.OptionsRegFeePerContract ?? 0);
        }

        var legs = assetType == "Options" ? GetLegsForSpread(spreadType) : 1;
        var multiplier = quantity * legs * (expiredWorthless ? 1 : 2);

        return (commissionRate * multiplier, regFeeRate * multiplier);
    }

    private async Task<decimal> CalculateFees(int? bankAccountId, string assetType, decimal quantity, string? spreadType = null, DateTime? tradeDate = null, bool expiredWorthless = false)
    {
        var (commission, regExchange) = await CalculateFeesBreakdown(bankAccountId, assetType, quantity, spreadType, tradeDate, expiredWorthless);
        return commission + regExchange;
    }

    private static int GetLegsForSpread(string? spreadType) => spreadType switch
    {
        "Vertical" or "Calendar" => 2,
        "Butterfly" => 3,
        "IronCondor" => 4,
        _ => 1
    };

    // ─── Linked Transaction Helpers ───────────────────────────────

    private async Task SyncLinkedExpense(TradeEntry trade)
    {
        if (trade.NetPnl == null || trade.BankAccountId == null)
        {
            await RemoveLinkedExpense(trade);
            return;
        }

        var account = await _db.BankAccounts.FirstOrDefaultAsync(a => a.Id == trade.BankAccountId && a.UserId == UserId);
        if (account == null) return;

        var isProfit = trade.NetPnl.Value >= 0;
        var amount = Math.Abs(trade.NetPnl.Value);
        var txnType = isProfit ? TransactionType.Income : TransactionType.Expense;
        var categoryId = await GetTradingCategoryId(isProfit);

        var pnlLabel = isProfit ? "Profit" : "Loss";
        var description = $"{pnlLabel} in {trade.Instrument} {trade.Direction}";
        if (!string.IsNullOrEmpty(trade.SpreadType))
            description += $" {trade.SpreadType}";

        if (trade.LinkedExpenseId != null)
        {
            var existing = await _db.DailyExpenses.FirstOrDefaultAsync(e => e.Id == trade.LinkedExpenseId);
            if (existing != null)
            {
                // Reverse old balance
                ReverseBalance(account, existing.TransactionType, existing.Amount);

                // Update expense
                existing.Date = trade.Date;
                existing.Amount = amount;
                existing.TransactionType = txnType;
                existing.CategoryId = categoryId;
                existing.Description = description;

                // Apply new balance
                ApplyBalance(account, txnType, amount);
                await _db.SaveChangesAsync();
                return;
            }
        }

        // Create new linked expense
        var expense = new DailyExpense
        {
            Date = trade.Date,
            Amount = amount,
            Description = description,
            TransactionType = txnType,
            FundingSourceType = FundingSourceType.BankAccount,
            FundingSourceId = trade.BankAccountId,
            CategoryId = categoryId,
            Tag = "auto-trade",
            UserId = UserId
        };
        _db.DailyExpenses.Add(expense);
        ApplyBalance(account, txnType, amount);
        await _db.SaveChangesAsync();

        trade.LinkedExpenseId = expense.Id;
        await _db.SaveChangesAsync();
    }

    private async Task RemoveLinkedExpense(TradeEntry trade)
    {
        if (trade.LinkedExpenseId == null) return;

        var expense = await _db.DailyExpenses.FirstOrDefaultAsync(e => e.Id == trade.LinkedExpenseId);
        if (expense == null) return;

        var account = await _db.BankAccounts.FirstOrDefaultAsync(a => a.Id == trade.BankAccountId && a.UserId == UserId);
        if (account != null)
        {
            ReverseBalance(account, expense.TransactionType, expense.Amount);
        }

        _db.DailyExpenses.Remove(expense);
        trade.LinkedExpenseId = null;
        await _db.SaveChangesAsync();
    }

    private void ApplyBalance(BankAccount account, TransactionType? txnType, decimal amount)
    {
        if (txnType == TransactionType.Income)
            account.CurrentBalance += amount;
        else if (txnType == TransactionType.Expense)
            account.CurrentBalance -= amount;
    }

    private void ReverseBalance(BankAccount account, TransactionType? txnType, decimal amount)
    {
        if (txnType == TransactionType.Income)
            account.CurrentBalance -= amount;
        else if (txnType == TransactionType.Expense)
            account.CurrentBalance += amount;
    }

    private async Task<int?> GetTradingCategoryId(bool isProfit)
    {
        string categoryName = isProfit ? "Trading Gains" : "Trading Losses";

        var category = await _db.CustomCategories.FirstOrDefaultAsync(c =>
            c.Name == categoryName && (c.UserId == UserId || c.UserId == null));

        if (category != null)
            return category.Id;

        // Create under "Day Trading" parent if no existing category found
        string parentName = isProfit ? "Passive Income" : "Day Trading";
        var categoryType = isProfit ? CategoryType.Income : CategoryType.Expense;

        var parent = await _db.CustomCategories.FirstOrDefaultAsync(c =>
            c.Name == parentName && c.ParentId == null && (c.UserId == UserId || c.UserId == null));

        if (parent == null)
        {
            parent = new CustomCategory
            {
                Name = parentName,
                Type = categoryType,
                UserId = UserId
            };
            _db.CustomCategories.Add(parent);
            await _db.SaveChangesAsync();
        }

        category = new CustomCategory
        {
            Name = categoryName,
            Type = categoryType,
            ParentId = parent.Id,
            UserId = UserId
        };
        _db.CustomCategories.Add(category);
        await _db.SaveChangesAsync();

        return category.Id;
    }
}

public class TradeEntryCreateDto
{
    public DateTime Date { get; set; }
    public int SetupId { get; set; }
    public string Instrument { get; set; } = string.Empty;
    public string Direction { get; set; } = "long";
    public decimal EntryPrice { get; set; }
    public decimal? ExitPrice { get; set; }
    public decimal Quantity { get; set; }
    public decimal? Pnl { get; set; }
    public bool ChecklistCompleted { get; set; }
    public string? EntryTime { get; set; }
    public string? ExitTime { get; set; }
    public string? Notes { get; set; }
    public string[]? Tags { get; set; }
    public bool IsRevengeTrading { get; set; }
    public string? EmotionAtEntry { get; set; }
    public List<ChecklistResponseDto>? ChecklistResponses { get; set; }

    // Options fields
    public string AssetType { get; set; } = "Options";
    public string? OptionType { get; set; }
    public string? SpreadType { get; set; }
    public decimal? StrikePrice { get; set; }
    public decimal? StrikePrice2 { get; set; }
    public decimal? StrikePrice3 { get; set; }
    public decimal? StrikePrice4 { get; set; }
    public DateTime? ExpirationDate { get; set; }
    public decimal? EntryPremium { get; set; }
    public decimal? ExitPremium { get; set; }
    public bool ExpiredWorthless { get; set; }
    public int Multiplier { get; set; } = 100;
    public int? BankAccountId { get; set; }
    public decimal? CommissionFees { get; set; }
    public decimal? RegExchangeFees { get; set; }
    public decimal? TotalFees { get; set; }
    public decimal? NetPnl { get; set; }
}

public class ChecklistResponseDto
{
    public int ChecklistItemId { get; set; }
    public string Label { get; set; } = string.Empty;
    public bool Checked { get; set; }
}

public class ReorderDto
{
    public List<int> Ids { get; set; } = new();
}
