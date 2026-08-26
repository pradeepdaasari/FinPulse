using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Pulse.Core.Migrations
{
    /// <inheritdoc />
    public partial class AddCategoryIcon : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Icon",
                table: "CustomCategories",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            // Populate icons for existing seeded categories
            migrationBuilder.Sql(@"
                UPDATE CustomCategories SET Icon = CASE Name
                    WHEN 'Housing' THEN 'home'
                    WHEN 'Transportation' THEN 'directions_car'
                    WHEN 'Insurance' THEN 'shield'
                    WHEN 'Utilities' THEN 'bolt'
                    WHEN 'Subscriptions' THEN 'subscriptions'
                    WHEN 'Food & Dining' THEN 'restaurant'
                    WHEN 'Lifestyle' THEN 'celebration'
                    WHEN 'Personal & Health' THEN 'favorite'
                    WHEN 'Savings & Investments' THEN 'savings'
                    WHEN 'Employment' THEN 'work'
                    WHEN 'Side Income' THEN 'monetization_on'
                    WHEN 'Passive Income' THEN 'account_balance'
                    WHEN 'Rent' THEN 'apartment'
                    WHEN 'Mortgage' THEN 'house'
                    WHEN 'Renter''s Insurance' THEN 'policy'
                    WHEN 'Car Payment' THEN 'car_rental'
                    WHEN 'Gas & Fuel' THEN 'local_gas_station'
                    WHEN 'Parking & Tolls' THEN 'local_parking'
                    WHEN 'Car Maintenance' THEN 'build'
                    WHEN 'Uber / Lyft' THEN 'hail'
                    WHEN 'Auto Insurance' THEN 'car_crash'
                    WHEN 'Health Insurance' THEN 'health_and_safety'
                    WHEN 'Life Insurance' THEN 'security'
                    WHEN 'Electric' THEN 'electrical_services'
                    WHEN 'Water & Sewer' THEN 'water_drop'
                    WHEN 'Natural Gas' THEN 'gas_meter'
                    WHEN 'Phone' THEN 'phone_android'
                    WHEN 'Internet' THEN 'wifi'
                    WHEN 'Streaming (Netflix, Hulu)' THEN 'live_tv'
                    WHEN 'Music (Spotify)' THEN 'headphones'
                    WHEN 'Cloud Storage (iCloud)' THEN 'cloud'
                    WHEN 'Gym Membership' THEN 'fitness_center'
                    WHEN 'Software & Apps' THEN 'apps'
                    WHEN 'Groceries' THEN 'shopping_cart'
                    WHEN 'Restaurants' THEN 'dinner_dining'
                    WHEN 'Coffee Shops' THEN 'coffee'
                    WHEN 'Fast Food & Delivery' THEN 'delivery_dining'
                    WHEN 'Entertainment' THEN 'movie'
                    WHEN 'Shopping' THEN 'shopping_bag'
                    WHEN 'Travel & Vacation' THEN 'flight'
                    WHEN 'Hobbies' THEN 'palette'
                    WHEN 'Gifts & Donations' THEN 'redeem'
                    WHEN 'Medical & Dental' THEN 'local_hospital'
                    WHEN 'Personal Care' THEN 'spa'
                    WHEN 'Clothing' THEN 'checkroom'
                    WHEN 'Education & Books' THEN 'school'
                    WHEN 'Pet Care' THEN 'pets'
                    WHEN 'Emergency Fund' THEN 'emergency'
                    WHEN 'Retirement (401k/IRA)' THEN 'elderly'
                    WHEN 'Brokerage' THEN 'trending_up'
                    WHEN 'Salary' THEN 'payments'
                    WHEN 'Bonus' THEN 'card_giftcard'
                    WHEN 'Overtime' THEN 'schedule'
                    WHEN 'Freelance / Consulting' THEN 'laptop'
                    WHEN 'Side Gig' THEN 'handyman'
                    WHEN 'Reselling / Marketplace' THEN 'storefront'
                    WHEN 'Rental Income' THEN 'real_estate_agent'
                    WHEN 'Dividends' THEN 'pie_chart'
                    WHEN 'Interest (HYSA)' THEN 'percent'
                    ELSE Icon
                END
                WHERE Icon IS NULL;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Icon",
                table: "CustomCategories");
        }
    }
}
