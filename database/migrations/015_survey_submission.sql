-- Real anonymous survey submissions. Preserve existing questions and responses.
IF COL_LENGTH('dbo.surveys','survey_code') IS NULL ALTER TABLE dbo.surveys ADD survey_code VARCHAR(80) NULL,is_deleted BIT NOT NULL DEFAULT 0;
IF COL_LENGTH('dbo.survey_questions','question_code') IS NULL ALTER TABLE dbo.survey_questions ADD question_code VARCHAR(80) NULL,answer_kind VARCHAR(20) NULL,max_choices TINYINT NOT NULL DEFAULT 1,min_number DECIMAL(18,2) NULL,max_number DECIMAL(18,2) NULL;
IF COL_LENGTH('dbo.survey_question_options','option_code') IS NULL ALTER TABLE dbo.survey_question_options ADD option_code VARCHAR(80) NULL;
IF COL_LENGTH('dbo.survey_responses','request_id') IS NULL ALTER TABLE dbo.survey_responses ADD request_id UNIQUEIDENTIFIER NULL,payload_hash VARCHAR(64) NULL,consent_agreed BIT NOT NULL DEFAULT 0;
IF COL_LENGTH('dbo.survey_answers','answer_number') IS NULL ALTER TABLE dbo.survey_answers ADD answer_number DECIMAL(18,2) NULL;
ALTER TABLE dbo.survey_responses ALTER COLUMN user_id INT NULL;
ALTER TABLE dbo.surveys ALTER COLUMN created_by INT NULL;
GO
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('dbo.surveys') AND name='UQ_survey_code') CREATE UNIQUE INDEX UQ_survey_code ON dbo.surveys(survey_code) WHERE survey_code IS NOT NULL;
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('dbo.survey_questions') AND name='UQ_question_code') CREATE UNIQUE INDEX UQ_question_code ON dbo.survey_questions(survey_id,question_code) WHERE question_code IS NOT NULL;
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('dbo.survey_responses') AND name='UQ_survey_request') CREATE UNIQUE INDEX UQ_survey_request ON dbo.survey_responses(request_id) WHERE request_id IS NOT NULL;
IF OBJECT_ID('dbo.survey_answer_options','U') IS NULL CREATE TABLE dbo.survey_answer_options(answer_id INT NOT NULL REFERENCES dbo.survey_answers(answer_id),option_id INT NOT NULL REFERENCES dbo.survey_question_options(option_id),PRIMARY KEY(answer_id,option_id));
GO
