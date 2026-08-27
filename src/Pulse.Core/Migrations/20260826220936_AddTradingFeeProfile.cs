using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Pulse.Core.Migrations
{
    /// <inheritdoc />
    public partial class AddTradingFeeProfile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "NetPnl",
                table: "TradeEntries",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "TotalFees",
                table: "TradeEntries",
                type: "decimal(18,4)",
                precision: 18,
                scale: 4,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "FuturesCommissionPerContract",
                table: "BankAccounts",
                type: "decimal(10,4)",
                precision: 10,
                scale: 4,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "FuturesRegFeePerContract",
                table: "BankAccounts",
                type: "decimal(10,4)",
                precision: 10,
                scale: 4,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "OptionsCommissionPerContract",
                table: "BankAccounts",
                type: "decimal(10,4)",
                precision: 10,
                scale: 4,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "OptionsRegFeePerContract",
                table: "BankAccounts",
                type: "decimal(10,4)",
                precision: 10,
                scale: 4,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NetPnl",
                table: "TradeEntries");

            migrationBuilder.DropColumn(
                name: "TotalFees",
                table: "TradeEntries");

            migrationBuilder.DropColumn(
                name: "FuturesCommissionPerContract",
                table: "BankAccounts");

            migrationBuilder.DropColumn(
                name: "FuturesRegFeePerContract",
                table: "BankAccounts");

            migrationBuilder.DropColumn(
                name: "OptionsCommissionPerContract",
                table: "BankAccounts");

            migrationBuilder.DropColumn(
                name: "OptionsRegFeePerContract",
                table: "BankAccounts");
        }
    }
}
