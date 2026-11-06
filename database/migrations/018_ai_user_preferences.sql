IF OBJECT_ID('dbo.ai_user_preferences','U') IS NULL
BEGIN
 CREATE TABLE dbo.ai_user_preferences(
  user_id INT NOT NULL REFERENCES dbo.users(user_id),
  preference_key VARCHAR(40) NOT NULL,
  consent_source VARCHAR(20) NOT NULL CHECK(consent_source IN ('CHAT_EXPLICIT','UI_CONFIRM')),
  consented_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT PK_ai_user_preferences PRIMARY KEY(user_id,preference_key)
 );
END;
