using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinPulse.Core.Migrations
{
    /// <inheritdoc />
    public partial class AddTransferAndBrokerage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ToFundingSourceId",
                table: "DailyExpenses",
                type: "int",
                nullable: true);

            // Seed "Trading Gains" category under "Passive Income"
            migrationBuilder.Sql(@"
                INSERT INTO CustomCategories (Name, IsFixed, Type, Icon, ParentId, UserId, CreatedAt, UpdatedAt)
                SELECT 'Trading Gains', 0, 1, 'show_chart', Id, NULL, GETUTCDATE(), GETUTCDATE()
                FROM CustomCategories WHERE Name = 'Passive Income' AND ParentId IS NULL
                AND NOT EXISTS (SELECT 1 FROM CustomCategories WHERE Name = 'Trading Gains');
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ToFundingSourceId",
                table: "DailyExpenses");
        }
    }
}
