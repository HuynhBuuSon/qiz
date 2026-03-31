package actions

import (
	"net/http"

	"github.com/canhan/qiz-api/models"
	"github.com/gobuffalo/buffalo"
)

// RandomWinnerCreateHandler POST /api/rooms/{room_id}/games/{game_id}/random/winner
func RandomWinnerCreateHandler(c buffalo.Context) error {
	gameID := c.Param("game_id")
	roomID := c.Param("room_id")

	if ok, err := gameExistsInRoom(gameID, roomID); err != nil || !ok {
		return c.Error(http.StatusNotFound, errNotFound("game"))
	}

	var body struct {
		PlayerID     string  `json:"playerId"`
		Action       string  `json:"action"`
		PointsAwarded *int   `json:"pointsAwarded"`
	}
	if err := c.Bind(&body); err != nil {
		return c.Error(http.StatusBadRequest, err)
	}
	if body.PlayerID == "" {
		return c.Error(http.StatusBadRequest, errMsg("playerId is required"))
	}
	if body.Action == "" {
		return c.Error(http.StatusBadRequest, errMsg("action is required"))
	}

	var winner models.RandomWinner
	if err := models.SQL.QueryRowx(
		`INSERT INTO random_winners (game_id, player_id, admin_action, points_awarded)
		 VALUES ($1,$2,$3,$4) RETURNING *`,
		gameID, body.PlayerID, body.Action, body.PointsAwarded,
	).StructScan(&winner); err != nil {
		return c.Error(http.StatusInternalServerError, err)
	}

	broadcastEvent("randomGame:winnerSelected", map[string]any{"room_id": roomID, "game_id": gameID, "winner": winner})
	return c.Render(http.StatusOK, r.JSON(winner))
}

// RandomWinnersListHandler GET /api/rooms/{room_id}/games/{game_id}/random/winners
func RandomWinnersListHandler(c buffalo.Context) error {
	gameID := c.Param("game_id")
	roomID := c.Param("room_id")

	if ok, err := gameExistsInRoom(gameID, roomID); err != nil || !ok {
		return c.Error(http.StatusNotFound, errNotFound("game"))
	}

	var winners []models.RandomWinner
	if err := models.SQL.Select(&winners,
		`SELECT id, game_id, player_id, admin_action, points_awarded, created_at
		 FROM random_winners WHERE game_id=$1 ORDER BY created_at ASC`, gameID); err != nil {
		return c.Error(http.StatusInternalServerError, err)
	}
	return c.Render(http.StatusOK, r.JSON(winners))
}
