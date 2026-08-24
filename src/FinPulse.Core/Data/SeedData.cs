namespace FinPulse.Core.Data;

using FinPulse.Core.Models;
using FinPulse.Core.Models.Enums;

public static class SeedData
{
    public static void Initialize(FinPulseDbContext context)
    {
        if (context.PersonalLoans.Any() || context.CreditCards.Any())
            return;

        var profile = new UserProfile
        {
            MonthlyIncome = 7500m
        };
        context.UserProfiles.Add(profile);

        context.PersonalLoans.AddRange(
            new PersonalLoan
            {
                LenderName = "SoFi Personal Loan",
                OriginalAmount = 25000m,
                CurrentBalance = 18750m,
                AprPercent = 8.99m,
                DurationMonths = 60,
                StartDate = new DateTime(2024, 3, 15),
                MonthlyPayment = 518.96m,
                DueDay = 15,
                PaymentFrequency = PaymentFrequency.Monthly
            },
            new PersonalLoan
            {
                LenderName = "Marcus by Goldman Sachs",
                OriginalAmount = 15000m,
                CurrentBalance = 12200m,
                AprPercent = 11.24m,
                DurationMonths = 48,
                StartDate = new DateTime(2024, 8, 1),
                MonthlyPayment = 389.42m,
                DueDay = 1,
                PaymentFrequency = PaymentFrequency.Monthly
            },
            new PersonalLoan
            {
                LenderName = "LightStream Auto Refinance",
                OriginalAmount = 22000m,
                CurrentBalance = 17600m,
                AprPercent = 5.49m,
                DurationMonths = 72,
                StartDate = new DateTime(2024, 1, 10),
                MonthlyPayment = 359.87m,
                DueDay = 10,
                PaymentFrequency = PaymentFrequency.Biweekly
            }
        );

        context.CreditCards.AddRange(
            new CreditCard
            {
                CardName = "Chase Sapphire Reserve",
                CurrentBalance = 4800m,
                AprPercent = 22.49m,
                MinimumPayment = 96m,
                DueDay = 22
            },
            new CreditCard
            {
                CardName = "Citi Double Cash",
                CurrentBalance = 3200m,
                AprPercent = 19.99m,
                MinimumPayment = 64m,
                DueDay = 5
            },
            new CreditCard
            {
                CardName = "Amex Blue Cash - Balance Transfer",
                CurrentBalance = 8500m,
                AprPercent = 21.24m,
                MinimumPayment = 170m,
                DueDay = 18,
                PromoAprPercent = 0m,
                PromoEndDate = new DateTime(2027, 6, 1)
            },
            new CreditCard
            {
                CardName = "Discover It",
                CurrentBalance = 1900m,
                AprPercent = 24.99m,
                MinimumPayment = 38m,
                DueDay = 28
            }
        );

        context.SaveChanges();
    }
}
