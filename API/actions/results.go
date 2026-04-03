package actions

import (
	"net/http"

	"github.com/canhan/qiz-api/models"
	"github.com/gobuffalo/buffalo"
)

// ResultsListHandler GET /api/rooms/{room_id}/games/{game_id}/results
func ResultsListHandler(c buffalo.Context) error {
	gameID := c.Param("game_id")
	roomID := c.Param("room_id")

	if ok, err := gameExistsInRoom(gameID, roomID); err != nil || !ok {
		return c.Error(http.StatusNotFound, errNotFound("game"))
	}

	var results []models.GameResult
	if err := models.SQL.Select(&results,
		`SELECT gr.id, gr.game_id, gr.player_id, gr.points_earned, gr.rank, gr.created_at,
		        p.name AS player_name, p.score AS player_score, p.rank AS player_rank
		 FROM game_results gr
		 JOIN players p ON gr.player_id = p.id
		 WHERE gr.game_id = $1
		 ORDER BY gr.rank ASC NULLS LAST`, gameID); err != nil {
		return c.Error(http.StatusInternalServerError, err)
	}
	return c.Render(http.StatusOK, r.JSON(results))
}

// ResultsCreateHandler POST /api/rooms/{room_id}/games/{game_id}/results
func ResultsCreateHandler(c buffalo.Context) error {
	gameID := c.Param("game_id")
	roomID := c.Param("room_id")

	if ok, err := gameExistsInRoom(gameID, roomID); err != nil || !ok {
		return c.Error(http.StatusNotFound, errNotFound("game"))
	}

	var body struct {
		PlayerID    string `json:"playerId"`
		PointsEarned int   `json:"pointsEarned"`
		Rank        *int   `json:"rank"`
	}
	if err := c.Bind(&body); err != nil {
		return c.Error(http.StatusBadRequest, err)
	}

	var result models.GameResult
	if err := models.SQL.QueryRowx(
		`INSERT INTO game_results (game_id, player_id, points_earned, rank)
		 VALUES ($1,$2,$3,$4)
		 ON CONFLICT (game_id, player_id) DO UPDATE
		   SET points_earned = EXCLUDED.points_earned,
		       rank = COALESCE(EXCLUDED.rank, game_results.rank)
		 RETURNING *`,
		gameID, body.PlayerID, body.PointsEarned, body.Rank,
	).StructScan(&result); err != nil {
		return c.Error(http.StatusInternalServerError, err)
	}
	return c.Render(http.StatusOK, r.JSON(result))
}

// ResultsBatchHandler PUT /api/rooms/{room_id}/games/{game_id}/results
func ResultsBatchHandler(c buffalo.Context) error {
	gameID := c.Param("game_id")
	roomID := c.Param("room_id")

	if ok, err := gameExistsInRoom(gameID, roomID); err != nil || !ok {
		return c.Error(http.StatusNotFound, errNotFound("game"))
	}

	var body struct {
		Results []struct {
			PlayerID     string `json:"playerId"`
			PointsEarned int    `json:"pointsEarned"`
			Rank         *int   `json:"rank"`
		} `json:"results"`
	}
	if err := c.Bind(&body); err != nil {
		return c.Error(http.StatusBadRequest, err)
	}

	for _, entry := range body.Results {
		// Upsert game result
		if _, err := models.SQL.Exec(
			`INSERT INTO game_results (game_id, player_id, points_earned, rank)
			 VALUES ($1,$2,$3,$4)
			 ON CONFLICT (game_id, player_id) DO UPDATE
			   SET points_earned = EXCLUDED.points_earned,
			       rank = COALESCE(EXCLUDED.rank, game_results.rank)`,
			gameID, entry.PlayerID, entry.PointsEarned, entry.Rank,
		); err != nil {
			return c.Error(http.StatusInternalServerError, err)
		}
		// Add points to player's cumulative score
		if _, err := models.SQL.Exec(
			`UPDATE players SET score = COALESCE(score,0) + $1 WHERE id=$2 AND room_id=$3`,
			entry.PointsEarned, entry.PlayerID, roomID,
		); err != nil {
			return c.Error(http.StatusInternalServerError, err)
		}
	}

	// Recalculate global ranks for all players in the room
	if err := recalcRanks(roomID); err != nil {
		return c.Error(http.StatusInternalServerError, err)
	}

	// Return updated results
	var results []models.GameResult
	if err := models.SQL.Select(&results,
		`SELECT gr.id, gr.game_id, gr.player_id, gr.points_earned, gr.rank, gr.created_at,
		        p.name AS player_name, p.score AS player_score, p.rank AS player_rank
		 FROM game_results gr
		 JOIN players p ON gr.player_id = p.id
		 WHERE gr.game_id = $1
		 ORDER BY gr.rank ASC NULLS LAST`, gameID); err != nil {
		return c.Error(http.StatusInternalServerError, err)
	}

	broadcastEvent("points:updated", map[string]any{"room_id": roomID, "game_id": gameID, "results": results})
	broadcastEvent("players:update", map[string]any{"room_id": roomID})
	return c.Render(http.StatusOK, r.JSON(results))
}
