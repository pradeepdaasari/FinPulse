using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Pulse.Core.Migrations
{
    /// <inheritdoc />
    public partial class RemoveCommissionSchedules : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CommissionSchedules");

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
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

            migrationBuilder.CreateTable(
                name: "CommissionSchedules",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BankAccountId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EffectiveFrom = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FuturesCommissionPerContract = table.Column<decimal>(type: "decimal(10,4)", precision: 10, scale: 4, nullable: true),
                    FuturesRegFeePerContract = table.Column<decimal>(type: "decimal(10,4)", precision: 10, scale: 4, nullable: true),
                    OptionsCommissionPerContract = table.Column<decimal>(type: "decimal(10,4)", precision: 10, scale: 4, nullable: true),
                    OptionsRegFeePerContract = table.Column<decimal>(type: "decimal(10,4)", precision: 10, scale: 4, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CommissionSchedules", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CommissionSchedules_BankAccounts_BankAccountId",
                        column: x => x.BankAccountId,
                        principalTable: "BankAccounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CommissionSchedules_BankAccountId_EffectiveFrom",
                table: "CommissionSchedules",
                columns: new[] { "BankAccountId", "EffectiveFrom" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CommissionSchedules_UserId",
                table: "CommissionSchedules",
                column: "UserId");
        }
    }
}
