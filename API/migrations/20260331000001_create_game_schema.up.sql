-- Migration: create game schema (mirrors UI/lib/db/migrations.ts exactly)

-- 1. game_rooms
CREATE TABLE IF NOT EXISTS game_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    room_number INTEGER UNIQUE,
    join_code VARCHAR(10) NOT NULL,
    presentation_code VARCHAR(10) NOT NULL,
    main_color VARCHAR(7) NOT NULL,
    color_from VARCHAR(7) NOT NULL,
    color_to VARCHAR(7) NOT NULL,
    max_players INTEGER NOT NULL,
    point_mode VARCHAR(10) NOT NULL,
    point_from INTEGER NOT NULL,
    point_to INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    settings JSONB DEFAULT '{}'
);

-- 2. room_number column (idempotent add)
ALTER TABLE game_rooms
    ADD COLUMN IF NOT EXISTS room_number INTEGER UNIQUE;

-- 3. index on room_number
CREATE INDEX IF NOT EXISTS idx_room_number ON game_rooms(room_number);

-- 4. players
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    room_id UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
    sequence_number INTEGER,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    score INTEGER DEFAULT 0,
    rank INTEGER,
    is_hidden_rank BOOLEAN DEFAULT FALSE,
    is_hidden_score BOOLEAN DEFAULT FALSE,
    color VARCHAR(7),
    metadata JSONB DEFAULT '{}',
    UNIQUE(room_id, name),
    UNIQUE(room_id, sequence_number)
);
CREATE INDEX IF NOT EXISTS idx_players_room_id ON players(room_id);

-- 5. games
CREATE TABLE IF NOT EXISTS games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL,
    game_order INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    settings JSONB DEFAULT '{}',
    UNIQUE(room_id, game_order)
);
CREATE INDEX IF NOT EXISTS idx_games_room_id ON games(room_id);

-- 6. weight_game_data
CREATE TABLE IF NOT EXISTS weight_game_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    mode VARCHAR(10) NOT NULL,
    weight_limit_from INTEGER NOT NULL,
    weight_limit_to INTEGER NOT NULL,
    weight_unit VARCHAR(5) NOT NULL,
    step1_started BOOLEAN DEFAULT FALSE,
    step2_started BOOLEAN DEFAULT FALSE,
    completed BOOLEAN DEFAULT FALSE,
    UNIQUE(game_id)
);

-- 7. weight_entries
CREATE TABLE IF NOT EXISTS weight_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    start_weight DECIMAL(10, 2),
    end_weight DECIMAL(10, 2),
    weight_range DECIMAL(10, 2),
    points INTEGER DEFAULT 0,
    final_rank INTEGER,
    UNIQUE(game_id, player_id)
);

-- 8. random_game_data
CREATE TABLE IF NOT EXISTS random_game_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    point_award INTEGER NOT NULL,
    is_repeat BOOLEAN DEFAULT FALSE,
    step2_started BOOLEAN DEFAULT FALSE,
    step3_started BOOLEAN DEFAULT FALSE,
    current_selected_player_id UUID REFERENCES players(id),
    completed BOOLEAN DEFAULT FALSE,
    UNIQUE(game_id)
);

-- 9. random_winners
CREATE TABLE IF NOT EXISTS random_winners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    admin_action VARCHAR(20),
    points_awarded INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_random_winners_game ON random_winners(game_id);

-- 10. game_results
CREATE TABLE IF NOT EXISTS game_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    points_earned INTEGER NOT NULL,
    rank INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(game_id, player_id)
);
