using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Pulse.Core.Migrations
{
    /// <inheritdoc />
    public partial class AddRelatedTradeIdToMoneyMovement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "RelatedTradeId",
                table: "MoneyMovements",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_MoneyMovements_RelatedTradeId",
                table: "MoneyMovements",
                column: "RelatedTradeId",
                filter: "[RelatedTradeId] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_MoneyMovements_RelatedTradeId",
                table: "MoneyMovements");

            migrationBuilder.DropColumn(
                name: "RelatedTradeId",
                table: "MoneyMovements");
        }
    }
}
