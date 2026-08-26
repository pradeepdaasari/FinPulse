using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Pulse.Core.Migrations
{
    /// <inheritdoc />
    public partial class AddTradingLossesCategory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Seed "Day Trading" parent expense category and "Trading Losses" child
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM CustomCategories WHERE Name = 'Day Trading' AND ParentId IS NULL AND Type = 0)
                BEGIN
                    INSERT INTO CustomCategories (Name, IsFixed, Type, Icon, ParentId, UserId, CreatedAt, UpdatedAt)
                    VALUES ('Day Trading', 1, 0, 'candlestick_chart', NULL, NULL, GETUTCDATE(), GETUTCDATE());
                END

                INSERT INTO CustomCategories (Name, IsFixed, Type, Icon, ParentId, UserId, CreatedAt, UpdatedAt)
                SELECT 'Trading Losses', 1, 0, 'trending_down', Id, NULL, GETUTCDATE(), GETUTCDATE()
                FROM CustomCategories WHERE Name = 'Day Trading' AND ParentId IS NULL AND Type = 0
                AND NOT EXISTS (SELECT 1 FROM CustomCategories WHERE Name = 'Trading Losses');
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
