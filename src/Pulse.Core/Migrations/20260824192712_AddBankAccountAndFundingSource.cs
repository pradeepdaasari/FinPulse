using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Pulse.Core.Migrations
{
    /// <inheritdoc />
    public partial class AddBankAccountAndFundingSource : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "FundingSourceId",
                table: "DailyExpenses",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "FundingSourceType",
                table: "DailyExpenses",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TransactionType",
                table: "DailyExpenses",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "BankAccounts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AccountName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    AccountType = table.Column<int>(type: "int", nullable: false),
                    CurrentBalance = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BankAccounts", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DailyExpenses_FundingSourceType_FundingSourceId",
                table: "DailyExpenses",
                columns: new[] { "FundingSourceType", "FundingSourceId" });

            migrationBuilder.CreateIndex(
                name: "IX_BankAccounts_UserId",
                table: "BankAccounts",
                column: "UserId");

            // Backfill existing expenses as Expense type
            migrationBuilder.Sql("UPDATE DailyExpenses SET TransactionType = 0 WHERE TransactionType IS NULL;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BankAccounts");

            migrationBuilder.DropIndex(
                name: "IX_DailyExpenses_FundingSourceType_FundingSourceId",
                table: "DailyExpenses");

            migrationBuilder.DropColumn(
                name: "FundingSourceId",
                table: "DailyExpenses");

            migrationBuilder.DropColumn(
                name: "FundingSourceType",
                table: "DailyExpenses");

            migrationBuilder.DropColumn(
                name: "TransactionType",
                table: "DailyExpenses");
        }
    }
}
