namespace Pulse.Core.Data;

using Microsoft.EntityFrameworkCore;
using Pulse.Core.Models;
using Pulse.Core.Models.Enums;
using Pulse.Core.Models.Health;
using Pulse.Core.Models.Trading;

public static class SeedData
{
    public static void Initialize(PulseDbContext context, string? userId = null)
    {
        SeedTradingWisdom(context);

        if (context.PersonalLoans.Any() || context.CreditCards.Any())
            return;

        Reseed(context, userId);
    }

    /// <summary>
    /// Assigns all records with NULL UserId to the given user.
    /// Fixes data created before the seed-ordering bug was fixed.
    /// </summary>
    public static void ClaimOrphanedRecords(PulseDbContext context, string userId)
    {
        string[] tables = [
            "PersonalLoans", "CreditCards", "BankAccounts", "BudgetExpenses",
            "DailyExpenses", "RecurringTransactions", "SavingsGoals", "PaymentHistories",
            "MonthlySnapshots", "CustomCategories", "UserProfiles", "MoneyMovements",
            "HealthMetrics", "BloodWorkReports", "WorkoutPlans", "WorkoutLogs",
            "PreMarketNotes", "PreMarketTemplates", "TradingSetups", "TradeEntries",
            "TradeNotes", "DailyReviews", "TradingRules", "TradingGoals",
            "TradingGoalSnapshots", "DailyLimits", "NetWorthSnapshots"
        ];

        foreach (var table in tables)
        {
            context.Database.ExecuteSqlRaw(
                $"UPDATE [{table}] SET UserId = {{0}} WHERE UserId IS NULL OR UserId = ''", userId);
        }
    }

    private static void SeedTradingWisdom(PulseDbContext context)
    {
        if (context.TradingWisdoms.Any()) return;

        context.TradingWisdoms.AddRange(
            new TradingWisdom { Text = "The goal of a successful trader is to make the best trades. Money is secondary.", Category = "process", Author = "Alexander Elder" },
            new TradingWisdom { Text = "Cut your losses short and let your winners run.", Category = "risk", Author = "Jesse Livermore" },
            new TradingWisdom { Text = "The market can stay irrational longer than you can stay solvent.", Category = "patience", Author = "John Maynard Keynes" },
            new TradingWisdom { Text = "Plan your trade and trade your plan.", Category = "discipline", Author = null },
            new TradingWisdom { Text = "Risk comes from not knowing what you are doing.", Category = "risk", Author = "Warren Buffett" },
            new TradingWisdom { Text = "The most important rule of trading is to play great defense, not great offense.", Category = "risk", Author = "Paul Tudor Jones" },
            new TradingWisdom { Text = "Discipline is the bridge between goals and accomplishment.", Category = "discipline", Author = "Jim Rohn" },
            new TradingWisdom { Text = "It's not whether you're right or wrong, but how much money you make when you're right and how much you lose when you're wrong.", Category = "risk", Author = "George Soros" },
            new TradingWisdom { Text = "The elements of good trading are: cutting losses, cutting losses, and cutting losses.", Category = "risk", Author = "Ed Seykota" },
            new TradingWisdom { Text = "Don't think about what the market is going to do. You have absolutely no control over that. Think about what you are going to do if it gets there.", Category = "process", Author = "William Eckhardt" },
            new TradingWisdom { Text = "Patience is the key to success in trading. Wait for the high-probability setups.", Category = "patience", Author = null },
            new TradingWisdom { Text = "The hard work in trading is done away from the screen — in preparation, journaling, and self-reflection.", Category = "process", Author = null },
            new TradingWisdom { Text = "Your worst enemy in trading is your own emotions. Master them or they will master you.", Category = "psychology", Author = null },
            new TradingWisdom { Text = "A losing trade is not a bad trade if you followed your rules. A winning trade is not a good trade if you broke your rules.", Category = "discipline", Author = null },
            new TradingWisdom { Text = "The secret to being successful from a trading perspective is to have an indefatigable and undying thirst for information and knowledge.", Category = "process", Author = "Paul Tudor Jones" }
        );
        context.SaveChanges();
    }

    public static void Reseed(PulseDbContext context, string? userId)
    {
        // Clear user's data (scoped to userId when available, otherwise clear all)
        if (userId != null)
        {
            context.PaymentHistories.RemoveRange(context.PaymentHistories.Where(x => x.UserId == userId));
            context.MonthlySnapshots.RemoveRange(context.MonthlySnapshots.Where(x => x.UserId == userId));
            context.DailyExpenses.RemoveRange(context.DailyExpenses.Where(x => x.UserId == userId));
            context.RecurringTransactions.RemoveRange(context.RecurringTransactions.Where(x => x.UserId == userId));
            context.SavingsGoals.RemoveRange(context.SavingsGoals.Where(x => x.UserId == userId));
            context.BudgetExpenses.RemoveRange(context.BudgetExpenses.Where(x => x.UserId == userId));
            context.PersonalLoans.RemoveRange(context.PersonalLoans.Where(x => x.UserId == userId));
            context.CreditCards.RemoveRange(context.CreditCards.Where(x => x.UserId == userId));
            context.BankAccounts.RemoveRange(context.BankAccounts.Where(x => x.UserId == userId));
            context.UserProfiles.RemoveRange(context.UserProfiles.Where(x => x.UserId == userId));
            context.CustomCategories.RemoveRange(context.CustomCategories.Where(x => x.UserId == userId));
        }
        else
        {
            context.PaymentHistories.RemoveRange(context.PaymentHistories);
            context.MonthlySnapshots.RemoveRange(context.MonthlySnapshots);
            context.DailyExpenses.RemoveRange(context.DailyExpenses);
            context.RecurringTransactions.RemoveRange(context.RecurringTransactions);
            context.SavingsGoals.RemoveRange(context.SavingsGoals);
            context.BudgetExpenses.RemoveRange(context.BudgetExpenses);
            context.PersonalLoans.RemoveRange(context.PersonalLoans);
            context.CreditCards.RemoveRange(context.CreditCards);
            context.BankAccounts.RemoveRange(context.BankAccounts);
            context.UserProfiles.RemoveRange(context.UserProfiles);
            context.CustomCategories.RemoveRange(context.CustomCategories);
        }
        context.SaveChanges();

        // Helper to stamp UserId on all added entities before each SaveChanges
        void StampAndSave()
        {
            if (userId != null)
            {
                foreach (var entry in context.ChangeTracker.Entries()
                    .Where(e => e.State == Microsoft.EntityFrameworkCore.EntityState.Added))
                {
                    var prop = entry.Properties.FirstOrDefault(p => p.Metadata.Name == "UserId");
                    if (prop != null && (prop.CurrentValue == null || (prop.CurrentValue is string s && s == string.Empty)))
                        prop.CurrentValue = userId;
                }
            }
            context.SaveChanges();
        }

        // ═══════════════════════════════════════════════════
        // EXPENSE CATEGORIES
        // ═══════════════════════════════════════════════════
        var housing = new CustomCategory { Name = "Housing", IsFixed = true, Icon = "home" };
        var transportation = new CustomCategory { Name = "Transportation", IsFixed = false, Icon = "directions_car" };
        var insurance = new CustomCategory { Name = "Insurance", IsFixed = true, Icon = "shield" };
        var utilities = new CustomCategory { Name = "Utilities", IsFixed = true, Icon = "bolt" };
        var subscriptions = new CustomCategory { Name = "Subscriptions", IsFixed = true, Icon = "subscriptions" };
        var food = new CustomCategory { Name = "Food & Dining", IsFixed = false, Icon = "restaurant" };
        var lifestyle = new CustomCategory { Name = "Lifestyle", IsFixed = false, Icon = "celebration" };
        var personal = new CustomCategory { Name = "Personal & Health", IsFixed = false, Icon = "favorite" };
        var savings = new CustomCategory { Name = "Savings & Investments", IsFixed = false, Icon = "savings" };

        // INCOME CATEGORIES
        var employment = new CustomCategory { Name = "Employment", IsFixed = true, Type = CategoryType.Income, Icon = "work" };
        var sideIncome = new CustomCategory { Name = "Side Income", IsFixed = false, Type = CategoryType.Income, Icon = "monetization_on" };
        var passiveIncome = new CustomCategory { Name = "Passive Income", IsFixed = false, Type = CategoryType.Income, Icon = "account_balance" };

        context.CustomCategories.AddRange(
            housing, transportation, insurance, utilities, subscriptions,
            food, lifestyle, personal, savings, employment, sideIncome, passiveIncome);
        StampAndSave();

        // ═══════════════════════════════════════════════════
        // EXPENSE SUB-CATEGORIES
        // ═══════════════════════════════════════════════════
        var rent = new CustomCategory { Name = "Rent", IsFixed = true, ParentId = housing.Id, Icon = "apartment" };
        var mortgage = new CustomCategory { Name = "Mortgage", IsFixed = true, ParentId = housing.Id, Icon = "house" };
        var rentersInsurance = new CustomCategory { Name = "Renter's Insurance", IsFixed = true, ParentId = housing.Id, Icon = "policy" };

        var carPayment = new CustomCategory { Name = "Car Payment", IsFixed = true, ParentId = transportation.Id, Icon = "car_rental" };
        var gas = new CustomCategory { Name = "Gas & Fuel", IsFixed = false, ParentId = transportation.Id, Icon = "local_gas_station" };
        var parking = new CustomCategory { Name = "Parking & Tolls", IsFixed = false, ParentId = transportation.Id, Icon = "local_parking" };
        var maintenance = new CustomCategory { Name = "Car Maintenance", IsFixed = false, ParentId = transportation.Id, Icon = "build" };
        var rideshare = new CustomCategory { Name = "Uber / Lyft", IsFixed = false, ParentId = transportation.Id, Icon = "hail" };

        var autoInsurance = new CustomCategory { Name = "Auto Insurance", IsFixed = true, ParentId = insurance.Id, Icon = "car_crash" };
        var healthInsurance = new CustomCategory { Name = "Health Insurance", IsFixed = true, ParentId = insurance.Id, Icon = "health_and_safety" };
        var lifeInsurance = new CustomCategory { Name = "Life Insurance", IsFixed = true, ParentId = insurance.Id, Icon = "security" };

        var electric = new CustomCategory { Name = "Electric", IsFixed = true, ParentId = utilities.Id, Icon = "electrical_services" };
        var water = new CustomCategory { Name = "Water & Sewer", IsFixed = true, ParentId = utilities.Id, Icon = "water_drop" };
        var naturalGas = new CustomCategory { Name = "Natural Gas", IsFixed = true, ParentId = utilities.Id, Icon = "gas_meter" };
        var phone = new CustomCategory { Name = "Phone", IsFixed = true, ParentId = utilities.Id, Icon = "phone_android" };
        var internet = new CustomCategory { Name = "Internet", IsFixed = true, ParentId = utilities.Id, Icon = "wifi" };

        var streaming = new CustomCategory { Name = "Streaming (Netflix, Hulu)", IsFixed = true, ParentId = subscriptions.Id, Icon = "live_tv" };
        var music = new CustomCategory { Name = "Music (Spotify)", IsFixed = true, ParentId = subscriptions.Id, Icon = "headphones" };
        var cloud = new CustomCategory { Name = "Cloud Storage (iCloud)", IsFixed = true, ParentId = subscriptions.Id, Icon = "cloud" };
        var gym = new CustomCategory { Name = "Gym Membership", IsFixed = true, ParentId = subscriptions.Id, Icon = "fitness_center" };
        var software = new CustomCategory { Name = "Software & Apps", IsFixed = true, ParentId = subscriptions.Id, Icon = "apps" };

        var groceries = new CustomCategory { Name = "Groceries", IsFixed = false, ParentId = food.Id, Icon = "shopping_cart" };
        var dining = new CustomCategory { Name = "Restaurants", IsFixed = false, ParentId = food.Id, Icon = "dinner_dining" };
        var coffee = new CustomCategory { Name = "Coffee Shops", IsFixed = false, ParentId = food.Id, Icon = "coffee" };
        var fastFood = new CustomCategory { Name = "Fast Food & Delivery", IsFixed = false, ParentId = food.Id, Icon = "delivery_dining" };

        var entertainment = new CustomCategory { Name = "Entertainment", IsFixed = false, ParentId = lifestyle.Id, Icon = "movie" };
        var shopping = new CustomCategory { Name = "Shopping", IsFixed = false, ParentId = lifestyle.Id, Icon = "shopping_bag" };
        var travel = new CustomCategory { Name = "Travel & Vacation", IsFixed = false, ParentId = lifestyle.Id, Icon = "flight" };
        var hobbies = new CustomCategory { Name = "Hobbies", IsFixed = false, ParentId = lifestyle.Id, Icon = "palette" };
        var gifts = new CustomCategory { Name = "Gifts & Donations", IsFixed = false, ParentId = lifestyle.Id, Icon = "redeem" };

        var healthcare = new CustomCategory { Name = "Medical & Dental", IsFixed = false, ParentId = personal.Id, Icon = "local_hospital" };
        var personalCare = new CustomCategory { Name = "Personal Care", IsFixed = false, ParentId = personal.Id, Icon = "spa" };
        var clothing = new CustomCategory { Name = "Clothing", IsFixed = false, ParentId = personal.Id, Icon = "checkroom" };
        var education = new CustomCategory { Name = "Education & Books", IsFixed = false, ParentId = personal.Id, Icon = "school" };
        var pets = new CustomCategory { Name = "Pet Care", IsFixed = false, ParentId = personal.Id, Icon = "pets" };

        var emergencyFund = new CustomCategory { Name = "Emergency Fund", IsFixed = false, ParentId = savings.Id, Icon = "emergency" };
        var retirement = new CustomCategory { Name = "Retirement (401k/IRA)", IsFixed = true, ParentId = savings.Id, Icon = "elderly" };
        var investing = new CustomCategory { Name = "Brokerage", IsFixed = false, ParentId = savings.Id, Icon = "trending_up" };

        // INCOME SUB-CATEGORIES
        var salary = new CustomCategory { Name = "Salary", IsFixed = true, Type = CategoryType.Income, ParentId = employment.Id, Icon = "payments" };
        var bonus = new CustomCategory { Name = "Bonus", IsFixed = false, Type = CategoryType.Income, ParentId = employment.Id, Icon = "card_giftcard" };
        var overtime = new CustomCategory { Name = "Overtime", IsFixed = false, Type = CategoryType.Income, ParentId = employment.Id, Icon = "schedule" };

        var freelance = new CustomCategory { Name = "Freelance / Consulting", IsFixed = false, Type = CategoryType.Income, ParentId = sideIncome.Id, Icon = "laptop" };
        var sideGig = new CustomCategory { Name = "Side Gig", IsFixed = false, Type = CategoryType.Income, ParentId = sideIncome.Id, Icon = "handyman" };
        var reselling = new CustomCategory { Name = "Reselling / Marketplace", IsFixed = false, Type = CategoryType.Income, ParentId = sideIncome.Id, Icon = "storefront" };

        var rentalIncome = new CustomCategory { Name = "Rental Income", IsFixed = true, Type = CategoryType.Income, ParentId = passiveIncome.Id, Icon = "real_estate_agent" };
        var dividends = new CustomCategory { Name = "Dividends", IsFixed = false, Type = CategoryType.Income, ParentId = passiveIncome.Id, Icon = "pie_chart" };
        var interest = new CustomCategory { Name = "Interest (HYSA)", IsFixed = false, Type = CategoryType.Income, ParentId = passiveIncome.Id, Icon = "percent" };

        context.CustomCategories.AddRange(
            rent, mortgage, rentersInsurance,
            carPayment, gas, parking, maintenance, rideshare,
            autoInsurance, healthInsurance, lifeInsurance,
            electric, water, naturalGas, phone, internet,
            streaming, music, cloud, gym, software,
            groceries, dining, coffee, fastFood,
            entertainment, shopping, travel, hobbies, gifts,
            healthcare, personalCare, clothing, education, pets,
            emergencyFund, retirement, investing,
            salary, bonus, overtime,
            freelance, sideGig, reselling,
            rentalIncome, dividends, interest
        );
        StampAndSave();

        // ═══════════════════════════════════════════════════
        // USER PROFILE — biweekly pay, $7k/mo net
        // ═══════════════════════════════════════════════════
        var profile = new UserProfile
        {
            MonthlyIncome = 7000m,
            PayFrequency = PaymentFrequency.Biweekly,
            NetPayPerCheck = 3500m,
            NextPayDate = new DateTime(2026, 9, 5)
        };
        context.UserProfiles.Add(profile);

        // ═══════════════════════════════════════════════════
        // BANK ACCOUNTS
        // ═══════════════════════════════════════════════════
        var checking = new BankAccount
        {
            AccountName = "Chase Total Checking",
            AccountType = BankAccountType.Checking,
            CurrentBalance = 4250.00m
        };
        var savingsAcct = new BankAccount
        {
            AccountName = "Marcus HYSA",
            AccountType = BankAccountType.Savings,
            CurrentBalance = 8500.00m
        };
        var brokerage = new BankAccount
        {
            AccountName = "Fidelity Brokerage",
            AccountType = BankAccountType.Brokerage,
            CurrentBalance = 12340.00m
        };
        context.BankAccounts.AddRange(checking, savingsAcct, brokerage);
        StampAndSave();

        // ═══════════════════════════════════════════════════
        // DEBT — realistic mix of loans + cards
        // ═══════════════════════════════════════════════════
        var sofiLoan = new PersonalLoan
        {
            LenderName = "SoFi Personal Loan",
            OriginalAmount = 25000m,
            CurrentBalance = 18240m,
            AprPercent = 8.99m,
            DurationMonths = 60,
            StartDate = new DateTime(2024, 3, 15),
            MonthlyPayment = 518.96m,
            DueDay = 15,
            PaymentFrequency = PaymentFrequency.Monthly
        };
        var marcusLoan = new PersonalLoan
        {
            LenderName = "Marcus by Goldman Sachs",
            OriginalAmount = 15000m,
            CurrentBalance = 11800m,
            AprPercent = 11.24m,
            DurationMonths = 48,
            StartDate = new DateTime(2024, 8, 1),
            MonthlyPayment = 389.42m,
            DueDay = 1,
            PaymentFrequency = PaymentFrequency.Monthly
        };
        var autoLoan = new PersonalLoan
        {
            LenderName = "Toyota Financial - Auto Loan",
            OriginalAmount = 28000m,
            CurrentBalance = 19500m,
            AprPercent = 4.99m,
            DurationMonths = 72,
            StartDate = new DateTime(2023, 11, 10),
            MonthlyPayment = 452.31m,
            DueDay = 10,
            PaymentFrequency = PaymentFrequency.Monthly
        };
        context.PersonalLoans.AddRange(sofiLoan, marcusLoan, autoLoan);

        var chaseSapphire = new CreditCard
        {
            CardName = "Chase Sapphire Preferred",
            CurrentBalance = 3200m,
            CreditLimit = 10000m,
            AprPercent = 21.49m,
            MinimumPayment = 89m,
            DueDay = 22
        };
        var citiDoubleCash = new CreditCard
        {
            CardName = "Citi Double Cash",
            CurrentBalance = 1850m,
            CreditLimit = 7500m,
            AprPercent = 19.99m,
            MinimumPayment = 52m,
            DueDay = 5
        };
        var amexBlue = new CreditCard
        {
            CardName = "Amex Blue Cash Everyday",
            CurrentBalance = 4200m,
            CreditLimit = 6000m,
            AprPercent = 20.24m,
            MinimumPayment = 84m,
            DueDay = 18,
            PromoAprPercent = 0m,
            PromoEndDate = new DateTime(2027, 3, 1)
        };
        var appleCard = new CreditCard
        {
            CardName = "Apple Card",
            CurrentBalance = 950m,
            CreditLimit = 5000m,
            AprPercent = 24.49m,
            MinimumPayment = 25m,
            DueDay = 28
        };
        context.CreditCards.AddRange(chaseSapphire, citiDoubleCash, amexBlue, appleCard);
        StampAndSave();

        // ═══════════════════════════════════════════════════
        // SAVINGS GOALS
        // ═══════════════════════════════════════════════════
        context.SavingsGoals.AddRange(
            new SavingsGoal
            {
                Name = "Emergency Fund (6 months)",
                TargetAmount = 25000m,
                CurrentAmount = 8500m,
                TargetDate = new DateTime(2027, 12, 31),
                LinkedAccountId = savingsAcct.Id,
                Icon = "emergency",
                CreatedAt = new DateTime(2026, 1, 15),
                UpdatedAt = new DateTime(2026, 8, 1)
            },
            new SavingsGoal
            {
                Name = "Vacation - Japan Trip",
                TargetAmount = 5000m,
                CurrentAmount = 1800m,
                TargetDate = new DateTime(2027, 4, 1),
                Icon = "flight",
                CreatedAt = new DateTime(2026, 3, 1),
                UpdatedAt = new DateTime(2026, 8, 10)
            },
            new SavingsGoal
            {
                Name = "New Laptop",
                TargetAmount = 2500m,
                CurrentAmount = 2200m,
                TargetDate = new DateTime(2026, 10, 1),
                Icon = "laptop_mac",
                CreatedAt = new DateTime(2026, 5, 1),
                UpdatedAt = new DateTime(2026, 8, 15)
            },
            new SavingsGoal
            {
                Name = "Down Payment - House",
                TargetAmount = 60000m,
                CurrentAmount = 12340m,
                TargetDate = new DateTime(2029, 6, 1),
                LinkedAccountId = brokerage.Id,
                Icon = "house",
                CreatedAt = new DateTime(2025, 6, 1),
                UpdatedAt = new DateTime(2026, 8, 1)
            }
        );

        // ═══════════════════════════════════════════════════
        // RECURRING TRANSACTIONS
        // ═══════════════════════════════════════════════════
        context.RecurringTransactions.AddRange(
            new RecurringTransaction
            {
                Description = "Rent Payment",
                Merchant = "Greystar Property Mgmt",
                Amount = 1650m,
                CategoryId = rent.Id,
                TransactionType = TransactionType.Expense,
                FundingSourceType = FundingSourceType.BankAccount,
                FundingSourceId = checking.Id,
                Frequency = RecurrenceFrequency.Monthly,
                NextRunDate = new DateTime(2026, 9, 1),
                IsActive = true,
                CreatedAt = new DateTime(2026, 1, 1),
                UpdatedAt = new DateTime(2026, 8, 1)
            },
            new RecurringTransaction
            {
                Description = "Netflix Premium",
                Merchant = "Netflix",
                Amount = 22.99m,
                CategoryId = streaming.Id,
                TransactionType = TransactionType.Expense,
                FundingSourceType = FundingSourceType.CreditCard,
                FundingSourceId = chaseSapphire.Id,
                Frequency = RecurrenceFrequency.Monthly,
                NextRunDate = new DateTime(2026, 9, 15),
                IsActive = true,
                CreatedAt = new DateTime(2026, 1, 1),
                UpdatedAt = new DateTime(2026, 8, 15)
            },
            new RecurringTransaction
            {
                Description = "Spotify Family",
                Merchant = "Spotify",
                Amount = 16.99m,
                CategoryId = music.Id,
                TransactionType = TransactionType.Expense,
                FundingSourceType = FundingSourceType.CreditCard,
                FundingSourceId = appleCard.Id,
                Frequency = RecurrenceFrequency.Monthly,
                NextRunDate = new DateTime(2026, 9, 8),
                IsActive = true,
                CreatedAt = new DateTime(2026, 1, 1),
                UpdatedAt = new DateTime(2026, 8, 8)
            },
            new RecurringTransaction
            {
                Description = "LA Fitness Membership",
                Merchant = "LA Fitness",
                Amount = 34.99m,
                CategoryId = gym.Id,
                TransactionType = TransactionType.Expense,
                FundingSourceType = FundingSourceType.BankAccount,
                FundingSourceId = checking.Id,
                Frequency = RecurrenceFrequency.Monthly,
                NextRunDate = new DateTime(2026, 9, 1),
                IsActive = true,
                CreatedAt = new DateTime(2026, 1, 1),
                UpdatedAt = new DateTime(2026, 8, 1)
            },
            new RecurringTransaction
            {
                Description = "T-Mobile Bill",
                Merchant = "T-Mobile",
                Amount = 75m,
                CategoryId = phone.Id,
                TransactionType = TransactionType.Expense,
                FundingSourceType = FundingSourceType.BankAccount,
                FundingSourceId = checking.Id,
                Frequency = RecurrenceFrequency.Monthly,
                NextRunDate = new DateTime(2026, 9, 18),
                IsActive = true,
                CreatedAt = new DateTime(2026, 1, 1),
                UpdatedAt = new DateTime(2026, 8, 18)
            },
            new RecurringTransaction
            {
                Description = "AT&T Fiber Internet",
                Merchant = "AT&T",
                Amount = 65m,
                CategoryId = internet.Id,
                TransactionType = TransactionType.Expense,
                FundingSourceType = FundingSourceType.BankAccount,
                FundingSourceId = checking.Id,
                Frequency = RecurrenceFrequency.Monthly,
                NextRunDate = new DateTime(2026, 9, 22),
                IsActive = true,
                CreatedAt = new DateTime(2026, 1, 1),
                UpdatedAt = new DateTime(2026, 8, 22)
            },
            new RecurringTransaction
            {
                Description = "Hulu + Disney Bundle",
                Merchant = "Hulu",
                Amount = 14.99m,
                CategoryId = streaming.Id,
                TransactionType = TransactionType.Expense,
                FundingSourceType = FundingSourceType.CreditCard,
                FundingSourceId = chaseSapphire.Id,
                Frequency = RecurrenceFrequency.Monthly,
                NextRunDate = new DateTime(2026, 9, 15),
                IsActive = true,
                CreatedAt = new DateTime(2026, 2, 1),
                UpdatedAt = new DateTime(2026, 8, 15)
            },
            new RecurringTransaction
            {
                Description = "iCloud+ Storage",
                Merchant = "Apple",
                Amount = 2.99m,
                CategoryId = cloud.Id,
                TransactionType = TransactionType.Expense,
                FundingSourceType = FundingSourceType.CreditCard,
                FundingSourceId = appleCard.Id,
                Frequency = RecurrenceFrequency.Monthly,
                NextRunDate = new DateTime(2026, 9, 1),
                IsActive = true,
                CreatedAt = new DateTime(2026, 1, 1),
                UpdatedAt = new DateTime(2026, 8, 1)
            },
            // Paused recurring — to test toggle
            new RecurringTransaction
            {
                Description = "Adobe Creative Cloud",
                Merchant = "Adobe",
                Amount = 54.99m,
                CategoryId = software.Id,
                TransactionType = TransactionType.Expense,
                FundingSourceType = FundingSourceType.CreditCard,
                FundingSourceId = citiDoubleCash.Id,
                Frequency = RecurrenceFrequency.Monthly,
                NextRunDate = new DateTime(2026, 9, 10),
                IsActive = false,
                CreatedAt = new DateTime(2026, 1, 1),
                UpdatedAt = new DateTime(2026, 7, 10)
            },
            // Biweekly paycheck as income recurring
            new RecurringTransaction
            {
                Description = "Paycheck - Direct Deposit",
                Merchant = "Employer Inc",
                Amount = 3500m,
                CategoryId = salary.Id,
                TransactionType = TransactionType.Income,
                FundingSourceType = FundingSourceType.BankAccount,
                FundingSourceId = checking.Id,
                Frequency = RecurrenceFrequency.Biweekly,
                NextRunDate = new DateTime(2026, 9, 5),
                IsActive = true,
                CreatedAt = new DateTime(2026, 1, 1),
                UpdatedAt = new DateTime(2026, 8, 22)
            }
        );

        // ═══════════════════════════════════════════════════
        // BUDGET — monthly allocations
        // ═══════════════════════════════════════════════════
        context.BudgetExpenses.AddRange(
            // Fixed bills
            new BudgetExpense { Name = "Rent", CategoryId = rent.Id, Amount = 1650m, IsFixed = true, DueDay = 1, Frequency = PaymentFrequency.Monthly, IsAutopay = true },
            new BudgetExpense { Name = "Auto Insurance (Geico)", CategoryId = autoInsurance.Id, Amount = 165m, IsFixed = true, DueDay = 5, Frequency = PaymentFrequency.Monthly, IsAutopay = true },
            new BudgetExpense { Name = "Electric (TXU)", CategoryId = electric.Id, Amount = 120m, IsFixed = true, DueDay = 12, Frequency = PaymentFrequency.Monthly, IsAutopay = false },
            new BudgetExpense { Name = "Water & Sewer", CategoryId = water.Id, Amount = 45m, IsFixed = true, DueDay = 15, Frequency = PaymentFrequency.Monthly, IsAutopay = true },
            new BudgetExpense { Name = "Natural Gas (Atmos)", CategoryId = naturalGas.Id, Amount = 35m, IsFixed = true, DueDay = 20, Frequency = PaymentFrequency.Monthly, IsAutopay = true },
            new BudgetExpense { Name = "T-Mobile", CategoryId = phone.Id, Amount = 75m, IsFixed = true, DueDay = 18, Frequency = PaymentFrequency.Monthly, IsAutopay = true },
            new BudgetExpense { Name = "AT&T Fiber", CategoryId = internet.Id, Amount = 65m, IsFixed = true, DueDay = 22, Frequency = PaymentFrequency.Monthly, IsAutopay = true },
            new BudgetExpense { Name = "Streaming (Netflix + Hulu + Disney+)", CategoryId = streaming.Id, Amount = 38m, IsFixed = true, DueDay = 15, Frequency = PaymentFrequency.Monthly, IsAutopay = true },
            new BudgetExpense { Name = "Spotify Family", CategoryId = music.Id, Amount = 17m, IsFixed = true, DueDay = 8, Frequency = PaymentFrequency.Monthly, IsAutopay = true },
            new BudgetExpense { Name = "iCloud+ (200GB)", CategoryId = cloud.Id, Amount = 3m, IsFixed = true, DueDay = 1, Frequency = PaymentFrequency.Monthly, IsAutopay = true },
            new BudgetExpense { Name = "LA Fitness", CategoryId = gym.Id, Amount = 35m, IsFixed = true, DueDay = 1, Frequency = PaymentFrequency.Monthly, IsAutopay = true },
            new BudgetExpense { Name = "Renter's Insurance (Lemonade)", CategoryId = rentersInsurance.Id, Amount = 15m, IsFixed = true, DueDay = 10, Frequency = PaymentFrequency.Monthly, IsAutopay = true },

            // Variable spending
            new BudgetExpense { Name = "Groceries", CategoryId = groceries.Id, Amount = 550m, IsFixed = false, Frequency = PaymentFrequency.Monthly, IsAutopay = false },
            new BudgetExpense { Name = "Restaurants & Takeout", CategoryId = dining.Id, Amount = 200m, IsFixed = false, Frequency = PaymentFrequency.Monthly, IsAutopay = false },
            new BudgetExpense { Name = "Coffee", CategoryId = coffee.Id, Amount = 60m, IsFixed = false, Frequency = PaymentFrequency.Monthly, IsAutopay = false },
            new BudgetExpense { Name = "Gas & Fuel", CategoryId = gas.Id, Amount = 180m, IsFixed = false, Frequency = PaymentFrequency.Monthly, IsAutopay = false },
            new BudgetExpense { Name = "Entertainment", CategoryId = entertainment.Id, Amount = 100m, IsFixed = false, Frequency = PaymentFrequency.Monthly, IsAutopay = false },
            new BudgetExpense { Name = "Shopping", CategoryId = shopping.Id, Amount = 150m, IsFixed = false, Frequency = PaymentFrequency.Monthly, IsAutopay = false },
            new BudgetExpense { Name = "Personal Care & Grooming", CategoryId = personalCare.Id, Amount = 50m, IsFixed = false, Frequency = PaymentFrequency.Monthly, IsAutopay = false },
            new BudgetExpense { Name = "Clothing", CategoryId = clothing.Id, Amount = 75m, IsFixed = false, Frequency = PaymentFrequency.Monthly, IsAutopay = false }
        );

        // ═══════════════════════════════════════════════════
        // INCOME TRANSACTIONS — August 2026
        // ═══════════════════════════════════════════════════
        context.DailyExpenses.AddRange(
            new DailyExpense { Date = new DateTime(2026, 8, 8), CategoryId = salary.Id, Amount = 3500m, Description = "Biweekly paycheck", Merchant = "Employer Inc", TransactionType = TransactionType.Income, FundingSourceType = FundingSourceType.BankAccount, FundingSourceId = checking.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new DailyExpense { Date = new DateTime(2026, 8, 22), CategoryId = salary.Id, Amount = 3500m, Description = "Biweekly paycheck", Merchant = "Employer Inc", TransactionType = TransactionType.Income, FundingSourceType = FundingSourceType.BankAccount, FundingSourceId = checking.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new DailyExpense { Date = new DateTime(2026, 8, 15), CategoryId = freelance.Id, Amount = 750m, Description = "Consulting invoice - Acme Corp", Merchant = "Acme Corp", TransactionType = TransactionType.Income, FundingSourceType = FundingSourceType.BankAccount, FundingSourceId = checking.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new DailyExpense { Date = new DateTime(2026, 8, 1), CategoryId = interest.Id, Amount = 28.50m, Description = "Monthly HYSA interest", Merchant = "Marcus by Goldman Sachs", TransactionType = TransactionType.Income, FundingSourceType = FundingSourceType.BankAccount, FundingSourceId = savingsAcct.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        );

        // ═══════════════════════════════════════════════════
        // DAILY EXPENSES — realistic August 2026 spending
        // ═══════════════════════════════════════════════════
        context.DailyExpenses.AddRange(
            // Week 1 (Aug 1-7)
            new DailyExpense { Date = new DateTime(2026, 8, 1), CategoryId = groceries.Id, Amount = 82.47m, Description = "Weekly grocery run", Merchant = "H-E-B", TransactionType = TransactionType.Expense, FundingSourceType = FundingSourceType.BankAccount, FundingSourceId = checking.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new DailyExpense { Date = new DateTime(2026, 8, 1), CategoryId = coffee.Id, Amount = 6.75m, Description = "Iced latte", Merchant = "Starbucks", TransactionType = TransactionType.Expense, FundingSourceType = FundingSourceType.CreditCard, FundingSourceId = appleCard.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new DailyExpense { Date = new DateTime(2026, 8, 2), CategoryId = dining.Id, Amount = 42.30m, Description = "Dinner with friends", Merchant = "Torchy's Tacos", TransactionType = TransactionType.Expense, FundingSourceType = FundingSourceType.CreditCard, FundingSourceId = chaseSapphire.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new DailyExpense { Date = new DateTime(2026, 8, 3), CategoryId = gas.Id, Amount = 54.12m, Description = "Fill up", Merchant = "Costco Gas", TransactionType = TransactionType.Expense, FundingSourceType = FundingSourceType.BankAccount, FundingSourceId = checking.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new DailyExpense { Date = new DateTime(2026, 8, 4), CategoryId = coffee.Id, Amount = 5.95m, Description = "Cold brew", Merchant = "Dutch Bros", TransactionType = TransactionType.Expense, FundingSourceType = FundingSourceType.CreditCard, FundingSourceId = appleCard.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new DailyExpense { Date = new DateTime(2026, 8, 5), CategoryId = entertainment.Id, Amount = 14.99m, Description = "Movie ticket - Deadpool 4", Merchant = "AMC Theatres", TransactionType = TransactionType.Expense, FundingSourceType = FundingSourceType.CreditCard, FundingSourceId = chaseSapphire.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new DailyExpense { Date = new DateTime(2026, 8, 6), CategoryId = fastFood.Id, Amount = 12.80m, Description = "Lunch", Merchant = "Chipotle", TransactionType = TransactionType.Expense, FundingSourceType = FundingSourceType.CreditCard, FundingSourceId = citiDoubleCash.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new DailyExpense { Date = new DateTime(2026, 8, 7), CategoryId = shopping.Id, Amount = 34.99m, Description = "Bluetooth speaker", Merchant = "Amazon", TransactionType = TransactionType.Expense, FundingSourceType = FundingSourceType.CreditCard, FundingSourceId = chaseSapphire.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },

            // Week 2 (Aug 8-14)
            new DailyExpense { Date = new DateTime(2026, 8, 8), CategoryId = groceries.Id, Amount = 67.23m, Description = "Weekly groceries", Merchant = "Trader Joe's", TransactionType = TransactionType.Expense, FundingSourceType = FundingSourceType.BankAccount, FundingSourceId = checking.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new DailyExpense { Date = new DateTime(2026, 8, 8), CategoryId = personalCare.Id, Amount = 32.00m, Description = "Haircut", Merchant = "Sport Clips", TransactionType = TransactionType.Expense, FundingSourceType = FundingSourceType.BankAccount, FundingSourceId = checking.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new DailyExpense { Date = new DateTime(2026, 8, 9), CategoryId = coffee.Id, Amount = 7.25m, Description = "Oat milk latte", Merchant = "Local Coffee", TransactionType = TransactionType.Expense, FundingSourceType = FundingSourceType.CreditCard, FundingSourceId = appleCard.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new DailyExpense { Date = new DateTime(2026, 8, 10), CategoryId = gas.Id, Amount = 48.75m, Description = "Fill up", Merchant = "Shell", TransactionType = TransactionType.Expense, FundingSourceType = FundingSourceType.BankAccount, FundingSourceId = checking.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new DailyExpense { Date = new DateTime(2026, 8, 10), CategoryId = parking.Id, Amount = 8.00m, Description = "Downtown parking", Merchant = "ParkMobile", TransactionType = TransactionType.Expense, FundingSourceType = FundingSourceType.BankAccount, FundingSourceId = checking.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new DailyExpense { Date = new DateTime(2026, 8, 11), CategoryId = dining.Id, Amount = 68.50m, Description = "Anniversary dinner", Merchant = "Perry's Steakhouse", TransactionType = TransactionType.Expense, FundingSourceType = FundingSourceType.CreditCard, FundingSourceId = chaseSapphire.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new DailyExpense { Date = new DateTime(2026, 8, 12), CategoryId = healthcare.Id, Amount = 40.00m, Description = "Copay - annual checkup", Merchant = "Baylor Scott & White", TransactionType = TransactionType.Expense, FundingSourceType = FundingSourceType.BankAccount, FundingSourceId = checking.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new DailyExpense { Date = new DateTime(2026, 8, 13), CategoryId = fastFood.Id, Amount = 9.45m, Description = "Quick lunch", Merchant = "Chick-fil-A", TransactionType = TransactionType.Expense, FundingSourceType = FundingSourceType.CreditCard, FundingSourceId = citiDoubleCash.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new DailyExpense { Date = new DateTime(2026, 8, 14), CategoryId = shopping.Id, Amount = 56.78m, Description = "Running shoes on sale", Merchant = "Nike.com", TransactionType = TransactionType.Expense, FundingSourceType = FundingSourceType.CreditCard, FundingSourceId = citiDoubleCash.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },

            // Week 3 (Aug 15-21)
            new DailyExpense { Date = new DateTime(2026, 8, 15), CategoryId = groceries.Id, Amount = 95.60m, Description = "Big Costco haul", Merchant = "Costco", TransactionType = TransactionType.Expense, FundingSourceType = FundingSourceType.BankAccount, FundingSourceId = checking.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new DailyExpense { Date = new DateTime(2026, 8, 15), CategoryId = coffee.Id, Amount = 6.50m, Description = "Pour over", Merchant = "Starbucks", TransactionType = TransactionType.Expense, FundingSourceType = FundingSourceType.CreditCard, FundingSourceId = appleCard.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new DailyExpense { Date = new DateTime(2026, 8, 16), CategoryId = entertainment.Id, Amount = 45.00m, Description = "Concert tickets", Merchant = "Ticketmaster", TransactionType = TransactionType.Expense, FundingSourceType = FundingSourceType.CreditCard, FundingSourceId = chaseSapphire.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new DailyExpense { Date = new DateTime(2026, 8, 17), CategoryId = gas.Id, Amount = 52.30m, Description = "Fill up before road trip", Merchant = "Buc-ee's", TransactionType = TransactionType.Expense, FundingSourceType = FundingSourceType.BankAccount, FundingSourceId = checking.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new DailyExpense { Date = new DateTime(2026, 8, 17), CategoryId = dining.Id, Amount = 28.50m, Description = "Brunch", Merchant = "First Watch", TransactionType = TransactionType.Expense, FundingSourceType = FundingSourceType.CreditCard, FundingSourceId = chaseSapphire.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new DailyExpense { Date = new DateTime(2026, 8, 18), CategoryId = clothing.Id, Amount = 89.00m, Description = "Work shirts (2)", Merchant = "Nordstrom Rack", TransactionType = TransactionType.Expense, FundingSourceType = FundingSourceType.CreditCard, FundingSourceId = citiDoubleCash.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new DailyExpense { Date = new DateTime(2026, 8, 19), CategoryId = coffee.Id, Amount = 5.75m, Description = "Espresso", Merchant = "Dutch Bros", TransactionType = TransactionType.Expense, FundingSourceType = FundingSourceType.CreditCard, FundingSourceId = appleCard.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new DailyExpense { Date = new DateTime(2026, 8, 20), CategoryId = fastFood.Id, Amount = 15.20m, Description = "DoorDash delivery", Merchant = "Panda Express", TransactionType = TransactionType.Expense, FundingSourceType = FundingSourceType.CreditCard, FundingSourceId = chaseSapphire.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new DailyExpense { Date = new DateTime(2026, 8, 21), CategoryId = gifts.Id, Amount = 35.00m, Description = "Birthday gift for mom", Merchant = "Amazon", TransactionType = TransactionType.Expense, FundingSourceType = FundingSourceType.CreditCard, FundingSourceId = chaseSapphire.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },

            // Week 4 (Aug 22-24)
            new DailyExpense { Date = new DateTime(2026, 8, 22), CategoryId = groceries.Id, Amount = 71.35m, Description = "Weekly groceries", Merchant = "H-E-B", TransactionType = TransactionType.Expense, FundingSourceType = FundingSourceType.BankAccount, FundingSourceId = checking.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new DailyExpense { Date = new DateTime(2026, 8, 22), CategoryId = gas.Id, Amount = 49.88m, Description = "Fill up", Merchant = "Costco Gas", TransactionType = TransactionType.Expense, FundingSourceType = FundingSourceType.BankAccount, FundingSourceId = checking.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new DailyExpense { Date = new DateTime(2026, 8, 23), CategoryId = dining.Id, Amount = 55.00m, Description = "Date night - sushi", Merchant = "Uchi", TransactionType = TransactionType.Expense, FundingSourceType = FundingSourceType.CreditCard, FundingSourceId = chaseSapphire.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new DailyExpense { Date = new DateTime(2026, 8, 23), CategoryId = rideshare.Id, Amount = 18.50m, Description = "Uber to/from restaurant", Merchant = "Uber", TransactionType = TransactionType.Expense, FundingSourceType = FundingSourceType.CreditCard, FundingSourceId = chaseSapphire.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new DailyExpense { Date = new DateTime(2026, 8, 24), CategoryId = shopping.Id, Amount = 42.99m, Description = "Household supplies", Merchant = "Target", TransactionType = TransactionType.Expense, FundingSourceType = FundingSourceType.BankAccount, FundingSourceId = checking.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new DailyExpense { Date = new DateTime(2026, 8, 24), CategoryId = coffee.Id, Amount = 6.25m, Description = "Morning coffee", Merchant = "Starbucks", TransactionType = TransactionType.Expense, FundingSourceType = FundingSourceType.CreditCard, FundingSourceId = appleCard.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },

            // Card payment transaction (tests CardPayment type)
            new DailyExpense { Date = new DateTime(2026, 8, 5), CategoryId = savings.Id, Amount = 200m, Description = "Chase Sapphire payment", Merchant = "Chase", TransactionType = TransactionType.CardPayment, FundingSourceType = FundingSourceType.BankAccount, FundingSourceId = checking.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },

            // Refund transaction
            new DailyExpense { Date = new DateTime(2026, 8, 14), CategoryId = shopping.Id, Amount = 29.99m, Description = "Returned defective charger", Merchant = "Amazon", TransactionType = TransactionType.Refund, FundingSourceType = FundingSourceType.CreditCard, FundingSourceId = chaseSapphire.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },

            // Transfer between accounts
            new DailyExpense { Date = new DateTime(2026, 8, 10), CategoryId = emergencyFund.Id, Amount = 500m, Description = "Monthly savings transfer", Merchant = "Internal Transfer", TransactionType = TransactionType.Transfer, FundingSourceType = FundingSourceType.BankAccount, FundingSourceId = checking.Id, ToFundingSourceId = savingsAcct.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },

            // ── Tagged transactions: Austin Weekend Trip ──
            new DailyExpense { Date = new DateTime(2026, 8, 9), CategoryId = gas.Id, Amount = 45.00m, Description = "Gas to Austin", Merchant = "Buc-ee's", TransactionType = TransactionType.Expense, FundingSourceType = FundingSourceType.BankAccount, FundingSourceId = checking.Id, Tag = "Austin Weekend", TagType = "trip", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new DailyExpense { Date = new DateTime(2026, 8, 9), CategoryId = dining.Id, Amount = 85.00m, Description = "Dinner at Franklin BBQ", Merchant = "Franklin Barbecue", TransactionType = TransactionType.Expense, FundingSourceType = FundingSourceType.CreditCard, FundingSourceId = chaseSapphire.Id, Tag = "Austin Weekend", TagType = "trip", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new DailyExpense { Date = new DateTime(2026, 8, 9), CategoryId = entertainment.Id, Amount = 32.00m, Description = "Live music on 6th Street", Merchant = "Stubb's BBQ", TransactionType = TransactionType.Expense, FundingSourceType = FundingSourceType.CreditCard, FundingSourceId = chaseSapphire.Id, Tag = "Austin Weekend", TagType = "trip", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new DailyExpense { Date = new DateTime(2026, 8, 10), CategoryId = dining.Id, Amount = 28.00m, Description = "Brunch at Kerbey Lane", Merchant = "Kerbey Lane Cafe", TransactionType = TransactionType.Expense, FundingSourceType = FundingSourceType.CreditCard, FundingSourceId = chaseSapphire.Id, Tag = "Austin Weekend", TagType = "trip", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new DailyExpense { Date = new DateTime(2026, 8, 10), CategoryId = shopping.Id, Amount = 22.50m, Description = "Souvenirs from South Congress", Merchant = "South Congress Market", TransactionType = TransactionType.Expense, FundingSourceType = FundingSourceType.CreditCard, FundingSourceId = appleCard.Id, Tag = "Austin Weekend", TagType = "trip", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },

            // ── Tagged transactions: Work Expenses ──
            new DailyExpense { Date = new DateTime(2026, 8, 6), CategoryId = dining.Id, Amount = 45.00m, Description = "Client lunch meeting", Merchant = "Capital Grille", TransactionType = TransactionType.Expense, FundingSourceType = FundingSourceType.CreditCard, FundingSourceId = citiDoubleCash.Id, Tag = "Work", TagType = "business", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new DailyExpense { Date = new DateTime(2026, 8, 13), CategoryId = parking.Id, Amount = 15.00m, Description = "Parking at client office", Merchant = "SpotHero", TransactionType = TransactionType.Expense, FundingSourceType = FundingSourceType.BankAccount, FundingSourceId = checking.Id, Tag = "Work", TagType = "business", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new DailyExpense { Date = new DateTime(2026, 8, 20), CategoryId = rideshare.Id, Amount = 24.00m, Description = "Uber to conference", Merchant = "Uber", TransactionType = TransactionType.Expense, FundingSourceType = FundingSourceType.CreditCard, FundingSourceId = chaseSapphire.Id, Tag = "Work", TagType = "business", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        );

        // ═══════════════════════════════════════════════════
        // PAYMENT HISTORY — last 6 months of debt payments
        // (enables payment streak and debt trend features)
        // ═══════════════════════════════════════════════════
        StampAndSave(); // ensure loans/cards have IDs

        var payments = new List<PaymentHistory>();
        // SoFi loan — 6 months of payments
        for (int i = 5; i >= 0; i--)
        {
            payments.Add(new PaymentHistory
            {
                DebtType = DebtType.PersonalLoan,
                DebtId = sofiLoan.Id,
                AmountPaid = 518.96m,
                PaymentDate = new DateTime(2026, 8 - i, 15)
            });
        }
        // Marcus loan — 6 months
        for (int i = 5; i >= 0; i--)
        {
            payments.Add(new PaymentHistory
            {
                DebtType = DebtType.PersonalLoan,
                DebtId = marcusLoan.Id,
                AmountPaid = 389.42m,
                PaymentDate = new DateTime(2026, 8 - i, 1)
            });
        }
        // Toyota auto loan — 6 months
        for (int i = 5; i >= 0; i--)
        {
            payments.Add(new PaymentHistory
            {
                DebtType = DebtType.PersonalLoan,
                DebtId = autoLoan.Id,
                AmountPaid = 452.31m,
                PaymentDate = new DateTime(2026, 8 - i, 10)
            });
        }
        // Chase Sapphire — 6 months (varying amounts)
        decimal[] chasePayments = { 200m, 250m, 300m, 200m, 250m, 200m };
        for (int i = 5; i >= 0; i--)
        {
            payments.Add(new PaymentHistory
            {
                DebtType = DebtType.CreditCard,
                DebtId = chaseSapphire.Id,
                AmountPaid = chasePayments[5 - i],
                PaymentDate = new DateTime(2026, 8 - i, 22)
            });
        }
        // Citi Double Cash — 6 months
        for (int i = 5; i >= 0; i--)
        {
            payments.Add(new PaymentHistory
            {
                DebtType = DebtType.CreditCard,
                DebtId = citiDoubleCash.Id,
                AmountPaid = 100m,
                PaymentDate = new DateTime(2026, 8 - i, 5)
            });
        }
        // Amex — 6 months
        for (int i = 5; i >= 0; i--)
        {
            payments.Add(new PaymentHistory
            {
                DebtType = DebtType.CreditCard,
                DebtId = amexBlue.Id,
                AmountPaid = 150m,
                PaymentDate = new DateTime(2026, 8 - i, 18)
            });
        }
        // Apple Card — 6 months
        for (int i = 5; i >= 0; i--)
        {
            payments.Add(new PaymentHistory
            {
                DebtType = DebtType.CreditCard,
                DebtId = appleCard.Id,
                AmountPaid = 50m,
                PaymentDate = new DateTime(2026, 8 - i, 28)
            });
        }
        context.PaymentHistories.AddRange(payments);

        // ═══════════════════════════════════════════════════
        // MONTHLY SNAPSHOTS — 6 months of debt trend data
        // ═══════════════════════════════════════════════════
        decimal[] debtTotals = { 65200m, 63800m, 62400m, 61100m, 60500m, 59740m };
        decimal[] paidAmounts = { 1860m, 1910m, 1960m, 1860m, 1910m, 1860m };
        for (int i = 0; i < 6; i++)
        {
            context.MonthlySnapshots.Add(new MonthlySnapshot
            {
                Year = 2026,
                Month = 3 + i, // March through August
                TotalDebt = debtTotals[i],
                TotalPaidThisMonth = paidAmounts[i],
                DebtBalancesJson = $"{{\"SoFi\": {19800 - i * 260}, \"Marcus\": {13000 - i * 200}, \"Toyota\": {21000 - i * 250}, \"Chase\": {3800 - i * 100}, \"Citi\": {2450 - i * 100}, \"Amex\": {4800 - i * 100}, \"Apple\": {1250 - i * 50}}}",
                CreatedAt = new DateTime(2026, 3 + i, 28)
            });
        }

        StampAndSave();

        // ═══════════════════════════════════════════════════
        // TRADING — Setups, Rules, Limits, Trades, Reviews
        // ═══════════════════════════════════════════════════

        // Clear existing trading data
        if (userId != null)
        {
            context.TradeNotes.RemoveRange(context.TradeNotes.Where(x => x.UserId == userId));
            context.ChecklistResponses.RemoveRange(context.ChecklistResponses.Where(x => context.TradeEntries.Where(t => t.UserId == userId).Select(t => t.Id).Contains(x.TradeEntryId)));
            context.TradeEntries.RemoveRange(context.TradeEntries.Where(x => x.UserId == userId));
            context.DailyReviews.RemoveRange(context.DailyReviews.Where(x => x.UserId == userId));
            context.PreMarketNotes.RemoveRange(context.PreMarketNotes.Where(x => x.UserId == userId));
            context.PreMarketTemplates.RemoveRange(context.PreMarketTemplates.Where(x => x.UserId == userId));
            context.TradingRules.RemoveRange(context.TradingRules.Where(x => x.UserId == userId));
            context.DailyLimits.RemoveRange(context.DailyLimits.Where(x => x.UserId == userId));
            context.TradingGoalSnapshots.RemoveRange(context.TradingGoalSnapshots.Where(x => x.UserId == userId));
            context.TradingGoals.RemoveRange(context.TradingGoals.Where(x => x.UserId == userId));
            context.ChecklistItems.RemoveRange(context.ChecklistItems.Where(x => context.TradingSetups.Where(s => s.UserId == userId).Select(s => s.Id).Contains(x.SetupId)));
            context.TradingSetups.RemoveRange(context.TradingSetups.Where(x => x.UserId == userId));
        }
        context.SaveChanges();

        // Trading Setups with checklist items
        var creditSpread = new TradingSetup { Name = "Credit Spread", Description = "Sell premium with defined risk. Best in high IV environments." };
        var ironCondor = new TradingSetup { Name = "Iron Condor", Description = "Neutral strategy collecting premium on both sides. Works in range-bound markets." };
        var longCall = new TradingSetup { Name = "Long Call / Put", Description = "Directional play with limited risk. Use on high-conviction moves." };
        var calendarSpread = new TradingSetup { Name = "Calendar Spread", Description = "Exploit time decay differential between near and far expirations." };

        context.TradingSetups.AddRange(creditSpread, ironCondor, longCall, calendarSpread);
        StampAndSave();

        context.ChecklistItems.AddRange(
            new ChecklistItem { SetupId = creditSpread.Id, Label = "IV rank above 30%", OrderIndex = 0 },
            new ChecklistItem { SetupId = creditSpread.Id, Label = "Checked earnings calendar — no event before expiration", OrderIndex = 1 },
            new ChecklistItem { SetupId = creditSpread.Id, Label = "Short strike at or beyond 1 SD", OrderIndex = 2 },
            new ChecklistItem { SetupId = creditSpread.Id, Label = "Risk/reward at least 1:2 (credit vs width)", OrderIndex = 3 },
            new ChecklistItem { SetupId = creditSpread.Id, Label = "Position size within 5% of account", OrderIndex = 4 },
            new ChecklistItem { SetupId = creditSpread.Id, Label = "Defined exit plan (50% profit target, 2x loss stop)", OrderIndex = 5 },

            new ChecklistItem { SetupId = ironCondor.Id, Label = "IV rank above 40%", OrderIndex = 0 },
            new ChecklistItem { SetupId = ironCondor.Id, Label = "No major catalysts before expiration", OrderIndex = 1 },
            new ChecklistItem { SetupId = ironCondor.Id, Label = "Underlying in defined range for 2+ weeks", OrderIndex = 2 },
            new ChecklistItem { SetupId = ironCondor.Id, Label = "Strikes beyond expected move", OrderIndex = 3 },
            new ChecklistItem { SetupId = ironCondor.Id, Label = "Max loss acceptable if both sides tested", OrderIndex = 4 },

            new ChecklistItem { SetupId = longCall.Id, Label = "Clear directional thesis with catalyst", OrderIndex = 0 },
            new ChecklistItem { SetupId = longCall.Id, Label = "IV not elevated (avoid crush)", OrderIndex = 1 },
            new ChecklistItem { SetupId = longCall.Id, Label = "At least 30 DTE for time", OrderIndex = 2 },
            new ChecklistItem { SetupId = longCall.Id, Label = "Risk limited to amount willing to lose 100%", OrderIndex = 3 },

            new ChecklistItem { SetupId = calendarSpread.Id, Label = "IV term structure in contango", OrderIndex = 0 },
            new ChecklistItem { SetupId = calendarSpread.Id, Label = "Near-term expiration has event or high IV", OrderIndex = 1 },
            new ChecklistItem { SetupId = calendarSpread.Id, Label = "Underlying near strike price", OrderIndex = 2 },
            new ChecklistItem { SetupId = calendarSpread.Id, Label = "Back month has 45+ DTE", OrderIndex = 3 }
        );

        // Trading Rules (playbook)
        context.TradingRules.AddRange(
            new TradingRule { Text = "Never risk more than 2% of account on a single trade", Category = "risk", OrderIndex = 0 },
            new TradingRule { Text = "No trading in the first 15 minutes after market open", Category = "entry", OrderIndex = 1 },
            new TradingRule { Text = "Always complete the pre-market checklist before placing any trade", Category = "process", OrderIndex = 2 },
            new TradingRule { Text = "Take 50% off at profit target, let the rest run with a trailing stop", Category = "exit", OrderIndex = 3 },
            new TradingRule { Text = "Stop trading for the day after 3 consecutive losses", Category = "risk", OrderIndex = 4 },
            new TradingRule { Text = "No revenge trades — if stopped out, wait 30 minutes before next entry", Category = "psychology", OrderIndex = 5 },
            new TradingRule { Text = "Only trade setups from the playbook — no impulse trades", Category = "entry", OrderIndex = 6 },
            new TradingRule { Text = "Complete the daily review every trading day, even if no trades", Category = "process", OrderIndex = 7 },
            new TradingRule { Text = "Scale position size down by 50% after a red week", Category = "risk", OrderIndex = 8 },
            new TradingRule { Text = "No trading when feeling anxious, angry, or euphoric", Category = "psychology", OrderIndex = 9 }
        );

        // Daily Limits
        context.DailyLimits.Add(new DailyLimits
        {
            MaxTradesPerDay = 4,
            MaxDailyLoss = 400,
            StopAfterConsecutiveLosses = 3
        });

        // Pre-Market Template
        context.PreMarketTemplates.Add(new PreMarketTemplate
        {
            KeyLevels = "SPX: Support _____ / Resistance _____\nQQQ: Support _____ / Resistance _____\nVIX: Current _____",
            Catalysts = "Economic data:\nEarnings:\nFed speakers:",
            Plan = "1. Market bias and reasoning:\n2. Primary setup to watch:\n3. Max trades today:\n4. Stop-loss level for the day:"
        });

        StampAndSave();

        // Trade Entries — 3 weeks of realistic options trades
        var trade1 = new TradeEntry
        {
            Date = new DateTime(2026, 9, 2),
            SetupId = creditSpread.Id,
            Instrument = "SPY",
            Direction = "short",
            AssetType = "Options",
            OptionType = "put",
            SpreadType = "credit-spread",
            StrikePrice = 540m,
            StrikePrice2 = 535m,
            ExpirationDate = new DateTime(2026, 9, 19),
            EntryPremium = 1.85m,
            ExitPremium = 0.45m,
            EntryPrice = 1.85m,
            ExitPrice = 0.45m,
            Quantity = 5,
            Multiplier = 100,
            Pnl = 700m,
            NetPnl = 693.40m,
            CommissionFees = 6.50m,
            RegExchangeFees = 0.10m,
            TotalFees = 6.60m,
            ChecklistCompleted = true,
            EmotionAtEntry = "focused",
            Status = "Closed",
            ClosedDate = new DateTime(2026, 9, 10),
            EntryTime = "10:15",
            ExitTime = "14:30",
            PlannedRisk = 350m,
            Notes = "Clean setup — IV rank 42, put below 1SD. Took profit at 50% target as planned.",
            Tags = "[\"winner\",\"disciplined\"]",
            BankAccountId = brokerage.Id
        };
        var trade2 = new TradeEntry
        {
            Date = new DateTime(2026, 9, 5),
            SetupId = longCall.Id,
            Instrument = "AAPL",
            Direction = "long",
            AssetType = "Options",
            OptionType = "call",
            SpreadType = "single",
            StrikePrice = 230m,
            ExpirationDate = new DateTime(2026, 10, 17),
            EntryPremium = 4.20m,
            ExitPremium = 2.10m,
            EntryPrice = 4.20m,
            ExitPrice = 2.10m,
            Quantity = 2,
            Multiplier = 100,
            Pnl = -420m,
            NetPnl = -423.30m,
            CommissionFees = 2.60m,
            RegExchangeFees = 0.70m,
            TotalFees = 3.30m,
            ChecklistCompleted = true,
            EmotionAtEntry = "confident",
            Status = "Closed",
            ClosedDate = new DateTime(2026, 9, 9),
            EntryTime = "10:45",
            ExitTime = "11:20",
            PlannedRisk = 420m,
            Notes = "Thesis was right but timing was off. AAPL sold off on broader market weakness. Took the loss at planned stop.",
            Tags = "[\"loser\",\"disciplined\"]",
            MistakeTags = "[\"bad-timing\"]",
            BankAccountId = brokerage.Id
        };
        var trade3 = new TradeEntry
        {
            Date = new DateTime(2026, 9, 9),
            SetupId = ironCondor.Id,
            Instrument = "QQQ",
            Direction = "short",
            AssetType = "Options",
            OptionType = "put",
            SpreadType = "iron-condor",
            StrikePrice = 480m,
            StrikePrice2 = 475m,
            StrikePrice3 = 500m,
            StrikePrice4 = 505m,
            ExpirationDate = new DateTime(2026, 9, 19),
            EntryPremium = 2.40m,
            ExitPremium = 1.20m,
            EntryPrice = 2.40m,
            ExitPrice = 1.20m,
            Quantity = 3,
            Multiplier = 100,
            Pnl = 360m,
            NetPnl = 354.10m,
            CommissionFees = 5.20m,
            RegExchangeFees = 0.70m,
            TotalFees = 5.90m,
            ChecklistCompleted = true,
            EmotionAtEntry = "calm",
            Status = "Closed",
            ClosedDate = new DateTime(2026, 9, 16),
            EntryTime = "10:30",
            ExitTime = "13:45",
            PlannedRisk = 450m,
            Notes = "QQQ stayed range-bound all week. Perfect environment for iron condor. Closed at 50% profit.",
            Tags = "[\"winner\",\"disciplined\"]",
            BankAccountId = brokerage.Id
        };
        var trade4 = new TradeEntry
        {
            Date = new DateTime(2026, 9, 12),
            SetupId = creditSpread.Id,
            Instrument = "TSLA",
            Direction = "short",
            AssetType = "Options",
            OptionType = "call",
            SpreadType = "credit-spread",
            StrikePrice = 280m,
            StrikePrice2 = 285m,
            ExpirationDate = new DateTime(2026, 9, 19),
            EntryPremium = 1.50m,
            ExitPremium = 3.80m,
            EntryPrice = 1.50m,
            ExitPrice = 3.80m,
            Quantity = 4,
            Multiplier = 100,
            Pnl = -920m,
            NetPnl = -925.20m,
            CommissionFees = 5.20m,
            RegExchangeFees = 0m,
            TotalFees = 5.20m,
            ChecklistCompleted = true,
            EmotionAtEntry = "anxious",
            IsRevengeTrading = true,
            Status = "Closed",
            ClosedDate = new DateTime(2026, 9, 15),
            EntryTime = "09:45",
            ExitTime = "10:10",
            PlannedRisk = 500m,
            Notes = "Entered too early — TSLA squeezed after Elon tweet. This was a revenge trade after the AAPL loss. Broke my 30-minute rule.",
            Tags = "[\"loser\",\"revenge\"]",
            MistakeTags = "[\"revenge-trade\",\"broke-rules\",\"early-entry\"]",
            BankAccountId = brokerage.Id
        };
        var trade5 = new TradeEntry
        {
            Date = new DateTime(2026, 9, 16),
            SetupId = creditSpread.Id,
            Instrument = "SPY",
            Direction = "short",
            AssetType = "Options",
            OptionType = "put",
            SpreadType = "credit-spread",
            StrikePrice = 545m,
            StrikePrice2 = 540m,
            ExpirationDate = new DateTime(2026, 10, 17),
            EntryPremium = 2.10m,
            EntryPrice = 2.10m,
            Quantity = 3,
            Multiplier = 100,
            ChecklistCompleted = true,
            EmotionAtEntry = "focused",
            Status = "Open",
            EntryTime = "11:00",
            PlannedRisk = 270m,
            Notes = "Solid setup — IV rank 38, well below support. Aiming for 50% profit target.",
            Tags = "[\"active\"]",
            BankAccountId = brokerage.Id
        };
        var trade6 = new TradeEntry
        {
            Date = new DateTime(2026, 9, 19),
            SetupId = calendarSpread.Id,
            Instrument = "AMZN",
            Direction = "long",
            AssetType = "Options",
            OptionType = "call",
            SpreadType = "calendar",
            StrikePrice = 195m,
            ExpirationDate = new DateTime(2026, 10, 3),
            EntryPremium = 3.50m,
            ExitPremium = 5.20m,
            EntryPrice = 3.50m,
            ExitPrice = 5.20m,
            Quantity = 2,
            Multiplier = 100,
            Pnl = 340m,
            NetPnl = 336.70m,
            CommissionFees = 2.60m,
            RegExchangeFees = 0.70m,
            TotalFees = 3.30m,
            ChecklistCompleted = true,
            EmotionAtEntry = "calm",
            Status = "Closed",
            ClosedDate = new DateTime(2026, 9, 22),
            EntryTime = "10:20",
            ExitTime = "14:00",
            PlannedRisk = 350m,
            Notes = "Near-term IV crushed after FOMC, back month held. Textbook calendar play.",
            Tags = "[\"winner\",\"disciplined\"]",
            BankAccountId = brokerage.Id
        };

        context.TradeEntries.AddRange(trade1, trade2, trade3, trade4, trade5, trade6);
        StampAndSave();

        // Trade Notes (in-trade observations)
        context.TradeNotes.AddRange(
            new TradeNote { TradeEntryId = trade1.Id, Note = "SPY holding above support, looking good for time decay", Emotion = "calm" },
            new TradeNote { TradeEntryId = trade1.Id, Note = "Hit 50% profit — closing as planned", Emotion = "satisfied" },
            new TradeNote { TradeEntryId = trade4.Id, Note = "TSLA spiking — this is going against me. Should have waited.", Emotion = "anxious" },
            new TradeNote { TradeEntryId = trade4.Id, Note = "Cutting the loss. Need to step away from the screen.", Emotion = "frustrated" },
            new TradeNote { TradeEntryId = trade5.Id, Note = "Market dipped but holding position — still within plan", Emotion = "focused" }
        );

        // Pre-Market Notes (last 2 weeks)
        context.PreMarketNotes.AddRange(
            new PreMarketNote
            {
                Date = new DateTime(2026, 9, 2),
                MentalState = "green",
                MarketBias = "bullish",
                Plan = "Look for put credit spreads on SPY if we hold above 548. IV elevated from holiday weekend.",
                KeyLevels = "SPX: 5480 support / 5520 resistance\nQQQ: 488 / 495\nVIX: 16.2",
                Catalysts = "ISM Manufacturing at 10am\nLabor Day weekend positioning unwinding",
                MaxTrades = 3,
                MaxLoss = 400m,
                EmotionalPlan = "Slept well, feeling rested. No emotional baggage from last week."
            },
            new PreMarketNote
            {
                Date = new DateTime(2026, 9, 5),
                MentalState = "green",
                MarketBias = "bullish",
                Plan = "AAPL showing strength ahead of event. Looking at long calls with 30+ DTE.",
                KeyLevels = "AAPL: 225 support / 235 resistance\nSPX: 5500 / 5550",
                Catalysts = "AAPL product launch rumors\nJobs report",
                MaxTrades = 2,
                MaxLoss = 500m,
                EmotionalPlan = "Good headspace. Focused on following the plan."
            },
            new PreMarketNote
            {
                Date = new DateTime(2026, 9, 9),
                MentalState = "yellow",
                MarketBias = "neutral",
                Plan = "Market feels range-bound. Iron condor on QQQ looks attractive. Being cautious after AAPL loss.",
                KeyLevels = "QQQ: 480 / 500 range\nVIX: 18.5",
                Catalysts = "CPI Wednesday — staying small today",
                MaxTrades = 2,
                MaxLoss = 300m,
                MentalStateNotes = "Still processing AAPL loss. Reminding myself it was a disciplined exit.",
                EmotionalPlan = "Acknowledge the frustration. Stick to neutral strategies today."
            },
            new PreMarketNote
            {
                Date = new DateTime(2026, 9, 12),
                MentalState = "yellow",
                MarketBias = "bearish",
                Plan = "Looking for call credit spreads on names showing weakness. TSLA at resistance.",
                KeyLevels = "TSLA: 270 support / 280 resistance\nSPX: 5450 / 5500",
                Catalysts = "PPI data\nTSLA delivery concerns",
                MaxTrades = 2,
                MaxLoss = 400m,
                MentalStateNotes = "Feeling the urge to make back losses. Need to be extra careful.",
                EmotionalPlan = "Red flag — revenge trading potential. Smaller size, wider stops."
            },
            new PreMarketNote
            {
                Date = new DateTime(2026, 9, 16),
                MentalState = "green",
                MarketBias = "neutral",
                Plan = "FOMC week. Selling premium on SPY — vol expansion expected. Conservative positioning.",
                KeyLevels = "SPX: 5480 / 5550\nVIX: 19.8",
                Catalysts = "Retail sales\nFOMC Wednesday",
                MaxTrades = 2,
                MaxLoss = 300m,
                EmotionalPlan = "Weekend reset helped. Clear head. Smaller size this week — FOMC uncertainty."
            },
            new PreMarketNote
            {
                Date = new DateTime(2026, 9, 19),
                MentalState = "green",
                MarketBias = "bullish",
                Plan = "Post-FOMC rally. Calendar spread on AMZN — near term IV crushed, back month holding.",
                KeyLevels = "AMZN: 192 / 198\nSPX: 5550 / 5600",
                Catalysts = "FOMC aftermath — dovish tone\nQuad witching",
                MaxTrades = 2,
                MaxLoss = 400m,
                EmotionalPlan = "Feeling great after the Fed cut. Staying disciplined — euphoria is dangerous."
            }
        );

        // Daily Reviews
        context.DailyReviews.AddRange(
            new DailyReview
            {
                Date = new DateTime(2026, 9, 2),
                Grade = "A",
                FollowedPlan = true,
                FollowedRules = true,
                TotalTrades = 1,
                TotalPnl = 693.40m,
                LessonsLearned = "Patience paid off. Waited for the setup and executed the plan perfectly.",
                ImprovementNote = "Could have sized up slightly — confidence was high and setup was textbook.",
                EmotionalSummary = "Calm and focused all day."
            },
            new DailyReview
            {
                Date = new DateTime(2026, 9, 5),
                Grade = "B",
                FollowedPlan = true,
                FollowedRules = true,
                TotalTrades = 1,
                TotalPnl = -423.30m,
                LessonsLearned = "Thesis was correct but timing was early. Market needed more time to digest jobs data.",
                ImprovementNote = "Consider waiting until after major data releases to enter directional trades.",
                EmotionalSummary = "Disappointed but not frustrated. Good loss — followed the plan."
            },
            new DailyReview
            {
                Date = new DateTime(2026, 9, 9),
                Grade = "A",
                FollowedPlan = true,
                FollowedRules = true,
                TotalTrades = 1,
                TotalPnl = 354.10m,
                LessonsLearned = "Neutral strategies work well when uncertain. Iron condor was the right call.",
                ImprovementNote = "Trust the process — yellow mental state doesn't mean don't trade, it means trade appropriately.",
                EmotionalSummary = "Started cautious, ended satisfied."
            },
            new DailyReview
            {
                Date = new DateTime(2026, 9, 12),
                Grade = "D",
                FollowedPlan = false,
                FollowedRules = false,
                TotalTrades = 1,
                TotalPnl = -925.20m,
                RulesViolated = "No revenge trades,Wait 30 min after loss,Only trade setups from playbook",
                LessonsLearned = "Revenge trading is the #1 account killer. I knew it and did it anyway. The yellow mental state was a warning I ignored.",
                ImprovementNote = "When mental state is yellow AND I'm processing a loss, skip the day entirely. No exceptions.",
                EmotionalSummary = "Angry at myself. This was 100% avoidable."
            },
            new DailyReview
            {
                Date = new DateTime(2026, 9, 16),
                Grade = "B",
                FollowedPlan = true,
                FollowedRules = true,
                TotalTrades = 1,
                TotalPnl = 0m,
                LessonsLearned = "Good entry on SPY spread. Still open — patience. No need to check P&L every 5 minutes.",
                ImprovementNote = "Trust the trade thesis and let it work.",
                EmotionalSummary = "Focused and disciplined. Good recovery week mentally."
            },
            new DailyReview
            {
                Date = new DateTime(2026, 9, 19),
                Grade = "A",
                FollowedPlan = true,
                FollowedRules = true,
                TotalTrades = 1,
                TotalPnl = 336.70m,
                LessonsLearned = "Calendar spreads after FOMC are a goldmine when vol term structure normalizes.",
                ImprovementNote = "Add this to the playbook as a recurring setup.",
                EmotionalSummary = "Calm and confident. Good execution."
            },
            // Observation-only day
            new DailyReview
            {
                Date = new DateTime(2026, 9, 15),
                Grade = "A",
                FollowedPlan = true,
                FollowedRules = true,
                TotalTrades = 0,
                TotalPnl = 0m,
                IsObservationOnly = true,
                MarketCondition = "volatile",
                MarketObservation = "FOMC anticipation driving wild swings. Smart to sit out. Observed SPX whipsaw — would have been stopped out on any position.",
                LessonsLearned = "Sitting out IS a valid trading decision. Protecting capital is priority #1.",
                EmotionalSummary = "Proud of the discipline to sit this one out."
            }
        );

        // Trading Goals
        context.TradingGoals.AddRange(
            new TradingGoal { Metric = "winRate", Operator = "gte", TargetValue = 60m, Timeframe = "weekly" },
            new TradingGoal { Metric = "avgRMultiple", Operator = "gte", TargetValue = 1.5m, Timeframe = "weekly" },
            new TradingGoal { Metric = "maxDailyLoss", Operator = "lte", TargetValue = 500m, Timeframe = "daily" },
            new TradingGoal { Metric = "checklistRate", Operator = "gte", TargetValue = 100m, Timeframe = "daily" },
            new TradingGoal { Metric = "revengeTradeCount", Operator = "lte", TargetValue = 0m, Timeframe = "weekly" }
        );

        StampAndSave();

        // ═══════════════════════════════════════════════════
        // HEALTH — Metrics, Blood Work, Workout Plans & Logs
        // ═══════════════════════════════════════════════════

        // Clear existing health data
        if (userId != null)
        {
            context.ExerciseSets.RemoveRange(context.ExerciseSets.Where(x => context.WorkoutLogs.Where(w => w.UserId == userId).Select(w => w.Id).Contains(x.WorkoutLogId)));
            context.WorkoutLogs.RemoveRange(context.WorkoutLogs.Where(x => x.UserId == userId));
            context.PlannedExercises.RemoveRange(context.PlannedExercises.Where(x => context.WorkoutPlanDays.Where(d => context.WorkoutPlans.Where(p => p.UserId == userId).Select(p => p.Id).Contains(d.PlanId)).Select(d => d.Id).Contains(x.PlanDayId)));
            context.WorkoutPlanDays.RemoveRange(context.WorkoutPlanDays.Where(x => context.WorkoutPlans.Where(p => p.UserId == userId).Select(p => p.Id).Contains(x.PlanId)));
            context.WorkoutPlans.RemoveRange(context.WorkoutPlans.Where(x => x.UserId == userId));
            context.BloodWorkResults.RemoveRange(context.BloodWorkResults.Where(x => context.BloodWorkReports.Where(r => r.UserId == userId).Select(r => r.Id).Contains(x.ReportId)));
            context.BloodWorkReports.RemoveRange(context.BloodWorkReports.Where(x => x.UserId == userId));
            context.HealthMetrics.RemoveRange(context.HealthMetrics.Where(x => x.UserId == userId));
        }
        context.SaveChanges();

        // Health Metrics — 4 weeks of daily vitals
        var healthMetrics = new List<HealthMetric>();
        var rng = new Random(42);
        for (int day = 0; day < 28; day++)
        {
            var date = new DateTime(2026, 8, 27).AddDays(day);
            healthMetrics.Add(new HealthMetric { MetricType = "weight", Value = 178m - day * 0.1m + (decimal)(rng.NextDouble() * 1.5 - 0.75), Unit = "lbs", MeasuredAt = date });
            healthMetrics.Add(new HealthMetric { MetricType = "body_fat", Value = 18.5m - day * 0.03m + (decimal)(rng.NextDouble() * 0.4 - 0.2), Unit = "%", MeasuredAt = date });
            healthMetrics.Add(new HealthMetric { MetricType = "blood_pressure_systolic", Value = 122m + (decimal)(rng.NextDouble() * 8 - 4), Unit = "mmHg", MeasuredAt = date });
            healthMetrics.Add(new HealthMetric { MetricType = "blood_pressure_diastolic", Value = 78m + (decimal)(rng.NextDouble() * 6 - 3), Unit = "mmHg", MeasuredAt = date });
            healthMetrics.Add(new HealthMetric { MetricType = "resting_heart_rate", Value = 62m + (decimal)(rng.NextDouble() * 8 - 4), Unit = "bpm", MeasuredAt = date });
            if (day % 7 == 0)
                healthMetrics.Add(new HealthMetric { MetricType = "sleep_hours", Value = 7.2m + (decimal)(rng.NextDouble() * 1.5 - 0.75), Unit = "hours", MeasuredAt = date, Notes = day == 0 ? "Started tracking sleep more seriously" : null });
        }
        context.HealthMetrics.AddRange(healthMetrics);
        StampAndSave();

        // Blood Work Reports
        var bloodWork1 = new BloodWorkReport
        {
            ReportDate = new DateTime(2026, 3, 15),
            LabName = "Quest Diagnostics",
            Notes = "Annual physical — baseline blood work"
        };
        var bloodWork2 = new BloodWorkReport
        {
            ReportDate = new DateTime(2026, 9, 10),
            LabName = "Quest Diagnostics",
            Notes = "6-month follow-up — checking cholesterol improvements after diet changes"
        };
        context.BloodWorkReports.AddRange(bloodWork1, bloodWork2);
        StampAndSave();

        context.BloodWorkResults.AddRange(
            // March report
            new BloodWorkResult { ReportId = bloodWork1.Id, TestName = "Total Cholesterol", Value = 215m, Unit = "mg/dL", ReferenceMin = 0, ReferenceMax = 200 },
            new BloodWorkResult { ReportId = bloodWork1.Id, TestName = "LDL Cholesterol", Value = 138m, Unit = "mg/dL", ReferenceMin = 0, ReferenceMax = 100 },
            new BloodWorkResult { ReportId = bloodWork1.Id, TestName = "HDL Cholesterol", Value = 52m, Unit = "mg/dL", ReferenceMin = 40, ReferenceMax = 999 },
            new BloodWorkResult { ReportId = bloodWork1.Id, TestName = "Triglycerides", Value = 145m, Unit = "mg/dL", ReferenceMin = 0, ReferenceMax = 150 },
            new BloodWorkResult { ReportId = bloodWork1.Id, TestName = "Fasting Glucose", Value = 95m, Unit = "mg/dL", ReferenceMin = 70, ReferenceMax = 100 },
            new BloodWorkResult { ReportId = bloodWork1.Id, TestName = "HbA1c", Value = 5.4m, Unit = "%", ReferenceMin = 0, ReferenceMax = 5.7m },
            new BloodWorkResult { ReportId = bloodWork1.Id, TestName = "Vitamin D", Value = 28m, Unit = "ng/mL", ReferenceMin = 30, ReferenceMax = 100 },
            new BloodWorkResult { ReportId = bloodWork1.Id, TestName = "TSH", Value = 2.1m, Unit = "mIU/L", ReferenceMin = 0.4m, ReferenceMax = 4.0m },
            new BloodWorkResult { ReportId = bloodWork1.Id, TestName = "Testosterone", Value = 520m, Unit = "ng/dL", ReferenceMin = 300, ReferenceMax = 1000 },
            // September follow-up (improvements)
            new BloodWorkResult { ReportId = bloodWork2.Id, TestName = "Total Cholesterol", Value = 195m, Unit = "mg/dL", ReferenceMin = 0, ReferenceMax = 200 },
            new BloodWorkResult { ReportId = bloodWork2.Id, TestName = "LDL Cholesterol", Value = 115m, Unit = "mg/dL", ReferenceMin = 0, ReferenceMax = 100 },
            new BloodWorkResult { ReportId = bloodWork2.Id, TestName = "HDL Cholesterol", Value = 58m, Unit = "mg/dL", ReferenceMin = 40, ReferenceMax = 999 },
            new BloodWorkResult { ReportId = bloodWork2.Id, TestName = "Triglycerides", Value = 120m, Unit = "mg/dL", ReferenceMin = 0, ReferenceMax = 150 },
            new BloodWorkResult { ReportId = bloodWork2.Id, TestName = "Fasting Glucose", Value = 90m, Unit = "mg/dL", ReferenceMin = 70, ReferenceMax = 100 },
            new BloodWorkResult { ReportId = bloodWork2.Id, TestName = "HbA1c", Value = 5.2m, Unit = "%", ReferenceMin = 0, ReferenceMax = 5.7m },
            new BloodWorkResult { ReportId = bloodWork2.Id, TestName = "Vitamin D", Value = 42m, Unit = "ng/mL", ReferenceMin = 30, ReferenceMax = 100 },
            new BloodWorkResult { ReportId = bloodWork2.Id, TestName = "TSH", Value = 1.9m, Unit = "mIU/L", ReferenceMin = 0.4m, ReferenceMax = 4.0m },
            new BloodWorkResult { ReportId = bloodWork2.Id, TestName = "Testosterone", Value = 580m, Unit = "ng/dL", ReferenceMin = 300, ReferenceMax = 1000 }
        );

        // Workout Plan — Push/Pull/Legs
        var pplPlan = new WorkoutPlan { Name = "Push / Pull / Legs", IsActive = true, IsSequential = true };
        context.WorkoutPlans.Add(pplPlan);
        StampAndSave();

        var pushDay = new WorkoutPlanDay { PlanId = pplPlan.Id, DayOfWeek = 1, FocusArea = "Push (Chest, Shoulders, Triceps)" };
        var pullDay = new WorkoutPlanDay { PlanId = pplPlan.Id, DayOfWeek = 2, FocusArea = "Pull (Back, Biceps)" };
        var legDay = new WorkoutPlanDay { PlanId = pplPlan.Id, DayOfWeek = 3, FocusArea = "Legs & Core" };
        context.WorkoutPlanDays.AddRange(pushDay, pullDay, legDay);
        StampAndSave();

        context.PlannedExercises.AddRange(
            // Push day
            new PlannedExercise { PlanDayId = pushDay.Id, ExerciseName = "Bench Press", TargetSets = 4, TargetReps = "8-10", TargetWeight = 185m, OrderIndex = 0, MuscleGroup = "Chest" },
            new PlannedExercise { PlanDayId = pushDay.Id, ExerciseName = "Overhead Press", TargetSets = 3, TargetReps = "8-10", TargetWeight = 115m, OrderIndex = 1, MuscleGroup = "Shoulders" },
            new PlannedExercise { PlanDayId = pushDay.Id, ExerciseName = "Incline Dumbbell Press", TargetSets = 3, TargetReps = "10-12", TargetWeight = 65m, OrderIndex = 2, MuscleGroup = "Chest" },
            new PlannedExercise { PlanDayId = pushDay.Id, ExerciseName = "Lateral Raises", TargetSets = 3, TargetReps = "12-15", TargetWeight = 20m, OrderIndex = 3, MuscleGroup = "Shoulders" },
            new PlannedExercise { PlanDayId = pushDay.Id, ExerciseName = "Tricep Pushdowns", TargetSets = 3, TargetReps = "12-15", TargetWeight = 50m, OrderIndex = 4, MuscleGroup = "Triceps" },
            // Pull day
            new PlannedExercise { PlanDayId = pullDay.Id, ExerciseName = "Deadlift", TargetSets = 4, TargetReps = "5-6", TargetWeight = 275m, OrderIndex = 0, MuscleGroup = "Back" },
            new PlannedExercise { PlanDayId = pullDay.Id, ExerciseName = "Barbell Rows", TargetSets = 4, TargetReps = "8-10", TargetWeight = 155m, OrderIndex = 1, MuscleGroup = "Back" },
            new PlannedExercise { PlanDayId = pullDay.Id, ExerciseName = "Pull-ups", TargetSets = 3, TargetReps = "8-10", OrderIndex = 2, MuscleGroup = "Back" },
            new PlannedExercise { PlanDayId = pullDay.Id, ExerciseName = "Face Pulls", TargetSets = 3, TargetReps = "15-20", TargetWeight = 30m, OrderIndex = 3, MuscleGroup = "Rear Delts" },
            new PlannedExercise { PlanDayId = pullDay.Id, ExerciseName = "Barbell Curls", TargetSets = 3, TargetReps = "10-12", TargetWeight = 65m, OrderIndex = 4, MuscleGroup = "Biceps" },
            // Leg day
            new PlannedExercise { PlanDayId = legDay.Id, ExerciseName = "Squats", TargetSets = 4, TargetReps = "6-8", TargetWeight = 225m, OrderIndex = 0, MuscleGroup = "Quads" },
            new PlannedExercise { PlanDayId = legDay.Id, ExerciseName = "Romanian Deadlift", TargetSets = 3, TargetReps = "8-10", TargetWeight = 185m, OrderIndex = 1, MuscleGroup = "Hamstrings" },
            new PlannedExercise { PlanDayId = legDay.Id, ExerciseName = "Leg Press", TargetSets = 3, TargetReps = "10-12", TargetWeight = 360m, OrderIndex = 2, MuscleGroup = "Quads" },
            new PlannedExercise { PlanDayId = legDay.Id, ExerciseName = "Leg Curls", TargetSets = 3, TargetReps = "12-15", TargetWeight = 90m, OrderIndex = 3, MuscleGroup = "Hamstrings" },
            new PlannedExercise { PlanDayId = legDay.Id, ExerciseName = "Hanging Leg Raises", TargetSets = 3, TargetReps = "12-15", OrderIndex = 4, MuscleGroup = "Core" }
        );

        // Workout Logs — last 2 weeks
        var log1 = new WorkoutLog { Date = new DateTime(2026, 9, 8), FocusArea = "Push (Chest, Shoulders, Triceps)", DurationMinutes = 65, PlanDayId = pushDay.Id, Notes = "Felt strong today. Hit a new bench PR." };
        var log2 = new WorkoutLog { Date = new DateTime(2026, 9, 9), FocusArea = "Pull (Back, Biceps)", DurationMinutes = 60, PlanDayId = pullDay.Id };
        var log3 = new WorkoutLog { Date = new DateTime(2026, 9, 10), FocusArea = "Legs & Core", DurationMinutes = 55, PlanDayId = legDay.Id, Notes = "Knees felt tight. Warmed up extra." };
        var log4 = new WorkoutLog { Date = new DateTime(2026, 9, 15), FocusArea = "Push (Chest, Shoulders, Triceps)", DurationMinutes = 60, PlanDayId = pushDay.Id };
        var log5 = new WorkoutLog { Date = new DateTime(2026, 9, 16), FocusArea = "Pull (Back, Biceps)", DurationMinutes = 70, PlanDayId = pullDay.Id, Notes = "Added extra set on deadlift — feeling good." };
        var log6 = new WorkoutLog { Date = new DateTime(2026, 9, 17), FocusArea = "Legs & Core", DurationMinutes = 50, PlanDayId = legDay.Id };
        context.WorkoutLogs.AddRange(log1, log2, log3, log4, log5, log6);
        StampAndSave();

        context.ExerciseSets.AddRange(
            // Log 1 — Push
            new ExerciseSet { WorkoutLogId = log1.Id, ExerciseName = "Bench Press", SetNumber = 1, Reps = 10, Weight = 175m, OrderIndex = 0 },
            new ExerciseSet { WorkoutLogId = log1.Id, ExerciseName = "Bench Press", SetNumber = 2, Reps = 9, Weight = 185m, OrderIndex = 1 },
            new ExerciseSet { WorkoutLogId = log1.Id, ExerciseName = "Bench Press", SetNumber = 3, Reps = 8, Weight = 190m, OrderIndex = 2 },
            new ExerciseSet { WorkoutLogId = log1.Id, ExerciseName = "Bench Press", SetNumber = 4, Reps = 6, Weight = 195m, OrderIndex = 3 },
            new ExerciseSet { WorkoutLogId = log1.Id, ExerciseName = "Overhead Press", SetNumber = 1, Reps = 10, Weight = 105m, OrderIndex = 4 },
            new ExerciseSet { WorkoutLogId = log1.Id, ExerciseName = "Overhead Press", SetNumber = 2, Reps = 8, Weight = 115m, OrderIndex = 5 },
            new ExerciseSet { WorkoutLogId = log1.Id, ExerciseName = "Overhead Press", SetNumber = 3, Reps = 7, Weight = 115m, OrderIndex = 6 },
            new ExerciseSet { WorkoutLogId = log1.Id, ExerciseName = "Incline Dumbbell Press", SetNumber = 1, Reps = 12, Weight = 60m, OrderIndex = 7 },
            new ExerciseSet { WorkoutLogId = log1.Id, ExerciseName = "Incline Dumbbell Press", SetNumber = 2, Reps = 10, Weight = 65m, OrderIndex = 8 },
            new ExerciseSet { WorkoutLogId = log1.Id, ExerciseName = "Incline Dumbbell Press", SetNumber = 3, Reps = 9, Weight = 65m, OrderIndex = 9 },

            // Log 2 — Pull
            new ExerciseSet { WorkoutLogId = log2.Id, ExerciseName = "Deadlift", SetNumber = 1, Reps = 6, Weight = 255m, OrderIndex = 0 },
            new ExerciseSet { WorkoutLogId = log2.Id, ExerciseName = "Deadlift", SetNumber = 2, Reps = 5, Weight = 275m, OrderIndex = 1 },
            new ExerciseSet { WorkoutLogId = log2.Id, ExerciseName = "Deadlift", SetNumber = 3, Reps = 5, Weight = 275m, OrderIndex = 2 },
            new ExerciseSet { WorkoutLogId = log2.Id, ExerciseName = "Deadlift", SetNumber = 4, Reps = 4, Weight = 285m, OrderIndex = 3 },
            new ExerciseSet { WorkoutLogId = log2.Id, ExerciseName = "Barbell Rows", SetNumber = 1, Reps = 10, Weight = 145m, OrderIndex = 4 },
            new ExerciseSet { WorkoutLogId = log2.Id, ExerciseName = "Barbell Rows", SetNumber = 2, Reps = 9, Weight = 155m, OrderIndex = 5 },
            new ExerciseSet { WorkoutLogId = log2.Id, ExerciseName = "Barbell Rows", SetNumber = 3, Reps = 8, Weight = 155m, OrderIndex = 6 },
            new ExerciseSet { WorkoutLogId = log2.Id, ExerciseName = "Pull-ups", SetNumber = 1, Reps = 10, Weight = 0m, OrderIndex = 7 },
            new ExerciseSet { WorkoutLogId = log2.Id, ExerciseName = "Pull-ups", SetNumber = 2, Reps = 8, Weight = 0m, OrderIndex = 8 },
            new ExerciseSet { WorkoutLogId = log2.Id, ExerciseName = "Pull-ups", SetNumber = 3, Reps = 7, Weight = 0m, OrderIndex = 9 },

            // Log 3 — Legs
            new ExerciseSet { WorkoutLogId = log3.Id, ExerciseName = "Squats", SetNumber = 1, Reps = 8, Weight = 205m, OrderIndex = 0 },
            new ExerciseSet { WorkoutLogId = log3.Id, ExerciseName = "Squats", SetNumber = 2, Reps = 7, Weight = 225m, OrderIndex = 1 },
            new ExerciseSet { WorkoutLogId = log3.Id, ExerciseName = "Squats", SetNumber = 3, Reps = 6, Weight = 225m, OrderIndex = 2 },
            new ExerciseSet { WorkoutLogId = log3.Id, ExerciseName = "Squats", SetNumber = 4, Reps = 6, Weight = 225m, OrderIndex = 3 },
            new ExerciseSet { WorkoutLogId = log3.Id, ExerciseName = "Romanian Deadlift", SetNumber = 1, Reps = 10, Weight = 175m, OrderIndex = 4 },
            new ExerciseSet { WorkoutLogId = log3.Id, ExerciseName = "Romanian Deadlift", SetNumber = 2, Reps = 9, Weight = 185m, OrderIndex = 5 },
            new ExerciseSet { WorkoutLogId = log3.Id, ExerciseName = "Romanian Deadlift", SetNumber = 3, Reps = 8, Weight = 185m, OrderIndex = 6 },
            new ExerciseSet { WorkoutLogId = log3.Id, ExerciseName = "Leg Press", SetNumber = 1, Reps = 12, Weight = 340m, OrderIndex = 7 },
            new ExerciseSet { WorkoutLogId = log3.Id, ExerciseName = "Leg Press", SetNumber = 2, Reps = 10, Weight = 360m, OrderIndex = 8 },
            new ExerciseSet { WorkoutLogId = log3.Id, ExerciseName = "Leg Press", SetNumber = 3, Reps = 10, Weight = 360m, OrderIndex = 9 }
        );

        StampAndSave();
    }
}
