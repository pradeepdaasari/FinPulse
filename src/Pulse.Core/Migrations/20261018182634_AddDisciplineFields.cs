using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Pulse.Core.Migrations
{
    /// <inheritdoc />
    public partial class AddDisciplineFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ExitEmotion",
                table: "TradeEntries",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExitReason",
                table: "TradeEntries",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LessonsLearned",
                table: "TradeEntries",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ProfitTarget",
                table: "TradeEntries",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "StopLoss",
                table: "TradeEntries",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TradeThesis",
                table: "TradeEntries",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ExitEmotion",
                table: "TradeEntries");

            migrationBuilder.DropColumn(
                name: "ExitReason",
                table: "TradeEntries");

            migrationBuilder.DropColumn(
                name: "LessonsLearned",
                table: "TradeEntries");

            migrationBuilder.DropColumn(
                name: "ProfitTarget",
                table: "TradeEntries");

            migrationBuilder.DropColumn(
                name: "StopLoss",
                table: "TradeEntries");

            migrationBuilder.DropColumn(
                name: "TradeThesis",
                table: "TradeEntries");
        }
    }
}
