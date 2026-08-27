using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Pulse.Core.Migrations
{
    /// <inheritdoc />
    public partial class AddOptionsFieldsToTradeEntry : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AssetType",
                table: "TradeEntries",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "BankAccountId",
                table: "TradeEntries",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "EntryPremium",
                table: "TradeEntries",
                type: "decimal(18,4)",
                precision: 18,
                scale: 4,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ExitPremium",
                table: "TradeEntries",
                type: "decimal(18,4)",
                precision: 18,
                scale: 4,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ExpirationDate",
                table: "TradeEntries",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OptionType",
                table: "TradeEntries",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SpreadType",
                table: "TradeEntries",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "StrikePrice",
                table: "TradeEntries",
                type: "decimal(18,6)",
                precision: 18,
                scale: 6,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "StrikePrice2",
                table: "TradeEntries",
                type: "decimal(18,6)",
                precision: 18,
                scale: 6,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "StrikePrice3",
                table: "TradeEntries",
                type: "decimal(18,6)",
                precision: 18,
                scale: 6,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "StrikePrice4",
                table: "TradeEntries",
                type: "decimal(18,6)",
                precision: 18,
                scale: 6,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_TradeEntries_BankAccountId",
                table: "TradeEntries",
                column: "BankAccountId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TradeEntries_BankAccountId",
                table: "TradeEntries");

            migrationBuilder.DropColumn(
                name: "AssetType",
                table: "TradeEntries");

            migrationBuilder.DropColumn(
                name: "BankAccountId",
                table: "TradeEntries");

            migrationBuilder.DropColumn(
                name: "EntryPremium",
                table: "TradeEntries");

            migrationBuilder.DropColumn(
                name: "ExitPremium",
                table: "TradeEntries");

            migrationBuilder.DropColumn(
                name: "ExpirationDate",
                table: "TradeEntries");

            migrationBuilder.DropColumn(
                name: "OptionType",
                table: "TradeEntries");

            migrationBuilder.DropColumn(
                name: "SpreadType",
                table: "TradeEntries");

            migrationBuilder.DropColumn(
                name: "StrikePrice",
                table: "TradeEntries");

            migrationBuilder.DropColumn(
                name: "StrikePrice2",
                table: "TradeEntries");

            migrationBuilder.DropColumn(
                name: "StrikePrice3",
                table: "TradeEntries");

            migrationBuilder.DropColumn(
                name: "StrikePrice4",
                table: "TradeEntries");
        }
    }
}
