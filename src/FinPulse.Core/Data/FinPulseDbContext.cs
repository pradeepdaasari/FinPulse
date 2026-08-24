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
        });

        // CreditCard decimal precision
        modelBuilder.Entity<CreditCard>(entity =>
        {
            entity.Property(e => e.CurrentBalance).HasPrecision(18, 2);
            entity.Property(e => e.MinimumPayment).HasPrecision(18, 2);
            entity.Property(e => e.AprPercent).HasPrecision(5, 3);
            entity.Property(e => e.PromoAprPercent).HasPrecision(5, 3);
        });

        // UserProfile decimal precision
        modelBuilder.Entity<UserProfile>(entity =>
        {
            entity.Property(e => e.MonthlyIncome).HasPrecision(18, 2);
            entity.Property(e => e.NetPayPerCheck).HasPrecision(18, 2);
        });

        // BudgetExpense decimal precision
        modelBuilder.Entity<BudgetExpense>(entity =>
        {
            entity.Property(e => e.Amount).HasPrecision(18, 2);
        });

        // DailyExpense
        modelBuilder.Entity<DailyExpense>(entity =>
        {
            entity.Property(e => e.Amount).HasPrecision(18, 2);
            entity.HasIndex(e => e.Date);
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
        });

        // MonthlySnapshot
        modelBuilder.Entity<MonthlySnapshot>(entity =>
        {
            entity.HasIndex(e => new { e.Year, e.Month }).IsUnique();
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
        }
    }
}
