using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Pulse.Core.Data;
using Pulse.Core.Models;
using Pulse.Core.Services;

var builder = WebApplication.CreateBuilder(args);

// Add EF Core — SQL Server for all environments
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<PulseDbContext>(options =>
    options.UseSqlServer(connectionString, sqlOptions =>
        sqlOptions.EnableRetryOnFailure(maxRetryCount: 5, maxRetryDelay: TimeSpan.FromSeconds(30), errorNumbersToAdd: null))
    .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning)));

// Add ASP.NET Core Identity
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequiredLength = 8;
    options.Password.RequireNonAlphanumeric = true;
    options.Password.RequireUppercase = true;
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.AllowedForNewUsers = true;
})
.AddEntityFrameworkStores<PulseDbContext>()
.AddDefaultTokenProviders();

builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.Strict;
    options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
    options.ExpireTimeSpan = TimeSpan.FromDays(14);
    options.SlidingExpiration = true;
    options.Events.OnRedirectToLogin = ctx =>
    {
        ctx.Response.StatusCode = 401;
        return Task.CompletedTask;
    };
    options.Events.OnRedirectToAccessDenied = ctx =>
    {
        ctx.Response.StatusCode = 403;
        return Task.CompletedTask;
    };
});

// Add application services
builder.Services.AddPulseCoreServices();

// Add CORS for development
builder.Services.AddCors(options =>
{
    options.AddPolicy("DevCors", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
        // All DateTime values in this app are UTC; SQL Server/EF Core strip DateTimeKind, so mark it explicitly on write
        options.JsonSerializerOptions.Converters.Add(new Pulse.Api.UtcDateTimeConverter());
        options.JsonSerializerOptions.Converters.Add(new Pulse.Api.UtcNullableDateTimeConverter());
    });
builder.Services.AddOpenApi();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Apply database schema
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<PulseDbContext>();
    db.Database.SetCommandTimeout(TimeSpan.FromMinutes(5));

    for (int attempt = 1; attempt <= 10; attempt++)
    {
        try
        {
            var pending = db.Database.GetPendingMigrations();
            if (pending.Any())
            {
                Console.WriteLine($"Applying {pending.Count()} pending migration(s)...");
                db.Database.Migrate();
            }
            else
            {
                Console.WriteLine("No pending migrations — skipping Migrate().");
            }
            break;
        }
        catch (Exception ex) when (attempt < 10)
        {
            Console.WriteLine($"Database connection attempt {attempt} failed: {ex.Message}. Retrying in 10s...");
            Thread.Sleep(TimeSpan.FromSeconds(10));
        }
    }

    // Seed Admin role and user first, so seed data gets the correct UserId
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

    if (!await roleManager.RoleExistsAsync("Admin"))
        await roleManager.CreateAsync(new IdentityRole("Admin"));
    if (!await roleManager.RoleExistsAsync("User"))
        await roleManager.CreateAsync(new IdentityRole("User"));

    // Auto-create admin user in local dev only
    if (app.Environment.IsDevelopment() && await userManager.FindByNameAsync("pradeepdasari@finpulse.com") == null)
    {
        var admin = new ApplicationUser
        {
            UserName = "pradeepdasari@finpulse.com",
            Email = "pradeepdasari@finpulse.com",
            EmailConfirmed = true,
            PreferredTimezone = "America/Chicago"
        };
        var result = await userManager.CreateAsync(admin, "Pulse@2026!");
        if (result.Succeeded)
        {
            await userManager.AddToRoleAsync(admin, "Admin");
        }
    }

    // Find the first admin user to own seed data and fix orphaned records
    var adminUsers = await userManager.GetUsersInRoleAsync("Admin");
    var primaryUser = adminUsers.FirstOrDefault();
    var seedUserId = primaryUser?.Id;

    SeedData.Initialize(db, seedUserId);

    // Fix any existing records with NULL UserId (from prior seed bug)
    if (seedUserId != null)
    {
        SeedData.ClaimOrphanedRecords(db, seedUserId);
    }

}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
    app.UseCors("DevCors");
}

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();

app.UseStaticFiles();
app.MapControllers();
app.MapFallbackToFile("index.html");

app.Run();
