using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Pulse.Core.Migrations
{
    /// <inheritdoc />
    public partial class AddRecurringIntervalCount : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "IntervalCount",
                table: "RecurringTransactions",
                type: "int",
                nullable: false,
                defaultValue: 1);

            // Convert Biweekly (enum 2) → Weekly (enum 1) with IntervalCount=2
            migrationBuilder.Sql(
                "UPDATE RecurringTransactions SET Frequency = 1, IntervalCount = 2 WHERE Frequency = 2");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IntervalCount",
                table: "RecurringTransactions");
        }
    }
}
