namespace FinPulse.Core.Data;

using Microsoft.EntityFrameworkCore;
using FinPulse.Core.Models;
using FinPulse.Core.Models.Enums;

public static class SeedData
{
    public static void Initialize(FinPulseDbContext context)
    {
        if (context.PersonalLoans.Any() || context.CreditCards.Any())
            return;

        Reseed(context, null);
    }

    public static void Reseed(FinPulseDbContext context, string? userId)
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
                    if (prop != null && prop.CurrentValue == null)
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
    }
}
