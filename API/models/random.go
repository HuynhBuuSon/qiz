package models

import "time"

// RandomGameData maps to the random_game_data table.
type RandomGameData struct {
	ID                      string  `db:"id"                          json:"id"`
	GameID                  string  `db:"game_id"                     json:"game_id"`
	PointAward              int     `db:"point_award"                 json:"point_award"`
	IsRepeat                bool    `db:"is_repeat"                   json:"is_repeat"`
	Step2Started            bool    `db:"step2_started"               json:"step2_started"`
	Step3Started            bool    `db:"step3_started"               json:"step3_started"`
	CurrentSelectedPlayerID *string `db:"current_selected_player_id"  json:"current_selected_player_id"`
	Completed               bool    `db:"completed"                   json:"completed"`
}

// RandomWinner maps to the random_winners table.
type RandomWinner struct {
	ID            string    `db:"id"             json:"id"`
	GameID        string    `db:"game_id"        json:"game_id"`
	PlayerID      string    `db:"player_id"      json:"player_id"`
	AdminAction   *string   `db:"admin_action"   json:"admin_action"`
	PointsAwarded int       `db:"points_awarded" json:"points_awarded"`
	CreatedAt     time.Time `db:"created_at"     json:"created_at"`
}
