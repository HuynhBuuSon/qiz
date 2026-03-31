package models

import "time"

// Game maps to the games table.
type Game struct {
ID        string    `db:"id"         json:"id"`
RoomID    string    `db:"room_id"    json:"room_id"`
Name      string    `db:"name"       json:"name"`
Type      string    `db:"type"       json:"type"`
GameOrder int       `db:"game_order" json:"game_order"`
Status    string    `db:"status"     json:"status"`
CreatedAt time.Time `db:"created_at" json:"created_at"`
Settings  RawJSON   `db:"settings"   json:"settings"`
}
