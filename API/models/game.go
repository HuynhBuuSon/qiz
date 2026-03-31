package models

import (
	"time"

	"github.com/gobuffalo/pop/v6"
	"github.com/gobuffalo/validate/v3"
	"github.com/gobuffalo/validate/v3/validators"
	"github.com/gofrs/uuid"
)

// Game represents a quiz game session.
type Game struct {
	ID                   uuid.UUID `json:"id" db:"id"`
	RoomID               uuid.UUID `json:"room_id" db:"room_id"`
	Title                string    `json:"title" db:"title"`
	Status               string    `json:"status" db:"status"`       // pending, active, finished
	GameType             string    `json:"game_type" db:"game_type"` // random, weighted
	CurrentQuestionIndex int       `json:"current_question_index" db:"current_question_index"`
	Questions            Questions `json:"questions,omitempty" has_many:"questions" order_by:"order_index asc"`
	CreatedAt            time.Time `json:"created_at" db:"created_at"`
	UpdatedAt            time.Time `json:"updated_at" db:"updated_at"`
}

// Games is a list of Game.
type Games []Game

// Validate gets run every time you call a "pop.Validate*" method.
func (g *Game) Validate(tx *pop.Connection) (*validate.Errors, error) {
	return validate.Validate(
		&validators.StringIsPresent{Field: g.Title, Name: "Title"},
		&validators.StringIsPresent{Field: g.Status, Name: "Status"},
	), nil
}

// ValidateCreate gets run every time you call "pop.ValidateAndCreate".
func (g *Game) ValidateCreate(tx *pop.Connection) (*validate.Errors, error) {
	return validate.NewErrors(), nil
}

// ValidateUpdate gets run every time you call "pop.ValidateAndUpdate".
func (g *Game) ValidateUpdate(tx *pop.Connection) (*validate.Errors, error) {
	return validate.NewErrors(), nil
}
