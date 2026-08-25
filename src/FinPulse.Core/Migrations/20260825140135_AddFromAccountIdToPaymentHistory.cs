using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinPulse.Core.Migrations
{
    /// <inheritdoc />
    public partial class AddFromAccountIdToPaymentHistory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "FromAccountId",
                table: "PaymentHistories",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FromAccountId",
                table: "PaymentHistories");
        }
    }
}
