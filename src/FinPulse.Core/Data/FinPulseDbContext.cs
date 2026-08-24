using Microsoft.EntityFrameworkCore;
using FinPulse.Core.Models;

namespace FinPulse.Core.Data;

public class FinPulseDbContext : DbContext
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
        }
    }
}
