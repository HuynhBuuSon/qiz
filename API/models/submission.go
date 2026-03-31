package models

import (
	"time"

	"github.com/gobuffalo/pop/v6"
	"github.com/gobuffalo/validate/v3"
	"github.com/gofrs/uuid"
)

// Submission represents a player's answer to a question.
type Submission struct {
	ID            uuid.UUID `json:"id" db:"id"`
	GameID        uuid.UUID `json:"game_id" db:"game_id"`
	PlayerID      uuid.UUID `json:"player_id" db:"player_id"`
	QuestionID    uuid.UUID `json:"question_id" db:"question_id"`
	SelectedIndex int       `json:"selected_index" db:"selected_index"`
	IsCorrect     bool      `json:"is_correct" db:"is_correct"`
	TimeTakenMs   int       `json:"time_taken_ms" db:"time_taken_ms"`
	PointsEarned  int       `json:"points_earned" db:"points_earned"`
	CreatedAt     time.Time `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time `json:"updated_at" db:"updated_at"`
}

// Submissions is a list of Submission.
type Submissions []Submission

// Validate gets run every time you call a "pop.Validate*" method.
func (s *Submission) Validate(tx *pop.Connection) (*validate.Errors, error) {
	return validate.NewErrors(), nil
}

// ValidateCreate gets run every time you call "pop.ValidateAndCreate".
func (s *Submission) ValidateCreate(tx *pop.Connection) (*validate.Errors, error) {
	return validate.NewErrors(), nil
}

// ValidateUpdate gets run every time you call "pop.ValidateAndUpdate".
func (s *Submission) ValidateUpdate(tx *pop.Connection) (*validate.Errors, error) {
	return validate.NewErrors(), nil
}
