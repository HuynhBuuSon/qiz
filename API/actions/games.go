package actions

import (
	"fmt"
	"net/http"

	"github.com/canhan/qiz-api/models"
	"github.com/gobuffalo/buffalo"
	"github.com/gobuffalo/pop/v6"
)

// GamesListHandler returns a list of games.
func GamesListHandler(c buffalo.Context) error {
	games := &models.Games{}

	if err := models.DB.All(games); err != nil {
		return err
	}

	return c.Render(http.StatusOK, r.JSON(games))
}

// GamesCreateHandler creates a new game.
func GamesCreateHandler(c buffalo.Context) error {
	game := &models.Game{}

	if err := c.Bind(game); err != nil {
		return err
	}

	tx, ok := c.Value("tx").(*pop.Connection)
	if !ok {
		return c.Error(http.StatusInternalServerError, fmt.Errorf("no transaction found"))
	}

	verrs, err := tx.ValidateAndCreate(game)
	if err != nil {
		return err
	}

	if verrs.HasAny() {
		return c.Render(http.StatusUnprocessableEntity, r.JSON(verrs))
	}

	return c.Render(http.StatusCreated, r.JSON(game))
}

// GamesShowHandler returns a single game with its questions.
func GamesShowHandler(c buffalo.Context) error {
	game := &models.Game{}

	if err := models.DB.Eager("Questions").Find(game, c.Param("game_id")); err != nil {
		return c.Error(http.StatusNotFound, err)
	}

	return c.Render(http.StatusOK, r.JSON(game))
}

// GamesUpdateHandler updates an existing game.
func GamesUpdateHandler(c buffalo.Context) error {
	game := &models.Game{}

	tx, ok := c.Value("tx").(*pop.Connection)
	if !ok {
		return c.Error(http.StatusInternalServerError, fmt.Errorf("no transaction found"))
	}

	if err := tx.Find(game, c.Param("game_id")); err != nil {
		return c.Error(http.StatusNotFound, err)
	}

	if err := c.Bind(game); err != nil {
		return err
	}

	verrs, err := tx.ValidateAndSave(game)
	if err != nil {
		return err
	}

	if verrs.HasAny() {
		return c.Render(http.StatusUnprocessableEntity, r.JSON(verrs))
	}

	return c.Render(http.StatusOK, r.JSON(game))
}

// GamesDeleteHandler deletes a game.
func GamesDeleteHandler(c buffalo.Context) error {
	game := &models.Game{}

	tx, ok := c.Value("tx").(*pop.Connection)
	if !ok {
		return c.Error(http.StatusInternalServerError, fmt.Errorf("no transaction found"))
	}

	if err := tx.Find(game, c.Param("game_id")); err != nil {
		return c.Error(http.StatusNotFound, err)
	}

	if err := tx.Destroy(game); err != nil {
		return err
	}

	return c.Render(http.StatusOK, r.JSON(map[string]string{"message": "game deleted"}))
}

// GamesStartHandler starts a game session.
func GamesStartHandler(c buffalo.Context) error {
	game := &models.Game{}

	tx, ok := c.Value("tx").(*pop.Connection)
	if !ok {
		return c.Error(http.StatusInternalServerError, fmt.Errorf("no transaction found"))
	}

	if err := tx.Find(game, c.Param("game_id")); err != nil {
		return c.Error(http.StatusNotFound, err)
	}

	game.Status = "active"
	game.CurrentQuestionIndex = 0

	if _, err := tx.ValidateAndSave(game); err != nil {
		return err
	}

	// Broadcast game start via WebSocket
	BroadcastToRoom(game.RoomID.String(), WSMessage{
		Type:    "game_started",
		Payload: game,
	})

	return c.Render(http.StatusOK, r.JSON(game))
}

// GamesNextHandler advances to the next question.
func GamesNextHandler(c buffalo.Context) error {
	game := &models.Game{}

	tx, ok := c.Value("tx").(*pop.Connection)
	if !ok {
		return c.Error(http.StatusInternalServerError, fmt.Errorf("no transaction found"))
	}

	if err := tx.Eager("Questions").Find(game, c.Param("game_id")); err != nil {
		return c.Error(http.StatusNotFound, err)
	}

	game.CurrentQuestionIndex++

	if game.CurrentQuestionIndex >= len(game.Questions) {
		game.Status = "finished"
	}

	if _, err := tx.ValidateAndSave(game); err != nil {
		return err
	}

	BroadcastToRoom(game.RoomID.String(), WSMessage{
		Type:    "question_changed",
		Payload: game,
	})

	return c.Render(http.StatusOK, r.JSON(game))
}

// GamesEndHandler ends a game session.
func GamesEndHandler(c buffalo.Context) error {
	game := &models.Game{}

	tx, ok := c.Value("tx").(*pop.Connection)
	if !ok {
		return c.Error(http.StatusInternalServerError, fmt.Errorf("no transaction found"))
	}

	if err := tx.Find(game, c.Param("game_id")); err != nil {
		return c.Error(http.StatusNotFound, err)
	}

	game.Status = "finished"

	if _, err := tx.ValidateAndSave(game); err != nil {
		return err
	}

	BroadcastToRoom(game.RoomID.String(), WSMessage{
		Type:    "game_ended",
		Payload: game,
	})

	return c.Render(http.StatusOK, r.JSON(game))
}

// SubmitAnswerHandler handles a player's answer submission.
func SubmitAnswerHandler(c buffalo.Context) error {
	submission := &models.Submission{}

	if err := c.Bind(submission); err != nil {
		return err
	}

	submission.GameID = mustUUID(c.Param("game_id"))

	tx, ok := c.Value("tx").(*pop.Connection)
	if !ok {
		return c.Error(http.StatusInternalServerError, fmt.Errorf("no transaction found"))
	}

	verrs, err := tx.ValidateAndCreate(submission)
	if err != nil {
		return err
	}

	if verrs.HasAny() {
		return c.Render(http.StatusUnprocessableEntity, r.JSON(verrs))
	}

	// Broadcast the submission to the room
	game := &models.Game{}
	if err := tx.Find(game, submission.GameID); err == nil {
		BroadcastToRoom(game.RoomID.String(), WSMessage{
			Type:    "answer_submitted",
			Payload: submission,
		})
	}

	return c.Render(http.StatusCreated, r.JSON(submission))
}

// GameResultsHandler returns results for a game.
func GameResultsHandler(c buffalo.Context) error {
	submissions := &models.Submissions{}

	if err := models.DB.Where("game_id = ?", c.Param("game_id")).All(submissions); err != nil {
		return err
	}

	return c.Render(http.StatusOK, r.JSON(submissions))
}

// LeaderboardHandler returns the leaderboard for a game.
func LeaderboardHandler(c buffalo.Context) error {
	type LeaderboardEntry struct {
		PlayerID   string `json:"player_id" db:"player_id"`
		PlayerName string `json:"player_name" db:"player_name"`
		Score      int    `json:"score" db:"score"`
		Rank       int    `json:"rank" db:"rank"`
	}

	var entries []LeaderboardEntry

	query := `
		SELECT
			p.id AS player_id,
			p.name AS player_name,
			COUNT(CASE WHEN s.is_correct THEN 1 END) AS score,
			RANK() OVER (ORDER BY COUNT(CASE WHEN s.is_correct THEN 1 END) DESC) AS rank
		FROM submissions s
		JOIN players p ON p.id = s.player_id
		WHERE s.game_id = ?
		GROUP BY p.id, p.name
		ORDER BY score DESC
	`

	if err := models.DB.RawQuery(query, c.Param("game_id")).All(&entries); err != nil {
		return err
	}

	return c.Render(http.StatusOK, r.JSON(entries))
}
