using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Pulse.Core.Migrations
{
    /// <inheritdoc />
    public partial class ConvertLocalDatesToUtc : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Convert local-as-UTC dates to real UTC using AT TIME ZONE (DST-aware).
            // Only affects tables whose controllers did NOT call ToUtc() on save.
            // Tables already storing real UTC (DailyExpenses, HealthMetrics, WorkoutLogs, TradeEntries)
            // and all CreatedAt/UpdatedAt fields are left untouched.

            migrationBuilder.Sql(@"
                UPDATE [PersonalLoans]
                SET [StartDate] = CAST([StartDate] AT TIME ZONE 'Central Standard Time' AT TIME ZONE 'UTC' AS datetime2)
                WHERE [StartDate] IS NOT NULL;

                UPDATE [PersonalLoans]
                SET [NextPaymentDate] = CAST([NextPaymentDate] AT TIME ZONE 'Central Standard Time' AT TIME ZONE 'UTC' AS datetime2)
                WHERE [NextPaymentDate] IS NOT NULL;

                UPDATE [PaymentHistories]
                SET [PaymentDate] = CAST([PaymentDate] AT TIME ZONE 'Central Standard Time' AT TIME ZONE 'UTC' AS datetime2)
                WHERE [PaymentDate] IS NOT NULL;

                UPDATE [CreditCards]
                SET [PromoEndDate] = CAST([PromoEndDate] AT TIME ZONE 'Central Standard Time' AT TIME ZONE 'UTC' AS datetime2)
                WHERE [PromoEndDate] IS NOT NULL;

                UPDATE [CreditCards]
                SET [LastStatementDate] = CAST([LastStatementDate] AT TIME ZONE 'Central Standard Time' AT TIME ZONE 'UTC' AS datetime2)
                WHERE [LastStatementDate] IS NOT NULL;

                UPDATE [RecurringTransactions]
                SET [NextRunDate] = CAST([NextRunDate] AT TIME ZONE 'Central Standard Time' AT TIME ZONE 'UTC' AS datetime2)
                WHERE [NextRunDate] IS NOT NULL;

                UPDATE [RecurringTransactions]
                SET [EndDate] = CAST([EndDate] AT TIME ZONE 'Central Standard Time' AT TIME ZONE 'UTC' AS datetime2)
                WHERE [EndDate] IS NOT NULL;

                UPDATE [SavingsGoals]
                SET [TargetDate] = CAST([TargetDate] AT TIME ZONE 'Central Standard Time' AT TIME ZONE 'UTC' AS datetime2)
                WHERE [TargetDate] IS NOT NULL;

                UPDATE [BloodWorkReports]
                SET [ReportDate] = CAST([ReportDate] AT TIME ZONE 'Central Standard Time' AT TIME ZONE 'UTC' AS datetime2)
                WHERE [ReportDate] IS NOT NULL;

                UPDATE [MoneyMovements]
                SET [MovementDate] = CAST([MovementDate] AT TIME ZONE 'Central Standard Time' AT TIME ZONE 'UTC' AS datetime2)
                WHERE [MovementDate] IS NOT NULL;

                UPDATE [UserProfiles]
                SET [NextPayDate] = CAST([NextPayDate] AT TIME ZONE 'Central Standard Time' AT TIME ZONE 'UTC' AS datetime2)
                WHERE [NextPayDate] IS NOT NULL;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Reverse: convert real UTC back to Central local time
            migrationBuilder.Sql(@"
                UPDATE [PersonalLoans]
                SET [StartDate] = CAST(CAST([StartDate] AS datetimeoffset) AT TIME ZONE 'Central Standard Time' AS datetime2)
                WHERE [StartDate] IS NOT NULL;

                UPDATE [PersonalLoans]
                SET [NextPaymentDate] = CAST(CAST([NextPaymentDate] AS datetimeoffset) AT TIME ZONE 'Central Standard Time' AS datetime2)
                WHERE [NextPaymentDate] IS NOT NULL;

                UPDATE [PaymentHistories]
                SET [PaymentDate] = CAST(CAST([PaymentDate] AS datetimeoffset) AT TIME ZONE 'Central Standard Time' AS datetime2)
                WHERE [PaymentDate] IS NOT NULL;

                UPDATE [CreditCards]
                SET [PromoEndDate] = CAST(CAST([PromoEndDate] AS datetimeoffset) AT TIME ZONE 'Central Standard Time' AS datetime2)
                WHERE [PromoEndDate] IS NOT NULL;

                UPDATE [CreditCards]
                SET [LastStatementDate] = CAST(CAST([LastStatementDate] AS datetimeoffset) AT TIME ZONE 'Central Standard Time' AS datetime2)
                WHERE [LastStatementDate] IS NOT NULL;

                UPDATE [RecurringTransactions]
                SET [NextRunDate] = CAST(CAST([NextRunDate] AS datetimeoffset) AT TIME ZONE 'Central Standard Time' AS datetime2)
                WHERE [NextRunDate] IS NOT NULL;

                UPDATE [RecurringTransactions]
                SET [EndDate] = CAST(CAST([EndDate] AS datetimeoffset) AT TIME ZONE 'Central Standard Time' AS datetime2)
                WHERE [EndDate] IS NOT NULL;

                UPDATE [SavingsGoals]
                SET [TargetDate] = CAST(CAST([TargetDate] AS datetimeoffset) AT TIME ZONE 'Central Standard Time' AS datetime2)
                WHERE [TargetDate] IS NOT NULL;

                UPDATE [BloodWorkReports]
                SET [ReportDate] = CAST(CAST([ReportDate] AS datetimeoffset) AT TIME ZONE 'Central Standard Time' AS datetime2)
                WHERE [ReportDate] IS NOT NULL;

                UPDATE [MoneyMovements]
                SET [MovementDate] = CAST(CAST([MovementDate] AS datetimeoffset) AT TIME ZONE 'Central Standard Time' AS datetime2)
                WHERE [MovementDate] IS NOT NULL;

                UPDATE [UserProfiles]
                SET [NextPayDate] = CAST(CAST([NextPayDate] AS datetimeoffset) AT TIME ZONE 'Central Standard Time' AS datetime2)
                WHERE [NextPayDate] IS NOT NULL;
            ");
        }
    }
}
