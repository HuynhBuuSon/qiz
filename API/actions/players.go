package actions

import (
	"net/http"
	"strings"

	"github.com/canhan/qiz-api/models"
	"github.com/gobuffalo/buffalo"
)

// PlayersListHandler GET /api/rooms/{room_id}/players
func PlayersListHandler(c buffalo.Context) error {
	roomID := c.Param("room_id")
	if ok, err := roomExists(roomID); err != nil || !ok {
		return c.Error(http.StatusNotFound, errNotFound("room"))
	}
	var players []models.Player
	if err := models.SQL.Select(&players, `SELECT * FROM players WHERE room_id=$1 ORDER BY rank ASC NULLS LAST, score DESC`, roomID); err != nil {
		return c.Error(http.StatusInternalServerError, err)
	}
	return c.Render(http.StatusOK, r.JSON(players))
}

// PlayersCreateHandler POST /api/rooms/{room_id}/players
func PlayersCreateHandler(c buffalo.Context) error {
	roomID := c.Param("room_id")

	var room models.GameRoom
	if err := models.SQL.Get(&room, `SELECT * FROM game_rooms WHERE id=$1`, roomID); err != nil {
		return c.Error(http.StatusNotFound, errNotFound("room"))
	}

	var body struct {
		Name string `json:"name"`
	}
	if err := c.Bind(&body); err != nil {
		return c.Error(http.StatusBadRequest, err)
	}
	if strings.TrimSpace(body.Name) == "" {
		return c.Error(http.StatusBadRequest, errMsg("name is required"))
	}

	// Check capacity
	var count int
	if err := models.SQL.Get(&count, `SELECT COUNT(*) FROM players WHERE room_id=$1`, roomID); err != nil {
		return c.Error(http.StatusInternalServerError, err)
	}
	if room.MaxPlayers > 0 && count >= room.MaxPlayers {
		return c.Error(http.StatusBadRequest, errMsg("room is at maximum capacity"))
	}

	var player models.Player
	if err := models.SQL.QueryRowx(
		`INSERT INTO players (room_id, name, score, rank)
		 VALUES ($1,$2,0,NULL) RETURNING *`,
		roomID, strings.TrimSpace(body.Name),
	).StructScan(&player); err != nil {
		return c.Error(http.StatusInternalServerError, err)
	}

	broadcastEvent("player:joined", map[string]any{"room_id": roomID, "player": player})
	return c.Render(http.StatusOK, r.JSON(player))
}

// PlayersShowHandler GET /api/rooms/{room_id}/players/{player_id}
func PlayersShowHandler(c buffalo.Context) error {
	var player models.Player
	if err := models.SQL.Get(&player, `SELECT * FROM players WHERE id=$1 AND room_id=$2`,
		c.Param("player_id"), c.Param("room_id")); err != nil {
		return c.Error(http.StatusNotFound, errNotFound("player"))
	}
	return c.Render(http.StatusOK, r.JSON(player))
}

// PlayersPatchHandler PATCH /api/rooms/{room_id}/players/{player_id}
func PlayersPatchHandler(c buffalo.Context) error {
	roomID := c.Param("room_id")
	playerID := c.Param("player_id")

	var exists bool
	if err := models.SQL.Get(&exists, `SELECT EXISTS(SELECT 1 FROM players WHERE id=$1 AND room_id=$2)`, playerID, roomID); err != nil || !exists {
		return c.Error(http.StatusNotFound, errNotFound("player"))
	}

	var body struct {
		Name          *string `json:"name"`
		Score         *int    `json:"score"`
		IsScoreHidden *bool   `json:"isScoreHidden"`
		IsRankHidden  *bool   `json:"isRankHidden"`
	}
	if err := c.Bind(&body); err != nil {
		return c.Error(http.StatusBadRequest, err)
	}

	parts := []string{}
	args := []any{}
	idx := 1
	if body.Name != nil {
		parts = append(parts, field("name", &idx))
		args = append(args, *body.Name)
	}
	if body.Score != nil {
		parts = append(parts, field("score", &idx))
		args = append(args, *body.Score)
	}
	if body.IsScoreHidden != nil {
		parts = append(parts, field("is_hidden_score", &idx))
		args = append(args, *body.IsScoreHidden)
	}
	if body.IsRankHidden != nil {
		parts = append(parts, field("is_hidden_rank", &idx))
		args = append(args, *body.IsRankHidden)
	}
	if len(parts) == 0 {
		return c.Error(http.StatusBadRequest, errMsg("no fields to update"))
	}
	args = append(args, playerID)

	var player models.Player
	if err := models.SQL.QueryRowx(
		`UPDATE players SET `+strings.Join(parts, ", ")+` WHERE id=$`+itoa(idx)+` RETURNING *`,
		args...,
	).StructScan(&player); err != nil {
		return c.Error(http.StatusInternalServerError, err)
	}

	// Recalculate ranks when score changed
	if body.Score != nil {
		if err := recalcRanks(roomID); err != nil {
			return c.Error(http.StatusInternalServerError, err)
		}
	}

	return c.Render(http.StatusOK, r.JSON(player))
}

// PlayersDeleteHandler DELETE /api/rooms/{room_id}/players/{player_id}
func PlayersDeleteHandler(c buffalo.Context) error {
	playerID := c.Param("player_id")
	roomID := c.Param("room_id")

	var exists bool
	if err := models.SQL.Get(&exists, `SELECT EXISTS(SELECT 1 FROM players WHERE id=$1 AND room_id=$2)`, playerID, roomID); err != nil || !exists {
		return c.Error(http.StatusNotFound, errNotFound("player"))
	}
	if _, err := models.SQL.Exec(`DELETE FROM players WHERE id=$1`, playerID); err != nil {
		return c.Error(http.StatusInternalServerError, err)
	}
	broadcastEvent("player:left", map[string]any{"room_id": roomID, "player_id": playerID})
	return c.Render(http.StatusOK, r.JSON(map[string]string{"message": "player deleted"}))
}
