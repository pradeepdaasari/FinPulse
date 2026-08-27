using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Pulse.Core.Migrations
{
    /// <inheritdoc />
    public partial class AddCommissionSchedule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CommissionSchedules",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BankAccountId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    OptionsCommissionPerContract = table.Column<decimal>(type: "decimal(10,4)", precision: 10, scale: 4, nullable: true),
                    FuturesCommissionPerContract = table.Column<decimal>(type: "decimal(10,4)", precision: 10, scale: 4, nullable: true),
                    OptionsRegFeePerContract = table.Column<decimal>(type: "decimal(10,4)", precision: 10, scale: 4, nullable: true),
                    FuturesRegFeePerContract = table.Column<decimal>(type: "decimal(10,4)", precision: 10, scale: 4, nullable: true),
                    EffectiveFrom = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
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

            // Seed: create initial commission schedule from existing BankAccount rates
            migrationBuilder.Sql(@"
                INSERT INTO CommissionSchedules
                    (BankAccountId, UserId, OptionsCommissionPerContract, FuturesCommissionPerContract,
                     OptionsRegFeePerContract, FuturesRegFeePerContract, EffectiveFrom, CreatedAt, UpdatedAt)
                SELECT Id, UserId, OptionsCommissionPerContract, FuturesCommissionPerContract,
                       OptionsRegFeePerContract, FuturesRegFeePerContract,
                       '2020-01-01', GETUTCDATE(), GETUTCDATE()
                FROM BankAccounts
                WHERE OptionsCommissionPerContract IS NOT NULL
                   OR FuturesCommissionPerContract IS NOT NULL
                   OR OptionsRegFeePerContract IS NOT NULL
                   OR FuturesRegFeePerContract IS NOT NULL
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CommissionSchedules");
        }
    }
}
