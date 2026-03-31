package models

import "time"

// GameResult maps to the game_results table.
type GameResult struct {
ID           string    `db:"id"           json:"id"`
GameID       string    `db:"game_id"      json:"game_id"`
PlayerID     string    `db:"player_id"    json:"player_id"`
PointsEarned int       `db:"points_earned" json:"points_earned"`
Rank         *int      `db:"rank"          json:"rank"`
CreatedAt    time.Time `db:"created_at"   json:"created_at"`
// Joined fields (from GET /results)
PlayerName *string `db:"name"  json:"name,omitempty"`
Score      *int    `db:"score" json:"score,omitempty"`
}
