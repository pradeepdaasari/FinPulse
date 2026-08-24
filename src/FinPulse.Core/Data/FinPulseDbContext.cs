using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using FinPulse.Core.Models;

namespace FinPulse.Core.Data;

public class FinPulseDbContext : IdentityDbContext<ApplicationUser>
{
    public FinPulseDbContext(DbContextOptions<FinPulseDbContext> options)
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
        }
    }
}
