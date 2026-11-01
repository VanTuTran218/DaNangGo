# Database audit

- Database: `DaNangGo`
- Audited at (UTC): 2026-10-07T08:31:14.872Z
- Tables discovered: 43

## Tables and row counts

| Table | Rows |
| --- | ---: |
| [dbo].[accommodation_amenities] | 0 |
| [dbo].[accommodations] | 0 |
| [dbo].[amenities] | 7 |
| [dbo].[attraction_categories] | 5 |
| [dbo].[attractions] | 0 |
| [dbo].[booking_items] | 0 |
| [dbo].[booking_status_logs] | 0 |
| [dbo].[bookings] | 0 |
| [dbo].[chat_message_places] | 0 |
| [dbo].[chat_messages] | 0 |
| [dbo].[chat_sessions] | 0 |
| [dbo].[cuisines] | 5 |
| [dbo].[districts] | 7 |
| [dbo].[itineraries] | 0 |
| [dbo].[itinerary_alternatives] | 0 |
| [dbo].[itinerary_days] | 0 |
| [dbo].[itinerary_items] | 0 |
| [dbo].[menu_item_tastes] | 0 |
| [dbo].[menu_items] | 0 |
| [dbo].[opening_hours] | 0 |
| [dbo].[partner_profiles] | 0 |
| [dbo].[payments] | 0 |
| [dbo].[place_images] | 0 |
| [dbo].[places] | 0 |
| [dbo].[restaurants] | 0 |
| [dbo].[reviews] | 0 |
| [dbo].[roles] | 3 |
| [dbo].[room_types] | 0 |
| [dbo].[route_cache] | 0 |
| [dbo].[survey_answers] | 0 |
| [dbo].[survey_question_options] | 0 |
| [dbo].[survey_questions] | 0 |
| [dbo].[survey_responses] | 0 |
| [dbo].[surveys] | 0 |
| [dbo].[system_settings] | 0 |
| [dbo].[tastes] | 6 |
| [dbo].[transport_modes] | 5 |
| [dbo].[user_favorites] | 0 |
| [dbo].[user_memberships] | 0 |
| [dbo].[user_preferences] | 0 |
| [dbo].[users] | 0 |
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
| [dbo].[itineraries] | itinerary_id | int | NO | YES |
| [dbo].[itineraries] | user_id | int | NO | NO |
| [dbo].[itineraries] | title | nvarchar(75) | YES | NO |
| [dbo].[itineraries] | start_date | date | YES | NO |
| [dbo].[itineraries] | num_days | tinyint | NO | NO |
| [dbo].[itineraries] | num_people | tinyint | NO | NO |
| [dbo].[itineraries] | budget | decimal(18,0) | NO | NO |
| [dbo].[itineraries] | include_stay | bit | NO | NO |
| [dbo].[itineraries] | include_food | bit | NO | NO |
| [dbo].[itineraries] | include_attractions | bit | NO | NO |
| [dbo].[itineraries] | total_estimated_cost | decimal(18,0) | NO | NO |
| [dbo].[itineraries] | budget_status | varchar(10) | YES | NO |
| [dbo].[itineraries] | status | varchar(15) | NO | NO |
| [dbo].[itineraries] | created_at | datetime2 | NO | NO |
| [dbo].[itineraries] | updated_at | datetime2 | YES | NO |
| [dbo].[itinerary_alternatives] | alt_id | int | NO | YES |
| [dbo].[itinerary_alternatives] | item_id | int | NO | NO |
| [dbo].[itinerary_alternatives] | alternative_place_id | int | NO | NO |
| [dbo].[itinerary_alternatives] | alternative_room_type_id | int | YES | NO |
| [dbo].[itinerary_alternatives] | alternative_menu_item_id | int | YES | NO |
| [dbo].[itinerary_alternatives] | cost_saving | decimal(18,0) | YES | NO |
| [dbo].[itinerary_alternatives] | reason | nvarchar(127.5) | YES | NO |
| [dbo].[itinerary_alternatives] | status | varchar(10) | NO | NO |
| [dbo].[itinerary_days] | day_id | int | NO | YES |
| [dbo].[itinerary_days] | itinerary_id | int | NO | NO |
| [dbo].[itinerary_days] | day_number | tinyint | NO | NO |
| [dbo].[itinerary_days] | day_cost | decimal(18,0) | NO | NO |
| [dbo].[itinerary_items] | item_id | int | NO | YES |
| [dbo].[itinerary_items] | day_id | int | NO | NO |
| [dbo].[itinerary_items] | place_id | int | NO | NO |
| [dbo].[itinerary_items] | item_type | varchar(10) | NO | NO |
| [dbo].[itinerary_items] | room_type_id | int | YES | NO |
| [dbo].[itinerary_items] | menu_item_id | int | YES | NO |
| [dbo].[itinerary_items] | quantity | int | NO | NO |
| [dbo].[itinerary_items] | unit_price | decimal(18,0) | NO | NO |
| [dbo].[itinerary_items] | estimated_cost | decimal(18,0) | NO | NO |
| [dbo].[itinerary_items] | start_time | time | YES | NO |
| [dbo].[itinerary_items] | end_time | time | YES | NO |
| [dbo].[itinerary_items] | mode_id | int | YES | NO |
| [dbo].[itinerary_items] | travel_minutes_from_previous | int | YES | NO |
| [dbo].[itinerary_items] | travel_cost | decimal(18,0) | NO | NO |
| [dbo].[itinerary_items] | sort_order | tinyint | NO | NO |
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
| [dbo].[restaurants] | place_id | int | NO | NO |
| [dbo].[restaurants] | place_type | varchar(20) | NO | NO |
| [dbo].[restaurants] | cuisine_id | int | YES | NO |
| [dbo].[restaurants] | price_min | decimal(18,0) | YES | NO |
| [dbo].[restaurants] | price_max | decimal(18,0) | YES | NO |
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
| [dbo].[route_cache] | route_id | int | NO | YES |
| [dbo].[route_cache] | from_place_id | int | NO | NO |
| [dbo].[route_cache] | to_place_id | int | NO | NO |
| [dbo].[route_cache] | mode_id | int | NO | NO |
| [dbo].[route_cache] | distance_km | decimal(8,2) | YES | NO |
| [dbo].[route_cache] | duration_minutes | int | YES | NO |
| [dbo].[route_cache] | estimated_cost | decimal(18,0) | YES | NO |
| [dbo].[route_cache] | cached_at | datetime2 | NO | NO |
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
- [dbo].[accommodations].PK__accommod__BF2B684A13FB279F: `place_id` (ordinal 1)
- [dbo].[amenities].PK__amenitie__E908452D298F60C8: `amenity_id` (ordinal 1)
- [dbo].[attraction_categories].PK__attracti__D54EE9B40CA4096D: `category_id` (ordinal 1)
- [dbo].[attractions].PK__attracti__BF2B684ADA781DC8: `place_id` (ordinal 1)
- [dbo].[booking_items].PK__booking___52020FDDA329B37A: `item_id` (ordinal 1)
- [dbo].[booking_status_logs].PK__booking___9E2397E073B73331: `log_id` (ordinal 1)
- [dbo].[bookings].PK__bookings__5DE3A5B1CEB058A8: `booking_id` (ordinal 1)
- [dbo].[chat_message_places].pk_chat_message_places: `message_id` (ordinal 1)
- [dbo].[chat_message_places].pk_chat_message_places: `place_id` (ordinal 2)
- [dbo].[chat_messages].PK__chat_mes__0BBF6EE6CC76626F: `message_id` (ordinal 1)
- [dbo].[chat_sessions].PK__chat_ses__69B13FDCEA9F9CF6: `session_id` (ordinal 1)
- [dbo].[cuisines].PK__cuisines__3197C6F4725DCF87: `cuisine_id` (ordinal 1)
- [dbo].[districts].PK__district__2521322B473AB3BE: `district_id` (ordinal 1)
- [dbo].[itineraries].PK__itinerar__6E8B21D6EA787C3C: `itinerary_id` (ordinal 1)
- [dbo].[itinerary_alternatives].PK__itinerar__77D19779DB51A927: `alt_id` (ordinal 1)
- [dbo].[itinerary_days].PK__itinerar__8B516ABB6BDDFBC2: `day_id` (ordinal 1)
- [dbo].[itinerary_items].PK__itinerar__52020FDDBECD543C: `item_id` (ordinal 1)
- [dbo].[menu_item_tastes].pk_menu_item_tastes: `menu_item_id` (ordinal 1)
- [dbo].[menu_item_tastes].pk_menu_item_tastes: `taste_id` (ordinal 2)
- [dbo].[menu_items].PK__menu_ite__973431D58B858803: `menu_item_id` (ordinal 1)
- [dbo].[opening_hours].PK__opening___E9D1AA2EB5A8BBE5: `opening_id` (ordinal 1)
- [dbo].[partner_profiles].PK__partner___576F1B2704F22205: `partner_id` (ordinal 1)
- [dbo].[payments].PK__payments__ED1FC9EAF0D316C1: `payment_id` (ordinal 1)
- [dbo].[place_images].PK__place_im__DC9AC95583FCC8D9: `image_id` (ordinal 1)
- [dbo].[places].PK__places__BF2B684A644D7999: `place_id` (ordinal 1)
- [dbo].[restaurants].PK__restaura__BF2B684A70D99BCD: `place_id` (ordinal 1)
- [dbo].[reviews].PK__reviews__60883D90ED70DD7A: `review_id` (ordinal 1)
- [dbo].[roles].PK__roles__760965CC3087FB57: `role_id` (ordinal 1)
- [dbo].[room_types].PK__room_typ__42395E841B803AAA: `room_type_id` (ordinal 1)
- [dbo].[route_cache].PK__route_ca__28F706FE00205A6D: `route_id` (ordinal 1)
- [dbo].[survey_answers].PK__survey_a__337243185BDA2EDC: `answer_id` (ordinal 1)
- [dbo].[survey_question_options].PK__survey_q__F4EACE1BB366D498: `option_id` (ordinal 1)
- [dbo].[survey_questions].PK__survey_q__2EC21549F3664324: `question_id` (ordinal 1)
- [dbo].[survey_responses].PK__survey_r__EBECD896970B2F4F: `response_id` (ordinal 1)
- [dbo].[surveys].PK__surveys__9DC31A07B3D2EF48: `survey_id` (ordinal 1)
- [dbo].[system_settings].PK__system_s__0DFAC426D1A3D56C: `setting_key` (ordinal 1)
- [dbo].[tastes].PK__tastes__E9D3142EB441A54F: `taste_id` (ordinal 1)
- [dbo].[transport_modes].PK__transpor__33C24C6EE73EC0AE: `mode_id` (ordinal 1)
- [dbo].[user_favorites].pk_user_favorites: `user_id` (ordinal 1)
- [dbo].[user_favorites].pk_user_favorites: `place_id` (ordinal 2)
- [dbo].[user_memberships].PK__user_mem__B9BE370FD887977B: `user_id` (ordinal 1)
- [dbo].[user_preferences].PK__user_pre__B9BE370FAC16E8C4: `user_id` (ordinal 1)
- [dbo].[users].PK__users__B9BE370FC9F5ABB5: `user_id` (ordinal 1)
- [dbo].[vip_offers].PK__vip_offe__03D37AC2394C5F31: `offer_id` (ordinal 1)
- [dbo].[vip_tiers].PK__vip_tier__9D52AF9CD8794AB9: `tier_id` (ordinal 1)

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
- [dbo].[itineraries].fk_itin_user: `user_id` → [dbo].[users].`user_id`
- [dbo].[itinerary_alternatives].fk_alt_item: `item_id` → [dbo].[itinerary_items].`item_id`
- [dbo].[itinerary_alternatives].fk_alt_menu: `alternative_menu_item_id` → [dbo].[menu_items].`menu_item_id`
- [dbo].[itinerary_alternatives].fk_alt_place: `alternative_place_id` → [dbo].[places].`place_id`
- [dbo].[itinerary_alternatives].fk_alt_room: `alternative_room_type_id` → [dbo].[room_types].`room_type_id`
- [dbo].[itinerary_days].fk_day_itin: `itinerary_id` → [dbo].[itineraries].`itinerary_id`
- [dbo].[itinerary_items].fk_item_day: `day_id` → [dbo].[itinerary_days].`day_id`
- [dbo].[itinerary_items].fk_item_menu: `menu_item_id` → [dbo].[menu_items].`menu_item_id`
- [dbo].[itinerary_items].fk_item_mode: `mode_id` → [dbo].[transport_modes].`mode_id`
- [dbo].[itinerary_items].fk_item_place: `place_id` → [dbo].[places].`place_id`
- [dbo].[itinerary_items].fk_item_room: `room_type_id` → [dbo].[room_types].`room_type_id`
- [dbo].[menu_item_tastes].fk_mit_item: `menu_item_id` → [dbo].[menu_items].`menu_item_id`
- [dbo].[menu_item_tastes].fk_mit_taste: `taste_id` → [dbo].[tastes].`taste_id`
- [dbo].[menu_items].fk_menu_rest: `place_id` → [dbo].[restaurants].`place_id`
- [dbo].[opening_hours].fk_open_place: `place_id` → [dbo].[places].`place_id`
- [dbo].[partner_profiles].fk_partner_approver: `approved_by` → [dbo].[users].`user_id`
- [dbo].[partner_profiles].fk_partner_user: `user_id` → [dbo].[users].`user_id`
- [dbo].[payments].FK_payments_booking: `booking_id` → [dbo].[bookings].`booking_id`
- [dbo].[place_images].fk_img_place: `place_id` → [dbo].[places].`place_id`
- [dbo].[places].fk_places_district: `district_id` → [dbo].[districts].`district_id`
- [dbo].[places].fk_places_partner: `partner_id` → [dbo].[partner_profiles].`partner_id`
- [dbo].[restaurants].fk_rest_cuisine: `cuisine_id` → [dbo].[cuisines].`cuisine_id`
- [dbo].[restaurants].fk_rest_place: `place_id` → [dbo].[places].`place_id`
- [dbo].[restaurants].fk_rest_place: `place_type` → [dbo].[places].`place_type`
- [dbo].[reviews].fk_rev_moderator: `moderated_by` → [dbo].[users].`user_id`
- [dbo].[reviews].fk_rev_place: `place_id` → [dbo].[places].`place_id`
- [dbo].[reviews].fk_rev_user: `user_id` → [dbo].[users].`user_id`
- [dbo].[room_types].fk_room_acc: `place_id` → [dbo].[accommodations].`place_id`
- [dbo].[route_cache].fk_rc_from: `from_place_id` → [dbo].[places].`place_id`
- [dbo].[route_cache].fk_rc_mode: `mode_id` → [dbo].[transport_modes].`mode_id`
- [dbo].[route_cache].fk_rc_to: `to_place_id` → [dbo].[places].`place_id`
- [dbo].[survey_answers].fk_sa_option: `option_id` → [dbo].[survey_question_options].`option_id`
- [dbo].[survey_answers].fk_sa_question: `question_id` → [dbo].[survey_questions].`question_id`
- [dbo].[survey_answers].fk_sa_response: `response_id` → [dbo].[survey_responses].`response_id`
- [dbo].[survey_question_options].fk_sqo_question: `question_id` → [dbo].[survey_questions].`question_id`
- [dbo].[survey_questions].fk_sq_survey: `survey_id` → [dbo].[surveys].`survey_id`
- [dbo].[survey_responses].fk_sr_itin: `itinerary_id` → [dbo].[itineraries].`itinerary_id`
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
- [dbo].[accommodations].PK__accommod__BF2B684A13FB279F: UNIQUE PRIMARY KEY (place_id)
- [dbo].[amenities].PK__amenitie__E908452D298F60C8: UNIQUE PRIMARY KEY (amenity_id)
- [dbo].[amenities].UQ__amenitie__72E12F1B0CA9243B: UNIQUE (name)
- [dbo].[attraction_categories].PK__attracti__D54EE9B40CA4096D: UNIQUE PRIMARY KEY (category_id)
- [dbo].[attraction_categories].UQ__attracti__72E12F1BED9B1681: UNIQUE (name)
- [dbo].[attractions].PK__attracti__BF2B684ADA781DC8: UNIQUE PRIMARY KEY (place_id)
- [dbo].[booking_items].PK__booking___52020FDDA329B37A: UNIQUE PRIMARY KEY (item_id)
- [dbo].[booking_status_logs].PK__booking___9E2397E073B73331: UNIQUE PRIMARY KEY (log_id)
- [dbo].[bookings].PK__bookings__5DE3A5B1CEB058A8: UNIQUE PRIMARY KEY (booking_id)
- [dbo].[chat_message_places].pk_chat_message_places: UNIQUE PRIMARY KEY (message_id, place_id)
- [dbo].[chat_messages].idx_cm_session: (session_id, created_at)
- [dbo].[chat_messages].PK__chat_mes__0BBF6EE6CC76626F: UNIQUE PRIMARY KEY (message_id)
- [dbo].[chat_sessions].PK__chat_ses__69B13FDCEA9F9CF6: UNIQUE PRIMARY KEY (session_id)
- [dbo].[cuisines].PK__cuisines__3197C6F4725DCF87: UNIQUE PRIMARY KEY (cuisine_id)
- [dbo].[cuisines].UQ__cuisines__72E12F1BA4AAC874: UNIQUE (name)
- [dbo].[districts].PK__district__2521322B473AB3BE: UNIQUE PRIMARY KEY (district_id)
- [dbo].[districts].UQ__district__72E12F1B7E12F100: UNIQUE (name)
- [dbo].[itineraries].idx_itin_user_status: (user_id, status)
- [dbo].[itineraries].PK__itinerar__6E8B21D6EA787C3C: UNIQUE PRIMARY KEY (itinerary_id)
- [dbo].[itinerary_alternatives].PK__itinerar__77D19779DB51A927: UNIQUE PRIMARY KEY (alt_id)
- [dbo].[itinerary_days].PK__itinerar__8B516ABB6BDDFBC2: UNIQUE PRIMARY KEY (day_id)
- [dbo].[itinerary_days].uq_itin_day: UNIQUE (itinerary_id, day_number)
- [dbo].[itinerary_items].idx_item_day: (day_id, sort_order)
- [dbo].[itinerary_items].PK__itinerar__52020FDDBECD543C: UNIQUE PRIMARY KEY (item_id)
- [dbo].[menu_item_tastes].pk_menu_item_tastes: UNIQUE PRIMARY KEY (menu_item_id, taste_id)
- [dbo].[menu_items].idx_menu_place: (place_id)
- [dbo].[menu_items].PK__menu_ite__973431D58B858803: UNIQUE PRIMARY KEY (menu_item_id)
- [dbo].[opening_hours].PK__opening___E9D1AA2EB5A8BBE5: UNIQUE PRIMARY KEY (opening_id)
- [dbo].[opening_hours].uq_open_slot: UNIQUE (place_id, day_of_week, open_time)
- [dbo].[partner_profiles].PK__partner___576F1B2704F22205: UNIQUE PRIMARY KEY (partner_id)
- [dbo].[partner_profiles].UQ__partner___B9BE370EEA560ABF: UNIQUE (user_id)
- [dbo].[payments].PK__payments__ED1FC9EAF0D316C1: UNIQUE PRIMARY KEY (payment_id)
- [dbo].[place_images].idx_img_place: (place_id)
- [dbo].[place_images].PK__place_im__DC9AC95583FCC8D9: UNIQUE PRIMARY KEY (image_id)
- [dbo].[places].idx_places_name: (name)
- [dbo].[places].idx_places_partner: (partner_id)
- [dbo].[places].idx_places_type_status_district: (place_type, status, district_id)
- [dbo].[places].PK__places__BF2B684A644D7999: UNIQUE PRIMARY KEY (place_id)
- [dbo].[places].uq_places_id_type: UNIQUE (place_id, place_type)
- [dbo].[restaurants].PK__restaura__BF2B684A70D99BCD: UNIQUE PRIMARY KEY (place_id)
- [dbo].[reviews].idx_rev_place_status: (place_id, status)
- [dbo].[reviews].PK__reviews__60883D90ED70DD7A: UNIQUE PRIMARY KEY (review_id)
- [dbo].[reviews].uq_review_user_place: UNIQUE (user_id, place_id)
- [dbo].[roles].PK__roles__760965CC3087FB57: UNIQUE PRIMARY KEY (role_id)
- [dbo].[roles].UQ__roles__783254B12851707D: UNIQUE (role_name)
- [dbo].[room_types].idx_room_place: (place_id)
- [dbo].[room_types].PK__room_typ__42395E841B803AAA: UNIQUE PRIMARY KEY (room_type_id)
- [dbo].[route_cache].PK__route_ca__28F706FE00205A6D: UNIQUE PRIMARY KEY (route_id)
- [dbo].[route_cache].uq_route: UNIQUE (from_place_id, to_place_id, mode_id)
- [dbo].[survey_answers].PK__survey_a__337243185BDA2EDC: UNIQUE PRIMARY KEY (answer_id)
- [dbo].[survey_answers].uq_sa_response_question: UNIQUE (response_id, question_id)
- [dbo].[survey_question_options].PK__survey_q__F4EACE1BB366D498: UNIQUE PRIMARY KEY (option_id)
- [dbo].[survey_questions].PK__survey_q__2EC21549F3664324: UNIQUE PRIMARY KEY (question_id)
- [dbo].[survey_responses].idx_sr_survey: (survey_id)
- [dbo].[survey_responses].idx_sr_user: (user_id, status)
- [dbo].[survey_responses].PK__survey_r__EBECD896970B2F4F: UNIQUE PRIMARY KEY (response_id)
- [dbo].[surveys].PK__surveys__9DC31A07B3D2EF48: UNIQUE PRIMARY KEY (survey_id)
- [dbo].[system_settings].PK__system_s__0DFAC426D1A3D56C: UNIQUE PRIMARY KEY (setting_key)
- [dbo].[tastes].PK__tastes__E9D3142EB441A54F: UNIQUE PRIMARY KEY (taste_id)
- [dbo].[tastes].UQ__tastes__72E12F1BACC2EE60: UNIQUE (name)
- [dbo].[transport_modes].PK__transpor__33C24C6EE73EC0AE: UNIQUE PRIMARY KEY (mode_id)
- [dbo].[transport_modes].UQ__transpor__357D4CF9A5E46D52: UNIQUE (code)
- [dbo].[user_favorites].idx_fav_place: (place_id)
- [dbo].[user_favorites].pk_user_favorites: UNIQUE PRIMARY KEY (user_id, place_id)
- [dbo].[user_memberships].PK__user_mem__B9BE370FD887977B: UNIQUE PRIMARY KEY (user_id)
- [dbo].[user_preferences].PK__user_pre__B9BE370FAC16E8C4: UNIQUE PRIMARY KEY (user_id)
- [dbo].[users].PK__users__B9BE370FC9F5ABB5: UNIQUE PRIMARY KEY (user_id)
- [dbo].[users].UQ__users__AB6E61648DC7D087: UNIQUE (email)
- [dbo].[vip_offers].PK__vip_offe__03D37AC2394C5F31: UNIQUE PRIMARY KEY (offer_id)
- [dbo].[vip_offers].UQ__vip_offe__357D4CF91D135999: UNIQUE (code)
- [dbo].[vip_tiers].PK__vip_tier__9D52AF9CD8794AB9: UNIQUE PRIMARY KEY (tier_id)
- [dbo].[vip_tiers].UQ__vip_tier__357D4CF96A3A5E74: UNIQUE (code)

## CHECK constraints

- [dbo].[accommodations].chk_acc_kind: `([accommodation_type]='HOMESTAY' OR [accommodation_type]='HOTEL')`
- [dbo].[accommodations].chk_acc_star: `([star_rating] IS NULL OR [star_rating]>=(1) AND [star_rating]<=(5))`
- [dbo].[accommodations].chk_acc_type: `([place_type]='ACCOMMODATION')`
- [dbo].[attractions].chk_attr_duration: `([visit_duration_minutes] IS NULL OR [visit_duration_minutes]>(0))`
- [dbo].[attractions].chk_attr_price: `([ticket_price]>=(0))`
- [dbo].[attractions].chk_attr_type: `([place_type]='ATTRACTION')`
- [dbo].[bookings].CK__bookings__bookin__336AA144: `([booking_type]='TICKET' OR [booking_type]='TABLE' OR [booking_type]='STAY')`
- [dbo].[bookings].CK__bookings__status__345EC57D: `([status]='COMPLETED' OR [status]='CANCELLED' OR [status]='CONFIRMED' OR [status]='PENDING')`
- [dbo].[chat_messages].chk_cm_sender: `([sender]='AI' OR [sender]='USER')`
- [dbo].[itineraries].chk_itin_bstatus: `([budget_status] IS NULL OR ([budget_status]='OVER' OR [budget_status]='FIT'))`
- [dbo].[itineraries].chk_itin_budget: `([budget]>(0))`
- [dbo].[itineraries].chk_itin_cost: `([total_estimated_cost]>=(0))`
- [dbo].[itineraries].chk_itin_days: `([num_days]>=(1) AND [num_days]<=(3))`
- [dbo].[itineraries].chk_itin_people: `([num_people]>=(1))`
- [dbo].[itineraries].chk_itin_status: `([status]='COMPLETED' OR [status]='CONFIRMED' OR [status]='DRAFT')`
- [dbo].[itinerary_alternatives].chk_alt_saving: `([cost_saving] IS NULL OR [cost_saving]>=(0))`
- [dbo].[itinerary_alternatives].chk_alt_status: `([status]='REJECTED' OR [status]='ACCEPTED' OR [status]='SUGGESTED')`
- [dbo].[itinerary_days].chk_day_number: `([day_number]>=(1) AND [day_number]<=(3))`
- [dbo].[itinerary_items].chk_item_money: `([unit_price]>=(0) AND [estimated_cost]>=(0) AND [travel_cost]>=(0))`
- [dbo].[itinerary_items].chk_item_qty: `([quantity]>(0))`
- [dbo].[itinerary_items].chk_item_ref: `(([room_type_id] IS NULL OR [item_type]='STAY') AND ([menu_item_id] IS NULL OR [item_type]='MEAL'))`
- [dbo].[itinerary_items].chk_item_type: `([item_type]='VISIT' OR [item_type]='MEAL' OR [item_type]='STAY')`
- [dbo].[menu_items].chk_menu_price: `([price]>=(0))`
- [dbo].[opening_hours].chk_open_day: `([day_of_week]>=(1) AND [day_of_week]<=(7))`
- [dbo].[partner_profiles].chk_partner_status: `([approval_status]='REJECTED' OR [approval_status]='APPROVED' OR [approval_status]='PENDING')`
- [dbo].[payments].CK__payments__method__4589517F: `([method]='VNPAY' OR [method]='MOMO' OR [method]='BANK_TRANSFER' OR [method]='CASH')`
- [dbo].[payments].CK__payments__status__467D75B8: `([status]='REFUNDED' OR [status]='FAILED' OR [status]='PAID' OR [status]='PENDING')`
- [dbo].[places].chk_places_lat: `([latitude] IS NULL OR [latitude]>=(-90) AND [latitude]<=(90))`
- [dbo].[places].chk_places_lng: `([longitude] IS NULL OR [longitude]>=(-180) AND [longitude]<=(180))`
- [dbo].[places].chk_places_rating: `([avg_rating]>=(0) AND [avg_rating]<=(5))`
- [dbo].[places].chk_places_status: `([status]='PENDING' OR [status]='HIDDEN' OR [status]='ACTIVE')`
- [dbo].[places].chk_places_type: `([place_type]='ATTRACTION' OR [place_type]='RESTAURANT' OR [place_type]='ACCOMMODATION')`
- [dbo].[restaurants].chk_rest_price: `([price_min] IS NULL OR [price_max] IS NULL OR [price_max]>=[price_min])`
- [dbo].[restaurants].chk_rest_type: `([place_type]='RESTAURANT')`
- [dbo].[reviews].chk_rev_rating: `([rating]>=(1) AND [rating]<=(5))`
- [dbo].[reviews].chk_rev_status: `([status]='HIDDEN' OR [status]='APPROVED' OR [status]='PENDING')`
- [dbo].[room_types].chk_room_orig: `([original_price] IS NULL OR [original_price]>=[price_per_night])`
- [dbo].[room_types].chk_room_price: `([price_per_night]>=(0))`
- [dbo].[room_types].chk_room_status: `([status]='HIDDEN' OR [status]='ACTIVE')`
- [dbo].[route_cache].chk_rc_diff: `([from_place_id]<>[to_place_id])`
- [dbo].[route_cache].chk_rc_dist: `([distance_km] IS NULL OR [distance_km]>=(0))`
- [dbo].[survey_answers].chk_sa_score: `([answer_score] IS NULL OR [answer_score]>=(1) AND [answer_score]<=(5))`
- [dbo].[survey_questions].chk_sq_type: `([question_type]='CHOICE' OR [question_type]='TEXT' OR [question_type]='RATING')`
- [dbo].[survey_responses].chk_sr_status: `([status]='SUBMITTED' OR [status]='SENT')`
- [dbo].[surveys].chk_survey_status: `([status]='CLOSED' OR [status]='OPEN' OR [status]='DRAFT')`
- [dbo].[surveys].chk_survey_target: `([target_role]='ALL' OR [target_role]='PARTNER' OR [target_role]='USER')`
- [dbo].[transport_modes].chk_mode_cost: `([cost_per_km]>=(0))`
- [dbo].[user_memberships].chk_mem_points: `([points]>=(0))`
- [dbo].[user_preferences].chk_pref_budget: `([default_budget_per_day] IS NULL OR [default_budget_per_day]>(0))`
- [dbo].[users].chk_users_status: `([status]='LOCKED' OR [status]='ACTIVE')`
- [dbo].[vip_offers].chk_offer_discount: `([discount_percent] IS NULL OR [discount_percent]>=(0) AND [discount_percent]<=(100))`
- [dbo].[vip_tiers].chk_tier_points: `([min_points]>=(0))`

## Auth design comparison and decisions

- `users`: exists.
  - Missing target columns: `public_id`, `email_verified`, `failed_login_count`, `locked_until`, `last_login_at`
- `roles`: exists.
  - Missing target columns: none by name; review listed types and role mapping.
- `partner_profiles`: exists.
  - Missing target columns: `service_type`, `tax_code`, `created_at`
- `refresh_tokens`: missing table.
  - Target columns to create if still needed after review: `token_id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `user_agent`, `ip`, `created_at`.
- `password_reset_tokens`: missing table.
  - Target columns to create if still needed after review: `id`, `user_id`, `token_hash`, `expires_at`, `used_at`, `created_at`.

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
- [dbo].[itineraries].user_id → users.user_id (fk_itin_user)
- [dbo].[partner_profiles].approved_by → users.user_id (fk_partner_approver)
- [dbo].[partner_profiles].user_id → users.user_id (fk_partner_user)
- [dbo].[reviews].moderated_by → users.user_id (fk_rev_moderator)
- [dbo].[reviews].user_id → users.user_id (fk_rev_user)
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

# Frontend Phase 3 baseline (before auth integration)

Before frontend changes, `npx tsc --noEmit` completed successfully. `npm run build` failed in the existing frontend because Next.js could not fetch the configured Google Fonts in the restricted network environment, and `VipLanding.tsx` imported `canvas-confetti` while it was not installed. The missing `canvas-confetti` package has since been added; Google font configuration is intentionally unchanged to preserve the existing visual design.

