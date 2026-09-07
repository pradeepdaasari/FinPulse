using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Pulse.Core.Migrations
{
    /// <inheritdoc />
    public partial class AddRelatedExpenseIdToMoneyMovement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "RelatedExpenseId",
                table: "MoneyMovements",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_MoneyMovements_RelatedExpenseId",
                table: "MoneyMovements",
                column: "RelatedExpenseId",
                filter: "[RelatedExpenseId] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_MoneyMovements_RelatedExpenseId",
                table: "MoneyMovements");

            migrationBuilder.DropColumn(
                name: "RelatedExpenseId",
                table: "MoneyMovements");
        }
    }
}
