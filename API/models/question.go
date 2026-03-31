package models

import (
	"encoding/json"
	"time"

	"github.com/gobuffalo/pop/v6"
	"github.com/gobuffalo/validate/v3"
	"github.com/gobuffalo/validate/v3/validators"
	"github.com/gofrs/uuid"
)

// Question represents a quiz question.
type Question struct {
	ID           uuid.UUID       `json:"id" db:"id"`
	GameID       uuid.UUID       `json:"game_id" db:"game_id"`
	Text         string          `json:"text" db:"text"`
	Options      json.RawMessage `json:"options" db:"options"` // JSON array of option strings
	CorrectIndex int             `json:"correct_index" db:"correct_index"`
	TimeLimit    int             `json:"time_limit" db:"time_limit"` // seconds
	Points       int             `json:"points" db:"points"`
	OrderIndex   int             `json:"order_index" db:"order_index"`
	CreatedAt    time.Time       `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time       `json:"updated_at" db:"updated_at"`
}

// Questions is a list of Question.
type Questions []Question

// Validate gets run every time you call a "pop.Validate*" method.
func (q *Question) Validate(tx *pop.Connection) (*validate.Errors, error) {
	return validate.Validate(
		&validators.StringIsPresent{Field: q.Text, Name: "Text"},
	), nil
}

// ValidateCreate gets run every time you call "pop.ValidateAndCreate".
func (q *Question) ValidateCreate(tx *pop.Connection) (*validate.Errors, error) {
	return validate.NewErrors(), nil
}

// ValidateUpdate gets run every time you call "pop.ValidateAndUpdate".
func (q *Question) ValidateUpdate(tx *pop.Connection) (*validate.Errors, error) {
	return validate.NewErrors(), nil
}
