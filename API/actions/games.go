package actions

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/canhan/qiz-api/models"
	"github.com/gobuffalo/buffalo"
)

// GamesListHandler GET /api/rooms/{room_id}/games
func GamesListHandler(c buffalo.Context) error {
	roomID := c.Param("room_id")
	if ok, err := roomExists(roomID); err != nil || !ok {
		return c.Error(http.StatusNotFound, errNotFound("room"))
	}
	var games []models.Game
	if err := models.SQL.Select(&games, `SELECT * FROM games WHERE room_id=$1 ORDER BY created_at DESC`, roomID); err != nil {
		return c.Error(http.StatusInternalServerError, err)
	}
	return c.Render(http.StatusOK, r.JSON(games))
}

// GamesCreateHandler POST /api/rooms/{room_id}/games
func GamesCreateHandler(c buffalo.Context) error {
	roomID := c.Param("room_id")
	if ok, err := roomExists(roomID); err != nil || !ok {
		return c.Error(http.StatusNotFound, errNotFound("room"))
	}

	var body struct {
		Name     string          `json:"name"`
		Type     string          `json:"type"`
		Settings json.RawMessage `json:"settings"`
	}
	if err := c.Bind(&body); err != nil {
		return c.Error(http.StatusBadRequest, err)
	}
	body.Type = strings.ToLower(body.Type)
	if body.Type != "weight" && body.Type != "random" {
		return c.Error(http.StatusBadRequest, errMsg("type must be 'weight' or 'random'"))
	}

	var maxOrder *int
	if err := models.SQL.Get(&maxOrder, `SELECT MAX(game_order) FROM games WHERE room_id=$1`, roomID); err != nil {
		return c.Error(http.StatusInternalServerError, err)
	}
	nextOrder := 1
	if maxOrder != nil {
		nextOrder = *maxOrder + 1
	}

	settings := models.RawJSON(body.Settings)
	if len(settings) == 0 {
		settings = models.RawJSON(`{}`)
	}

	var game models.Game
	if err := models.SQL.QueryRowx(
		`INSERT INTO games (room_id, name, type, game_order, status, settings)
		 VALUES ($1,$2,$3,$4,'pending',$5) RETURNING *`,
		roomID, body.Name, body.Type, nextOrder, settings,
	).StructScan(&game); err != nil {
		return c.Error(http.StatusInternalServerError, err)
	}
	broadcastEvent("game:update", map[string]any{"room_id": roomID, "game": game})
	return c.Render(http.StatusOK, r.JSON(game))
}

// GamesShowHandler GET /api/rooms/{room_id}/games/{game_id}
func GamesShowHandler(c buffalo.Context) error {
	var game models.Game
	if err := models.SQL.Get(&game, `SELECT * FROM games WHERE id=$1 AND room_id=$2`,
		c.Param("game_id"), c.Param("room_id")); err != nil {
		return c.Error(http.StatusNotFound, errNotFound("game"))
	}
	return c.Render(http.StatusOK, r.JSON(game))
}

// GamesPatchHandler PATCH /api/rooms/{room_id}/games/{game_id}
func GamesPatchHandler(c buffalo.Context) error {
	gameID := c.Param("game_id")
	roomID := c.Param("room_id")

	if ok, err := gameExistsInRoom(gameID, roomID); err != nil || !ok {
		return c.Error(http.StatusNotFound, errNotFound("game"))
	}

	var body struct {
		Status   *string         `json:"status"`
		Config   json.RawMessage `json:"config"`
		Settings json.RawMessage `json:"settings"`
	}
	if err := c.Bind(&body); err != nil {
		return c.Error(http.StatusBadRequest, err)
	}

	parts := []string{}
	args := []any{}
	idx := 1
	if body.Status != nil {
		parts = append(parts, field("status", &idx))
		args = append(args, *body.Status)
	}
	// Accept either "config" or "settings" key for the JSONB column
	var settingsVal json.RawMessage
	if len(body.Config) > 0 {
		settingsVal = body.Config
	} else if len(body.Settings) > 0 {
		settingsVal = body.Settings
	}
	if len(settingsVal) > 0 {
		parts = append(parts, field("settings", &idx))
		args = append(args, models.RawJSON(settingsVal))
	}
	if len(parts) == 0 {
		return c.Error(http.StatusBadRequest, errMsg("no fields to update"))
	}
	args = append(args, gameID)

	var game models.Game
	if err := models.SQL.QueryRowx(
		`UPDATE games SET `+strings.Join(parts, ", ")+` WHERE id=$`+itoa(idx)+` RETURNING *`,
		args...,
	).StructScan(&game); err != nil {
		return c.Error(http.StatusInternalServerError, err)
	}

	broadcastEvent("game:update", map[string]any{"room_id": roomID, "game": game})
	return c.Render(http.StatusOK, r.JSON(game))
}

// GamesDeleteHandler DELETE /api/rooms/{room_id}/games/{game_id}
func GamesDeleteHandler(c buffalo.Context) error {
	gameID := c.Param("game_id")
	roomID := c.Param("room_id")

	var game models.Game
	if err := models.SQL.Get(&game, `SELECT * FROM games WHERE id=$1 AND room_id=$2`, gameID, roomID); err != nil {
		return c.Error(http.StatusNotFound, errNotFound("game"))
	}
	if game.Status == "active" {
		return c.Error(http.StatusBadRequest, errMsg("cannot delete an active game"))
	}

	// Delete dependent rows first
	for _, q := range []string{
		`DELETE FROM weight_entries WHERE game_id=$1`,
		`DELETE FROM weight_game_data WHERE game_id=$1`,
		`DELETE FROM random_winners WHERE game_id=$1`,
		`DELETE FROM random_game_data WHERE game_id=$1`,
		`DELETE FROM game_results WHERE game_id=$1`,
	} {
		if _, err := models.SQL.Exec(q, gameID); err != nil {
			return c.Error(http.StatusInternalServerError, err)
		}
	}
	if _, err := models.SQL.Exec(`DELETE FROM games WHERE id=$1`, gameID); err != nil {
		return c.Error(http.StatusInternalServerError, err)
	}

	broadcastEvent("game:ended", map[string]any{"room_id": roomID, "game_id": gameID})
	return c.Render(http.StatusOK, r.JSON(map[string]string{"message": "game deleted"}))
}
