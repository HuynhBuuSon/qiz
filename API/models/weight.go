package models

// WeightGameData maps to the weight_game_data table.
type WeightGameData struct {
	ID              string `db:"id"               json:"id"`
	GameID          string `db:"game_id"          json:"game_id"`
	Mode            string `db:"mode"             json:"mode"`
	WeightLimitFrom int    `db:"weight_limit_from" json:"weight_limit_from"`
	WeightLimitTo   int    `db:"weight_limit_to"  json:"weight_limit_to"`
	WeightUnit      string `db:"weight_unit"      json:"weight_unit"`
	Step1Started    bool   `db:"step1_started"    json:"step1_started"`
	Step2Started    bool   `db:"step2_started"    json:"step2_started"`
	Completed       bool   `db:"completed"        json:"completed"`
}

// WeightEntry maps to the weight_entries table.
type WeightEntry struct {
	ID          string   `db:"id"           json:"id"`
	GameID      string   `db:"game_id"      json:"game_id"`
	PlayerID    string   `db:"player_id"    json:"player_id"`
	StartWeight *float64 `db:"start_weight" json:"start_weight"`
	EndWeight   *float64 `db:"end_weight"   json:"end_weight"`
	WeightRange *float64 `db:"weight_range" json:"weight_range"`
	Points      int      `db:"points"       json:"points"`
	FinalRank   *int     `db:"final_rank"   json:"final_rank"`
}
