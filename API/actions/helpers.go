package actions

import (
	"fmt"
	"math/rand"
	"strconv"

	"github.com/canhan/qiz-api/models"
)

// generateCode creates a random uppercase-alphanumeric code of the given length.
func generateCode(length int) string {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, length)
	for i := range b {
		b[i] = chars[rand.Intn(len(chars))]
	}
	return string(b)
}

// randIntn returns a random int in [0, n).
func randIntn(n int) int { return rand.Intn(n) }

// field builds a SET fragment like "column = $N" and increments idx.
func field(col string, idx *int) string {
	s := col + " = $" + strconv.Itoa(*idx)
	*idx++
	return s
}

// itoa converts an int to its string form.
func itoa(n int) string { return strconv.Itoa(n) }

// errNotFound returns a standard not-found error.
func errNotFound(entity string) error { return fmt.Errorf("%s not found", entity) }

// errMsg returns a plain string error.
func errMsg(msg string) error { return fmt.Errorf("%s", msg) }

// recalcRanks re-ranks all players in a room by score DESC, joined_at ASC.
func recalcRanks(roomID string) error {
	rows, err := models.SQL.Queryx(
		`SELECT id FROM players WHERE room_id = $1 ORDER BY score DESC, joined_at ASC`,
		roomID,
	)
	if err != nil {
		return err
	}
	defer rows.Close()
	rank := 1
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return err
		}
		if _, err := models.SQL.Exec(`UPDATE players SET rank = $1 WHERE id = $2`, rank, id); err != nil {
			return err
		}
		rank++
	}
	return rows.Err()
}

// broadcastEvent publishes a WebSocket event to all connected clients in a room.
// roomID is extracted from the payload map if present; otherwise broadcasts are no-op.
func broadcastEvent(eventType string, payload any) {
	roomID := ""
	if m, ok := payload.(map[string]any); ok {
		if id, ok := m["room_id"].(string); ok {
			roomID = id
		}
	}
	if roomID == "" {
		return
	}
	hub.broadcast(roomID, WSMessage{Type: eventType, Payload: payload})
}

// roomExists returns true if a game_room with the given id exists.
func roomExists(roomID string) (bool, error) {
	var exists bool
	err := models.SQL.Get(&exists, `SELECT EXISTS(SELECT 1 FROM game_rooms WHERE id=$1)`, roomID)
	return exists, err
}

// gameExistsInRoom returns true if a game belongs to the room.
func gameExistsInRoom(gameID, roomID string) (bool, error) {
	var exists bool
	err := models.SQL.Get(&exists, `SELECT EXISTS(SELECT 1 FROM games WHERE id=$1 AND room_id=$2)`, gameID, roomID)
	return exists, err
}
