using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Pulse.Core.Models;
using Pulse.Core.Models.Health;
using Pulse.Core.Models.Trading;

namespace Pulse.Core.Data;

public class PulseDbContext : IdentityDbContext<ApplicationUser>
{
    public PulseDbContext(DbContextOptions<PulseDbContext> options)
        : base(options)
    {
    }

    public DbSet<PersonalLoan> PersonalLoans => Set<PersonalLoan>();
    public DbSet<CreditCard> CreditCards => Set<CreditCard>();
    public DbSet<UserProfile> UserProfiles => Set<UserProfile>();
    public DbSet<PaymentHistory> PaymentHistories => Set<PaymentHistory>();
    public DbSet<MonthlySnapshot> MonthlySnapshots => Set<MonthlySnapshot>();
    public DbSet<BudgetExpense> BudgetExpenses => Set<BudgetExpense>();
    public DbSet<DailyExpense> DailyExpenses => Set<DailyExpense>();
    public DbSet<CustomCategory> CustomCategories => Set<CustomCategory>();
    public DbSet<BankAccount> BankAccounts => Set<BankAccount>();
    public DbSet<RecurringTransaction> RecurringTransactions => Set<RecurringTransaction>();
    public DbSet<SavingsGoal> SavingsGoals => Set<SavingsGoal>();

    // Trading
    public DbSet<TradingSetup> TradingSetups => Set<TradingSetup>();
    public DbSet<ChecklistItem> ChecklistItems => Set<ChecklistItem>();
    public DbSet<PreMarketNote> PreMarketNotes => Set<PreMarketNote>();
    public DbSet<TradeEntry> TradeEntries => Set<TradeEntry>();
    public DbSet<ChecklistResponse> ChecklistResponses => Set<ChecklistResponse>();
    public DbSet<TradingRule> TradingRules => Set<TradingRule>();
    public DbSet<DailyReview> DailyReviews => Set<DailyReview>();
    public DbSet<DailyLimits> DailyLimits => Set<DailyLimits>();
    public DbSet<TradingWisdom> TradingWisdoms => Set<TradingWisdom>();
    public DbSet<CommissionSchedule> CommissionSchedules => Set<CommissionSchedule>();

    // Health & Fitness
    public DbSet<HealthMetric> HealthMetrics => Set<HealthMetric>();
    public DbSet<BloodWorkReport> BloodWorkReports => Set<BloodWorkReport>();
    public DbSet<BloodWorkResult> BloodWorkResults => Set<BloodWorkResult>();
    public DbSet<WorkoutPlan> WorkoutPlans => Set<WorkoutPlan>();
    public DbSet<WorkoutPlanDay> WorkoutPlanDays => Set<WorkoutPlanDay>();
    public DbSet<PlannedExercise> PlannedExercises => Set<PlannedExercise>();
    public DbSet<WorkoutLog> WorkoutLogs => Set<WorkoutLog>();
    public DbSet<ExerciseSet> ExerciseSets => Set<ExerciseSet>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // PersonalLoan decimal precision
        modelBuilder.Entity<PersonalLoan>(entity =>
        {
            entity.Property(e => e.OriginalAmount).HasPrecision(18, 2);
            entity.Property(e => e.CurrentBalance).HasPrecision(18, 2);
            entity.Property(e => e.MonthlyPayment).HasPrecision(18, 2);
            entity.Property(e => e.AprPercent).HasPrecision(5, 3);
            entity.HasIndex(e => e.UserId);
        });

        // CreditCard decimal precision
        modelBuilder.Entity<CreditCard>(entity =>
        {
            entity.Property(e => e.CurrentBalance).HasPrecision(18, 2);
            entity.Property(e => e.MinimumPayment).HasPrecision(18, 2);
            entity.Property(e => e.AprPercent).HasPrecision(5, 3);
            entity.Property(e => e.PromoAprPercent).HasPrecision(5, 3);
            entity.HasIndex(e => e.UserId);
        });

        // UserProfile decimal precision
        modelBuilder.Entity<UserProfile>(entity =>
        {
            entity.Property(e => e.MonthlyIncome).HasPrecision(18, 2);
            entity.Property(e => e.NetPayPerCheck).HasPrecision(18, 2);
            entity.HasIndex(e => e.UserId).IsUnique();
        });

        // BudgetExpense decimal precision
        modelBuilder.Entity<BudgetExpense>(entity =>
        {
            entity.Property(e => e.Amount).HasPrecision(18, 2);
            entity.HasIndex(e => e.UserId);
        });

        // DailyExpense
        modelBuilder.Entity<DailyExpense>(entity =>
        {
            entity.Property(e => e.Amount).HasPrecision(18, 2);
            entity.HasIndex(e => e.Date);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => new { e.FundingSourceType, e.FundingSourceId });
            entity.HasIndex(e => e.SplitGroupId).HasFilter("[SplitGroupId] IS NOT NULL");
            entity.HasIndex(e => new { e.UserId, e.Tag }).HasFilter("[Tag] IS NOT NULL");
        });

        // BankAccount
        modelBuilder.Entity<BankAccount>(entity =>
        {
            entity.Property(e => e.CurrentBalance).HasPrecision(18, 2);
            entity.Property(e => e.OptionsCommissionPerContract).HasPrecision(10, 4);
            entity.Property(e => e.FuturesCommissionPerContract).HasPrecision(10, 4);
            entity.Property(e => e.OptionsRegFeePerContract).HasPrecision(10, 4);
            entity.Property(e => e.FuturesRegFeePerContract).HasPrecision(10, 4);
            entity.HasIndex(e => e.UserId);
        });

        // RecurringTransaction
        modelBuilder.Entity<RecurringTransaction>(entity =>
        {
            entity.Property(e => e.Amount).HasPrecision(18, 2);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => new { e.IsActive, e.NextRunDate });
        });

        // SavingsGoal
        modelBuilder.Entity<SavingsGoal>(entity =>
        {
            entity.Property(e => e.TargetAmount).HasPrecision(18, 2);
            entity.Property(e => e.CurrentAmount).HasPrecision(18, 2);
            entity.HasIndex(e => e.UserId);
        });

        // CustomCategory
        modelBuilder.Entity<CustomCategory>(entity =>
        {
            entity.HasIndex(e => new { e.Name, e.ParentId, e.UserId }).IsUnique();
            entity.HasOne(e => e.Parent)
                .WithMany(e => e.Children)
                .HasForeignKey(e => e.ParentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // PaymentHistory decimal precision
        modelBuilder.Entity<PaymentHistory>(entity =>
        {
            entity.Property(e => e.AmountPaid).HasPrecision(18, 2);
            entity.HasIndex(e => e.UserId);
        });

        // MonthlySnapshot
        modelBuilder.Entity<MonthlySnapshot>(entity =>
        {
            entity.HasIndex(e => new { e.Year, e.Month, e.UserId }).IsUnique();
            entity.Property(e => e.TotalDebt).HasPrecision(18, 2);
            entity.Property(e => e.TotalPaidThisMonth).HasPrecision(18, 2);
        });

        // HealthMetric
        modelBuilder.Entity<HealthMetric>(entity =>
        {
            entity.Property(e => e.Value).HasPrecision(10, 2);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => new { e.UserId, e.MetricType, e.MeasuredAt });
        });

        // BloodWorkReport
        modelBuilder.Entity<BloodWorkReport>(entity =>
        {
            entity.HasIndex(e => e.UserId);
            entity.HasMany(e => e.Results)
                .WithOne(r => r.Report)
                .HasForeignKey(r => r.ReportId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // BloodWorkResult
        modelBuilder.Entity<BloodWorkResult>(entity =>
        {
            entity.Property(e => e.Value).HasPrecision(10, 3);
            entity.Property(e => e.ReferenceMin).HasPrecision(10, 3);
            entity.Property(e => e.ReferenceMax).HasPrecision(10, 3);
        });

        // WorkoutPlan
        modelBuilder.Entity<WorkoutPlan>(entity =>
        {
            entity.HasIndex(e => e.UserId);
            entity.HasMany(e => e.Days)
                .WithOne(d => d.Plan)
                .HasForeignKey(d => d.PlanId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // WorkoutPlanDay
        modelBuilder.Entity<WorkoutPlanDay>(entity =>
        {
            entity.HasMany(e => e.Exercises)
                .WithOne(ex => ex.PlanDay)
                .HasForeignKey(ex => ex.PlanDayId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // PlannedExercise
        modelBuilder.Entity<PlannedExercise>(entity =>
        {
            entity.Property(e => e.TargetWeight).HasPrecision(10, 2);
        });

        // WorkoutLog
        modelBuilder.Entity<WorkoutLog>(entity =>
        {
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => new { e.UserId, e.Date });
            entity.HasMany(e => e.Sets)
                .WithOne(s => s.WorkoutLog)
                .HasForeignKey(s => s.WorkoutLogId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ExerciseSet
        modelBuilder.Entity<ExerciseSet>(entity =>
        {
            entity.Property(e => e.Weight).HasPrecision(10, 2);
        });

        // TradingSetup
        modelBuilder.Entity<TradingSetup>(entity =>
        {
            entity.HasIndex(e => e.UserId);
            entity.HasMany(e => e.ChecklistItems)
                .WithOne(i => i.Setup)
                .HasForeignKey(i => i.SetupId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // PreMarketNote
        modelBuilder.Entity<PreMarketNote>(entity =>
        {
            entity.Property(e => e.MaxLoss).HasPrecision(18, 2);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => new { e.UserId, e.Date });
        });

        // TradeEntry
        modelBuilder.Entity<TradeEntry>(entity =>
        {
            entity.Property(e => e.EntryPrice).HasPrecision(18, 6);
            entity.Property(e => e.ExitPrice).HasPrecision(18, 6);
            entity.Property(e => e.Quantity).HasPrecision(18, 4);
            entity.Property(e => e.Pnl).HasPrecision(18, 2);
            entity.Property(e => e.StrikePrice).HasPrecision(18, 6);
            entity.Property(e => e.StrikePrice2).HasPrecision(18, 6);
            entity.Property(e => e.StrikePrice3).HasPrecision(18, 6);
            entity.Property(e => e.StrikePrice4).HasPrecision(18, 6);
            entity.Property(e => e.EntryPremium).HasPrecision(18, 4);
            entity.Property(e => e.ExitPremium).HasPrecision(18, 4);
            entity.Property(e => e.TotalFees).HasPrecision(18, 4);
            entity.Property(e => e.NetPnl).HasPrecision(18, 2);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => new { e.UserId, e.Date });
            entity.HasIndex(e => e.BankAccountId);
            entity.HasMany(e => e.ChecklistResponses)
                .WithOne(r => r.TradeEntry)
                .HasForeignKey(r => r.TradeEntryId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.LinkedExpense)
                .WithMany()
                .HasForeignKey(e => e.LinkedExpenseId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // TradingRule
        modelBuilder.Entity<TradingRule>(entity =>
        {
            entity.HasIndex(e => e.UserId);
        });

        // DailyReview
        modelBuilder.Entity<DailyReview>(entity =>
        {
            entity.Property(e => e.TotalPnl).HasPrecision(18, 2);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => new { e.UserId, e.Date });
        });

        // DailyLimits
        modelBuilder.Entity<DailyLimits>(entity =>
        {
            entity.Property(e => e.MaxDailyLoss).HasPrecision(18, 2);
            entity.HasIndex(e => e.UserId).IsUnique();
        });

        // CommissionSchedule
        modelBuilder.Entity<CommissionSchedule>(entity =>
        {
            entity.Property(e => e.OptionsCommissionPerContract).HasPrecision(10, 4);
            entity.Property(e => e.FuturesCommissionPerContract).HasPrecision(10, 4);
            entity.Property(e => e.OptionsRegFeePerContract).HasPrecision(10, 4);
            entity.Property(e => e.FuturesRegFeePerContract).HasPrecision(10, 4);
            entity.HasIndex(e => new { e.BankAccountId, e.EffectiveFrom }).IsUnique();
            entity.HasIndex(e => e.UserId);
            entity.HasOne(e => e.BankAccount)
                .WithMany()
                .HasForeignKey(e => e.BankAccountId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    public override int SaveChanges()
    {
        SetTimestamps();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        SetTimestamps();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void SetTimestamps()
    {
        var now = DateTime.UtcNow;

        foreach (var entry in ChangeTracker.Entries()
            .Where(e => e.State == EntityState.Added || e.State == EntityState.Modified))
        {
            if (entry.Entity is PersonalLoan loan)
            {
                loan.UpdatedAt = now;
                if (entry.State == EntityState.Added)
                    loan.CreatedAt = now;
            }
            else if (entry.Entity is CreditCard card)
            {
                card.UpdatedAt = now;
                if (entry.State == EntityState.Added)
                    card.CreatedAt = now;
            }
            else if (entry.Entity is UserProfile profile)
            {
                profile.UpdatedAt = now;
                if (entry.State == EntityState.Added)
                    profile.CreatedAt = now;
            }
            else if (entry.Entity is BudgetExpense expense)
            {
                expense.UpdatedAt = now;
                if (entry.State == EntityState.Added)
                    expense.CreatedAt = now;
            }
            else if (entry.Entity is DailyExpense daily)
            {
                daily.UpdatedAt = now;
                if (entry.State == EntityState.Added)
                    daily.CreatedAt = now;
            }
            else if (entry.Entity is CustomCategory cat)
            {
                cat.UpdatedAt = now;
                if (entry.State == EntityState.Added)
                    cat.CreatedAt = now;
            }
            else if (entry.Entity is BankAccount account)
            {
                account.UpdatedAt = now;
                if (entry.State == EntityState.Added)
                    account.CreatedAt = now;
            }
            else if (entry.Entity is RecurringTransaction recurring)
            {
                recurring.UpdatedAt = now;
                if (entry.State == EntityState.Added)
                    recurring.CreatedAt = now;
            }
            else if (entry.Entity is SavingsGoal goal)
            {
                goal.UpdatedAt = now;
                if (entry.State == EntityState.Added)
                    goal.CreatedAt = now;
            }
            else if (entry.Entity is HealthMetric metric)
            {
                metric.UpdatedAt = now;
                if (entry.State == EntityState.Added)
                    metric.CreatedAt = now;
            }
            else if (entry.Entity is BloodWorkReport report)
            {
                report.UpdatedAt = now;
                if (entry.State == EntityState.Added)
                    report.CreatedAt = now;
            }
            else if (entry.Entity is BloodWorkResult result)
            {
                result.UpdatedAt = now;
                if (entry.State == EntityState.Added)
                    result.CreatedAt = now;
            }
            else if (entry.Entity is WorkoutPlan plan)
            {
                plan.UpdatedAt = now;
                if (entry.State == EntityState.Added)
                    plan.CreatedAt = now;
            }
            else if (entry.Entity is WorkoutPlanDay planDay)
            {
                planDay.UpdatedAt = now;
                if (entry.State == EntityState.Added)
                    planDay.CreatedAt = now;
            }
            else if (entry.Entity is PlannedExercise exercise)
            {
                exercise.UpdatedAt = now;
                if (entry.State == EntityState.Added)
                    exercise.CreatedAt = now;
            }
            else if (entry.Entity is WorkoutLog log)
            {
                log.UpdatedAt = now;
                if (entry.State == EntityState.Added)
                    log.CreatedAt = now;
            }
            else if (entry.Entity is ExerciseSet set)
            {
                set.UpdatedAt = now;
                if (entry.State == EntityState.Added)
                    set.CreatedAt = now;
            }
            else if (entry.Entity is TradingSetup tradingSetup)
            {
                tradingSetup.UpdatedAt = now;
                if (entry.State == EntityState.Added)
                    tradingSetup.CreatedAt = now;
            }
            else if (entry.Entity is PreMarketNote preMarket)
            {
                preMarket.UpdatedAt = now;
                if (entry.State == EntityState.Added)
                    preMarket.CreatedAt = now;
            }
            else if (entry.Entity is TradeEntry trade)
            {
                trade.UpdatedAt = now;
                if (entry.State == EntityState.Added)
                    trade.CreatedAt = now;
            }
            else if (entry.Entity is TradingRule rule)
            {
                rule.UpdatedAt = now;
                if (entry.State == EntityState.Added)
                    rule.CreatedAt = now;
            }
            else if (entry.Entity is DailyReview review)
            {
                review.UpdatedAt = now;
                if (entry.State == EntityState.Added)
                    review.CreatedAt = now;
            }
            else if (entry.Entity is DailyLimits limits)
            {
                limits.UpdatedAt = now;
            }
            else if (entry.Entity is CommissionSchedule schedule)
            {
                schedule.UpdatedAt = now;
                if (entry.State == EntityState.Added)
                    schedule.CreatedAt = now;
            }
        }
    }
}
