namespace FinPulse.Core.Data;

using FinPulse.Core.Models;
using FinPulse.Core.Models.Enums;

public static class SeedData
{
    public static void Initialize(FinPulseDbContext context)
    {
        if (context.PersonalLoans.Any() || context.CreditCards.Any())
            return;

        // ═══════════════════════════════════════════════════
        // EXPENSE CATEGORIES
        // ═══════════════════════════════════════════════════
        var housing = new CustomCategory { Name = "Housing", IsFixed = true };
        var transportation = new CustomCategory { Name = "Transportation", IsFixed = false };
        var insurance = new CustomCategory { Name = "Insurance", IsFixed = true };
        var utilities = new CustomCategory { Name = "Utilities", IsFixed = true };
        var subscriptions = new CustomCategory { Name = "Subscriptions", IsFixed = true };
        var food = new CustomCategory { Name = "Food & Dining", IsFixed = false };
        var lifestyle = new CustomCategory { Name = "Lifestyle", IsFixed = false };
        var personal = new CustomCategory { Name = "Personal & Health", IsFixed = false };
        var savings = new CustomCategory { Name = "Savings & Investments", IsFixed = false };

        // INCOME CATEGORIES
        var employment = new CustomCategory { Name = "Employment", IsFixed = true, Type = CategoryType.Income };
        var sideIncome = new CustomCategory { Name = "Side Income", IsFixed = false, Type = CategoryType.Income };
        var passiveIncome = new CustomCategory { Name = "Passive Income", IsFixed = false, Type = CategoryType.Income };

        context.CustomCategories.AddRange(
            housing, transportation, insurance, utilities, subscriptions,
            food, lifestyle, personal, savings, employment, sideIncome, passiveIncome);
        context.SaveChanges();

        // ═══════════════════════════════════════════════════
        // EXPENSE SUB-CATEGORIES
        // ═══════════════════════════════════════════════════
        var rent = new CustomCategory { Name = "Rent", IsFixed = true, ParentId = housing.Id };
        var mortgage = new CustomCategory { Name = "Mortgage", IsFixed = true, ParentId = housing.Id };
        var rentersInsurance = new CustomCategory { Name = "Renter's Insurance", IsFixed = true, ParentId = housing.Id };

        var carPayment = new CustomCategory { Name = "Car Payment", IsFixed = true, ParentId = transportation.Id };
        var gas = new CustomCategory { Name = "Gas & Fuel", IsFixed = false, ParentId = transportation.Id };
        var parking = new CustomCategory { Name = "Parking & Tolls", IsFixed = false, ParentId = transportation.Id };
        var maintenance = new CustomCategory { Name = "Car Maintenance", IsFixed = false, ParentId = transportation.Id };
        var rideshare = new CustomCategory { Name = "Uber / Lyft", IsFixed = false, ParentId = transportation.Id };

        var autoInsurance = new CustomCategory { Name = "Auto Insurance", IsFixed = true, ParentId = insurance.Id };
        var healthInsurance = new CustomCategory { Name = "Health Insurance", IsFixed = true, ParentId = insurance.Id };
        var lifeInsurance = new CustomCategory { Name = "Life Insurance", IsFixed = true, ParentId = insurance.Id };

        var electric = new CustomCategory { Name = "Electric", IsFixed = true, ParentId = utilities.Id };
        var water = new CustomCategory { Name = "Water & Sewer", IsFixed = true, ParentId = utilities.Id };
        var naturalGas = new CustomCategory { Name = "Natural Gas", IsFixed = true, ParentId = utilities.Id };
        var phone = new CustomCategory { Name = "Phone", IsFixed = true, ParentId = utilities.Id };
        var internet = new CustomCategory { Name = "Internet", IsFixed = true, ParentId = utilities.Id };

        var streaming = new CustomCategory { Name = "Streaming (Netflix, Hulu)", IsFixed = true, ParentId = subscriptions.Id };
        var music = new CustomCategory { Name = "Music (Spotify)", IsFixed = true, ParentId = subscriptions.Id };
        var cloud = new CustomCategory { Name = "Cloud Storage (iCloud)", IsFixed = true, ParentId = subscriptions.Id };
        var gym = new CustomCategory { Name = "Gym Membership", IsFixed = true, ParentId = subscriptions.Id };
        var software = new CustomCategory { Name = "Software & Apps", IsFixed = true, ParentId = subscriptions.Id };

        var groceries = new CustomCategory { Name = "Groceries", IsFixed = false, ParentId = food.Id };
        var dining = new CustomCategory { Name = "Restaurants", IsFixed = false, ParentId = food.Id };
        var coffee = new CustomCategory { Name = "Coffee Shops", IsFixed = false, ParentId = food.Id };
        var fastFood = new CustomCategory { Name = "Fast Food & Delivery", IsFixed = false, ParentId = food.Id };

        var entertainment = new CustomCategory { Name = "Entertainment", IsFixed = false, ParentId = lifestyle.Id };
        var shopping = new CustomCategory { Name = "Shopping", IsFixed = false, ParentId = lifestyle.Id };
        var travel = new CustomCategory { Name = "Travel & Vacation", IsFixed = false, ParentId = lifestyle.Id };
        var hobbies = new CustomCategory { Name = "Hobbies", IsFixed = false, ParentId = lifestyle.Id };
        var gifts = new CustomCategory { Name = "Gifts & Donations", IsFixed = false, ParentId = lifestyle.Id };

        var healthcare = new CustomCategory { Name = "Medical & Dental", IsFixed = false, ParentId = personal.Id };
        var personalCare = new CustomCategory { Name = "Personal Care", IsFixed = false, ParentId = personal.Id };
        var clothing = new CustomCategory { Name = "Clothing", IsFixed = false, ParentId = personal.Id };
        var education = new CustomCategory { Name = "Education & Books", IsFixed = false, ParentId = personal.Id };
        var pets = new CustomCategory { Name = "Pet Care", IsFixed = false, ParentId = personal.Id };

        var emergencyFund = new CustomCategory { Name = "Emergency Fund", IsFixed = false, ParentId = savings.Id };
        var retirement = new CustomCategory { Name = "Retirement (401k/IRA)", IsFixed = true, ParentId = savings.Id };
        var investing = new CustomCategory { Name = "Brokerage", IsFixed = false, ParentId = savings.Id };

        // INCOME SUB-CATEGORIES
        var salary = new CustomCategory { Name = "Salary", IsFixed = true, Type = CategoryType.Income, ParentId = employment.Id };
        var bonus = new CustomCategory { Name = "Bonus", IsFixed = false, Type = CategoryType.Income, ParentId = employment.Id };
        var overtime = new CustomCategory { Name = "Overtime", IsFixed = false, Type = CategoryType.Income, ParentId = employment.Id };

        var freelance = new CustomCategory { Name = "Freelance / Consulting", IsFixed = false, Type = CategoryType.Income, ParentId = sideIncome.Id };
        var sideGig = new CustomCategory { Name = "Side Gig", IsFixed = false, Type = CategoryType.Income, ParentId = sideIncome.Id };
        var reselling = new CustomCategory { Name = "Reselling / Marketplace", IsFixed = false, Type = CategoryType.Income, ParentId = sideIncome.Id };

        var rentalIncome = new CustomCategory { Name = "Rental Income", IsFixed = true, Type = CategoryType.Income, ParentId = passiveIncome.Id };
        var dividends = new CustomCategory { Name = "Dividends", IsFixed = false, Type = CategoryType.Income, ParentId = passiveIncome.Id };
        var interest = new CustomCategory { Name = "Interest (HYSA)", IsFixed = false, Type = CategoryType.Income, ParentId = passiveIncome.Id };

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
        context.SaveChanges();

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
        // DEBT — realistic mix of loans + cards
        // ═══════════════════════════════════════════════════
        context.PersonalLoans.AddRange(
            new PersonalLoan
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
            },
            new PersonalLoan
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
            },
            new PersonalLoan
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
            }
        );

        context.CreditCards.AddRange(
            new CreditCard
            {
                CardName = "Chase Sapphire Preferred",
                CurrentBalance = 3200m,
                AprPercent = 21.49m,
                MinimumPayment = 89m,
                DueDay = 22
            },
            new CreditCard
            {
                CardName = "Citi Double Cash",
                CurrentBalance = 1850m,
                AprPercent = 19.99m,
                MinimumPayment = 52m,
                DueDay = 5
            },
            new CreditCard
            {
                CardName = "Amex Blue Cash Everyday",
                CurrentBalance = 4200m,
                AprPercent = 20.24m,
                MinimumPayment = 84m,
                DueDay = 18,
                PromoAprPercent = 0m,
                PromoEndDate = new DateTime(2027, 3, 1)
            },
            new CreditCard
            {
                CardName = "Apple Card",
                CurrentBalance = 950m,
                AprPercent = 24.49m,
                MinimumPayment = 25m,
                DueDay = 28
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
        // DAILY EXPENSES — realistic August 2026 spending
        // ═══════════════════════════════════════════════════
        context.DailyExpenses.AddRange(
            // Week 1 (Aug 1-7)
            new DailyExpense { Date = new DateTime(2026, 8, 1), CategoryId = groceries.Id, Amount = 82.47m, Description = "Weekly grocery run", Merchant = "H-E-B" },
            new DailyExpense { Date = new DateTime(2026, 8, 1), CategoryId = coffee.Id, Amount = 6.75m, Description = "Iced latte", Merchant = "Starbucks" },
            new DailyExpense { Date = new DateTime(2026, 8, 2), CategoryId = dining.Id, Amount = 42.30m, Description = "Dinner with friends", Merchant = "Torchy's Tacos" },
            new DailyExpense { Date = new DateTime(2026, 8, 3), CategoryId = gas.Id, Amount = 54.12m, Description = "Fill up", Merchant = "Costco Gas" },
            new DailyExpense { Date = new DateTime(2026, 8, 4), CategoryId = coffee.Id, Amount = 5.95m, Description = "Cold brew", Merchant = "Dutch Bros" },
            new DailyExpense { Date = new DateTime(2026, 8, 5), CategoryId = entertainment.Id, Amount = 14.99m, Description = "Movie ticket - Deadpool 4", Merchant = "AMC Theatres" },
            new DailyExpense { Date = new DateTime(2026, 8, 6), CategoryId = fastFood.Id, Amount = 12.80m, Description = "Lunch", Merchant = "Chipotle" },
            new DailyExpense { Date = new DateTime(2026, 8, 7), CategoryId = shopping.Id, Amount = 34.99m, Description = "Bluetooth speaker", Merchant = "Amazon" },

            // Week 2 (Aug 8-14)
            new DailyExpense { Date = new DateTime(2026, 8, 8), CategoryId = groceries.Id, Amount = 67.23m, Description = "Weekly groceries", Merchant = "Trader Joe's" },
            new DailyExpense { Date = new DateTime(2026, 8, 8), CategoryId = personalCare.Id, Amount = 32.00m, Description = "Haircut", Merchant = "Sport Clips" },
            new DailyExpense { Date = new DateTime(2026, 8, 9), CategoryId = coffee.Id, Amount = 7.25m, Description = "Oat milk latte", Merchant = "Local Coffee" },
            new DailyExpense { Date = new DateTime(2026, 8, 10), CategoryId = gas.Id, Amount = 48.75m, Description = "Fill up", Merchant = "Shell" },
            new DailyExpense { Date = new DateTime(2026, 8, 10), CategoryId = parking.Id, Amount = 8.00m, Description = "Downtown parking", Merchant = "ParkMobile" },
            new DailyExpense { Date = new DateTime(2026, 8, 11), CategoryId = dining.Id, Amount = 68.50m, Description = "Anniversary dinner", Merchant = "Perry's Steakhouse" },
            new DailyExpense { Date = new DateTime(2026, 8, 12), CategoryId = healthcare.Id, Amount = 40.00m, Description = "Copay - annual checkup", Merchant = "Baylor Scott & White" },
            new DailyExpense { Date = new DateTime(2026, 8, 13), CategoryId = fastFood.Id, Amount = 9.45m, Description = "Quick lunch", Merchant = "Chick-fil-A" },
            new DailyExpense { Date = new DateTime(2026, 8, 14), CategoryId = shopping.Id, Amount = 56.78m, Description = "Running shoes on sale", Merchant = "Nike.com" },

            // Week 3 (Aug 15-21)
            new DailyExpense { Date = new DateTime(2026, 8, 15), CategoryId = groceries.Id, Amount = 95.60m, Description = "Big Costco haul", Merchant = "Costco" },
            new DailyExpense { Date = new DateTime(2026, 8, 15), CategoryId = coffee.Id, Amount = 6.50m, Description = "Pour over", Merchant = "Starbucks" },
            new DailyExpense { Date = new DateTime(2026, 8, 16), CategoryId = entertainment.Id, Amount = 45.00m, Description = "Concert tickets", Merchant = "Ticketmaster" },
            new DailyExpense { Date = new DateTime(2026, 8, 17), CategoryId = gas.Id, Amount = 52.30m, Description = "Fill up before road trip", Merchant = "Buc-ee's" },
            new DailyExpense { Date = new DateTime(2026, 8, 17), CategoryId = dining.Id, Amount = 28.50m, Description = "Brunch", Merchant = "First Watch" },
            new DailyExpense { Date = new DateTime(2026, 8, 18), CategoryId = clothing.Id, Amount = 89.00m, Description = "Work shirts (2)", Merchant = "Nordstrom Rack" },
            new DailyExpense { Date = new DateTime(2026, 8, 19), CategoryId = coffee.Id, Amount = 5.75m, Description = "Espresso", Merchant = "Dutch Bros" },
            new DailyExpense { Date = new DateTime(2026, 8, 20), CategoryId = fastFood.Id, Amount = 15.20m, Description = "DoorDash delivery", Merchant = "Panda Express" },
            new DailyExpense { Date = new DateTime(2026, 8, 21), CategoryId = gifts.Id, Amount = 35.00m, Description = "Birthday gift for mom", Merchant = "Amazon" },

            // Week 4 (Aug 22-24)
            new DailyExpense { Date = new DateTime(2026, 8, 22), CategoryId = groceries.Id, Amount = 71.35m, Description = "Weekly groceries", Merchant = "H-E-B" },
            new DailyExpense { Date = new DateTime(2026, 8, 22), CategoryId = gas.Id, Amount = 49.88m, Description = "Fill up", Merchant = "Costco Gas" },
            new DailyExpense { Date = new DateTime(2026, 8, 23), CategoryId = dining.Id, Amount = 55.00m, Description = "Date night - sushi", Merchant = "Uchi" },
            new DailyExpense { Date = new DateTime(2026, 8, 23), CategoryId = rideshare.Id, Amount = 18.50m, Description = "Uber to/from restaurant", Merchant = "Uber" },
            new DailyExpense { Date = new DateTime(2026, 8, 24), CategoryId = shopping.Id, Amount = 42.99m, Description = "Household supplies", Merchant = "Target" },
            new DailyExpense { Date = new DateTime(2026, 8, 24), CategoryId = coffee.Id, Amount = 6.25m, Description = "Morning coffee", Merchant = "Starbucks" }
        );

        context.SaveChanges();
    }
}
