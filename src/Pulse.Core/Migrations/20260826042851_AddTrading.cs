using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Pulse.Core.Migrations
{
    /// <inheritdoc />
    public partial class AddTrading : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DailyLimits",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    MaxTradesPerDay = table.Column<int>(type: "int", nullable: false),
                    MaxDailyLoss = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    StopAfterConsecutiveLosses = table.Column<int>(type: "int", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DailyLimits", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DailyReviews",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Grade = table.Column<string>(type: "nvarchar(2)", maxLength: 2, nullable: false),
                    FollowedPlan = table.Column<bool>(type: "bit", nullable: false),
                    FollowedRules = table.Column<bool>(type: "bit", nullable: false),
                    TotalTrades = table.Column<int>(type: "int", nullable: false),
                    TotalPnl = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    RulesViolated = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    LessonsLearned = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ImprovementNote = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    EmotionalSummary = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DailyReviews", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PreMarketNotes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    MarketBias = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    KeyLevels = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Catalysts = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Plan = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    MentalState = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    MentalStateNotes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    MaxTrades = table.Column<int>(type: "int", nullable: false),
                    MaxLoss = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PreMarketNotes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TradingRules",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    Text = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Category = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    OrderIndex = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TradingRules", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TradingSetups",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TradingSetups", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TradingWisdoms",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Text = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    Category = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Author = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TradingWisdoms", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ChecklistItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SetupId = table.Column<int>(type: "int", nullable: false),
                    Label = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    OrderIndex = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChecklistItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChecklistItems_TradingSetups_SetupId",
                        column: x => x.SetupId,
                        principalTable: "TradingSetups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TradeEntries",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    SetupId = table.Column<int>(type: "int", nullable: false),
                    Instrument = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Direction = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    EntryPrice = table.Column<decimal>(type: "decimal(18,6)", precision: 18, scale: 6, nullable: false),
                    ExitPrice = table.Column<decimal>(type: "decimal(18,6)", precision: 18, scale: 6, nullable: true),
                    Quantity = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    Pnl = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    ChecklistCompleted = table.Column<bool>(type: "bit", nullable: false),
                    EntryTime = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    ExitTime = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Tags = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsRevengeTrading = table.Column<bool>(type: "bit", nullable: false),
                    EmotionAtEntry = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TradeEntries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TradeEntries_TradingSetups_SetupId",
                        column: x => x.SetupId,
                        principalTable: "TradingSetups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ChecklistResponses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TradeEntryId = table.Column<int>(type: "int", nullable: false),
                    ChecklistItemId = table.Column<int>(type: "int", nullable: false),
                    Label = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    Checked = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChecklistResponses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChecklistResponses_TradeEntries_TradeEntryId",
                        column: x => x.TradeEntryId,
                        principalTable: "TradeEntries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ChecklistItems_SetupId",
                table: "ChecklistItems",
                column: "SetupId");

            migrationBuilder.CreateIndex(
                name: "IX_ChecklistResponses_TradeEntryId",
                table: "ChecklistResponses",
                column: "TradeEntryId");

            migrationBuilder.CreateIndex(
                name: "IX_DailyLimits_UserId",
                table: "DailyLimits",
                column: "UserId",
                unique: true,
                filter: "[UserId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_DailyReviews_UserId",
                table: "DailyReviews",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_DailyReviews_UserId_Date",
                table: "DailyReviews",
                columns: new[] { "UserId", "Date" });

            migrationBuilder.CreateIndex(
                name: "IX_PreMarketNotes_UserId",
                table: "PreMarketNotes",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_PreMarketNotes_UserId_Date",
                table: "PreMarketNotes",
                columns: new[] { "UserId", "Date" });

            migrationBuilder.CreateIndex(
                name: "IX_TradeEntries_SetupId",
                table: "TradeEntries",
                column: "SetupId");

            migrationBuilder.CreateIndex(
                name: "IX_TradeEntries_UserId",
                table: "TradeEntries",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_TradeEntries_UserId_Date",
                table: "TradeEntries",
                columns: new[] { "UserId", "Date" });

            migrationBuilder.CreateIndex(
                name: "IX_TradingRules_UserId",
                table: "TradingRules",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_TradingSetups_UserId",
                table: "TradingSetups",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ChecklistItems");

            migrationBuilder.DropTable(
                name: "ChecklistResponses");

            migrationBuilder.DropTable(
                name: "DailyLimits");

            migrationBuilder.DropTable(
                name: "DailyReviews");

            migrationBuilder.DropTable(
                name: "PreMarketNotes");

            migrationBuilder.DropTable(
                name: "TradingRules");

            migrationBuilder.DropTable(
                name: "TradingWisdoms");

            migrationBuilder.DropTable(
                name: "TradeEntries");

            migrationBuilder.DropTable(
                name: "TradingSetups");
        }
    }
}
