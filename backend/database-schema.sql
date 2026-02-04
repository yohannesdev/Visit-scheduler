-- Create Database
USE master;
GO

IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'VisitScheduler')
BEGIN
    CREATE DATABASE VisitScheduler;
END
GO

USE VisitScheduler;
GO

-- Create Appointments Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Appointments')
BEGIN
    CREATE TABLE Appointments (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        email NVARCHAR(255) NOT NULL,
        phone NVARCHAR(50) NOT NULL,
        address NVARCHAR(500) NOT NULL,
        requestedDate DATE NOT NULL,
        requestedTime TIME NOT NULL,
        notes NVARCHAR(MAX),
        status NVARCHAR(50) DEFAULT 'pending',
        submittedAt DATETIME DEFAULT GETDATE(),
        CONSTRAINT CK_Status CHECK (status IN ('pending', 'confirmed', 'declined'))
    );
    
    -- Create indexes for better performance
    CREATE INDEX IX_Appointments_Status ON Appointments(status);
    CREATE INDEX IX_Appointments_RequestedDate ON Appointments(requestedDate);
    CREATE INDEX IX_Appointments_SubmittedAt ON Appointments(submittedAt);
END
GO

-- Sample data (optional - remove if you don't want test data)
-- INSERT INTO Appointments (name, email, phone, address, requestedDate, requestedTime, notes, status)
-- VALUES 
--     ('John Doe', 'john@example.com', '(555) 123-4567', '123 Main St, City, State 12345', '2026-02-10', '10:00:00', 'Please call before arrival', 'pending'),
--     ('Jane Smith', 'jane@example.com', '(555) 987-6543', '456 Oak Ave, City, State 12345', '2026-02-11', '14:30:00', '', 'confirmed');

PRINT 'Database and table created successfully!';
GO
