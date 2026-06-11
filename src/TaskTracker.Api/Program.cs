using Microsoft.EntityFrameworkCore;
using TaskTracker.Api.Data;
using TaskTracker.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure SQLite database
builder.Services.AddDbContext<TaskTrackerDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// Register services
builder.Services.AddScoped<IProjectService, ProjectService>();
builder.Services.AddScoped<ITaskService, TaskService>();
builder.Services.AddScoped<IIdeaService, IdeaService>();
builder.Services.AddScoped<ISearchService, SearchService>();
builder.Services.AddScoped<IDailyTodoService, DailyTodoService>();
builder.Services.AddScoped<IActivityService, ActivityService>();

// Register HttpClient for TTS proxy
builder.Services.AddHttpClient();

// Configure CORS for React frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:3007")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// Ensure database is created and migrations are applied on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<TaskTrackerDbContext>();

    // Older deployments recorded the first migration under its class-name
    // fallback ID ("InitialCreate"). It now carries an explicit timestamped
    // ID, so rewrite the history row to keep existing databases in sync.
    if (db.Database.CanConnect())
    {
        try
        {
            db.Database.ExecuteSqlRaw(
                "UPDATE __EFMigrationsHistory SET MigrationId = '20250101000000_InitialCreate' WHERE MigrationId = 'InitialCreate'");

            // Some legacy databases have the InitialCreate tables but no matching
            // history row at all (the row was lost when the migration id was
            // renamed). Without this, Migrate() re-runs InitialCreate and fails
            // with "table Projects already exists". Backfill the row only when the
            // schema is clearly already present.
            db.Database.ExecuteSqlRaw(
                "INSERT INTO __EFMigrationsHistory (MigrationId, ProductVersion) " +
                "SELECT '20250101000000_InitialCreate', '9.0.0' " +
                "WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='Projects') " +
                "AND NOT EXISTS (SELECT 1 FROM __EFMigrationsHistory WHERE MigrationId='20250101000000_InitialCreate')");
        }
        catch (Microsoft.Data.Sqlite.SqliteException)
        {
            // History table doesn't exist yet (fresh database) — nothing to fix up.
        }
    }

    db.Database.Migrate();
}

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowReactApp");
app.UseAuthorization();
app.MapControllers();

app.Run();
