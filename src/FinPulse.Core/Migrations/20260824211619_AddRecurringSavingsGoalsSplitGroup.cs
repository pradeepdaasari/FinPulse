using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinPulse.Core.Migrations
{
    /// <inheritdoc />
    public partial class AddRecurringSavingsGoalsSplitGroup : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "SplitGroupId",
                table: "DailyExpenses",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "RecurringTransactions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Merchant = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    CategoryId = table.Column<int>(type: "int", nullable: false),
                    TransactionType = table.Column<int>(type: "int", nullable: false),
                    FundingSourceType = table.Column<int>(type: "int", nullable: true),
                    FundingSourceId = table.Column<int>(type: "int", nullable: true),
                    Frequency = table.Column<int>(type: "int", nullable: false),
                    NextRunDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RecurringTransactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RecurringTransactions_CustomCategories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "CustomCategories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SavingsGoals",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    TargetAmount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    CurrentAmount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    TargetDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LinkedAccountId = table.Column<int>(type: "int", nullable: true),
                    Icon = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SavingsGoals", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SavingsGoals_BankAccounts_LinkedAccountId",
                        column: x => x.LinkedAccountId,
                        principalTable: "BankAccounts",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_DailyExpenses_SplitGroupId",
                table: "DailyExpenses",
                column: "SplitGroupId",
                filter: "[SplitGroupId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_RecurringTransactions_CategoryId",
                table: "RecurringTransactions",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_RecurringTransactions_IsActive_NextRunDate",
                table: "RecurringTransactions",
                columns: new[] { "IsActive", "NextRunDate" });

            migrationBuilder.CreateIndex(
                name: "IX_RecurringTransactions_UserId",
                table: "RecurringTransactions",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_SavingsGoals_LinkedAccountId",
                table: "SavingsGoals",
                column: "LinkedAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_SavingsGoals_UserId",
                table: "SavingsGoals",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RecurringTransactions");

            migrationBuilder.DropTable(
                name: "SavingsGoals");

            migrationBuilder.DropIndex(
                name: "IX_DailyExpenses_SplitGroupId",
                table: "DailyExpenses");

            migrationBuilder.DropColumn(
                name: "SplitGroupId",
                table: "DailyExpenses");
        }
    }
}
