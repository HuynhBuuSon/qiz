package models

import "time"

// Player maps to the players table.
type Player struct {
	ID             string    `db:"id"              json:"id"`
	Name           string    `db:"name"            json:"name"`
	RoomID         string    `db:"room_id"         json:"room_id"`
	SequenceNumber *int      `db:"sequence_number" json:"sequence_number"`
	JoinedAt       time.Time `db:"joined_at"       json:"joined_at"`
	Score          int       `db:"score"           json:"score"`
	Rank           *int      `db:"rank"            json:"rank"`
	IsHiddenRank   bool      `db:"is_hidden_rank"  json:"is_hidden_rank"`
	IsHiddenScore  bool      `db:"is_hidden_score" json:"is_hidden_score"`
	Color          *string   `db:"color"           json:"color"`
	Metadata       RawJSON   `db:"metadata"        json:"metadata"`
}
