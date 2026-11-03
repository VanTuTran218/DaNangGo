# Database audit

- Database: `DaNangGo`
- Audited at (UTC): 2026-11-03T11:42:16.072Z
- Tables discovered: 56

## Tables and row counts

| Table | Rows |
| --- | ---: |
| [dbo].[accommodation_amenities] | 20 |
| [dbo].[accommodations] | 20 |
| [dbo].[amenities] | 7 |
| [dbo].[attraction_categories] | 5 |
| [dbo].[attractions] | 9 |
| [dbo].[booking_items] | 0 |
| [dbo].[booking_status_logs] | 0 |
| [dbo].[bookings] | 0 |
| [dbo].[chat_message_places] | 0 |
| [dbo].[chat_messages] | 0 |
| [dbo].[chat_sessions] | 0 |
| [dbo].[cuisines] | 7 |
| [dbo].[districts] | 7 |
| [dbo].[email_verifications] | 0 |
| [dbo].[itineraries] | 0 |
| [dbo].[itinerary_budgets] | 0 |
| [dbo].[itinerary_catalog_places] | 97 |
| [dbo].[itinerary_catalog_preferences] | 115 |
| [dbo].[itinerary_items] | 0 |
| [dbo].[itinerary_training_data] | 0 |
| [dbo].[menu_item_tastes] | 0 |
| [dbo].[menu_items] | 0 |
| [dbo].[opening_hours] | 0 |
| [dbo].[partner_profiles] | 30 |
| [dbo].[partner_subscriptions] | 2 |
| [dbo].[password_reset_tokens] | 0 |
| [dbo].[payments] | 0 |
| [dbo].[place_images] | 24 |
| [dbo].[place_lock_logs] | 0 |
| [dbo].[places] | 34 |
| [dbo].[refresh_tokens] | 93 |
| [dbo].[restaurants] | 4 |
| [dbo].[review_cooldowns] | 106 |
| [dbo].[review_images] | 5 |
| [dbo].[reviews] | 112 |
| [dbo].[roles] | 3 |
| [dbo].[room_types] | 45 |
| [dbo].[route_cache] | 0 |
| [dbo].[sepay_webhook_transactions] | 0 |
| [dbo].[subscription_packages] | 3 |
| [dbo].[subscription_status_logs] | 0 |
| [dbo].[survey_answers] | 0 |
| [dbo].[survey_question_options] | 0 |
| [dbo].[survey_questions] | 0 |
| [dbo].[survey_responses] | 0 |
| [dbo].[surveys] | 0 |
| [dbo].[system_settings] | 0 |
| [dbo].[tastes] | 6 |
| [dbo].[transport_modes] | 5 |
| [dbo].[user_favorites] | 0 |
| [dbo].[user_itinerary_preferences] | 0 |
| [dbo].[user_memberships] | 0 |
| [dbo].[user_preferences] | 0 |
| [dbo].[users] | 58 |
| [dbo].[vip_offers] | 0 |
| [dbo].[vip_tiers] | 0 |

## Columns

| Table | Column | SQL type | NULL | Identity |
| --- | --- | --- | --- | --- |
| [dbo].[accommodation_amenities] | place_id | int | NO | NO |
| [dbo].[accommodation_amenities] | amenity_id | int | NO | NO |
| [dbo].[accommodations] | place_id | int | NO | NO |
| [dbo].[accommodations] | place_type | varchar(20) | NO | NO |
| [dbo].[accommodations] | accommodation_type | varchar(20) | NO | NO |
| [dbo].[accommodations] | star_rating | tinyint | YES | NO |
| [dbo].[accommodations] | check_in_time | time | YES | NO |
| [dbo].[accommodations] | check_out_time | time | YES | NO |
| [dbo].[accommodations] | accepts_cash | bit | NO | NO |
| [dbo].[accommodations] | accepts_bank_transfer | bit | NO | NO |
| [dbo].[amenities] | amenity_id | int | NO | YES |
| [dbo].[amenities] | name | nvarchar(50) | NO | NO |
| [dbo].[amenities] | icon | varchar(100) | YES | NO |
| [dbo].[attraction_categories] | category_id | int | NO | YES |
| [dbo].[attraction_categories] | name | nvarchar(50) | NO | NO |
| [dbo].[attractions] | place_id | int | NO | NO |
| [dbo].[attractions] | place_type | varchar(20) | NO | NO |
| [dbo].[attractions] | category_id | int | YES | NO |
| [dbo].[attractions] | ticket_price | decimal(18,0) | NO | NO |
| [dbo].[attractions] | visit_duration_minutes | int | YES | NO |
| [dbo].[booking_items] | item_id | int | NO | YES |
| [dbo].[booking_items] | booking_id | int | NO | NO |
| [dbo].[booking_items] | room_type_id | int | YES | NO |
| [dbo].[booking_items] | menu_item_id | int | YES | NO |
| [dbo].[booking_items] | quantity | int | NO | NO |
| [dbo].[booking_items] | unit_price | decimal(18,2) | NO | NO |
| [dbo].[booking_items] | check_in | date | YES | NO |
| [dbo].[booking_items] | check_out | date | YES | NO |
| [dbo].[booking_items] | visit_date | date | YES | NO |
| [dbo].[booking_items] | party_size | int | YES | NO |
| [dbo].[booking_status_logs] | log_id | int | NO | YES |
| [dbo].[booking_status_logs] | booking_id | int | NO | NO |
| [dbo].[booking_status_logs] | old_status | nvarchar(10) | YES | NO |
| [dbo].[booking_status_logs] | new_status | nvarchar(10) | NO | NO |
| [dbo].[booking_status_logs] | changed_by | int | YES | NO |
| [dbo].[booking_status_logs] | changed_at | datetime | NO | NO |
| [dbo].[bookings] | booking_id | int | NO | YES |
| [dbo].[bookings] | user_id | int | NO | NO |
| [dbo].[bookings] | place_id | int | YES | NO |
| [dbo].[bookings] | booking_type | nvarchar(10) | NO | NO |
| [dbo].[bookings] | status | nvarchar(10) | NO | NO |
| [dbo].[bookings] | total_amount | decimal(18,2) | NO | NO |
| [dbo].[bookings] | contact_name | nvarchar(50) | NO | NO |
| [dbo].[bookings] | contact_phone | nvarchar(10) | NO | NO |
| [dbo].[bookings] | note | nvarchar(250) | YES | NO |
| [dbo].[bookings] | created_at | datetime | NO | NO |
| [dbo].[bookings] | updated_at | datetime | YES | NO |
| [dbo].[chat_message_places] | message_id | bigint | NO | NO |
| [dbo].[chat_message_places] | place_id | int | NO | NO |
| [dbo].[chat_messages] | message_id | bigint | NO | YES |
| [dbo].[chat_messages] | session_id | int | NO | NO |
| [dbo].[chat_messages] | sender | varchar(10) | NO | NO |
| [dbo].[chat_messages] | content | nvarchar(max) | NO | NO |
| [dbo].[chat_messages] | created_at | datetime2 | NO | NO |
| [dbo].[chat_sessions] | session_id | int | NO | YES |
| [dbo].[chat_sessions] | user_id | int | NO | NO |
| [dbo].[chat_sessions] | started_at | datetime2 | NO | NO |
| [dbo].[cuisines] | cuisine_id | int | NO | YES |
| [dbo].[cuisines] | name | nvarchar(50) | NO | NO |
| [dbo].[districts] | district_id | int | NO | YES |
| [dbo].[districts] | name | nvarchar(50) | NO | NO |
| [dbo].[email_verifications] | id | bigint | NO | YES |
| [dbo].[email_verifications] | user_id | int | NO | NO |
| [dbo].[email_verifications] | code_hash | varchar(255) | NO | NO |
| [dbo].[email_verifications] | expires_at | datetime2 | NO | NO |
| [dbo].[email_verifications] | attempts | int | NO | NO |
| [dbo].[email_verifications] | created_at | datetime2 | NO | NO |
| [dbo].[email_verifications] | last_sent_at | datetime2 | NO | NO |
| [dbo].[email_verifications] | sent_count | int | NO | NO |
| [dbo].[email_verifications] | window_start | datetime2 | NO | NO |
| [dbo].[email_verifications] | purpose | varchar(20) | NO | NO |
| [dbo].[itineraries] | id | bigint | NO | YES |
| [dbo].[itineraries] | title | nvarchar(100) | NO | NO |
| [dbo].[itineraries] | status | nvarchar(10) | NO | NO |
| [dbo].[itineraries] | generation_input_json | nvarchar(max) | NO | NO |
| [dbo].[itineraries] | notices_json | nvarchar(max) | NO | NO |
| [dbo].[itineraries] | recommendations_json | nvarchar(max) | NO | NO |
| [dbo].[itineraries] | algorithm_version | nvarchar(25) | NO | NO |
| [dbo].[itineraries] | generated_at | datetime2 | NO | NO |
| [dbo].[itineraries] | created_at | datetime2 | NO | NO |
| [dbo].[itineraries] | updated_at | datetime2 | YES | NO |
| [dbo].[itineraries] | user_id | int | YES | NO |
| [dbo].[itineraries] | start_date | date | YES | NO |
| [dbo].[itineraries] | day_count | tinyint | YES | NO |
| [dbo].[itineraries] | guest_count | int | YES | NO |
| [dbo].[itineraries] | needs_json | nvarchar(max) | YES | NO |
| [dbo].[itinerary_budgets] | itinerary_id | bigint | NO | NO |
| [dbo].[itinerary_budgets] | currency | char(3) | NO | NO |
| [dbo].[itinerary_budgets] | budget_amount | decimal(18,2) | NO | NO |
| [dbo].[itinerary_budgets] | estimated_total | decimal(18,2) | NO | NO |
| [dbo].[itinerary_budgets] | remaining_budget | decimal(18,2) | NO | NO |
| [dbo].[itinerary_budgets] | over_budget_amount | decimal(18,2) | NO | NO |
| [dbo].[itinerary_budgets] | budget_status | nvarchar(10) | NO | NO |
| [dbo].[itinerary_budgets] | accommodation_cost | decimal(18,2) | NO | NO |
| [dbo].[itinerary_budgets] | food_cost | decimal(18,2) | NO | NO |
| [dbo].[itinerary_budgets] | transport_cost | decimal(18,2) | NO | NO |
| [dbo].[itinerary_budgets] | attractions_cost | decimal(18,2) | NO | NO |
| [dbo].[itinerary_budgets] | contingency_cost | decimal(18,2) | NO | NO |
| [dbo].[itinerary_budgets] | entertainment_cost | decimal(18,2) | NO | NO |
| [dbo].[itinerary_catalog_places] | id | int | NO | YES |
| [dbo].[itinerary_catalog_places] | slug | nvarchar(50) | NO | NO |
| [dbo].[itinerary_catalog_places] | kind | nvarchar(10) | NO | NO |
| [dbo].[itinerary_catalog_places] | name | nvarchar(100) | NO | NO |
| [dbo].[itinerary_catalog_places] | description | nvarchar(500) | NO | NO |
| [dbo].[itinerary_catalog_places] | address | nvarchar(150) | NO | NO |
| [dbo].[itinerary_catalog_places] | price | decimal(18,2) | NO | NO |
| [dbo].[itinerary_catalog_places] | accommodation_type | nvarchar(15) | YES | NO |
| [dbo].[itinerary_catalog_places] | stars | tinyint | YES | NO |
| [dbo].[itinerary_catalog_places] | meal_period | nvarchar(10) | YES | NO |
| [dbo].[itinerary_catalog_places] | image_url | nvarchar(500) | NO | NO |
| [dbo].[itinerary_catalog_places] | is_active | bit | NO | NO |
| [dbo].[itinerary_catalog_places] | created_at | datetime2 | NO | NO |
| [dbo].[itinerary_catalog_places] | opening_time | time | YES | NO |
| [dbo].[itinerary_catalog_places] | closing_time | time | YES | NO |
| [dbo].[itinerary_catalog_places] | visit_duration_minutes | smallint | YES | NO |
| [dbo].[itinerary_catalog_places] | latitude | decimal(9,6) | YES | NO |
| [dbo].[itinerary_catalog_places] | longitude | decimal(9,6) | YES | NO |
| [dbo].[itinerary_catalog_places] | room_type | nvarchar(50) | YES | NO |
| [dbo].[itinerary_catalog_places] | room_capacity | smallint | YES | NO |
| [dbo].[itinerary_catalog_places] | price_basis | nvarchar(10) | NO | NO |
| [dbo].[itinerary_catalog_preferences] | place_id | int | NO | NO |
| [dbo].[itinerary_catalog_preferences] | preference | nvarchar(50) | NO | NO |
| [dbo].[itinerary_items] | id | bigint | NO | YES |
| [dbo].[itinerary_items] | itinerary_id | bigint | NO | NO |
| [dbo].[itinerary_items] | day_number | tinyint | NO | NO |
| [dbo].[itinerary_items] | sequence_number | smallint | NO | NO |
| [dbo].[itinerary_items] | item_key | nvarchar(50) | NO | NO |
| [dbo].[itinerary_items] | scheduled_time | time | NO | NO |
| [dbo].[itinerary_items] | item_type | nvarchar(10) | NO | NO |
| [dbo].[itinerary_items] | title | nvarchar(150) | NO | NO |
| [dbo].[itinerary_items] | description | nvarchar(1000) | NO | NO |
| [dbo].[itinerary_items] | location | nvarchar(250) | YES | NO |
| [dbo].[itinerary_items] | image_url | nvarchar(500) | YES | NO |
| [dbo].[itinerary_items] | estimated_cost | decimal(18,2) | NO | NO |
| [dbo].[itinerary_items] | catalog_place_id | int | YES | NO |
| [dbo].[itinerary_items] | unit_price | decimal(18,2) | NO | NO |
| [dbo].[itinerary_items] | quantity | int | NO | NO |
| [dbo].[itinerary_items] | duration_minutes | smallint | YES | NO |
| [dbo].[itinerary_items] | travel_minutes | smallint | YES | NO |
| [dbo].[itinerary_training_data] | id | bigint | NO | YES |
| [dbo].[itinerary_training_data] | input_json | nvarchar(max) | NO | NO |
| [dbo].[itinerary_training_data] | output_json | nvarchar(max) | NO | NO |
| [dbo].[itinerary_training_data] | algorithm_version | nvarchar(25) | NO | NO |
| [dbo].[itinerary_training_data] | created_at | datetime2 | NO | NO |
| [dbo].[menu_item_tastes] | menu_item_id | int | NO | NO |
| [dbo].[menu_item_tastes] | taste_id | int | NO | NO |
| [dbo].[menu_items] | menu_item_id | int | NO | YES |
| [dbo].[menu_items] | place_id | int | NO | NO |
| [dbo].[menu_items] | name | nvarchar(75) | NO | NO |
| [dbo].[menu_items] | description | nvarchar(250) | YES | NO |
| [dbo].[menu_items] | price | decimal(18,0) | NO | NO |
| [dbo].[menu_items] | is_available | bit | NO | NO |
| [dbo].[menu_items] | image_url | varchar(255) | YES | NO |
| [dbo].[menu_items] | updated_at | datetime2 | YES | NO |
| [dbo].[opening_hours] | opening_id | int | NO | YES |
| [dbo].[opening_hours] | place_id | int | NO | NO |
| [dbo].[opening_hours] | day_of_week | tinyint | NO | NO |
| [dbo].[opening_hours] | open_time | time | NO | NO |
| [dbo].[opening_hours] | close_time | time | NO | NO |
| [dbo].[partner_profiles] | partner_id | int | NO | YES |
| [dbo].[partner_profiles] | user_id | int | NO | NO |
| [dbo].[partner_profiles] | business_name | nvarchar(75) | NO | NO |
| [dbo].[partner_profiles] | contact_phone | varchar(20) | YES | NO |
| [dbo].[partner_profiles] | address | nvarchar(127.5) | YES | NO |
| [dbo].[partner_profiles] | approval_status | varchar(20) | NO | NO |
| [dbo].[partner_profiles] | approved_by | int | YES | NO |
| [dbo].[partner_profiles] | approved_at | datetime2 | YES | NO |
| [dbo].[partner_profiles] | service_type | nvarchar(5) | YES | NO |
| [dbo].[partner_profiles] | tax_code | nvarchar(10) | YES | NO |
| [dbo].[partner_profiles] | created_at | datetime2 | NO | NO |
| [dbo].[partner_profiles] | rejection_reason | nvarchar(250) | YES | NO |
| [dbo].[partner_subscriptions] | subscription_id | int | NO | YES |
| [dbo].[partner_subscriptions] | transaction_code | nvarchar(25) | NO | NO |
| [dbo].[partner_subscriptions] | partner_id | int | NO | NO |
| [dbo].[partner_subscriptions] | package_id | int | NO | NO |
| [dbo].[partner_subscriptions] | package_name | nvarchar(50) | NO | NO |
| [dbo].[partner_subscriptions] | duration_months | int | NO | NO |
| [dbo].[partner_subscriptions] | price | bigint | NO | NO |
| [dbo].[partner_subscriptions] | subscription_status | nvarchar(10) | NO | NO |
| [dbo].[partner_subscriptions] | payment_status | nvarchar(10) | NO | NO |
| [dbo].[partner_subscriptions] | payment_method | nvarchar(25) | NO | NO |
| [dbo].[partner_subscriptions] | payment_reference | nvarchar(50) | YES | NO |
| [dbo].[partner_subscriptions] | payment_proof_note | nvarchar(250) | YES | NO |
| [dbo].[partner_subscriptions] | payment_submitted_at | datetime2 | YES | NO |
| [dbo].[partner_subscriptions] | start_date | datetime2 | YES | NO |
| [dbo].[partner_subscriptions] | end_date | datetime2 | YES | NO |
| [dbo].[partner_subscriptions] | created_at | datetime2 | NO | NO |
| [dbo].[partner_subscriptions] | confirmed_by | int | YES | NO |
| [dbo].[partner_subscriptions] | confirmed_at | datetime2 | YES | NO |
| [dbo].[partner_subscriptions] | rejection_reason | nvarchar(250) | YES | NO |
| [dbo].[partner_subscriptions] | is_renewal | bit | NO | NO |
| [dbo].[partner_subscriptions] | renewed_from_id | int | YES | NO |
| [dbo].[password_reset_tokens] | id | bigint | NO | YES |
| [dbo].[password_reset_tokens] | user_id | int | NO | NO |
| [dbo].[password_reset_tokens] | token_hash | char(64) | NO | NO |
| [dbo].[password_reset_tokens] | expires_at | datetime2 | NO | NO |
| [dbo].[password_reset_tokens] | used_at | datetime2 | YES | NO |
| [dbo].[password_reset_tokens] | created_at | datetime2 | NO | NO |
| [dbo].[payments] | payment_id | int | NO | YES |
| [dbo].[payments] | booking_id | int | NO | NO |
| [dbo].[payments] | method | nvarchar(10) | NO | NO |
| [dbo].[payments] | amount | decimal(18,2) | NO | NO |
| [dbo].[payments] | status | nvarchar(10) | NO | NO |
| [dbo].[payments] | paid_at | datetime | YES | NO |
| [dbo].[payments] | reference_code | nvarchar(50) | YES | NO |
| [dbo].[payments] | created_at | datetime | NO | NO |
| [dbo].[place_images] | image_id | int | NO | YES |
| [dbo].[place_images] | place_id | int | NO | NO |
| [dbo].[place_images] | image_url | varchar(255) | NO | NO |
| [dbo].[place_images] | is_cover | bit | NO | NO |
| [dbo].[place_lock_logs] | log_id | int | NO | YES |
| [dbo].[place_lock_logs] | place_id | int | NO | NO |
| [dbo].[place_lock_logs] | reason | nvarchar(127.5) | NO | NO |
| [dbo].[place_lock_logs] | previous_status | varchar(20) | NO | NO |
| [dbo].[place_lock_logs] | locked_by | int | NO | NO |
| [dbo].[place_lock_logs] | locked_at | datetime2 | NO | NO |
| [dbo].[place_lock_logs] | unlocked_by | int | YES | NO |
| [dbo].[place_lock_logs] | unlocked_at | datetime2 | YES | NO |
| [dbo].[places] | place_id | int | NO | YES |
| [dbo].[places] | place_type | varchar(20) | NO | NO |
| [dbo].[places] | name | nvarchar(100) | NO | NO |
| [dbo].[places] | description | nvarchar(max) | YES | NO |
| [dbo].[places] | address | nvarchar(127.5) | YES | NO |
| [dbo].[places] | district_id | int | YES | NO |
| [dbo].[places] | latitude | decimal(9,6) | YES | NO |
| [dbo].[places] | longitude | decimal(9,6) | YES | NO |
| [dbo].[places] | phone | varchar(20) | YES | NO |
| [dbo].[places] | website | varchar(255) | YES | NO |
| [dbo].[places] | partner_id | int | YES | NO |
| [dbo].[places] | avg_rating | decimal(2,1) | NO | NO |
| [dbo].[places] | review_count | int | NO | NO |
| [dbo].[places] | view_count | int | NO | NO |
| [dbo].[places] | promo_label | nvarchar(25) | YES | NO |
| [dbo].[places] | status | varchar(20) | NO | NO |
| [dbo].[places] | verified_at | datetime2 | YES | NO |
| [dbo].[places] | created_at | datetime2 | NO | NO |
| [dbo].[places] | updated_at | datetime2 | YES | NO |
| [dbo].[places] | booking_url | nvarchar(250) | YES | NO |
| [dbo].[refresh_tokens] | token_id | bigint | NO | YES |
| [dbo].[refresh_tokens] | user_id | int | NO | NO |
| [dbo].[refresh_tokens] | token_hash | char(64) | NO | NO |
| [dbo].[refresh_tokens] | expires_at | datetime2 | NO | NO |
| [dbo].[refresh_tokens] | revoked_at | datetime2 | YES | NO |
| [dbo].[refresh_tokens] | user_agent | nvarchar(127.5) | YES | NO |
| [dbo].[refresh_tokens] | ip | nvarchar(22.5) | YES | NO |
| [dbo].[refresh_tokens] | created_at | datetime2 | NO | NO |
| [dbo].[restaurants] | place_id | int | NO | NO |
| [dbo].[restaurants] | place_type | varchar(20) | NO | NO |
| [dbo].[restaurants] | cuisine_id | int | YES | NO |
| [dbo].[restaurants] | price_min | decimal(18,0) | YES | NO |
| [dbo].[restaurants] | price_max | decimal(18,0) | YES | NO |
| [dbo].[review_cooldowns] | user_id | int | NO | NO |
| [dbo].[review_cooldowns] | place_id | int | NO | NO |
| [dbo].[review_cooldowns] | last_reviewed_at | datetime2 | NO | NO |
| [dbo].[review_images] | image_id | int | NO | YES |
| [dbo].[review_images] | review_id | int | NO | NO |
| [dbo].[review_images] | image_order | tinyint | NO | NO |
| [dbo].[review_images] | mime_type | varchar(20) | NO | NO |
| [dbo].[review_images] | image_data | varbinary(max) | NO | NO |
| [dbo].[reviews] | review_id | int | NO | YES |
| [dbo].[reviews] | user_id | int | NO | NO |
| [dbo].[reviews] | place_id | int | NO | NO |
| [dbo].[reviews] | rating | tinyint | NO | NO |
| [dbo].[reviews] | comment | nvarchar(500) | YES | NO |
| [dbo].[reviews] | status | varchar(20) | NO | NO |
| [dbo].[reviews] | moderated_by | int | YES | NO |
| [dbo].[reviews] | moderated_at | datetime2 | YES | NO |
| [dbo].[reviews] | created_at | datetime2 | NO | NO |
| [dbo].[reviews] | updated_at | datetime2 | YES | NO |
| [dbo].[roles] | role_id | int | NO | YES |
| [dbo].[roles] | role_name | varchar(30) | NO | NO |
| [dbo].[room_types] | room_type_id | int | NO | YES |
| [dbo].[room_types] | place_id | int | NO | NO |
| [dbo].[room_types] | name | nvarchar(50) | NO | NO |
| [dbo].[room_types] | capacity | tinyint | YES | NO |
| [dbo].[room_types] | price_per_night | decimal(18,0) | NO | NO |
| [dbo].[room_types] | original_price | decimal(18,0) | YES | NO |
| [dbo].[room_types] | status | varchar(20) | NO | NO |
| [dbo].[room_types] | updated_at | datetime2 | YES | NO |
| [dbo].[room_types] | room_count | int | NO | NO |
| [dbo].[route_cache] | route_id | int | NO | YES |
| [dbo].[route_cache] | from_place_id | int | NO | NO |
| [dbo].[route_cache] | to_place_id | int | NO | NO |
| [dbo].[route_cache] | mode_id | int | NO | NO |
| [dbo].[route_cache] | distance_km | decimal(8,2) | YES | NO |
| [dbo].[route_cache] | duration_minutes | int | YES | NO |
| [dbo].[route_cache] | estimated_cost | decimal(18,0) | YES | NO |
| [dbo].[route_cache] | cached_at | datetime2 | NO | NO |
| [dbo].[sepay_webhook_transactions] | sepay_id | bigint | NO | NO |
| [dbo].[sepay_webhook_transactions] | transaction_code | nvarchar(25) | YES | NO |
| [dbo].[sepay_webhook_transactions] | transfer_type | nvarchar(5) | NO | NO |
| [dbo].[sepay_webhook_transactions] | transfer_amount | bigint | NO | NO |
| [dbo].[sepay_webhook_transactions] | reference_code | nvarchar(127.5) | YES | NO |
| [dbo].[sepay_webhook_transactions] | transaction_date | nvarchar(20) | YES | NO |
| [dbo].[sepay_webhook_transactions] | processing_status | nvarchar(15) | NO | NO |
| [dbo].[sepay_webhook_transactions] | processing_note | nvarchar(250) | YES | NO |
| [dbo].[sepay_webhook_transactions] | raw_payload | nvarchar(max) | NO | NO |
| [dbo].[sepay_webhook_transactions] | received_at | datetime2 | NO | NO |
| [dbo].[sepay_webhook_transactions] | processed_at | datetime2 | YES | NO |
| [dbo].[subscription_packages] | package_id | int | NO | YES |
| [dbo].[subscription_packages] | package_code | varchar(50) | NO | NO |
| [dbo].[subscription_packages] | name | nvarchar(50) | NO | NO |
| [dbo].[subscription_packages] | duration_months | int | NO | NO |
| [dbo].[subscription_packages] | price | bigint | NO | NO |
| [dbo].[subscription_packages] | description | nvarchar(250) | YES | NO |
| [dbo].[subscription_packages] | is_active | bit | NO | NO |
| [dbo].[subscription_packages] | sort_order | int | NO | NO |
| [dbo].[subscription_packages] | created_at | datetime2 | NO | NO |
| [dbo].[subscription_packages] | updated_at | datetime2 | YES | NO |
| [dbo].[subscription_status_logs] | log_id | int | NO | YES |
| [dbo].[subscription_status_logs] | subscription_id | int | NO | NO |
| [dbo].[subscription_status_logs] | previous_status | nvarchar(25) | YES | NO |
| [dbo].[subscription_status_logs] | new_status | nvarchar(25) | NO | NO |
| [dbo].[subscription_status_logs] | action_by_user_id | int | YES | NO |
| [dbo].[subscription_status_logs] | created_at | datetime2 | NO | NO |
| [dbo].[subscription_status_logs] | note | nvarchar(250) | YES | NO |
| [dbo].[survey_answers] | answer_id | int | NO | YES |
| [dbo].[survey_answers] | response_id | int | NO | NO |
| [dbo].[survey_answers] | question_id | int | NO | NO |
| [dbo].[survey_answers] | option_id | int | YES | NO |
| [dbo].[survey_answers] | answer_text | nvarchar(500) | YES | NO |
| [dbo].[survey_answers] | answer_score | tinyint | YES | NO |
| [dbo].[survey_question_options] | option_id | int | NO | YES |
| [dbo].[survey_question_options] | question_id | int | NO | NO |
| [dbo].[survey_question_options] | option_text | nvarchar(100) | NO | NO |
| [dbo].[survey_question_options] | sort_order | tinyint | YES | NO |
| [dbo].[survey_questions] | question_id | int | NO | YES |
| [dbo].[survey_questions] | survey_id | int | NO | NO |
| [dbo].[survey_questions] | content | nvarchar(250) | NO | NO |
| [dbo].[survey_questions] | question_type | varchar(20) | NO | NO |
| [dbo].[survey_questions] | is_required | bit | NO | NO |
| [dbo].[survey_questions] | sort_order | tinyint | YES | NO |
| [dbo].[survey_responses] | response_id | int | NO | YES |
| [dbo].[survey_responses] | survey_id | int | NO | NO |
| [dbo].[survey_responses] | user_id | int | NO | NO |
| [dbo].[survey_responses] | place_id | int | YES | NO |
| [dbo].[survey_responses] | itinerary_id | int | YES | NO |
| [dbo].[survey_responses] | status | varchar(10) | NO | NO |
| [dbo].[survey_responses] | sent_at | datetime2 | NO | NO |
| [dbo].[survey_responses] | submitted_at | datetime2 | YES | NO |
| [dbo].[surveys] | survey_id | int | NO | YES |
| [dbo].[surveys] | title | nvarchar(100) | NO | NO |
| [dbo].[surveys] | description | nvarchar(250) | YES | NO |
| [dbo].[surveys] | target_role | varchar(10) | NO | NO |
| [dbo].[surveys] | status | varchar(20) | NO | NO |
| [dbo].[surveys] | created_by | int | NO | NO |
| [dbo].[surveys] | created_at | datetime2 | NO | NO |
| [dbo].[surveys] | expires_at | datetime2 | YES | NO |
| [dbo].[system_settings] | setting_key | varchar(100) | NO | NO |
| [dbo].[system_settings] | setting_value | nvarchar(250) | NO | NO |
| [dbo].[system_settings] | description | nvarchar(127.5) | YES | NO |
| [dbo].[system_settings] | updated_by | int | YES | NO |
| [dbo].[system_settings] | updated_at | datetime2 | NO | NO |
| [dbo].[tastes] | taste_id | int | NO | YES |
| [dbo].[tastes] | name | nvarchar(25) | NO | NO |
| [dbo].[transport_modes] | mode_id | int | NO | YES |
| [dbo].[transport_modes] | code | varchar(20) | NO | NO |
| [dbo].[transport_modes] | name | nvarchar(25) | NO | NO |
| [dbo].[transport_modes] | cost_per_km | decimal(18,0) | NO | NO |
| [dbo].[user_favorites] | user_id | int | NO | NO |
| [dbo].[user_favorites] | place_id | int | NO | NO |
| [dbo].[user_favorites] | created_at | datetime2 | NO | NO |
| [dbo].[user_itinerary_preferences] | user_id | int | NO | NO |
| [dbo].[user_itinerary_preferences] | preferences_json | nvarchar(max) | NO | NO |
| [dbo].[user_itinerary_preferences] | updated_at | datetime2 | NO | NO |
| [dbo].[user_memberships] | user_id | int | NO | NO |
| [dbo].[user_memberships] | tier_id | int | NO | NO |
| [dbo].[user_memberships] | points | int | NO | NO |
| [dbo].[user_memberships] | joined_at | datetime2 | NO | NO |
| [dbo].[user_preferences] | user_id | int | NO | NO |
| [dbo].[user_preferences] | preferred_cuisine_id | int | YES | NO |
| [dbo].[user_preferences] | preferred_taste_id | int | YES | NO |
| [dbo].[user_preferences] | preferred_category_id | int | YES | NO |
| [dbo].[user_preferences] | default_budget_per_day | decimal(18,0) | YES | NO |
| [dbo].[users] | user_id | int | NO | YES |
| [dbo].[users] | role_id | int | NO | NO |
| [dbo].[users] | full_name | nvarchar(50) | NO | NO |
| [dbo].[users] | email | varchar(150) | NO | NO |
| [dbo].[users] | password_hash | varchar(255) | NO | NO |
| [dbo].[users] | phone | varchar(20) | YES | NO |
| [dbo].[users] | date_of_birth | date | YES | NO |
| [dbo].[users] | avatar_url | varchar(255) | YES | NO |
| [dbo].[users] | status | varchar(20) | NO | NO |
| [dbo].[users] | created_at | datetime2 | NO | NO |
| [dbo].[users] | updated_at | datetime2 | YES | NO |
| [dbo].[users] | public_id | nvarchar(10) | NO | NO |
| [dbo].[users] | email_verified | bit | NO | NO |
| [dbo].[users] | failed_login_count | int | NO | NO |
| [dbo].[users] | locked_until | datetime2 | YES | NO |
| [dbo].[users] | last_login_at | datetime2 | YES | NO |
| [dbo].[users] | admin_locked | bit | NO | NO |
| [dbo].[vip_offers] | offer_id | int | NO | YES |
| [dbo].[vip_offers] | code | varchar(30) | NO | NO |
| [dbo].[vip_offers] | title | nvarchar(75) | NO | NO |
| [dbo].[vip_offers] | description | nvarchar(250) | YES | NO |
| [dbo].[vip_offers] | min_tier_id | int | YES | NO |
| [dbo].[vip_offers] | discount_percent | decimal(5,2) | YES | NO |
| [dbo].[vip_offers] | valid_until | date | YES | NO |
| [dbo].[vip_offers] | is_active | bit | NO | NO |
| [dbo].[vip_tiers] | tier_id | int | NO | YES |
| [dbo].[vip_tiers] | code | varchar(20) | NO | NO |
| [dbo].[vip_tiers] | name | nvarchar(25) | NO | NO |
| [dbo].[vip_tiers] | min_points | int | NO | NO |
| [dbo].[vip_tiers] | benefits | nvarchar(max) | YES | NO |

## Primary keys

- [dbo].[accommodation_amenities].pk_accommodation_amenities: `place_id` (ordinal 1)
- [dbo].[accommodation_amenities].pk_accommodation_amenities: `amenity_id` (ordinal 2)
- [dbo].[accommodations].PK__accommod__BF2B684A70CB446C: `place_id` (ordinal 1)
- [dbo].[amenities].PK__amenitie__E908452D0FFB7063: `amenity_id` (ordinal 1)
- [dbo].[attraction_categories].PK__attracti__D54EE9B4A30344F2: `category_id` (ordinal 1)
- [dbo].[attractions].PK__attracti__BF2B684A35E13BE3: `place_id` (ordinal 1)
- [dbo].[booking_items].PK__booking___52020FDD9A5868DE: `item_id` (ordinal 1)
- [dbo].[booking_status_logs].PK__booking___9E2397E0826453AD: `log_id` (ordinal 1)
- [dbo].[bookings].PK__bookings__5DE3A5B1025E1BD0: `booking_id` (ordinal 1)
- [dbo].[chat_message_places].pk_chat_message_places: `message_id` (ordinal 1)
- [dbo].[chat_message_places].pk_chat_message_places: `place_id` (ordinal 2)
- [dbo].[chat_messages].PK__chat_mes__0BBF6EE6CBEBAF85: `message_id` (ordinal 1)
- [dbo].[chat_sessions].PK__chat_ses__69B13FDCFA602274: `session_id` (ordinal 1)
- [dbo].[cuisines].PK__cuisines__3197C6F4FFADCA3E: `cuisine_id` (ordinal 1)
- [dbo].[districts].PK__district__2521322BD38A09A7: `district_id` (ordinal 1)
- [dbo].[email_verifications].PK_email_verifications: `id` (ordinal 1)
- [dbo].[itineraries].PK_itineraries: `id` (ordinal 1)
- [dbo].[itinerary_budgets].PK_itinerary_budgets: `itinerary_id` (ordinal 1)
- [dbo].[itinerary_catalog_places].PK__itinerar__3213E83F82686CF1: `id` (ordinal 1)
- [dbo].[itinerary_catalog_preferences].PK_itinerary_catalog_preferences: `place_id` (ordinal 1)
- [dbo].[itinerary_catalog_preferences].PK_itinerary_catalog_preferences: `preference` (ordinal 2)
- [dbo].[itinerary_items].PK_itinerary_items: `id` (ordinal 1)
- [dbo].[itinerary_training_data].PK__itinerar__3213E83FBFDEE38C: `id` (ordinal 1)
- [dbo].[menu_item_tastes].pk_menu_item_tastes: `menu_item_id` (ordinal 1)
- [dbo].[menu_item_tastes].pk_menu_item_tastes: `taste_id` (ordinal 2)
- [dbo].[menu_items].PK__menu_ite__973431D5472D610C: `menu_item_id` (ordinal 1)
- [dbo].[opening_hours].PK__opening___E9D1AA2EF3DAE0A3: `opening_id` (ordinal 1)
- [dbo].[partner_profiles].PK__partner___576F1B27091736AB: `partner_id` (ordinal 1)
- [dbo].[partner_subscriptions].PK_partner_subscriptions: `subscription_id` (ordinal 1)
- [dbo].[password_reset_tokens].PK_password_reset_tokens: `id` (ordinal 1)
- [dbo].[payments].PK__payments__ED1FC9EAE0F07A97: `payment_id` (ordinal 1)
- [dbo].[place_images].PK__place_im__DC9AC9554AB8120B: `image_id` (ordinal 1)
- [dbo].[place_lock_logs].PK__place_lo__9E2397E085964291: `log_id` (ordinal 1)
- [dbo].[places].PK__places__BF2B684A42DDB7EC: `place_id` (ordinal 1)
- [dbo].[refresh_tokens].PK_refresh_tokens: `token_id` (ordinal 1)
- [dbo].[restaurants].PK__restaura__BF2B684AC8723505: `place_id` (ordinal 1)
- [dbo].[review_cooldowns].pk_review_cooldowns: `user_id` (ordinal 1)
- [dbo].[review_cooldowns].pk_review_cooldowns: `place_id` (ordinal 2)
- [dbo].[review_images].pk_review_images: `image_id` (ordinal 1)
- [dbo].[reviews].PK__reviews__60883D9052EDAB15: `review_id` (ordinal 1)
- [dbo].[roles].PK__roles__760965CC88C91DBD: `role_id` (ordinal 1)
- [dbo].[room_types].PK__room_typ__42395E8407330049: `room_type_id` (ordinal 1)
- [dbo].[route_cache].PK__route_ca__28F706FEEE7528B0: `route_id` (ordinal 1)
- [dbo].[sepay_webhook_transactions].PK_sepay_webhook_transactions: `sepay_id` (ordinal 1)
- [dbo].[subscription_packages].PK_subscription_packages: `package_id` (ordinal 1)
- [dbo].[subscription_status_logs].PK_subscription_status_logs: `log_id` (ordinal 1)
- [dbo].[survey_answers].PK__survey_a__337243182A95E55C: `answer_id` (ordinal 1)
- [dbo].[survey_question_options].PK__survey_q__F4EACE1B7F6C756A: `option_id` (ordinal 1)
- [dbo].[survey_questions].PK__survey_q__2EC21549E13DDDE1: `question_id` (ordinal 1)
- [dbo].[survey_responses].PK__survey_r__EBECD8967E7C8F4D: `response_id` (ordinal 1)
- [dbo].[surveys].PK__surveys__9DC31A077D5A9C7A: `survey_id` (ordinal 1)
- [dbo].[system_settings].PK__system_s__0DFAC426F641B1DA: `setting_key` (ordinal 1)
- [dbo].[tastes].PK__tastes__E9D3142ED15DE4F0: `taste_id` (ordinal 1)
- [dbo].[transport_modes].PK__transpor__33C24C6ED1D7DB6E: `mode_id` (ordinal 1)
- [dbo].[user_favorites].pk_user_favorites: `user_id` (ordinal 1)
- [dbo].[user_favorites].pk_user_favorites: `place_id` (ordinal 2)
- [dbo].[user_itinerary_preferences].PK_user_itinerary_preferences: `user_id` (ordinal 1)
- [dbo].[user_memberships].PK__user_mem__B9BE370F38171B68: `user_id` (ordinal 1)
- [dbo].[user_preferences].PK__user_pre__B9BE370FBC63EAE0: `user_id` (ordinal 1)
- [dbo].[users].PK__users__B9BE370FC08476A9: `user_id` (ordinal 1)
- [dbo].[vip_offers].PK__vip_offe__03D37AC2AE8CE334: `offer_id` (ordinal 1)
- [dbo].[vip_tiers].PK__vip_tier__9D52AF9C9C24BA7A: `tier_id` (ordinal 1)

## Foreign keys

- [dbo].[accommodation_amenities].fk_aa_acc: `place_id` → [dbo].[accommodations].`place_id`
- [dbo].[accommodation_amenities].fk_aa_amenity: `amenity_id` → [dbo].[amenities].`amenity_id`
- [dbo].[accommodations].fk_acc_place: `place_id` → [dbo].[places].`place_id`
- [dbo].[accommodations].fk_acc_place: `place_type` → [dbo].[places].`place_type`
- [dbo].[attractions].fk_attr_category: `category_id` → [dbo].[attraction_categories].`category_id`
- [dbo].[attractions].fk_attr_place: `place_type` → [dbo].[places].`place_type`
- [dbo].[attractions].fk_attr_place: `place_id` → [dbo].[places].`place_id`
- [dbo].[booking_items].FK_booking_items_booking: `booking_id` → [dbo].[bookings].`booking_id`
- [dbo].[booking_status_logs].FK_status_logs_booking: `booking_id` → [dbo].[bookings].`booking_id`
- [dbo].[chat_message_places].fk_cmp_message: `message_id` → [dbo].[chat_messages].`message_id`
- [dbo].[chat_message_places].fk_cmp_place: `place_id` → [dbo].[places].`place_id`
- [dbo].[chat_messages].fk_cm_session: `session_id` → [dbo].[chat_sessions].`session_id`
- [dbo].[chat_sessions].fk_cs_user: `user_id` → [dbo].[users].`user_id`
- [dbo].[email_verifications].FK_email_verifications_users: `user_id` → [dbo].[users].`user_id`
- [dbo].[itinerary_budgets].FK_itinerary_budgets_itinerary: `itinerary_id` → [dbo].[itineraries].`id`
- [dbo].[itinerary_catalog_preferences].FK_itinerary_catalog_preferences_place: `place_id` → [dbo].[itinerary_catalog_places].`id`
- [dbo].[itinerary_items].FK_itinerary_items_catalog_place: `catalog_place_id` → [dbo].[itinerary_catalog_places].`id`
- [dbo].[itinerary_items].FK_itinerary_items_itinerary: `itinerary_id` → [dbo].[itineraries].`id`
- [dbo].[menu_item_tastes].fk_mit_item: `menu_item_id` → [dbo].[menu_items].`menu_item_id`
- [dbo].[menu_item_tastes].fk_mit_taste: `taste_id` → [dbo].[tastes].`taste_id`
- [dbo].[menu_items].fk_menu_rest: `place_id` → [dbo].[restaurants].`place_id`
- [dbo].[opening_hours].fk_open_place: `place_id` → [dbo].[places].`place_id`
- [dbo].[partner_profiles].fk_partner_approver: `approved_by` → [dbo].[users].`user_id`
- [dbo].[partner_profiles].fk_partner_user: `user_id` → [dbo].[users].`user_id`
- [dbo].[partner_subscriptions].FK_partner_subscriptions_confirmed_by: `confirmed_by` → [dbo].[users].`user_id`
- [dbo].[partner_subscriptions].FK_partner_subscriptions_package: `package_id` → [dbo].[subscription_packages].`package_id`
- [dbo].[partner_subscriptions].FK_partner_subscriptions_partner: `partner_id` → [dbo].[partner_profiles].`partner_id`
- [dbo].[partner_subscriptions].FK_partner_subscriptions_renewed_from: `renewed_from_id` → [dbo].[partner_subscriptions].`subscription_id`
- [dbo].[password_reset_tokens].FK_password_reset_tokens_users: `user_id` → [dbo].[users].`user_id`
- [dbo].[payments].FK_payments_booking: `booking_id` → [dbo].[bookings].`booking_id`
- [dbo].[place_images].fk_img_place: `place_id` → [dbo].[places].`place_id`
- [dbo].[place_lock_logs].fk_pll_locker: `locked_by` → [dbo].[users].`user_id`
- [dbo].[place_lock_logs].fk_pll_place: `place_id` → [dbo].[places].`place_id`
- [dbo].[place_lock_logs].fk_pll_unlocker: `unlocked_by` → [dbo].[users].`user_id`
- [dbo].[places].fk_places_district: `district_id` → [dbo].[districts].`district_id`
- [dbo].[places].fk_places_partner: `partner_id` → [dbo].[partner_profiles].`partner_id`
- [dbo].[refresh_tokens].FK_refresh_tokens_users: `user_id` → [dbo].[users].`user_id`
- [dbo].[restaurants].fk_rest_cuisine: `cuisine_id` → [dbo].[cuisines].`cuisine_id`
- [dbo].[restaurants].fk_rest_place: `place_id` → [dbo].[places].`place_id`
- [dbo].[restaurants].fk_rest_place: `place_type` → [dbo].[places].`place_type`
- [dbo].[review_cooldowns].fk_review_cooldowns_place: `place_id` → [dbo].[places].`place_id`
- [dbo].[review_cooldowns].fk_review_cooldowns_user: `user_id` → [dbo].[users].`user_id`
- [dbo].[review_images].fk_review_images_review: `review_id` → [dbo].[reviews].`review_id`
- [dbo].[reviews].fk_rev_moderator: `moderated_by` → [dbo].[users].`user_id`
- [dbo].[reviews].fk_rev_place: `place_id` → [dbo].[places].`place_id`
- [dbo].[reviews].fk_rev_user: `user_id` → [dbo].[users].`user_id`
- [dbo].[reviews].fk_reviews_moderated_by: `moderated_by` → [dbo].[users].`user_id`
- [dbo].[room_types].fk_room_acc: `place_id` → [dbo].[accommodations].`place_id`
- [dbo].[route_cache].fk_rc_from: `from_place_id` → [dbo].[places].`place_id`
- [dbo].[route_cache].fk_rc_mode: `mode_id` → [dbo].[transport_modes].`mode_id`
- [dbo].[route_cache].fk_rc_to: `to_place_id` → [dbo].[places].`place_id`
- [dbo].[subscription_status_logs].FK_sub_logs_subscription: `subscription_id` → [dbo].[partner_subscriptions].`subscription_id`
- [dbo].[subscription_status_logs].FK_sub_logs_user: `action_by_user_id` → [dbo].[users].`user_id`
- [dbo].[survey_answers].fk_sa_option: `option_id` → [dbo].[survey_question_options].`option_id`
- [dbo].[survey_answers].fk_sa_question: `question_id` → [dbo].[survey_questions].`question_id`
- [dbo].[survey_answers].fk_sa_response: `response_id` → [dbo].[survey_responses].`response_id`
- [dbo].[survey_question_options].fk_sqo_question: `question_id` → [dbo].[survey_questions].`question_id`
- [dbo].[survey_questions].fk_sq_survey: `survey_id` → [dbo].[surveys].`survey_id`
- [dbo].[survey_responses].fk_sr_place: `place_id` → [dbo].[places].`place_id`
- [dbo].[survey_responses].fk_sr_survey: `survey_id` → [dbo].[surveys].`survey_id`
- [dbo].[survey_responses].fk_sr_user: `user_id` → [dbo].[users].`user_id`
- [dbo].[surveys].fk_survey_user: `created_by` → [dbo].[users].`user_id`
- [dbo].[system_settings].fk_setting_user: `updated_by` → [dbo].[users].`user_id`
- [dbo].[user_favorites].fk_fav_place: `place_id` → [dbo].[places].`place_id`
- [dbo].[user_favorites].fk_fav_user: `user_id` → [dbo].[users].`user_id`
- [dbo].[user_memberships].fk_mem_tier: `tier_id` → [dbo].[vip_tiers].`tier_id`
- [dbo].[user_memberships].fk_mem_user: `user_id` → [dbo].[users].`user_id`
- [dbo].[user_preferences].fk_pref_category: `preferred_category_id` → [dbo].[attraction_categories].`category_id`
- [dbo].[user_preferences].fk_pref_cuisine: `preferred_cuisine_id` → [dbo].[cuisines].`cuisine_id`
- [dbo].[user_preferences].fk_pref_taste: `preferred_taste_id` → [dbo].[tastes].`taste_id`
- [dbo].[user_preferences].fk_pref_user: `user_id` → [dbo].[users].`user_id`
- [dbo].[users].fk_users_role: `role_id` → [dbo].[roles].`role_id`
- [dbo].[vip_offers].fk_offer_tier: `min_tier_id` → [dbo].[vip_tiers].`tier_id`

## Indexes

- [dbo].[accommodation_amenities].pk_accommodation_amenities: UNIQUE PRIMARY KEY (place_id, amenity_id)
- [dbo].[accommodations].PK__accommod__BF2B684A70CB446C: UNIQUE PRIMARY KEY (place_id)
- [dbo].[amenities].PK__amenitie__E908452D0FFB7063: UNIQUE PRIMARY KEY (amenity_id)
- [dbo].[amenities].UQ__amenitie__72E12F1B0031B808: UNIQUE (name)
- [dbo].[attraction_categories].PK__attracti__D54EE9B4A30344F2: UNIQUE PRIMARY KEY (category_id)
- [dbo].[attraction_categories].UQ__attracti__72E12F1B96659641: UNIQUE (name)
- [dbo].[attractions].IX_attractions_category_price: (category_id, ticket_price)
- [dbo].[attractions].PK__attracti__BF2B684A35E13BE3: UNIQUE PRIMARY KEY (place_id)
- [dbo].[booking_items].PK__booking___52020FDD9A5868DE: UNIQUE PRIMARY KEY (item_id)
- [dbo].[booking_status_logs].PK__booking___9E2397E0826453AD: UNIQUE PRIMARY KEY (log_id)
- [dbo].[bookings].PK__bookings__5DE3A5B1025E1BD0: UNIQUE PRIMARY KEY (booking_id)
- [dbo].[chat_message_places].pk_chat_message_places: UNIQUE PRIMARY KEY (message_id, place_id)
- [dbo].[chat_messages].idx_cm_session: (session_id, created_at)
- [dbo].[chat_messages].PK__chat_mes__0BBF6EE6CBEBAF85: UNIQUE PRIMARY KEY (message_id)
- [dbo].[chat_sessions].PK__chat_ses__69B13FDCFA602274: UNIQUE PRIMARY KEY (session_id)
- [dbo].[cuisines].PK__cuisines__3197C6F4FFADCA3E: UNIQUE PRIMARY KEY (cuisine_id)
- [dbo].[cuisines].UQ__cuisines__72E12F1B654024C3: UNIQUE (name)
- [dbo].[districts].PK__district__2521322BD38A09A7: UNIQUE PRIMARY KEY (district_id)
- [dbo].[districts].UQ__district__72E12F1B3CE0A0BB: UNIQUE (name)
- [dbo].[email_verifications].IX_email_verifications_user_id: (user_id)
- [dbo].[email_verifications].PK_email_verifications: UNIQUE PRIMARY KEY (id)
- [dbo].[email_verifications].UQ_email_verifications_user_purpose: UNIQUE (user_id, purpose)
- [dbo].[itineraries].IX_itineraries_created_at: (created_at)
- [dbo].[itineraries].IX_itineraries_user_created: (user_id, created_at)
- [dbo].[itineraries].PK_itineraries: UNIQUE PRIMARY KEY (id)
- [dbo].[itinerary_budgets].PK_itinerary_budgets: UNIQUE PRIMARY KEY (itinerary_id)
- [dbo].[itinerary_catalog_places].PK__itinerar__3213E83F82686CF1: UNIQUE PRIMARY KEY (id)
- [dbo].[itinerary_catalog_places].UQ__itinerar__32DD1E4CB1CD9511: UNIQUE (slug)
- [dbo].[itinerary_catalog_preferences].PK_itinerary_catalog_preferences: UNIQUE PRIMARY KEY (place_id, preference)
- [dbo].[itinerary_items].IX_itinerary_items_itinerary_day: (itinerary_id, day_number, sequence_number)
- [dbo].[itinerary_items].PK_itinerary_items: UNIQUE PRIMARY KEY (id)
- [dbo].[itinerary_items].UQ_itinerary_items_key: UNIQUE (itinerary_id, item_key)
- [dbo].[itinerary_items].UQ_itinerary_items_order: UNIQUE (itinerary_id, day_number, sequence_number)
- [dbo].[itinerary_training_data].PK__itinerar__3213E83FBFDEE38C: UNIQUE PRIMARY KEY (id)
- [dbo].[menu_item_tastes].IX_menu_item_tastes_taste_item: (taste_id, menu_item_id)
- [dbo].[menu_item_tastes].pk_menu_item_tastes: UNIQUE PRIMARY KEY (menu_item_id, taste_id)
- [dbo].[menu_items].idx_menu_place: (place_id)
- [dbo].[menu_items].IX_menu_items_place_available: (place_id, is_available)
- [dbo].[menu_items].PK__menu_ite__973431D5472D610C: UNIQUE PRIMARY KEY (menu_item_id)
- [dbo].[opening_hours].IX_opening_hours_place_day: (place_id, day_of_week)
- [dbo].[opening_hours].PK__opening___E9D1AA2EF3DAE0A3: UNIQUE PRIMARY KEY (opening_id)
- [dbo].[opening_hours].uq_open_slot: UNIQUE (place_id, day_of_week, open_time)
- [dbo].[partner_profiles].IX_partner_profiles_user_status: (user_id, approval_status)
- [dbo].[partner_profiles].PK__partner___576F1B27091736AB: UNIQUE PRIMARY KEY (partner_id)
- [dbo].[partner_profiles].UQ__partner___B9BE370E771A8C42: UNIQUE (user_id)
- [dbo].[partner_subscriptions].IX_partner_subscriptions_created: (created_at)
- [dbo].[partner_subscriptions].IX_partner_subscriptions_partner: (partner_id, subscription_status, end_date)
- [dbo].[partner_subscriptions].IX_partner_subscriptions_revenue: (payment_status, confirmed_at)
- [dbo].[partner_subscriptions].PK_partner_subscriptions: UNIQUE PRIMARY KEY (subscription_id)
- [dbo].[partner_subscriptions].UQ_partner_subscriptions_txcode: UNIQUE (transaction_code)
- [dbo].[password_reset_tokens].IX_password_reset_tokens_user_active: (user_id, expires_at)
- [dbo].[password_reset_tokens].PK_password_reset_tokens: UNIQUE PRIMARY KEY (id)
- [dbo].[password_reset_tokens].UQ_password_reset_tokens_token_hash: UNIQUE (token_hash)
- [dbo].[payments].PK__payments__ED1FC9EAE0F07A97: UNIQUE PRIMARY KEY (payment_id)
- [dbo].[place_images].idx_img_place: (place_id)
- [dbo].[place_images].IX_place_images_place_cover: (place_id, is_cover)
- [dbo].[place_images].PK__place_im__DC9AC9554AB8120B: UNIQUE PRIMARY KEY (image_id)
- [dbo].[place_lock_logs].idx_pll_place_open: (place_id, unlocked_at)
- [dbo].[place_lock_logs].PK__place_lo__9E2397E085964291: UNIQUE PRIMARY KEY (log_id)
- [dbo].[places].idx_places_name: (name)
- [dbo].[places].idx_places_partner: (partner_id)
- [dbo].[places].idx_places_type_status_district: (place_type, status, district_id)
- [dbo].[places].IX_places_admin_status_created: (status, created_at)
- [dbo].[places].IX_places_filter_covering: (status, district_id, avg_rating)
- [dbo].[places].IX_places_partner_dashboard: (partner_id, status, created_at)
- [dbo].[places].IX_places_type_status_rating: (place_type, status, avg_rating)
- [dbo].[places].PK__places__BF2B684A42DDB7EC: UNIQUE PRIMARY KEY (place_id)
- [dbo].[places].uq_places_id_type: UNIQUE (place_id, place_type)
- [dbo].[refresh_tokens].IX_refresh_tokens_user_active: (user_id, expires_at)
- [dbo].[refresh_tokens].PK_refresh_tokens: UNIQUE PRIMARY KEY (token_id)
- [dbo].[refresh_tokens].UQ_refresh_tokens_token_hash: UNIQUE (token_hash)
- [dbo].[restaurants].IX_restaurants_cuisine_price: (cuisine_id, price_min, price_max)
- [dbo].[restaurants].IX_restaurants_price_range: (price_min, price_max)
- [dbo].[restaurants].PK__restaura__BF2B684AC8723505: UNIQUE PRIMARY KEY (place_id)
- [dbo].[review_cooldowns].pk_review_cooldowns: UNIQUE PRIMARY KEY (user_id, place_id)
- [dbo].[review_images].pk_review_images: UNIQUE PRIMARY KEY (image_id)
- [dbo].[review_images].uq_review_images_order: UNIQUE (review_id, image_order)
- [dbo].[reviews].idx_rev_place_status: (place_id, status)
- [dbo].[reviews].PK__reviews__60883D9052EDAB15: UNIQUE PRIMARY KEY (review_id)
- [dbo].[roles].PK__roles__760965CC88C91DBD: UNIQUE PRIMARY KEY (role_id)
- [dbo].[roles].UQ__roles__783254B1FEE52437: UNIQUE (role_name)
- [dbo].[room_types].idx_room_place: (place_id)
- [dbo].[room_types].idx_room_place_status_price: (place_id, status)
- [dbo].[room_types].PK__room_typ__42395E8407330049: UNIQUE PRIMARY KEY (room_type_id)
- [dbo].[route_cache].PK__route_ca__28F706FEEE7528B0: UNIQUE PRIMARY KEY (route_id)
- [dbo].[route_cache].uq_route: UNIQUE (from_place_id, to_place_id, mode_id)
- [dbo].[sepay_webhook_transactions].IX_sepay_webhook_transactions_code: (transaction_code)
- [dbo].[sepay_webhook_transactions].IX_sepay_webhook_transactions_status_received: (processing_status, received_at)
- [dbo].[sepay_webhook_transactions].PK_sepay_webhook_transactions: UNIQUE PRIMARY KEY (sepay_id)
- [dbo].[subscription_packages].PK_subscription_packages: UNIQUE PRIMARY KEY (package_id)
- [dbo].[subscription_packages].UQ_subscription_packages_code: UNIQUE (package_code)
- [dbo].[subscription_status_logs].PK_subscription_status_logs: UNIQUE PRIMARY KEY (log_id)
- [dbo].[survey_answers].PK__survey_a__337243182A95E55C: UNIQUE PRIMARY KEY (answer_id)
- [dbo].[survey_answers].uq_sa_response_question: UNIQUE (response_id, question_id)
- [dbo].[survey_question_options].PK__survey_q__F4EACE1B7F6C756A: UNIQUE PRIMARY KEY (option_id)
- [dbo].[survey_questions].PK__survey_q__2EC21549E13DDDE1: UNIQUE PRIMARY KEY (question_id)
- [dbo].[survey_responses].idx_sr_survey: (survey_id)
- [dbo].[survey_responses].idx_sr_user: (user_id, status)
- [dbo].[survey_responses].PK__survey_r__EBECD8967E7C8F4D: UNIQUE PRIMARY KEY (response_id)
- [dbo].[surveys].PK__surveys__9DC31A077D5A9C7A: UNIQUE PRIMARY KEY (survey_id)
- [dbo].[system_settings].PK__system_s__0DFAC426F641B1DA: UNIQUE PRIMARY KEY (setting_key)
- [dbo].[tastes].PK__tastes__E9D3142ED15DE4F0: UNIQUE PRIMARY KEY (taste_id)
- [dbo].[tastes].UQ__tastes__72E12F1BC4506724: UNIQUE (name)
- [dbo].[transport_modes].PK__transpor__33C24C6ED1D7DB6E: UNIQUE PRIMARY KEY (mode_id)
- [dbo].[transport_modes].UQ__transpor__357D4CF93503B0CF: UNIQUE (code)
- [dbo].[user_favorites].idx_fav_place: (place_id)
- [dbo].[user_favorites].pk_user_favorites: UNIQUE PRIMARY KEY (user_id, place_id)
- [dbo].[user_itinerary_preferences].PK_user_itinerary_preferences: UNIQUE PRIMARY KEY (user_id)
- [dbo].[user_memberships].PK__user_mem__B9BE370F38171B68: UNIQUE PRIMARY KEY (user_id)
- [dbo].[user_preferences].PK__user_pre__B9BE370FBC63EAE0: UNIQUE PRIMARY KEY (user_id)
- [dbo].[users].PK__users__B9BE370FC08476A9: UNIQUE PRIMARY KEY (user_id)
- [dbo].[users].UQ__users__AB6E6164F05E83CB: UNIQUE (email)
- [dbo].[users].UX_users_phone: UNIQUE (phone) WHERE ([phone] IS NOT NULL)
- [dbo].[users].UX_users_public_id: UNIQUE (public_id)
- [dbo].[vip_offers].PK__vip_offe__03D37AC2AE8CE334: UNIQUE PRIMARY KEY (offer_id)
- [dbo].[vip_offers].UQ__vip_offe__357D4CF953345A4B: UNIQUE (code)
- [dbo].[vip_tiers].PK__vip_tier__9D52AF9C9C24BA7A: UNIQUE PRIMARY KEY (tier_id)
- [dbo].[vip_tiers].UQ__vip_tier__357D4CF9F31D5660: UNIQUE (code)

## CHECK constraints

- [dbo].[accommodations].chk_acc_kind: `([accommodation_type]='APARTMENT' OR [accommodation_type]='HOSTEL' OR [accommodation_type]='RESORT' OR [accommodation_type]='HOMESTAY' OR [accommodation_type]='HOTEL')`
- [dbo].[accommodations].chk_acc_star: `([star_rating] IS NULL OR [star_rating]>=(1) AND [star_rating]<=(5))`
- [dbo].[accommodations].chk_acc_type: `([place_type]='ACCOMMODATION')`
- [dbo].[attractions].chk_attr_duration: `([visit_duration_minutes] IS NULL OR [visit_duration_minutes]>(0))`
- [dbo].[attractions].chk_attr_price: `([ticket_price]>=(0))`
- [dbo].[attractions].chk_attr_type: `([place_type]='ATTRACTION')`
- [dbo].[bookings].CK__bookings__bookin__214BF109: `([booking_type]='TICKET' OR [booking_type]='TABLE' OR [booking_type]='STAY')`
- [dbo].[bookings].CK__bookings__status__22401542: `([status]='COMPLETED' OR [status]='CANCELLED' OR [status]='CONFIRMED' OR [status]='PENDING')`
- [dbo].[chat_messages].chk_cm_sender: `([sender]='AI' OR [sender]='USER')`
- [dbo].[itineraries].CK_itineraries_day_count: `([day_count] IS NULL OR [day_count]>=(1) AND [day_count]<=(3))`
- [dbo].[itineraries].CK_itineraries_guest_count: `([guest_count] IS NULL OR [guest_count]>(0))`
- [dbo].[itineraries].CK_itineraries_input_json: `(isjson([generation_input_json])=(1))`
- [dbo].[itineraries].CK_itineraries_needs_json: `([needs_json] IS NULL OR isjson([needs_json])=(1))`
- [dbo].[itineraries].CK_itineraries_notices_json: `(isjson([notices_json])=(1))`
- [dbo].[itineraries].CK_itineraries_recommendations_json: `(isjson([recommendations_json])=(1))`
- [dbo].[itineraries].CK_itineraries_status: `([status]=N'ARCHIVED' OR [status]=N'SAVED' OR [status]=N'DRAFT')`
- [dbo].[itinerary_budgets].CK_itinerary_budgets_amounts: `([budget_amount]>=(0) AND [estimated_total]>=(0) AND [over_budget_amount]>=(0) AND [accommodation_cost]>=(0) AND [food_cost]>=(0) AND [transport_cost]>=(0) AND [attractions_cost]>=(0) AND [contingency_cost]>=(0))`
- [dbo].[itinerary_budgets].CK_itinerary_budgets_balance: `([remaining_budget]=([budget_amount]-[estimated_total]) AND [over_budget_amount]=case when [estimated_total]>[budget_amount] then [estimated_total]-[budget_amount] else (0) end AND [budget_status]=case when [estimated_total]>[budget_amount] then N'over-budget' else N'within-budget' end)`
- [dbo].[itinerary_budgets].CK_itinerary_budgets_cost_breakdown: `([estimated_total]=((((([accommodation_cost]+[food_cost])+[transport_cost])+[attractions_cost])+[entertainment_cost])+[contingency_cost]))`
- [dbo].[itinerary_budgets].CK_itinerary_budgets_status: `([budget_status]=N'over-budget' OR [budget_status]=N'within-budget')`
- [dbo].[itinerary_catalog_places].CK_itinerary_catalog_kind: `([kind]='ENTERTAINMENT' OR [kind]='ATTRACTION' OR [kind]='FOOD' OR [kind]='STAY')`
- [dbo].[itinerary_catalog_places].CK_itinerary_catalog_meal: `([meal_period] IS NULL OR ([meal_period]='DINNER' OR [meal_period]='SNACK' OR [meal_period]='LUNCH' OR [meal_period]='BREAKFAST'))`
- [dbo].[itinerary_catalog_places].CK_itinerary_catalog_price: `([price]>=(0))`
- [dbo].[itinerary_catalog_places].CK_itinerary_catalog_price_basis: `([price_basis]=N'PER_ROOM' OR [price_basis]=N'PER_PERSON')`
- [dbo].[itinerary_catalog_places].CK_itinerary_catalog_room_capacity: `([room_capacity] IS NULL OR [room_capacity]>(0))`
- [dbo].[itinerary_catalog_places].CK_itinerary_catalog_stay: `([kind]='STAY' AND [accommodation_type] IS NOT NULL AND ([stars]>=(3) AND [stars]<=(5)) AND [meal_period] IS NULL OR [kind]='FOOD' AND [accommodation_type] IS NULL AND [stars] IS NULL AND [meal_period] IS NOT NULL OR [kind]='ATTRACTION' AND [accommodation_type] IS NULL AND [stars] IS NULL AND [meal_period] IS NULL OR [kind]='ENTERTAINMENT' AND [accommodation_type] IS NULL AND [stars] IS NULL AND [meal_period] IS NULL)`
- [dbo].[itinerary_catalog_preferences].CK_itinerary_catalog_preference: `([preference]=N'Check-in sống ảo' OR [preference]=N'Phiêu lưu mạo hiểm' OR [preference]=N'Di sản & Văn hoá' OR [preference]=N'Biển & Nghỉ dưỡng' OR [preference]=N'Ẩm thực địa phương')`
- [dbo].[itinerary_items].CK_itinerary_items_cost: `([estimated_cost]>=(0))`
- [dbo].[itinerary_items].CK_itinerary_items_day: `([day_number]>=(1) AND [day_number]<=(7))`
- [dbo].[itinerary_items].CK_itinerary_items_duration: `([duration_minutes] IS NULL OR [duration_minutes]>(0))`
- [dbo].[itinerary_items].CK_itinerary_items_quantity: `([quantity]>(0))`
- [dbo].[itinerary_items].CK_itinerary_items_sequence: `([sequence_number]>=(1))`
- [dbo].[itinerary_items].CK_itinerary_items_type: `([item_type]=N'entertainment' OR [item_type]=N'transport' OR [item_type]=N'hotel' OR [item_type]=N'food' OR [item_type]=N'attraction')`
- [dbo].[itinerary_items].CK_itinerary_items_unit_price: `([unit_price]>=(0))`
- [dbo].[itinerary_training_data].CK_itinerary_training_input_json: `(isjson([input_json])=(1))`
- [dbo].[itinerary_training_data].CK_itinerary_training_output_json: `(isjson([output_json])=(1))`
- [dbo].[menu_items].chk_menu_price: `([price]>=(0))`
- [dbo].[opening_hours].chk_open_day: `([day_of_week]>=(1) AND [day_of_week]<=(7))`
- [dbo].[partner_profiles].chk_partner_status: `([approval_status]='REJECTED' OR [approval_status]='APPROVED' OR [approval_status]='PENDING')`
- [dbo].[partner_profiles].CK_partner_profiles_service_type: `([service_type] IS NULL OR ([service_type]=N'TICKET' OR [service_type]=N'TABLE' OR [service_type]=N'STAY'))`
- [dbo].[partner_subscriptions].CK_partner_subscriptions_pay_status: `([payment_status]='REJECTED' OR [payment_status]='PAID' OR [payment_status]='PENDING')`
- [dbo].[partner_subscriptions].CK_partner_subscriptions_price: `([price]>=(0))`
- [dbo].[partner_subscriptions].CK_partner_subscriptions_sub_status: `([subscription_status]='CANCELLED' OR [subscription_status]='REJECTED' OR [subscription_status]='EXPIRED' OR [subscription_status]='ACTIVE' OR [subscription_status]='PENDING')`
- [dbo].[payments].CK__payments__method__336AA144: `([method]='VNPAY' OR [method]='MOMO' OR [method]='BANK_TRANSFER' OR [method]='CASH')`
- [dbo].[payments].CK__payments__status__345EC57D: `([status]='REFUNDED' OR [status]='FAILED' OR [status]='PAID' OR [status]='PENDING')`
- [dbo].[places].chk_places_booking_url: `([booking_url] IS NULL OR [booking_url] like 'http://%' OR [booking_url] like 'https://%')`
- [dbo].[places].chk_places_lat: `([latitude] IS NULL OR [latitude]>=(-90) AND [latitude]<=(90))`
- [dbo].[places].chk_places_lng: `([longitude] IS NULL OR [longitude]>=(-180) AND [longitude]<=(180))`
- [dbo].[places].chk_places_rating: `([avg_rating]>=(0) AND [avg_rating]<=(5))`
- [dbo].[places].chk_places_status: `([status]='LOCKED' OR [status]='PENDING' OR [status]='HIDDEN' OR [status]='ACTIVE')`
- [dbo].[places].chk_places_type: `([place_type]='ATTRACTION' OR [place_type]='RESTAURANT' OR [place_type]='ACCOMMODATION')`
- [dbo].[restaurants].chk_rest_price: `(([price_min] IS NULL OR [price_min]>=(0)) AND ([price_max] IS NULL OR [price_max]>=(0)) AND ([price_min] IS NULL OR [price_max] IS NULL OR [price_max]>=[price_min]))`
- [dbo].[restaurants].chk_rest_type: `([place_type]='RESTAURANT')`
- [dbo].[review_images].ck_review_images_mime: `([mime_type]='image/webp' OR [mime_type]='image/png' OR [mime_type]='image/jpeg')`
- [dbo].[review_images].ck_review_images_order: `([image_order]>=(0) AND [image_order]<=(4))`
- [dbo].[reviews].chk_rev_rating: `([rating]>=(1) AND [rating]<=(5))`
- [dbo].[reviews].chk_rev_status: `([status]='HIDDEN' OR [status]='APPROVED' OR [status]='PENDING')`
- [dbo].[room_types].chk_room_count: `([room_count]>(0))`
- [dbo].[room_types].chk_room_orig: `([original_price] IS NULL OR [original_price]>=[price_per_night])`
- [dbo].[room_types].chk_room_price: `([price_per_night]>=(0))`
- [dbo].[room_types].chk_room_status: `([status]='HIDDEN' OR [status]='ACTIVE')`
- [dbo].[route_cache].chk_rc_diff: `([from_place_id]<>[to_place_id])`
- [dbo].[route_cache].chk_rc_dist: `([distance_km] IS NULL OR [distance_km]>=(0))`
- [dbo].[subscription_packages].CK_subscription_packages_duration: `([duration_months]>(0))`
- [dbo].[subscription_packages].CK_subscription_packages_price: `([price]>=(0))`
- [dbo].[survey_answers].chk_sa_score: `([answer_score] IS NULL OR [answer_score]>=(1) AND [answer_score]<=(5))`
- [dbo].[survey_questions].chk_sq_type: `([question_type]='CHOICE' OR [question_type]='TEXT' OR [question_type]='RATING')`
- [dbo].[survey_responses].chk_sr_status: `([status]='SUBMITTED' OR [status]='SENT')`
- [dbo].[surveys].chk_survey_status: `([status]='CLOSED' OR [status]='OPEN' OR [status]='DRAFT')`
- [dbo].[surveys].chk_survey_target: `([target_role]='ALL' OR [target_role]='PARTNER' OR [target_role]='USER')`
- [dbo].[transport_modes].chk_mode_cost: `([cost_per_km]>=(0))`
- [dbo].[user_itinerary_preferences].CK_user_itinerary_preferences_json: `(isjson([preferences_json])=(1))`
- [dbo].[user_memberships].chk_mem_points: `([points]>=(0))`
- [dbo].[user_preferences].chk_pref_budget: `([default_budget_per_day] IS NULL OR [default_budget_per_day]>(0))`
- [dbo].[users].chk_users_status: `([status]='LOCKED' OR [status]='ACTIVE')`
- [dbo].[vip_offers].chk_offer_discount: `([discount_percent] IS NULL OR [discount_percent]>=(0) AND [discount_percent]<=(100))`
- [dbo].[vip_tiers].chk_tier_points: `([min_points]>=(0))`

## Auth design comparison and decisions

- `users`: exists.
  - Missing target columns: none by name; review listed types and role mapping.
- `roles`: exists.
  - Missing target columns: none by name; review listed types and role mapping.
- `partner_profiles`: exists.
  - Missing target columns: none by name; review listed types and role mapping.
- `refresh_tokens`: exists.
  - Missing target columns: none by name; review listed types and role mapping.
- `password_reset_tokens`: exists.
  - Missing target columns: none by name; review listed types and role mapping.

### Role mapping

Existing roles (3 rows): `1: User`, `2: Partner`, `3: Admin`.

The existing `users.role_id` FK to `roles.role_id` must remain. Map USER/PARTNER/ADMIN to role IDs 1/2/3 via case-insensitive `role_name`; do not add duplicate role rows. Existing labels are title case (`User`, `Partner`, `Admin`).

### Compatibility notes

- `users.email` is currently `varchar(150) NOT NULL` with a UNIQUE index; `phone` is nullable. This matches the updated product decision: email is required at registration, phone is optional, and the existing email column/index can remain unchanged. The migration adds a filtered UNIQUE index for phone.
- `users.status` is `varchar(20) NOT NULL` and its current CHECK allows only ACTIVE/LOCKED. The target adds PENDING; the constraint must be adjusted additively and checked against current data before the application uses it.
- `partner_profiles` already exists and has a UNIQUE `user_id` plus FK to users, existing approval status constraint, and `business_name NVARCHAR(75)` (shorter than target). Preserve those constraints and use additive changes only after reviewing type/length needs.
- Registration requires an email and accepts an optional phone number. Login lookup must accept either `users.email` or `users.phone`; no additional email column or placeholder email is needed.
- `bookings.user_id` exists but no declared FK to `users` was found; leave that relationship untouched during auth schema work unless separately approved and audited.
- Both `users` and `partner_profiles` currently have zero rows; `roles` has three rows. Existing dependent FK tables are preserved as listed below.

### Existing user references

- [dbo].[chat_sessions].user_id → users.user_id (fk_cs_user)
- [dbo].[email_verifications].user_id → users.user_id (FK_email_verifications_users)
- [dbo].[partner_profiles].approved_by → users.user_id (fk_partner_approver)
- [dbo].[partner_profiles].user_id → users.user_id (fk_partner_user)
- [dbo].[partner_subscriptions].confirmed_by → users.user_id (FK_partner_subscriptions_confirmed_by)
- [dbo].[password_reset_tokens].user_id → users.user_id (FK_password_reset_tokens_users)
- [dbo].[place_lock_logs].locked_by → users.user_id (fk_pll_locker)
- [dbo].[place_lock_logs].unlocked_by → users.user_id (fk_pll_unlocker)
- [dbo].[refresh_tokens].user_id → users.user_id (FK_refresh_tokens_users)
- [dbo].[review_cooldowns].user_id → users.user_id (fk_review_cooldowns_user)
- [dbo].[reviews].moderated_by → users.user_id (fk_rev_moderator)
- [dbo].[reviews].user_id → users.user_id (fk_rev_user)
- [dbo].[reviews].moderated_by → users.user_id (fk_reviews_moderated_by)
- [dbo].[subscription_status_logs].action_by_user_id → users.user_id (FK_sub_logs_user)
- [dbo].[survey_responses].user_id → users.user_id (fk_sr_user)
- [dbo].[surveys].created_by → users.user_id (fk_survey_user)
- [dbo].[system_settings].updated_by → users.user_id (fk_setting_user)
- [dbo].[user_favorites].user_id → users.user_id (fk_fav_user)
- [dbo].[user_memberships].user_id → users.user_id (fk_mem_user)
- [dbo].[user_preferences].user_id → users.user_id (fk_pref_user)

## TypeScript baseline (before audit files)

### Backend

Command: `npx tsc --noEmit` (backend). Failed before changes. Existing diagnostics include TS1295/TS1287 because CommonJS package/module settings conflict with `verbatimModuleSyntax`; places.routes.ts also has TS1484 type-only import errors and TS2345 for `req.params.id` (`string | string[] | undefined`).

### Frontend

Command: `npx tsc --noEmit` (frontend). Could not complete: no usable local TypeScript executable was available, and npx attempted to fetch package `tsc` from npm, which failed with EACCES. No files were modified at the time of either baseline check.

## Phase 0 verification after fixes

Backend `npx tsc --noEmit` now passes. Minimal fixes: `backend/tsconfig.json` enables Node ambient types and disables `verbatimModuleSyntax`, which conflicted with the existing CommonJS package; `places.routes.ts` validates the Express 5 route parameter before parsing it. These do not change runtime module format.

Frontend typecheck remains unavailable because `frontend/node_modules` is absent and npm registry access failed with EACCES; install dependencies in the frontend workspace before running its compiler.

