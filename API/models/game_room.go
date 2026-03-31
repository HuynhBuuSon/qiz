package models

import "time"

// GameRoom maps to the game_rooms table.
type GameRoom struct {
	ID               string    `db:"id"                json:"id"`
	Name             string    `db:"name"              json:"name"`
	RoomNumber       *int      `db:"room_number"       json:"room_number"`
	JoinCode         string    `db:"join_code"         json:"join_code"`
	PresentationCode string    `db:"presentation_code" json:"presentation_code"`
	MainColor        string    `db:"main_color"        json:"main_color"`
	ColorFrom        string    `db:"color_from"        json:"color_from"`
	ColorTo          string    `db:"color_to"          json:"color_to"`
	MaxPlayers       int       `db:"max_players"       json:"max_players"`
	PointMode        string    `db:"point_mode"        json:"point_mode"`
	PointFrom        int       `db:"point_from"        json:"point_from"`
	PointTo          int       `db:"point_to"          json:"point_to"`
	CreatedAt        time.Time `db:"created_at"        json:"created_at"`
	CreatedBy        string    `db:"created_by"        json:"created_by"`
	Status           string    `db:"status"            json:"status"`
	Settings         RawJSON   `db:"settings"          json:"settings"`
}
