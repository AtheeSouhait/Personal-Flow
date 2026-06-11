using Microsoft.EntityFrameworkCore;
using TaskTracker.Api.Models;

namespace TaskTracker.Api.Data;

public class TaskTrackerDbContext : DbContext
{
    public TaskTrackerDbContext(DbContextOptions<TaskTrackerDbContext> options)
        : base(options)
    {
    }

    public DbSet<Project> Projects { get; set; } = null!;
    public DbSet<ProjectTask> Tasks { get; set; } = null!;
    public DbSet<Idea> Ideas { get; set; } = null!;
    public DbSet<DailyTodo> DailyTodos { get; set; } = null!;
    public DbSet<Subtask> Subtasks { get; set; } = null!;
    public DbSet<Activity> Activities { get; set; } = null!;
    public DbSet<ActivityLog> ActivityLogs { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Project configuration
        modelBuilder.Entity<Project>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(5000);
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.UpdatedAt).IsRequired();
            entity.Property(e => e.Status).HasConversion<string>();
            entity.Property(e => e.DisplayOrder).IsRequired();
            entity.HasIndex(e => e.DisplayOrder);

            entity.HasMany(e => e.Tasks)
                .WithOne(e => e.Project)
                .HasForeignKey(e => e.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.Ideas)
                .WithOne(e => e.Project)
                .HasForeignKey(e => e.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Task configuration
        modelBuilder.Entity<ProjectTask>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(2000);
            entity.Property(e => e.Status).HasConversion<string>();
            entity.Property(e => e.Priority).HasConversion<string>();
            entity.Property(e => e.ProgressPercentage).IsRequired();
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.UpdatedAt).IsRequired();

            entity.Property(e => e.DisplayOrder).IsRequired();
            entity.HasIndex(e => e.DisplayOrder);
            entity.HasIndex(e => e.ProjectId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.DueDate);

            entity.HasMany(e => e.Subtasks)
                .WithOne(e => e.Task)
                .HasForeignKey(e => e.TaskId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Subtask configuration
        modelBuilder.Entity<Subtask>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
            entity.Property(e => e.IsCompleted).IsRequired();
            entity.Property(e => e.DisplayOrder).IsRequired();
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.UpdatedAt).IsRequired();

            entity.HasIndex(e => e.TaskId);
        });

        // Idea configuration
        modelBuilder.Entity<Idea>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(2000);
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.UpdatedAt).IsRequired();

            entity.HasIndex(e => e.ProjectId);
        });

        // DailyTodo configuration
        modelBuilder.Entity<DailyTodo>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.IsCompleted).IsRequired();
            entity.Property(e => e.DisplayOrder).IsRequired();
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.UpdatedAt).IsRequired();

            entity.HasIndex(e => e.DisplayOrder);
            entity.HasIndex(e => e.IsCompleted);
        });

        // Activity configuration
        modelBuilder.Entity<Activity>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.GoalPeriod).HasConversion<string>();
            entity.Property(e => e.GoalType).HasConversion<string>();
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.UpdatedAt).IsRequired();

            entity.HasIndex(e => e.Name).IsUnique();

            entity.HasMany(e => e.Logs)
                .WithOne(e => e.Activity)
                .HasForeignKey(e => e.ActivityId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ActivityLog configuration
        modelBuilder.Entity<ActivityLog>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Date).IsRequired();
            entity.Property(e => e.ElapsedSeconds).IsRequired();
            entity.Property(e => e.NotesJson).IsRequired();
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.UpdatedAt).IsRequired();

            entity.HasIndex(e => e.Date);
            entity.HasIndex(e => new { e.ActivityId, e.Date }).IsUnique();
        });
    }
}
