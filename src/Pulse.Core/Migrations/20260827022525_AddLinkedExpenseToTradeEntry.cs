using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Pulse.Core.Migrations
{
    /// <inheritdoc />
    public partial class AddLinkedExpenseToTradeEntry : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "LinkedExpenseId",
                table: "TradeEntries",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_TradeEntries_LinkedExpenseId",
                table: "TradeEntries",
                column: "LinkedExpenseId");

            migrationBuilder.AddForeignKey(
                name: "FK_TradeEntries_DailyExpenses_LinkedExpenseId",
                table: "TradeEntries",
                column: "LinkedExpenseId",
                principalTable: "DailyExpenses",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TradeEntries_DailyExpenses_LinkedExpenseId",
                table: "TradeEntries");

            migrationBuilder.DropIndex(
                name: "IX_TradeEntries_LinkedExpenseId",
                table: "TradeEntries");

            migrationBuilder.DropColumn(
                name: "LinkedExpenseId",
                table: "TradeEntries");
        }
    }
}
